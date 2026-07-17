"use client";

import { useState } from "react";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Fundo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const INSTITUICAO_COLORS: Record<string, string> = {
  Nubank: "#820AD1",
  Inter: "#FF7A00",
  Itaú: "#EC7000",
  XP: "#000000",
  BTG: "#002855",
  Sicoob: "#009639",
};

interface RendimentoInfo {
  total: number;
  mensal: number;
  percentual: number;
  dias: number;
}

interface FundoCardProps {
  fundo: Fundo;
  rendimento: RendimentoInfo;
}

function getCountdown(metaData: string | null): { label: string; variant: "green" | "amber" | "destructive" } {
  if (!metaData) return { label: "Sem prazo", variant: "green" };
  const diffDays = Math.ceil((new Date(metaData).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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

function estimativaMeses(saldo: number, meta: number, aporte: number): number | null {
  if (aporte <= 0 || saldo >= meta) return null;
  return Math.ceil((meta - saldo) / aporte);
}

export function FundoCard({ fundo, rendimento }: FundoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = fundo.meta > 0 ? (fundo.saldo_atual / fundo.meta) * 100 : 0;
  const countdown = getCountdown(fundo.meta_data);
  const meses = estimativaMeses(fundo.saldo_atual, fundo.meta, fundo.aporte_mensal);
  const instColor = fundo.custodia
    ? INSTITUICAO_COLORS[fundo.custodia.instituicao] ?? "#8888A0"
    : "#8888A0";

  return (
    <Card className="card-glow hover-lift border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          className="w-full p-5 text-left"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{fundo.nome}</p>
              {fundo.custodia && (
                <Badge
                  variant="outline"
                  className="mt-1 text-xs"
                  style={{ borderColor: instColor, color: instColor }}
                >
                  {fundo.custodia.instituicao} · {fundo.custodia.tipo.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={countdown.variant}>{countdown.label}</Badge>
              {expanded ? (
                <IconChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <p className="mt-4 font-mono text-2xl font-bold">{formatCurrency(fundo.saldo_atual)}</p>
          <p className="font-mono text-sm text-muted-foreground">
            meta {formatCurrency(fundo.meta)}
            {meses !== null && ` · ~${meses} meses`}
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", progressColor(pct))}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </button>

        {expanded && fundo.custodia && (
          <div className="border-t border-border/60 bg-secondary/20 px-5 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rendimento
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-muted-foreground">Total ganho</p>
                <p className="font-mono font-semibold text-fd-green">
                  +{formatCurrency(rendimento.total)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Mensal est.</p>
                <p className="font-mono font-semibold">+{formatCurrency(rendimento.mensal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">% ganho</p>
                <p className="font-mono font-semibold">{rendimento.percentual.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dias investido</p>
                <p className="font-mono font-semibold">{rendimento.dias}d</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
