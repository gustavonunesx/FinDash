"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  onboardingSalario,
  onboardingPrimeiroFundo,
  onboardingCompletar,
} from "@/app/(app)/onboarding/actions";

const STEPS = ["Salário", "Primeiro fundo", "Perfil"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [salario, setSalario] = useState("");
  const [fundoNome, setFundoNome] = useState("Reserva de Emergência");
  const [fundoMeta, setFundoMeta] = useState("");
  const [fundoSaldo, setFundoSaldo] = useState("");
  const [nome, setNome] = useState("");
  const [custoVida, setCustoVida] = useState("");
  const [pending, startTransition] = useTransition();

  function nextSalario() {
    startTransition(async () => {
      const result = await onboardingSalario(parseFloat(salario));
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStep(1);
    });
  }

  function nextFundo() {
    startTransition(async () => {
      const result = await onboardingPrimeiroFundo({
        nome: fundoNome,
        meta: parseFloat(fundoMeta),
        saldo_atual: parseFloat(fundoSaldo) || 0,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setStep(2);
    });
  }

  function finish() {
    startTransition(async () => {
      const result = await onboardingCompletar(nome, parseFloat(custoVida) || 0);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Onboarding concluído!");
      router.push("/dashboard");
    });
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gradient">Bem-vindo ao FinDash</h1>
        <p className="mt-2 text-muted-foreground">Configure sua conta em 3 passos</p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex h-8 items-center rounded-full px-3 text-xs font-medium transition-colors",
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-fd-green/20 text-fd-green"
                  : "bg-secondary text-muted-foreground"
            )}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Qual é seu salário mensal?</Label>
                <Input
                  type="number"
                  placeholder="4500"
                  className="font-mono text-lg"
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={nextSalario} disabled={pending || !salario}>
                Continuar
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do fundo</Label>
                <Input value={fundoNome} onChange={(e) => setFundoNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta (R$)</Label>
                  <Input
                    type="number"
                    className="font-mono"
                    value={fundoMeta}
                    onChange={(e) => setFundoMeta(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saldo atual</Label>
                  <Input
                    type="number"
                    className="font-mono"
                    value={fundoSaldo}
                    onChange={(e) => setFundoSaldo(e.target.value)}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={nextFundo}
                disabled={pending || !fundoMeta}
              >
                Continuar
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Como podemos te chamar?</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ana" />
              </div>
              <div className="space-y-2">
                <Label>Custo de vida mensal (R$)</Label>
                <Input
                  type="number"
                  className="font-mono"
                  value={custoVida}
                  onChange={(e) => setCustoVida(e.target.value)}
                  placeholder="3200"
                />
                <p className="text-xs text-muted-foreground">
                  Usado para detectar quando você está na fase &quot;investindo&quot;.
                </p>
              </div>
              <Button className="w-full" onClick={finish} disabled={pending || !nome}>
                {pending ? "Finalizando..." : "Ir para o dashboard"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
