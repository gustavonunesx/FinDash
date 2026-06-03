"use client";

import type { Fundo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FundoMiniCardProps {
  fundo: Fundo;
}

function getCountdown(metaData: string | null) {
  if (!metaData) return { label: "Sem prazo", color: "text-muted-foreground" };
  const diffDays = Math.ceil((new Date(metaData).getTime() - Date.now()) / 86400000);
  if (diffDays <= 0) return { label: "Expirado", color: "text-fd-red" };
  if (diffDays <= 30) return { label: `${diffDays}d`, color: "text-fd-red" };
  if (diffDays <= 90) return { label: `${Math.ceil(diffDays / 30)}m`, color: "text-fd-amber" };
  return { label: `${Math.ceil(diffDays / 30)}m`, color: "text-fd-green" };
}

function barColor(pct: number) {
  if (pct >= 100) return "var(--color-fd-green)";
  if (pct >= 60) return "var(--color-fd-blue)";
  if (pct >= 30) return "var(--color-fd-amber)";
  return "var(--color-fd-red)";
}

export function FundoMiniCard({ fundo }: FundoMiniCardProps) {
  const pct = fundo.meta > 0 ? (fundo.saldo_atual / fundo.meta) * 100 : 0;
  const countdown = getCountdown(fundo.meta_data);

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#1a1a24] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 4px 16px rgba(0,0,0,0.3)" }}
    >
      {/* Color dot */}
      <div
        className="h-8 w-1.5 shrink-0 rounded-full"
        style={{ background: barColor(pct) }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{fundo.nome}</p>
          <span className={cn("shrink-0 font-mono text-xs", countdown.color)}>
            {countdown.label}
          </span>
        </div>

        {fundo.custodia && (
          <p className="mt-0.5 text-xs text-muted-foreground">{fundo.custodia.instituicao}</p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }}
              />
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold">{formatCurrency(fundo.saldo_atual)}</p>
        <p className="font-mono text-xs text-muted-foreground">/ {formatCurrency(fundo.meta)}</p>
      </div>
    </div>
  );
}
