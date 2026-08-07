"use server";

import { revalidarEntidade } from "@/lib/revalidate";
import { isDemoMode } from "@/lib/demo-data";
import { getDemoGastos } from "@/lib/demo-store";
import { getProfile } from "@/lib/data";
import { parseGastosCsv, type CsvGastoRow } from "@/lib/csv-parser";
import { apenasDebitos, parseOfx, type OfxTransacao } from "@/lib/ofx-parser";
import { createClient } from "@/lib/supabase/server";
import { LIMITES_FREE, type CategoriaGasto } from "@/lib/types";
import { criarGasto, type GastoFormData } from "./actions";

export async function parseCsvPreview(content: string) {
  return parseGastosCsv(content);
}

export type OfxPreview = {
  transacoes: OfxTransacao[];
  saldo: number | null;
  conta: string | null;
  errors: string[];
  /** FITIDs que já existem no banco — reimportação do mesmo extrato. */
  jaImportados: string[];
};

export async function parseOfxPreview(content: string): Promise<OfxPreview> {
  const { transacoes, saldo, conta, errors } = parseOfx(content);
  const debitos = apenasDebitos(transacoes);

  if (debitos.length === 0) {
    return { transacoes: [], saldo, conta, errors, jaImportados: [] };
  }

  // Marcar o que já entrou antes é o que torna reimportar o mesmo extrato uma
  // operação segura — o usuário vê o que será ignorado antes de confirmar.
  const jaImportados = isDemoMode()
    ? []
    : await (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase
          .from("gastos")
          .select("provider_transaction_id")
          .eq("user_id", user.id)
          .in(
            "provider_transaction_id",
            debitos.map((t) => t.fitid)
          );
        return (data ?? []).map((g) => g.provider_transaction_id as string);
      })();

  return { transacoes: debitos, saldo, conta, errors, jaImportados };
}

export type OfxImportRow = {
  fitid: string;
  nome: string;
  valor: number;
  categoria: CategoriaGasto;
  data: string;
};

export async function importarGastosOfx(rows: OfxImportRow[], bancoId: string | null) {
  if (rows.length === 0) return { error: "Nenhuma transação para importar." };

  if (isDemoMode()) {
    return { error: "Importação de OFX não está disponível no modo demonstração." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const profile = await getProfile();
  if (profile?.plano !== "premium") {
    const { count } = await supabase
      .from("gastos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("origem", "manual");

    const restante = LIMITES_FREE.gastos - (count ?? 0);
    if (restante <= 0) {
      return { error: `Limite de ${LIMITES_FREE.gastos} gastos no plano Free.` };
    }
    rows = rows.slice(0, restante);
  }

  const linhas = rows.map((r) => ({
    user_id: user.id,
    nome: r.nome,
    valor: r.valor,
    categoria: r.categoria,
    subcategoria: null,
    recorrente: false,
    dia_recorrencia: null,
    parcelas_total: null,
    parcela_inicio: null,
    banco_id: bancoId,
    origem: "ofx",
    provider_transaction_id: r.fitid,
    // O usuário já revisou a categoria na tela de preview antes de confirmar.
    categoria_confirmada: true,
    created_at: r.data,
  }));

  // O índice único em (user_id, provider_transaction_id) absorve o que já foi
  // importado antes, então reimportar o mesmo extrato não duplica nada.
  const { data, error } = await supabase
    .from("gastos")
    .upsert(linhas, {
      onConflict: "user_id,provider_transaction_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) return { error: error.message };

  revalidarEntidade("gastos");

  const importados = data?.length ?? 0;
  return {
    success: true,
    imported: importados,
    duplicados: rows.length - importados,
  };
}

export async function importarGastosCsv(rows: CsvGastoRow[]) {
  const profile = await getProfile();
  const isPremium = profile?.plano === "premium";

  const currentCount = isDemoMode()
    ? getDemoGastos().length
    : await (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return 0;
        const { count } = await supabase
          .from("gastos")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        return count ?? 0;
      })();

  const limit = isPremium ? Infinity : LIMITES_FREE.gastos;
  const toImport = rows.slice(0, limit - currentCount);

  if (toImport.length === 0) {
    return { error: `Limite de ${LIMITES_FREE.gastos} gastos no plano Free.` };
  }

  let imported = 0;
  for (const row of toImport) {
    const data: GastoFormData = {
      nome: row.nome,
      valor: row.valor,
      categoria: row.categoria,
      subcategoria: row.subcategoria ?? undefined,
      recorrente: row.recorrente,
      dia_recorrencia: row.dia_recorrencia ?? undefined,
    };
    const result = await criarGasto(data);
    if (!result.error) imported++;
  }

  revalidarEntidade("gastos");

  return {
    success: true,
    imported,
    skipped: rows.length - toImport.length,
  };
}

export async function confirmarRecorrente(gastoId: string) {
  if (isDemoMode()) {
    revalidarEntidade("gastos");
    return { success: true };
  }

  const supabase = await createClient();
  const { data: gasto } = await supabase.from("gastos").select("*").eq("id", gastoId).single();
  if (!gasto) return { error: "Gasto não encontrado" };

  await supabase.from("gastos").insert({
    user_id: gasto.user_id,
    nome: gasto.nome,
    valor: gasto.valor,
    categoria: gasto.categoria,
    subcategoria: gasto.subcategoria,
    recorrente: gasto.recorrente,
    dia_recorrencia: gasto.dia_recorrencia,
    parcelas_total: gasto.parcelas_total,
    parcela_inicio: gasto.parcela_inicio,
  });

  revalidarEntidade("gastos");
  return { success: true };
}
