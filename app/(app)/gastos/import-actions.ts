"use server";

import { revalidarEntidade } from "@/lib/revalidate";
import { isDemoMode } from "@/lib/demo-data";
import { getDemoGastos } from "@/lib/demo-store";
import { getProfile } from "@/lib/data";
import { parseGastosCsv, type CsvGastoRow } from "@/lib/csv-parser";
import { createClient } from "@/lib/supabase/server";
import { LIMITES_FREE } from "@/lib/types";
import { criarGasto, type GastoFormData } from "./actions";

export async function parseCsvPreview(content: string) {
  return parseGastosCsv(content);
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
