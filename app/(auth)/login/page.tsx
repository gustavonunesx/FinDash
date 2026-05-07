"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn, signInWithGoogle } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconBrandGoogle, IconLoader2 } from "@tabler/icons-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const result = await signIn(form.get("email") as string, form.get("password") as string)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signInWithGoogle()
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta FinDash</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full border-border"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <IconLoader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <IconBrandGoogle className="size-4 mr-2" />
          )}
          Entrar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

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
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-fd-red">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/recuperar-senha" className="hover:text-foreground transition-colors">
            Esqueceu a senha?
          </Link>
          <Link href="/cadastro" className="hover:text-foreground transition-colors">
            Criar conta
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
