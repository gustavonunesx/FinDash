"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIA_LABELS, type Gasto } from "@/lib/types";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const catColor: Record<string, string> = {
  necessidade: "bg-fd-amber/10 text-fd-amber",
  objetivo: "bg-fd-green/10 text-fd-green",
  qualidade: "bg-fd-blue/10 text-fd-blue",
};

const catDot: Record<string, string> = {
  necessidade: "bg-fd-amber",
  objetivo: "bg-fd-green",
  qualidade: "bg-fd-blue",
};

export function RecentTransactions({ gastos }: { gastos: Gasto[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rows = listRef.current?.querySelectorAll("[data-tx-row]");
      if (!rows?.length) return;
      gsap.fromTo(
        rows,
        { opacity: 0, x: -16 },
        {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: listRef, dependencies: [gastos] }
  );

  return (
    <div
      ref={listRef}
      className="rounded-2xl border border-white/[0.06] bg-[#1a1a24] overflow-hidden"
      style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)" }}
    >
      {gastos.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          Nenhum gasto registrado ainda.
        </p>
      ) : (
        gastos.map((gasto, i) => (
          <div
            key={gasto.id}
            data-tx-row
            className={cn(
              "flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]",
              i < gastos.length - 1 && "border-b border-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn("h-1.5 w-1.5 shrink-0 rounded-full", catDot[gasto.categoria])} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{gasto.nome}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", catColor[gasto.categoria])}>
                    {CATEGORIA_LABELS[gasto.categoria]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(gasto.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold text-fd-red">
              -{formatCurrency(gasto.valor)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
