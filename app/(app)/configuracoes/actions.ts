"use server";

import { revalidarEntidade } from "@/lib/revalidate";
import { isDemoMode } from "@/lib/demo-data";
import { setDemoConfig, setDemoProfile } from "@/lib/demo-store";
import { createClient } from "@/lib/supabase/server";

export async function salvarConfiguracoes(data: {
  nome?: string;
  custo_vida?: number;
  meta_economia_mensal?: number | null;
  salario?: number;
  renda_extra?: number;
}) {
  if (isDemoMode()) {
    if (data.nome) setDemoProfile({ nome: data.nome });
    setDemoConfig({
      ...(data.custo_vida !== undefined && { custo_vida: data.custo_vida }),
      ...(data.meta_economia_mensal !== undefined && {
        meta_economia_mensal: data.meta_economia_mensal,
      }),
      ...(data.salario !== undefined && { salario: data.salario }),
      ...(data.renda_extra !== undefined && { renda_extra: data.renda_extra }),
    });
    revalidarEntidade("config", "perfil");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  if (data.nome) {
    await supabase.from("profiles").update({ nome: data.nome }).eq("id", user.id);
  }

  const configUpdate: Record<string, unknown> = {};
  if (data.custo_vida !== undefined) configUpdate.custo_vida = data.custo_vida;
  if (data.meta_economia_mensal !== undefined)
    configUpdate.meta_economia_mensal = data.meta_economia_mensal;
  if (data.salario !== undefined) configUpdate.salario = data.salario;
  if (data.renda_extra !== undefined) configUpdate.renda_extra = data.renda_extra;

  if (Object.keys(configUpdate).length > 0) {
    const { error } = await supabase
      .from("configuracoes")
      .upsert({ user_id: user.id, ...configUpdate });
    if (error) return { error: error.message };
  }

  revalidarEntidade("config", "perfil");
  return { success: true };
}
