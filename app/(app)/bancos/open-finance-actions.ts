"use server";

import { getProfile } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";
import { buscarContas, corPorOrdem, desconectarItem, PROVIDER } from "@/lib/open-finance";
import { sincronizarItem } from "@/lib/open-finance-sync";
import { revalidarEntidade } from "@/lib/revalidate";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaGasto } from "@/lib/types";

/**
 * Chamada quando o widget da Pluggy conclui com sucesso. Traz as contas do item
 * e materializa cada uma como um banco do usuário.
 *
 * O vínculo é feito aqui no servidor, e não a partir do payload do widget,
 * porque o client só nos entrega o `itemId` — os saldos precisam vir da API com
 * a API Key para não serem forjáveis.
 */
export async function vincularItemConectado(itemId: string) {
  if (isDemoMode()) {
    return { error: "Conexão com banco não está disponível no modo demonstração." };
  }

  if (!itemId?.trim()) return { error: "Conexão inválida." };

  const profile = await getProfile();
  if (!profile) return { error: "Não autenticado" };
  if (profile.plano !== "premium") {
    return { error: "Conectar banco pelo Open Finance é um recurso Premium." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  let contas;
  try {
    contas = await buscarContas(itemId);
  } catch (error) {
    console.error("[open-finance] falha ao buscar contas do item", error);
    return { error: "Não foi possível ler as contas desse banco. Tente novamente." };
  }

  if (contas.length === 0) {
    return { error: "Nenhuma conta encontrada nesse banco." };
  }

  const { count } = await supabase
    .from("bancos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const agora = new Date().toISOString();
  let ordem = count ?? 0;

  const linhas = contas.map((conta) => ({
    user_id: user.id,
    nome: conta.nome,
    saldo: conta.saldo,
    cor: corPorOrdem(ordem++),
    ordem: ordem - 1,
    saldo_atualizado_em: agora,
    origem: "open_finance" as const,
    provider: PROVIDER,
    provider_item_id: conta.provider_item_id,
    provider_account_id: conta.provider_account_id,
    sincronizado_em: agora,
    sync_status: "ok" as const,
  }));

  // Reconectar o mesmo banco atualiza a linha existente em vez de duplicar —
  // o índice único em (user_id, provider_account_id) é a chave do upsert.
  const { error } = await supabase
    .from("bancos")
    .upsert(linhas, { onConflict: "user_id,provider_account_id" });

  if (error) return { error: error.message };

  revalidarEntidade("bancos");
  return { success: true, contas: contas.length };
}

/**
 * Remove o consentimento na Pluggy e devolve o banco ao modo manual. Os gastos
 * já importados continuam existindo — apagá-los reescreveria o histórico
 * financeiro do usuário sem que ele tenha pedido isso.
 */
export async function desconectarBanco(bancoId: string) {
  if (isDemoMode()) {
    return { error: "Conexão com banco não está disponível no modo demonstração." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: banco } = await supabase
    .from("bancos")
    .select("id, provider_item_id")
    .eq("id", bancoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!banco) return { error: "Banco não encontrado." };

  if (banco.provider_item_id) {
    // Outras contas do mesmo item deixam de sincronizar junto: o consentimento
    // na Pluggy é por item, não por conta.
    const { data: irmas } = await supabase
      .from("bancos")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider_item_id", banco.provider_item_id);

    try {
      await desconectarItem(banco.provider_item_id);
    } catch (error) {
      console.error("[open-finance] falha ao remover item na Pluggy", error);
      return { error: "Não foi possível revogar o acesso no banco. Tente novamente." };
    }

    const ids = (irmas ?? []).map((b) => b.id);
    const { error } = await supabase
      .from("bancos")
      .update({
        origem: "manual",
        provider: null,
        provider_item_id: null,
        provider_account_id: null,
        sync_status: null,
        consentimento_expira_em: null,
      })
      .in("id", ids.length > 0 ? ids : [banco.id]);

    if (error) return { error: error.message };
  }

  revalidarEntidade("bancos");
  return { success: true };
}

/**
 * A conexão via Pluggy está desligada até a base justificar o mínimo de
 * R$ 2.500/mês do plano de Dados. Registrar quem clicou em "Em breve" transforma
 * essa decisão em demanda medida, em vez de palpite.
 */
export async function registrarInteresseOpenFinance() {
  if (isDemoMode()) return { success: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  // Clicar de novo não é erro: o upsert mantém a primeira data.
  const { error } = await supabase
    .from("open_finance_interesse")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  if (error) return { error: error.message };
  return { success: true };
}

/** Botão "Atualizar agora": puxa saldo e transações sem esperar webhook ou cron. */
export async function sincronizarAgora() {
  if (isDemoMode()) {
    return { error: "Sincronização não está disponível no modo demonstração." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: bancos } = await supabase
    .from("bancos")
    .select("provider_item_id")
    .eq("user_id", user.id)
    .eq("origem", "open_finance")
    .not("provider_item_id", "is", null);

  const itemIds = [...new Set((bancos ?? []).map((b) => b.provider_item_id as string))];
  if (itemIds.length === 0) return { error: "Nenhum banco conectado." };

  // A escrita usa o service client porque `sincronizarItem` também roda no cron
  // e no webhook, onde não há sessão. Os itens já foram filtrados pelo user_id
  // acima, então o usuário só alcança o que é dele.
  const admin = createServiceClient();

  let importados = 0;
  let conciliados = 0;
  const erros: string[] = [];

  for (const itemId of itemIds) {
    try {
      const r = await sincronizarItem(admin, itemId);
      importados += r.gastosImportados;
      conciliados += r.gastosConciliados;
      erros.push(...r.erros);
    } catch (e) {
      erros.push(e instanceof Error ? e.message : "erro ao sincronizar");
    }
  }

  revalidarEntidade("bancos", "gastos");

  if (erros.length > 0 && importados === 0 && conciliados === 0) {
    return { error: "Não foi possível sincronizar agora. Tente novamente." };
  }

  return { success: true, importados, conciliados };
}

/** Confirma o bucket 50/30/20 de um gasto importado. */
export async function confirmarCategoriaGasto(id: string, categoria: CategoriaGasto) {
  if (isDemoMode()) {
    return { error: "Revisão não está disponível no modo demonstração." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("gastos")
    .update({ categoria, categoria_confirmada: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidarEntidade("gastos");
  return { success: true };
}

/** Aceita todas as sugestões de categoria de uma vez. */
export async function confirmarTodasCategorias() {
  if (isDemoMode()) {
    return { error: "Revisão não está disponível no modo demonstração." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data, error } = await supabase
    .from("gastos")
    .update({ categoria_confirmada: true })
    .eq("user_id", user.id)
    .eq("categoria_confirmada", false)
    .select("id");

  if (error) return { error: error.message };

  revalidarEntidade("gastos");
  return { success: true, confirmados: data?.length ?? 0 };
}
