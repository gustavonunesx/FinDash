"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import {
  addDemoGasto,
  deleteDemoGasto,
  getDemoGastos,
  updateDemoGasto,
} from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";
import { LIMITES_FREE, type CategoriaGasto } from "@/lib/types";
import { getProfile } from "@/lib/data";

export type GastoFormData = {
  nome: string;
  valor: number;
  categoria: CategoriaGasto;
  subcategoria?: string;
  recorrente: boolean;
  dia_recorrencia?: number;
};

async function checkGastoLimit(): Promise<{ ok: boolean; error?: string }> {
  const profile = await getProfile();
  if (profile?.plano === "premium") return { ok: true };

  const gastos = isDemoMode()
    ? getDemoGastos()
    : await (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];
        const { data } = await supabase.from("gastos").select("id").eq("user_id", user.id);
        return data ?? [];
      })();

  if (gastos.length >= LIMITES_FREE.gastos) {
    return { ok: false, error: `Limite de ${LIMITES_FREE.gastos} gastos no plano Free.` };
  }
  return { ok: true };
}

export async function criarGasto(data: GastoFormData) {
  const limit = await checkGastoLimit();
  if (!limit.ok) return { error: limit.error };

  if (isDemoMode()) {
    addDemoGasto({
      id: crypto.randomUUID(),
      user_id: "demo-user",
      nome: data.nome,
      valor: data.valor,
      categoria: data.categoria,
      subcategoria: data.subcategoria ?? null,
      recorrente: data.recorrente,
      dia_recorrencia: data.dia_recorrencia ?? null,
      created_at: new Date().toISOString(),
    });
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("gastos").insert({
    user_id: user.id,
    nome: data.nome,
    valor: data.valor,
    categoria: data.categoria,
    subcategoria: data.subcategoria ?? null,
    recorrente: data.recorrente,
    dia_recorrencia: data.dia_recorrencia ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function editarGasto(id: string, data: GastoFormData) {
  if (isDemoMode()) {
    updateDemoGasto(id, {
      nome: data.nome,
      valor: data.valor,
      categoria: data.categoria,
      subcategoria: data.subcategoria ?? null,
      recorrente: data.recorrente,
      dia_recorrencia: data.dia_recorrencia ?? null,
    });
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gastos")
    .update({
      nome: data.nome,
      valor: data.valor,
      categoria: data.categoria,
      subcategoria: data.subcategoria ?? null,
      recorrente: data.recorrente,
      dia_recorrencia: data.dia_recorrencia ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletarGasto(id: string) {
  if (isDemoMode()) {
    deleteDemoGasto(id);
    revalidatePath("/gastos");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("gastos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  return { success: true };
}
