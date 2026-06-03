"use client";

import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetaEconomiaProps {
  meta: number;
  atual: number;
}

export function MetaEconomia({ meta, atual }: MetaEconomiaProps) {
  const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;
  const isOnTrack = pct >= 50;

  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-5"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Meta de economia</p>
          <p className="mt-0.5 font-mono text-xl font-bold">
            {formatCurrency(atual)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            de {formatCurrency(meta)}
          </p>
        </div>
        <span className={cn(
          "rounded-lg px-2 py-1 text-xs font-medium",
          isOnTrack ? "bg-fd-green/10 text-fd-green" : "bg-fd-amber/10 text-fd-amber"
        )}>
          {Math.round(pct)}%
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: isOnTrack ? "var(--color-fd-green)" : "var(--color-fd-amber)",
            boxShadow: isOnTrack
              ? "0 0 8px rgba(29,158,117,0.4)"
              : "0 0 8px rgba(232,146,58,0.4)",
          }}
        />
      </div>
    </div>
  );
}
