"use client"

import { useState } from "react"
import Link from "next/link"
import { signUp, signInWithGoogle } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconBrandGoogle, IconLoader2 } from "@tabler/icons-react"

export default function CadastroPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

    const result = await signUp(
      form.get("nome") as string,
      form.get("email") as string,
      password
    )

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signInWithGoogle()
  }

  if (success) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 text-center space-y-3">
          <div className="text-4xl">📬</div>
          <h2 className="font-semibold text-lg">Confirme seu email</h2>
          <p className="text-muted-foreground text-sm">
            Enviamos um link de confirmação para o seu email. Clique no link para ativar sua conta.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full mt-2 border-border">
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
        <CardTitle className="text-xl">Criar conta</CardTitle>
        <CardDescription>Comece grátis, sem cartão de crédito</CardDescription>
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
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="Seu nome"
              required
              autoComplete="name"
            />
          </div>
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
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
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
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-fd-red">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            Criar conta gratuita
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
