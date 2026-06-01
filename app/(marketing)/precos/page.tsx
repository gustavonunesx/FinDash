"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const plans = {
  free: {
    name: "Free",
    price: 0,
    features: ["10 gastos", "3 fundos", "Calculadora 50/30/20", "Dashboard completo"],
  },
  premium: {
    name: "Premium",
    monthly: 19,
    yearly: 149,
    features: [
      "Gastos ilimitados",
      "Fundos ilimitados",
      "Histórico mensal com gráficos",
      "Exportação PDF",
      "Plano Família (até 3 membros)",
      "14 dias grátis",
    ],
  },
};

function CheckoutToastPrecos() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("checkout") === "cancel") {
      toast.info("Checkout cancelado. Você continua no plano Free.");
      router.replace("/precos", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}

export default function PrecosPage() {
  const [yearly, setYearly] = useState(false);
  const [pending, startTransition] = useTransition();
  const price = yearly ? plans.premium.yearly : plans.premium.monthly;
  const period = yearly ? "/ano" : "/mês";

  function handleCheckout() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yearly }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else toast.error(data.error ?? "Configure Stripe para checkout");
      } catch {
        toast.error("Erro ao iniciar checkout");
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <CheckoutToastPrecos />
      </Suspense>
      <header className="border-b border-border/40 glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold text-gradient">
            FinDash
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Planos simples, valor real</h1>
          <p className="mt-4 text-muted-foreground">
            Comece grátis. Upgrade quando quiser histórico e relatórios.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Anual
              <Badge variant="green" className="ml-2">
                -35%
              </Badge>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{plans.free.name}</CardTitle>
              <CardDescription>Para começar a organizar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-bold">
                R$0<span className="text-lg text-muted-foreground">/mês</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {plans.free.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="mt-8 block">
                <Button variant="outline" className="w-full">
                  Começar grátis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="animate-glow-pulse-green border-fd-purple/40 bg-fd-purple/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{plans.premium.name}</CardTitle>
                <Badge variant="purple">Popular</Badge>
              </div>
              <CardDescription>Parceiro financeiro de longo prazo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-4xl font-bold">
                R${price}
                <span className="text-lg text-muted-foreground">{period}</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {plans.premium.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full bg-fd-purple hover:bg-fd-purple/90"
                onClick={handleCheckout}
                disabled={pending}
              >
                {pending ? "Redirecionando..." : "Testar 14 dias grátis"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
