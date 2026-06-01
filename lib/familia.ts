import { isDemoMode } from "./demo-data";
import { calcularScore502030 } from "./score";
import type { FamiliaResumo } from "./types";
import { createClient } from "./supabase/server";

const DEMO_FAMILIA: FamiliaResumo = {
  familia: {
    id: "fam-demo",
    owner_id: "demo-user",
    nome: "Família Silva",
    created_at: new Date().toISOString(),
  },
  membros: [
    { id: "m1", familia_id: "fam-demo", user_id: "demo-user", papel: "owner", joined_at: "2025-01-01", nome: "Ana Silva" },
    { id: "m2", familia_id: "fam-demo", user_id: "demo-user-2", papel: "membro", joined_at: "2025-03-01", nome: "João Silva" },
  ],
  rendaTotal: 9800,
  gastosTotal: 5200,
  fundosTotal: 23700,
  scoreMedio: 78,
};

export async function getFamiliaResumo(): Promise<FamiliaResumo | null> {
  if (isDemoMode()) return DEMO_FAMILIA;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("familia_membros")
    .select("familia_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  const { data: familia } = await supabase
    .from("familias")
    .select("*")
    .eq("id", membership.familia_id)
    .single();

  if (!familia) return null;

  const { data: membrosRaw } = await supabase
    .from("familia_membros")
    .select("*, profiles:nome")
    .eq("familia_id", familia.id);

  const { data: membrosIds } = await supabase
    .from("familia_membros")
    .select("user_id")
    .eq("familia_id", familia.id);

  const ids = membrosIds?.map((m) => m.user_id) ?? [];
  if (ids.length === 0) return null;

  let rendaTotal = 0;
  let gastosTotal = 0;
  let fundosTotal = 0;
  let scoreSum = 0;

  for (const uid of ids) {
    const [{ data: config }, { data: gastos }, { data: fundos }] = await Promise.all([
      supabase.from("configuracoes").select("*").eq("user_id", uid).single(),
      supabase.from("gastos").select("*").eq("user_id", uid),
      supabase.from("fundos").select("*").eq("user_id", uid),
    ]);
    if (config) {
      rendaTotal += config.salario + config.renda_extra;
      const score = calcularScore502030(config, gastos ?? []);
      scoreSum += score.score;
    }
    gastosTotal += (gastos ?? []).reduce((s, g) => s + g.valor, 0);
    fundosTotal += (fundos ?? []).reduce((s, f) => s + f.saldo_atual, 0);
  }

  const membros = await Promise.all(
    (membrosRaw ?? []).map(async (m) => {
      const { data: p } = await supabase.from("profiles").select("nome").eq("id", m.user_id).single();
      return { ...m, nome: p?.nome ?? "Membro" };
    })
  );

  return {
    familia,
    membros,
    rendaTotal,
    gastosTotal,
    fundosTotal,
    scoreMedio: ids.length > 0 ? Math.round(scoreSum / ids.length) : 0,
  };
}

export async function isFamiliaOwner(): Promise<boolean> {
  if (isDemoMode()) return true;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("familias").select("id").eq("owner_id", user.id).maybeSingle();
  return !!data;
}
