"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import { DEMO_FUNDOS, DEMO_GASTOS } from "@/lib/demo-data";
import {
  addDemoFundo,
  seedDemoData,
  setDemoConfig,
  setDemoProfile,
} from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

export async function onboardingSalario(salario: number) {
  if (salario <= 0) return { error: "Informe um salário válido" };

  if (isDemoMode()) {
    setDemoConfig({ salario, renda_extra: 0 });
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase
    .from("configuracoes")
    .upsert({ user_id: user.id, salario, renda_extra: 0, custo_vida: 0, fase: "construindo" });

  if (error) return { error: error.message };
  return { success: true };
}

export async function onboardingPrimeiroFundo(data: {
  nome: string;
  meta: number;
  saldo_atual: number;
}) {
  if (!data.nome || data.meta <= 0) return { error: "Preencha nome e meta" };

  if (isDemoMode()) {
    addDemoFundo({
      id: crypto.randomUUID(),
      user_id: "demo-user",
      nome: data.nome,
      saldo_atual: data.saldo_atual,
      meta: data.meta,
      meta_data: null,
      aporte_mensal: 0,
      cor: "#1D9E75",
      ordem: 0,
      custodia: null,
      reserva_emergencia: false,
    });
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("fundos").insert({
    user_id: user.id,
    nome: data.nome,
    saldo_atual: data.saldo_atual,
    meta: data.meta,
    cor: "#1D9E75",
    ordem: 0,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function onboardingCompletar(nome: string, custoVida: number) {
  if (!nome.trim()) return { error: "Informe seu nome" };

  if (isDemoMode()) {
    setDemoProfile({ nome, onboarding_completed: true });
    setDemoConfig({ custo_vida: custoVida });
    seedDemoData();
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  await supabase.from("profiles").update({ nome, onboarding_completed: true }).eq("id", user.id);
  await supabase.from("configuracoes").upsert({ user_id: user.id, custo_vida: custoVida });

  // Seed só os gastos simples — os parcelados do demo estourariam o limite do plano Free.
  for (const g of DEMO_GASTOS.filter((g) => !g.parcelas_total)) {
    await supabase.from("gastos").insert({
      user_id: user.id,
      nome: g.nome,
      valor: g.valor,
      categoria: g.categoria,
      subcategoria: g.subcategoria,
      recorrente: g.recorrente,
      dia_recorrencia: g.dia_recorrencia,
    });
  }

  for (const f of DEMO_FUNDOS) {
    await supabase.from("fundos").insert({
      user_id: user.id,
      nome: f.nome,
      saldo_atual: f.saldo_atual,
      meta: f.meta,
      meta_data: f.meta_data,
      aporte_mensal: f.aporte_mensal,
      cor: f.cor,
      ordem: f.ordem,
      custodia: f.custodia,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true };
}
