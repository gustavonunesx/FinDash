"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Fundo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FundoMiniCardProps {
  fundo: Fundo;
}

function getCountdown(metaData: string | null): { label: string; variant: "green" | "amber" | "destructive" } {
  if (!metaData) return { label: "Sem prazo", variant: "green" };
  const target = new Date(metaData);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { label: "Expirado", variant: "destructive" };
  if (diffDays <= 30) return { label: `${diffDays}d restantes`, variant: "destructive" };
  if (diffDays <= 90) return { label: `${Math.ceil(diffDays / 30)} meses`, variant: "amber" };
  return { label: `${Math.ceil(diffDays / 30)} meses`, variant: "green" };
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-fd-green";
  if (pct >= 60) return "bg-fd-blue";
  if (pct >= 30) return "bg-fd-amber";
  return "bg-fd-red";
}

export function FundoMiniCard({ fundo }: FundoMiniCardProps) {
  const pct = fundo.meta > 0 ? (fundo.saldo_atual / fundo.meta) * 100 : 0;
  const countdown = getCountdown(fundo.meta_data);

  return (
    <Card className="card-glow hover-lift glass-subtle h-full border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{fundo.nome}</p>
            {fundo.custodia && (
              <Badge variant="outline" className="mt-1 text-xs">
                {fundo.custodia.instituicao}
              </Badge>
            )}
          </div>
          <Badge variant={countdown.variant}>{countdown.label}</Badge>
        </div>

        <p className="mt-4 font-mono text-2xl font-bold">
          {formatCurrency(fundo.saldo_atual)}
        </p>
        <p className="font-mono text-sm text-muted-foreground">
          meta {formatCurrency(fundo.meta)}
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", progressColor(pct))}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {Math.round(pct)}% · {formatCurrency(fundo.aporte_mensal)}/mês
        </p>
      </CardContent>
    </Card>
  );
}
