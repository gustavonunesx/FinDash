import {
  DEMO_CONFIG,
  DEMO_PROFILE,
  isDemoMode,
} from "./demo-data";
import { createClient } from "./supabase/server";
import type { Banco, Configuracao, Fundo, Gasto, HistoricoMensal, Profile, RendaExtraItem } from "./types";

export async function getCurrentUserId(): Promise<string | null> {
  if (isDemoMode()) return "demo-user";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  if (isDemoMode()) {
    const { getDemoProfile } = await import("./demo-store");
    return getDemoProfile();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function getConfig(): Promise<Configuracao | null> {
  if (isDemoMode()) {
    const { getDemoConfig } = await import("./demo-store");
    return getDemoConfig();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("configuracoes").select("*").eq("user_id", user.id).single();
  return data;
}

export async function getGastos(): Promise<Gasto[]> {
  if (isDemoMode()) {
    const { getDemoGastos } = await import("./demo-store");
    return getDemoGastos();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("gastos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getFundos(): Promise<Fundo[]> {
  if (isDemoMode()) {
    const { getDemoFundos } = await import("./demo-store");
    return getDemoFundos();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("fundos")
    .select("*")
    .eq("user_id", user.id)
    .order("ordem");
  return data ?? [];
}

export async function getBancos(): Promise<Banco[]> {
  if (isDemoMode()) {
    const { getDemoBancos } = await import("./demo-store");
    return getDemoBancos();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("bancos")
    .select("*")
    .eq("user_id", user.id)
    .order("ordem");
  return data ?? [];
}

export async function getHistorico(): Promise<HistoricoMensal[]> {
  if (isDemoMode()) {
    const { getDemoHistorico } = await import("./demo-store");
    return getDemoHistorico();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("historico_mensal")
    .select("*")
    .eq("user_id", user.id)
    .order("mes", { ascending: true });
  return data ?? [];
}

export async function getRendaExtraHistorico(): Promise<RendaExtraItem[]> {
  if (isDemoMode()) {
    const { getDemoRendaExtraHistorico } = await import("./demo-store");
    return getDemoRendaExtraHistorico();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("renda_extra_historico")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAppData() {
  const [profile, config, gastos, fundos] = await Promise.all([
    getProfile(),
    getConfig(),
    getGastos(),
    getFundos(),
  ]);

  return {
    profile: profile ?? DEMO_PROFILE,
    config: config ?? DEMO_CONFIG,
    gastos,
    fundos,
  };
}
