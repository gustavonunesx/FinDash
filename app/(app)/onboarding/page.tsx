import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingClient } from "@/components/onboarding/OnboardingClient"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, onboarding_completed")
    .eq("id", user.id)
    .single()

  if (profile?.onboarding_completed) redirect("/dashboard")

  const primeiroNome = (profile?.nome ?? user.email ?? "").split(" ")[0]

  return <OnboardingClient primeiroNome={primeiroNome} />
}
