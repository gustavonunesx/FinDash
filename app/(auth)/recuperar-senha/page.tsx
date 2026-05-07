"use client"

import { useState } from "react"
import Link from "next/link"
import { resetPassword } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"

export default function RecuperarSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const result = await resetPassword(form.get("email") as string)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 text-center space-y-3">
          <div className="text-4xl">✉️</div>
          <h2 className="font-semibold text-lg">Email enviado!</h2>
          <p className="text-muted-foreground text-sm">
            Se esse email estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full mt-2 border-border">
              <IconArrowLeft className="size-4 mr-2" />
              Voltar para o login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link de redefinição
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          {error && (
            <p className="text-sm text-fd-red">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            Enviar link de recuperação
          </Button>
        </form>

        <Link href="/login">
          <Button variant="ghost" className="w-full text-muted-foreground">
            <IconArrowLeft className="size-4 mr-2" />
            Voltar para o login
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
