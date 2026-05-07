"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconLoader2 } from "@tabler/icons-react"

export default function AtualizarSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (password !== confirm) {
      setError("As senhas não coincidem.")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError("Erro ao atualizar senha. O link pode ter expirado.")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="font-mono text-primary">Fin</span>Dash
          </h1>
        </div>
        <Card className="bg-card border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Nova senha</CardTitle>
            <CardDescription>Digite sua nova senha abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <p className="text-sm text-fd-red">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <IconLoader2 className="size-4 mr-2 animate-spin" />}
                Atualizar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
