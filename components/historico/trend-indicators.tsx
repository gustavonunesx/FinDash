"use client";

import { useEffect, useRef } from "react";
import type { HistoricoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
          { label: "Renda", ...calcTrend(current.salario, previous.salario), invertColor: false, value: current.salario },
          {
            label: "Gastos",
            ...calcTrend(current.total_gastos, previous.total_gastos),
            invertColor: true,
            value: current.total_gastos,
          },
          {
            label: "Saldo livre",
            ...calcTrend(
              current.salario - current.total_gastos,
              previous.salario - previous.total_gastos
            ),
            invertColor: false,
            value: current.salario - current.total_gastos,
          },
        ]
      : [];

  useEffect(() => {
    const root = ref.current;
    if (!root || !hasTrend) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [hasTrend, historico]);

  if (!hasTrend || !current) return null;

  return (
    <div ref={ref} className="grid gap-6 sm:grid-cols-3">
      {trends.map((t, i) => {
        const positive = t.invertColor ? !t.up : t.up;
        const color = positive ? "var(--color-fd-green)" : "var(--color-fd-red)";
        return (
          <div
            key={t.label}
            data-reveal
            style={{ "--index": i + 1 } as React.CSSProperties}
            className="reveal rounded-xl border border-border bg-card p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tracking-tight" style={{ color }}>
                {t.pct > 0 ? "+" : ""}
                {t.pct}%
              </span>
              {/* seta como primitivo SVG, sem lib de ícones */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color }} aria-hidden>
                {t.up ? (
                  <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              {formatCurrency(t.value)}
              <span className="ml-1.5 text-[11px]">vs. mês anterior</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
