import { createClient } from "@/lib/supabase/server";
import { generateReferralCode } from "@/lib/referral";

export async function ensureUserProfile(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const nome =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Usuário";

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      nome,
      onboarding_completed: false,
      referral_code: generateReferralCode(user.id),
    });
    await supabase.from("configuracoes").insert({
      user_id: user.id,
      salario: 0,
      renda_extra: 0,
      custo_vida: 0,
      fase: "construindo",
    });
    return { isNew: true, onboardingCompleted: false };
  }

  return { isNew: false, onboardingCompleted: existing.onboarding_completed };
}
