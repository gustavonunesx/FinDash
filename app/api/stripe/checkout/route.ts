import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  const { yearly } = await req.json();
  const priceId = yearly ? PLANS.premium.yearly : PLANS.premium.monthly;

  if (!priceId) {
    return NextResponse.json({ error: "Price ID não configurado" }, { status: 503 });
  }

  let customerId: string | undefined;
  let userId = "demo-user";

  if (!isDemoMode()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    customerId = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/precos?checkout=cancel`,
    metadata: { user_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
