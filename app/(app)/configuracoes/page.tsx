import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConfiguracoesClient } from "@/components/configuracoes/ConfiguracoesClient"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: config }] = await Promise.all([
    supabase.from("profiles").select("nome, plano, assinatura_status, stripe_customer_id").eq("id", user.id).single(),
    supabase.from("configuracoes").select("custo_vida").eq("user_id", user.id).single(),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e assinatura</p>
      </div>

      <ConfiguracoesClient
        email={user.email ?? ""}
        nome={profile?.nome ?? ""}
        plano={profile?.plano ?? "free"}
        assinaturaStatus={profile?.assinatura_status ?? null}
        temStripeCustomer={!!profile?.stripe_customer_id}
        custoVida={config?.custo_vida ?? 1200}
      />
    </div>
  )
}
