import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { REFERRAL_REWARD_BRL } from "@/lib/referral";

export async function grantReferralReward(referredUserId: string): Promise<boolean> {
  if (!stripe) return false;

  const supabase = createServiceClient();

  const { data: referred } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", referredUserId)
    .single();

  if (!referred?.referred_by) return false;

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id, referral_rewards")
    .eq("id", referred.referred_by)
    .single();

  if (!referrer?.stripe_customer_id) return false;

  await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
    amount: -REFERRAL_REWARD_BRL * 100,
    currency: "brl",
    description: "Crédito referral FinDash — 1 mês Premium",
  });

  await supabase
    .from("profiles")
    .update({ referral_rewards: (referrer.referral_rewards ?? 0) + 1 })
    .eq("id", referrer.id);

  return true;
}
