import { createClient } from "@/lib/supabase/server"
import { PrecosClient } from "@/components/marketing/PrecosClient"
import { PRICE_MONTHLY, PRICE_ANNUAL } from "@/lib/stripe"

export default async function PrecosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let planoAtual: "free" | "premium" = "free"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plano")
      .eq("id", user.id)
      .single()
    planoAtual = profile?.plano ?? "free"
  }

  return (
    <PrecosClient
      isLoggedIn={!!user}
      planoAtual={planoAtual}
      priceMonthly={PRICE_MONTHLY}
      priceAnnual={PRICE_ANNUAL}
    />
  )
}
