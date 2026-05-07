import { headers } from "next/headers"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  if (!sig) {
    return new Response("Missing stripe-signature", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 })
  }

  const admin = await createAdminClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      await admin
        .from("profiles")
        .update({
          plano: "premium",
          stripe_subscription_id: subscriptionId,
          assinatura_status: "active",
        })
        .eq("stripe_customer_id", customerId)
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await admin
        .from("profiles")
        .update({ assinatura_status: sub.status as "active" | "canceled" | "trialing" })
        .eq("stripe_customer_id", customerId)
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await admin
        .from("profiles")
        .update({
          plano: "free",
          assinatura_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId)
      break
    }
  }

  return new Response(null, { status: 200 })
}
