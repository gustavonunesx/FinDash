"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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

  const trends =
    hasTrend && current && previous
      ? [
          { label: "Renda", ...calcTrend(current.salario, previous.salario), invertColor: false },
          {
            label: "Gastos",
            ...calcTrend(current.total_gastos, previous.total_gastos),
            invertColor: true,
          },
          {
            label: "Saldo livre",
            ...calcTrend(
              current.salario - current.total_gastos,
              previous.salario - previous.total_gastos
            ),
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
        { opacity: 0, scale: 0.9, y: 12 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: ref.current, start: "top 88%" },
        }
      );
    },
    { scope: ref, dependencies: [historico, hasTrend] }
  );

  if (!hasTrend || !current) return null;

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-3">
      {trends.map((t) => {
        const positive = t.invertColor ? !t.up : t.up;
        return (
          <div
            key={t.label}
            data-trend
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  positive ? "bg-fd-green/10 text-fd-green" : "bg-fd-red/10 text-fd-red"
                )}
              >
                {t.up ? (
                  <IconTrendingUp className="h-4 w-4" />
                ) : (
                  <IconTrendingDown className="h-4 w-4" />
                )}
              </span>
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
              <p className="mt-1 font-mono text-sm text-foreground">
                {formatCurrency(current.salario - current.total_gastos)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
