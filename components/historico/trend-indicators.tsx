"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface TrendIndicatorsProps {
  historico: HistoricoMensal[];
}

function calcTrend(current: number, previous: number) {
  if (previous === 0) return { pct: 0, up: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct, up: pct >= 0 };
}

export function TrendIndicators({ historico }: TrendIndicatorsProps) {
  const ref = useRef<HTMLDivElement>(null);

  const hasTrend = historico.length >= 2;
  const current = hasTrend ? historico[historico.length - 1] : null;
  const previous = hasTrend ? historico[historico.length - 2] : null;

  const trends = hasTrend && current && previous
    ? [
        { label: "Renda", ...calcTrend(current.salario, previous.salario), invertColor: false },
        {
          label: "Gastos",
          ...calcTrend(current.total_gastos, previous.total_gastos),
          invertColor: true,
        },
        {
          label: "Saldo livre",
          ...calcTrend(current.salario - current.total_gastos, previous.salario - previous.total_gastos),
          invertColor: false,
        },
      ]
    : [];

  useGSAP(
    () => {
      if (!hasTrend) return;
      const items = ref.current?.querySelectorAll("[data-trend]");
      if (!items?.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.4)" }
      );
    },
    { scope: ref, dependencies: [historico, hasTrend] }
  );

  if (!hasTrend || !current) return null;

  return (
    <div ref={ref} className="mb-8 grid gap-3 sm:grid-cols-3">
      {trends.map((t) => {
        const positive = t.invertColor ? !t.up : t.up;
        return (
          <div
            key={t.label}
            data-trend
            className="rounded-xl border border-border/60 bg-card/50 p-4"
          >
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <div className="mt-2 flex items-center gap-2">
              {t.up ? (
                <IconTrendingUp className={cn("h-5 w-5", positive ? "text-fd-green" : "text-fd-red")} />
              ) : (
                <IconTrendingDown className={cn("h-5 w-5", positive ? "text-fd-green" : "text-fd-red")} />
              )}
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  positive ? "text-fd-green" : "text-fd-red"
                )}
              >
                {t.pct > 0 ? "+" : ""}
                {t.pct}%
              </span>
              <span className="text-xs text-muted-foreground">vs. mês anterior</span>
            </div>
            {t.label === "Saldo livre" && (
              <p className="mt-1 font-mono text-sm">
                {formatCurrency(current.salario - current.total_gastos)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
