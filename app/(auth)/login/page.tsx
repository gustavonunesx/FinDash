"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn, signInWithGoogle } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconBrandGoogle, IconLoader2, IconMail, IconLock } from "@tabler/icons-react"

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
    <Card className="bg-card border-border shadow-premium-lg">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl tracking-tight">Entrar</CardTitle>
        <CardDescription className="text-muted-foreground">Acesse sua conta FinDash</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button
          variant="outline"
          className="w-full border-border h-11 gap-2 text-sm font-medium hover:bg-muted/50 transition-all"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconBrandGoogle className="size-4" />
          )}
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">ou continue com email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-fd-red bg-fd-red/10 border border-fd-red/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="flex justify-between text-sm">
          <Link href="/recuperar-senha" className="text-muted-foreground hover:text-foreground transition-colors">
            Esqueceu a senha?
          </Link>
          <Link href="/cadastro" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Criar conta
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
