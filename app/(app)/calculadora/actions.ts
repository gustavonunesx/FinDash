"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import { setDemoConfig } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

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
