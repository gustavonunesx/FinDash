"use server";

import { revalidarEntidade } from "@/lib/revalidate";
import { BANCO_MANUAL, isDemoMode } from "@/lib/demo-data";
import {
  addDemoBanco,
  deleteDemoBanco,
  getDemoBancos,
  updateDemoBanco,
} from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";
import { BANCO_CORES } from "@/lib/types";

export type BancoFormData = {
  nome: string;
  saldo: number;
  cor?: string;
};

export async function criarBanco(data: BancoFormData) {
  const nome = data.nome.trim();
  if (!nome) return { error: "Informe o nome do banco." };

  if (isDemoMode()) {
    const bancos = getDemoBancos();
    addDemoBanco({
      id: crypto.randomUUID(),
      user_id: "demo-user",
      nome,
      saldo: data.saldo,
      cor: data.cor ?? BANCO_CORES[bancos.length % BANCO_CORES.length],
      ordem: bancos.length,
      saldo_atualizado_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...BANCO_MANUAL,
    });
    revalidarEntidade("bancos");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { count } = await supabase
    .from("bancos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const ordem = count ?? 0;

  const { error } = await supabase.from("bancos").insert({
    user_id: user.id,
    nome,
    saldo: data.saldo,
    cor: data.cor ?? BANCO_CORES[ordem % BANCO_CORES.length],
    ordem,
  });

  if (error) return { error: error.message };
  revalidarEntidade("bancos");
  return { success: true };
}

export async function editarBanco(id: string, data: BancoFormData) {
  const nome = data.nome.trim();
  if (!nome) return { error: "Informe o nome do banco." };

  const campos = {
    nome,
    saldo: data.saldo,
    ...(data.cor ? { cor: data.cor } : {}),
    saldo_atualizado_em: new Date().toISOString(),
  };

  if (isDemoMode()) {
    updateDemoBanco(id, campos);
    revalidarEntidade("bancos");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bancos").update(campos).eq("id", id);
  if (error) return { error: error.message };
  revalidarEntidade("bancos");
  return { success: true };
}

/** Atalho do painel de saldos: só o número muda, sem abrir o modal completo. */
export async function atualizarSaldoBanco(id: string, saldo: number) {
  const campos = { saldo, saldo_atualizado_em: new Date().toISOString() };

  if (isDemoMode()) {
    updateDemoBanco(id, campos);
    revalidarEntidade("bancos");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bancos").update(campos).eq("id", id);
  if (error) return { error: error.message };
  revalidarEntidade("bancos");
  return { success: true };
}

export async function deletarBanco(id: string) {
  if (isDemoMode()) {
    deleteDemoBanco(id);
    revalidarEntidade("bancos", "gastos");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bancos").delete().eq("id", id);
  if (error) return { error: error.message };
  // `gastos.banco_id` cai para null via ON DELETE SET NULL, então a tabela de
  // gastos também precisa revalidar.
  revalidarEntidade("bancos", "gastos");
  return { success: true };
}
