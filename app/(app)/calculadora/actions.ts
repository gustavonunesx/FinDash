"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import { setDemoConfig } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";
import type { RendaExtraItem } from "@/lib/types";

export async function salvarSalario(salario: number) {
  if (isDemoMode()) {
    setDemoConfig({ salario });
    revalidatePath("/calculadora");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("configuracoes")
    .upsert({ user_id: user.id, salario });

  if (error) return { error: error.message };

  revalidatePath("/calculadora");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function registrarRendaExtra(
  valor: number,
  descricao: string | null
): Promise<{ success?: boolean; data?: RendaExtraItem; error?: string }> {
  if (isDemoMode()) {
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        valor,
        descricao,
        created_at: new Date().toISOString(),
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data, error } = await supabase
    .from("renda_extra_historico")
    .insert({ user_id: user.id, valor, descricao })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/calculadora");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function salvarAjustesLimite(ajustes: Record<string, number>) {
  if (isDemoMode()) {
    setDemoConfig({ ajustes_limite: ajustes });
    revalidatePath("/calculadora");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("configuracoes")
    .upsert({ user_id: user.id, ajustes_limite: ajustes });

  if (error) return { error: error.message };

  revalidatePath("/calculadora");
  return { success: true };
}
