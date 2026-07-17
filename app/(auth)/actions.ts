"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";
import { generateReferralCode } from "@/lib/referral";

export async function loginAction(formData: FormData) {
  if (isDemoMode()) redirect("/dashboard");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  if (isDemoMode()) redirect("/dashboard");

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nome = formData.get("nome") as string;
  const referralCode = (formData.get("referral") as string)?.trim().toUpperCase();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    let referredBy: string | null = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (referrer && referrer.id !== data.user.id) {
        referredBy = referrer.id;
      }
    }

    await supabase.from("profiles").insert({
      id: data.user.id,
      nome,
      onboarding_completed: false,
      referral_code: generateReferralCode(data.user.id),
      referred_by: referredBy,
    });
    await supabase.from("configuracoes").insert({
      user_id: data.user.id,
      salario: 0,
      renda_extra: 0,
      custo_vida: 0,
      fase: "construindo",
    });
  }

  redirect("/onboarding");
}

export async function googleAuthAction() {
  if (isDemoMode()) redirect("/dashboard");

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return { error: "Não foi possível iniciar login com Google" };
}

export async function resetPasswordAction(formData: FormData) {
  if (isDemoMode()) return { success: true };

  const email = formData.get("email") as string;
  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/configuracoes`,
  });
  if (error) return { error: error.message };
  return { success: true };
}
