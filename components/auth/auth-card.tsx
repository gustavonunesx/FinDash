"use client";

import { useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { toast } from "sonner";
import { IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction, signupAction, googleAuthAction } from "@/app/(auth)/actions";
import { isDemoMode } from "@/lib/demo-data";

gsap.registerPlugin(useGSAP);

type AuthMode = "login" | "cadastro";

export function AuthCard({ defaultMode = "login" }: { defaultMode?: AuthMode }) {
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref")?.toUpperCase() ?? "";

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const demoMode = isDemoMode();

  useGSAP(
    () => {
      if (!formRef.current) return;
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: mode === "login" ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    },
    { scope: cardRef, dependencies: [mode] }
  );

  const toggleMode = () => setMode((m) => (m === "login" ? "cadastro" : "login"));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (referralFromUrl && mode === "cadastro") {
      fd.set("referral", referralFromUrl);
    }
    startTransition(async () => {
      const result = mode === "login" ? await loginAction(fd) : await signupAction(fd);
      if (result?.error) toast.error(result.error);
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await googleAuthAction();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Card ref={cardRef} className="w-full max-w-md shadow-premium">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-gradient">FinDash</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Entre para ver sua situação financeira"
            : "Crie sua conta e organize suas finanças"}
        </CardDescription>
        {mode === "cadastro" && referralFromUrl && (
          <Badge variant="purple" className="mx-auto mt-2">
            Convite: {referralFromUrl}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {mode === "cadastro" && (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" placeholder="Seu nome" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" name="password" type="password" placeholder="••••••••" required />
          </div>
          {mode === "login" && (
            <Link
              href="/recuperar-senha"
              className="block text-right text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </div>

        {!demoMode && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              disabled={pending}
              onClick={handleGoogle}
            >
              <IconBrandGoogle className="h-4 w-4" />
              Continuar com Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
