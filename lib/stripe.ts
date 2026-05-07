import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
})

export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY!
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL!

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const admin = await createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)

  return customer.id
}
