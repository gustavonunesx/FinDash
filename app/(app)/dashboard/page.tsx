import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, plano")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="font-mono text-primary">Fin</span>Dash
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Olá, {profile?.nome ?? user.email} 👋
            </p>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              Sair
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground text-sm">
            ✅ <strong>Milestone 1 concluído!</strong> Autenticação funcionando.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            <li>• Usuário: {user.email}</li>
            <li>• Plano: {profile?.plano ?? "free"}</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            🚧 Dashboard completo vem no Milestone 2.
          </p>
        </div>
      </div>
    </div>
  )
}
