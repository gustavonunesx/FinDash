"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import { getAppData } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { totalPorCategoria } from "@/lib/score";

export async function registrarSnapshotMensal() {
  const { config, gastos, fundos } = await getAppData();
  if (!config) return { error: "Configuração não encontrada" };

  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const totais = totalPorCategoria(gastos);
  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade;
  const snapshot_fundos = Object.fromEntries(fundos.map((f) => [f.id, f.saldo_atual]));

  if (isDemoMode()) {
    return { success: true, skipped: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: existing } = await supabase
    .from("historico_mensal")
    .select("id")
    .eq("user_id", user.id)
    .eq("mes", mes)
    .maybeSingle();

  if (existing) return { success: true, skipped: true };

  const { error } = await supabase.from("historico_mensal").insert({
    user_id: user.id,
    mes,
    salario: config.salario + config.renda_extra,
    total_gastos: totalGastos,
    snapshot_fundos,
  });

  if (error) return { error: error.message };

  revalidatePath("/historico");
  return { success: true, skipped: false };
}
