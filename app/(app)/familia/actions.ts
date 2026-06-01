"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data";

const MAX_MEMBROS = 3;

export async function criarFamilia(nome: string) {
  if (!nome.trim()) return { error: "Informe o nome da família" };

  const profile = await getProfile();
  if (profile?.plano !== "premium") {
    return { error: "Plano Família disponível apenas para assinantes Premium." };
  }

  if (isDemoMode()) {
    revalidatePath("/familia");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: existing } = await supabase
    .from("familia_membros")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { error: "Você já pertence a uma família" };

  const { data: familia, error } = await supabase
    .from("familias")
    .insert({ owner_id: user.id, nome })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("familia_membros").insert({
    familia_id: familia.id,
    user_id: user.id,
    papel: "owner",
  });

  await supabase.from("profiles").update({ familia_id: familia.id }).eq("id", user.id);

  revalidatePath("/familia");
  return { success: true };
}

export async function convidarMembro(email: string) {
  if (!email.trim()) return { error: "Informe o email" };

  if (isDemoMode()) {
    return { success: true, link: `${process.env.NEXT_PUBLIC_APP_URL}/familia/aceitar?token=demo` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: familia } = await supabase
    .from("familias")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!familia) return { error: "Crie uma família primeiro" };

  const { count } = await supabase
    .from("familia_membros")
    .select("*", { count: "exact", head: true })
    .eq("familia_id", familia.id);

  if ((count ?? 0) >= MAX_MEMBROS) {
    return { error: `Limite de ${MAX_MEMBROS} membros por família.` };
  }

  const { data: convite, error } = await supabase
    .from("familia_convites")
    .insert({ familia_id: familia.id, email: email.trim().toLowerCase() })
    .select("token")
    .single();

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { success: true, link: `${appUrl}/familia/aceitar?token=${convite.token}` };
}

export async function aceitarConvite(token: string) {
  if (isDemoMode()) return { success: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login para aceitar o convite" };

  const { data: convite } = await supabase
    .from("familia_convites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!convite) return { error: "Convite inválido ou expirado" };

  await supabase.from("familia_membros").insert({
    familia_id: convite.familia_id,
    user_id: user.id,
    papel: "membro",
  });

  await supabase
    .from("familia_convites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", convite.id);

  await supabase
    .from("profiles")
    .update({ familia_id: convite.familia_id })
    .eq("id", user.id);

  revalidatePath("/familia");
  return { success: true };
}
