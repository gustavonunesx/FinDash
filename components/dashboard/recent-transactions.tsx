"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIA_LABELS, type Gasto } from "@/lib/types";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const catStyle: Record<string, string> = {
  necessidade: "bg-amber-50  text-fd-amber",
  objetivo:    "bg-emerald-50 text-fd-green",
  qualidade:   "bg-blue-50   text-fd-blue",
};

const catDot: Record<string, string> = {
  necessidade: "bg-fd-amber",
  objetivo:    "bg-fd-green",
  qualidade:   "bg-fd-blue",
};

export function RecentTransactions({ gastos }: { gastos: Gasto[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rows = listRef.current?.querySelectorAll("[data-tx-row]");
      if (!rows?.length) return;
      gsap.fromTo(rows,
        { opacity: 0, x: -12 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: "power2.out",
          scrollTrigger: { trigger: listRef.current, start: "top 88%", toggleActions: "play none none reverse" } }
      );
    },
    { scope: listRef, dependencies: [gastos] }
  );

  if (gastos.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        Nenhum gasto registrado ainda.
      </p>
    );
  }

  return (
    <div ref={listRef}>
      {gastos.map((gasto, i) => (
        <div
          key={gasto.id}
          data-tx-row
          className={cn(
            "flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/50",
            i < gastos.length - 1 && "border-b border-border"
          )}
        >
          {/* Ícone colorido */}
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold", catStyle[gasto.categoria])}>
            {gasto.nome.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{gasto.nome}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", catStyle[gasto.categoria])}>
                {CATEGORIA_LABELS[gasto.categoria]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeDate(gasto.created_at)}
              </span>
            </div>
          </div>

          <span className="shrink-0 font-mono text-sm font-semibold text-fd-red">
            -{formatCurrency(gasto.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}
