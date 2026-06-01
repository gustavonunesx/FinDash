"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { confirmarAporte } from "@/app/(app)/fundos/actions";
import { calcularScore502030 } from "@/lib/score";
import { detectarFase } from "@/lib/rendimento";
import {
  loadPesosCustom,
  savePesosCustom,
  normalizePesos,
  PESOS_DEFAULT,
  type PesosRendaExtra,
} from "@/lib/calculadora-pesos";
import type { Configuracao, Fundo, Gasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
interface CalculadoraClientProps {
  config: Configuracao;
  gastos: Gasto[];
  fundos: Fundo[];
}

const FASE_PESOS = PESOS_DEFAULT;

const CARDS = [  { key: "reserva" as const, label: "Reserva", color: "border-fd-green/40 bg-fd-green/5" },
  { key: "objetivos" as const, label: "Objetivos", color: "border-fd-blue/40 bg-fd-blue/5" },
  { key: "qualidade" as const, label: "Qualidade", color: "border-fd-amber/40 bg-fd-amber/5" },
  { key: "investimentos" as const, label: "Investimentos", color: "border-fd-purple/40 bg-fd-purple/5" },
];

export function CalculadoraClient({ config, gastos, fundos }: CalculadoraClientProps) {
  const [rendaExtra, setRendaExtra] = useState(config.renda_extra || 0);
  const [activeCard, setActiveCard] = useState(0);
  const [showPesos, setShowPesos] = useState(false);
  const [pending, startTransition] = useTransition();

  const score = calcularScore502030({ ...config, renda_extra: rendaExtra }, gastos);
  const reserva = fundos.find((f) => f.nome.toLowerCase().includes("reserva"));
  const fase = detectarFase(reserva?.saldo_atual ?? 0, config.custo_vida);
  const [pesos, setPesos] = useState<PesosRendaExtra>(FASE_PESOS[fase]);

  useEffect(() => {
    setPesos(loadPesosCustom(fase));
  }, [fase]);

  function updatePeso(key: keyof PesosRendaExtra, pct: number) {
    const next = normalizePesos({ ...pesos, [key]: pct / 100 });
    setPesos(next);
    savePesosCustom(fase, next);
  }

  function resetPesos() {
    const defaults = { ...FASE_PESOS[fase] };
    setPesos(defaults);
    savePesosCustom(fase, defaults);
  }
  const distribuicao = CARDS.map((c) => ({
    ...c,
    valor: rendaExtra * pesos[c.key],
  }));

  const fundoInvestimento = fundos[0];

  function handleConfirmarAporte() {
    if (!fundoInvestimento) return toast.error("Crie um fundo primeiro");
    startTransition(async () => {
      const valor = distribuicao[activeCard].valor;
      const result = await confirmarAporte(fundoInvestimento.id, valor);
      if (result.error) toast.error(result.error);
      else {
        if (result.metaAtingida) {
          toast.success(`🎯 Meta atingida no fundo "${result.fundoNome}"!`, { duration: 5000 });
        } else {
          toast.success(`Aporte de ${formatCurrency(valor)} confirmado!`);
        }
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calculadoras</h1>
        <p className="mt-2 text-muted-foreground">
          Método 50/30/20 e distribuição de renda extra
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>50/30/20 — {formatCurrency(score.rendaTotal)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {score.categorias.map((cat) => (
            <div key={cat.categoria} className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm capitalize">{cat.categoria}</p>
              <p className="font-mono text-xl font-bold">{formatCurrency(cat.gasto)}</p>
              <p className="font-mono text-xs text-muted-foreground">
                limite {formatCurrency(cat.limite)}
              </p>
              <Badge
                variant={
                  cat.status === "ok" ? "green" : cat.status === "atencao" ? "amber" : "destructive"
                }
                className="mt-2"
              >
                {Math.round(cat.percentual * 100)}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Renda Extra</h2>
          <div className="flex items-center gap-2">
            <Badge variant={fase === "investindo" ? "purple" : "green"}>
              Fase: {fase}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowPesos(!showPesos)}>
              {showPesos ? "Ocultar pesos" : "Personalizar pesos"}
            </Button>
          </div>
        </div>

        {showPesos && (
          <Card className="mb-4 border-border/60">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              {CARDS.map((c) => (
                <div key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="font-mono">{Math.round(pesos[c.key] * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(pesos[c.key] * 100)}
                    onChange={(e) => updatePeso(c.key, parseInt(e.target.value, 10))}
                    className="w-full accent-fd-green"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button variant="ghost" size="sm" onClick={resetPesos}>
                  Restaurar padrão da fase
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-muted-foreground">Valor extra (R$)</label>
          <input
            type="number"
            className="w-40 rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm"
            value={rendaExtra || ""}
            onChange={(e) => setRendaExtra(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {distribuicao.map((card, i) => (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveCard(i)}
              className={cn(
                "min-w-[200px] snap-center rounded-xl border p-5 text-left transition-all hover-lift",
                card.color,
                activeCard === i && "ring-2 ring-primary"
              )}
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold">{formatCurrency(card.valor)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(pesos[card.key] * 100)}% da renda extra
              </p>
            </button>
          ))}
        </div>

        {fundoInvestimento && rendaExtra > 0 && (
          <Button className="mt-4" onClick={handleConfirmarAporte} disabled={pending}>
            Confirmar que investi {formatCurrency(distribuicao[activeCard].valor)} em{" "}
            {fundoInvestimento.nome}
          </Button>
        )}
      </div>
    </div>
  );
}
