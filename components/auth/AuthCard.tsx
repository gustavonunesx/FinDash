"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, signUp, signInWithGoogle } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IconBrandGoogle, IconLoader2, IconMail, IconLock, IconUser } from "@tabler/icons-react"
import gsap from "gsap"

type Mode = "login" | "register"

interface AuthCardProps {
  initialMode: Mode
}

export default function AuthCard({ initialMode }: AuthCardProps) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function animateTransition(newMode: Mode) {
    if (!formRef.current) return
    const el = formRef.current
    const exitX = newMode === "register" ? -20 : 20

    // fase 1: saída
    gsap.to(el, {
      x: exitX,
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => {
        // garante opacity:0 antes do React re-renderizar o conteúdo novo
        gsap.set(el, { x: -exitX, opacity: 0 })
        setError(null)
        setMode(newMode)
        router.replace(newMode === "login" ? "/login" : "/cadastro")
      },
    })
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!formRef.current) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      // entrada inicial da página
      gsap.fromTo(
        formRef.current,
        { x: 0, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" }
      )
      return
    }
    // entrada após troca de modo — o gsap.set já deixou opacity:0 e x posicionado
    gsap.to(formRef.current, { x: 0, opacity: 1, duration: 0.25, ease: "power2.out" })
  }, [mode])

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const result = await signIn(
      form.get("email") as string,
      form.get("password") as string
    )

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          <Button
            variant="outline"
            className="w-full mt-2 border-border"
            onClick={() => animateTransition("login")}
          >
            Voltar para o login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border shadow-premium-lg">
      <CardHeader className="space-y-2 pb-4">
        <CardTitle className="text-2xl tracking-tight">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {mode === "login"
            ? "Acesse sua conta FinDash"
            : "Comece grátis, sem cartão de crédito"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div ref={formRef} className="space-y-5">
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
            {mode === "login" ? "Continuar com Google" : "Entrar com Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">ou continue com email</span>
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome"
                    required
                    autoComplete="name"
                    className="pl-10"
                  />
                </div>
              </div>
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
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm font-medium">Confirmar senha</Label>
                <div className="relative">
                  <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
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
                Criar conta gratuita
              </Button>
            </form>
          )}

          <div className="flex justify-between text-sm pt-1">
            {mode === "login" ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/recuperar-senha")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Esqueceu a senha?
                </button>
                <button
                  type="button"
                  onClick={() => animateTransition("register")}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <p className="w-full text-center text-muted-foreground">
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => animateTransition("login")}
                  className="text-foreground font-medium hover:text-primary transition-colors"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
