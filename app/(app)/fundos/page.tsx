import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FundosGrid } from "@/components/fundos/FundosGrid"

export default async function FundosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: fundos }, { data: profile }] = await Promise.all([
    supabase
      .from("fundos")
      .select("*")
      .eq("user_id", user.id)
      .order("ordem", { ascending: true }),
    supabase
      .from("profiles")
      .select("plano")
      .eq("id", user.id)
      .single(),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Fundos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Acompanhe suas metas financeiras
        </p>
      </div>

      <FundosGrid
        fundos={fundos ?? []}
        plano={profile?.plano ?? "free"}
      />
    </div>
  )
}
