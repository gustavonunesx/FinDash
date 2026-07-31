"use server";

import { revalidarEntidade } from "@/lib/revalidate";
import { isDemoMode } from "@/lib/demo-data";
import {
  addDemoFundo,
  deleteDemoFundo,
  getDemoFundos,
  updateDemoFundo,
} from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";
import { LIMITES_FREE, type Custodia } from "@/lib/types";
import { getProfile } from "@/lib/data";
import { checkAndNotifyMetaAtingida } from "@/lib/fundo-meta";

export type FundoFormData = {
  nome: string;
  saldo_atual: number;
  meta: number;
  meta_data?: string;
  aporte_mensal: number;
  cor: string;
  custodia?: Custodia;
  reserva_emergencia?: boolean;
};

async function checkFundoLimit(): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (profile?.plano === "premium") return { ok: true };

  const fundos = isDemoMode()
    ? getDemoFundos()
    : await (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase.from("fundos").select("id").eq("user_id", user.id);
        return data ?? [];
      })();

  if (fundos.length >= LIMITES_FREE.fundos) {
    return { ok: false, error: `Limite de ${LIMITES_FREE.fundos} fundos no plano Free.` };
  }
  return { ok: true };
}

export async function criarFundo(data: FundoFormData) {
  const limit = await checkFundoLimit();
  if (!limit.ok) return { error: limit.error };

  if (isDemoMode()) {
    const fundos = getDemoFundos();
    const id = crypto.randomUUID();
    if (data.reserva_emergencia) {
      fundos.forEach((f) => updateDemoFundo(f.id, { reserva_emergencia: false }));
    }
    addDemoFundo({
      id,
      user_id: "demo-user",
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: data.meta_data ?? null,
      aporte_mensal: data.aporte_mensal,
      cor: data.cor,
      ordem: fundos.length,
      custodia: data.custodia ?? null,
      reserva_emergencia: data.reserva_emergencia ?? false,
    });
    revalidarEntidade("fundos");
    if (data.meta > 0 && data.saldo_atual >= data.meta) {
      await checkAndNotifyMetaAtingida(id, data.saldo_atual, data.meta, data.nome);
    }
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { count } = await supabase
    .from("fundos")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (data.reserva_emergencia) {
    await supabase.from("fundos").update({ reserva_emergencia: false }).eq("user_id", user.id);
  }

  const { data: inserted, error } = await supabase
    .from("fundos")
    .insert({
      user_id: user.id,
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: data.meta_data ?? null,
      aporte_mensal: data.aporte_mensal,
      cor: data.cor,
      ordem: count ?? 0,
      custodia: data.custodia ?? null,
      reserva_emergencia: data.reserva_emergencia ?? false,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (inserted && data.meta > 0 && data.saldo_atual >= data.meta) {
    await checkAndNotifyMetaAtingida(inserted.id, data.saldo_atual, data.meta, data.nome);
  }

  revalidarEntidade("fundos");
  return { success: true };
}

export async function editarFundo(id: string, data: FundoFormData) {
  if (isDemoMode()) {
    if (data.reserva_emergencia) {
      getDemoFundos().forEach((f) => updateDemoFundo(f.id, { reserva_emergencia: false }));
    }
    updateDemoFundo(id, {
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: data.meta_data ?? null,
      aporte_mensal: data.aporte_mensal,
      cor: data.cor,
      custodia: data.custodia ?? null,
      reserva_emergencia: data.reserva_emergencia ?? false,
    });
    revalidarEntidade("fundos");
    let metaResult = null;
    if (data.meta > 0 && data.saldo_atual >= data.meta) {
      metaResult = await checkAndNotifyMetaAtingida(id, data.saldo_atual, data.meta, data.nome);
    }
    return { success: true, metaAtingida: metaResult?.atingida, metaNotificada: metaResult?.notificada };
  }

  const supabase = await createClient();

  if (data.reserva_emergencia) {
    await supabase.from("fundos").update({ reserva_emergencia: false }).neq("id", id);
  }

  const { error } = await supabase
    .from("fundos")
    .update({
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: data.meta_data ?? null,
      aporte_mensal: data.aporte_mensal,
      cor: data.cor,
      custodia: data.custodia ?? null,
      reserva_emergencia: data.reserva_emergencia ?? false,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  let metaResult = null;
  if (data.meta > 0 && data.saldo_atual >= data.meta) {
    metaResult = await checkAndNotifyMetaAtingida(id, data.saldo_atual, data.meta, data.nome);
  }

  revalidarEntidade("fundos");
  return { success: true, metaAtingida: metaResult?.atingida, metaNotificada: metaResult?.notificada };
}

export async function deletarFundo(id: string) {
  if (isDemoMode()) {
    deleteDemoFundo(id);
    revalidarEntidade("fundos");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("fundos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidarEntidade("fundos");
  return { success: true };
}

export async function marcarFundoReserva(fundoId: string) {
  if (isDemoMode()) {
    getDemoFundos().forEach((f) => updateDemoFundo(f.id, { reserva_emergencia: f.id === fundoId }));
    revalidarEntidade("fundos");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await supabase.from("fundos").update({ reserva_emergencia: false }).eq("user_id", user.id);
  const { error } = await supabase.from("fundos").update({ reserva_emergencia: true }).eq("id", fundoId);

  if (error) return { error: error.message };

  revalidarEntidade("fundos");
  return { success: true };
}

export async function confirmarAporte(fundoId: string, valor: number) {
  if (isDemoMode()) {
    const fundos = getDemoFundos();
    const fundo = fundos.find((f) => f.id === fundoId);
    if (!fundo) return { error: "Fundo não encontrado" };
    const novoSaldo = fundo.saldo_atual + valor;
    updateDemoFundo(fundoId, { saldo_atual: novoSaldo });
    revalidarEntidade("fundos");
    const metaResult = await checkAndNotifyMetaAtingida(
      fundoId,
      novoSaldo,
      fundo.meta,
      fundo.nome
    );
    return {
      success: true,
      metaAtingida: metaResult.atingida,
      metaNotificada: metaResult.notificada,
      fundoNome: fundo.nome,
    };
  }

  const supabase = await createClient();
  const { data: fundo } = await supabase
    .from("fundos")
    .select("saldo_atual, meta, nome")
    .eq("id", fundoId)
    .single();
  if (!fundo) return { error: "Fundo não encontrado" };

  const novoSaldo = fundo.saldo_atual + valor;
  const { error } = await supabase
    .from("fundos")
    .update({ saldo_atual: novoSaldo })
    .eq("id", fundoId);

  if (error) return { error: error.message };

  const metaResult = await checkAndNotifyMetaAtingida(
    fundoId,
    novoSaldo,
    fundo.meta,
    fundo.nome
  );

  revalidarEntidade("fundos");
  return {
    success: true,
    metaAtingida: metaResult.atingida,
    metaNotificada: metaResult.notificada,
    fundoNome: fundo.nome,
  };
}
