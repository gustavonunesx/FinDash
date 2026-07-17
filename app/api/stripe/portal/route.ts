import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";

export async function POST() {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ error: "Portal indisponível em modo demo" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Cliente Stripe não encontrado" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/configuracoes`,
  });

  return NextResponse.json({ url: session.url });
}
