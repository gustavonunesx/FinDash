"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIA_EMOJI, type Gasto } from "@/lib/types";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RecentTransactionsProps {
  gastos: Gasto[];
}

export function RecentTransactions({ gastos }: RecentTransactionsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rows = listRef.current?.querySelectorAll("[data-tx-row]");
      if (!rows?.length) return;

      gsap.fromTo(
        rows,
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: listRef, dependencies: [gastos] }
  );

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold md:text-3xl">Transações recentes</h2>
      <div ref={listRef} className="divide-y divide-border rounded-xl border border-border/60 bg-card/50">
        {gastos.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhum gasto registrado ainda. Comece adicionando seu primeiro gasto.
          </p>
        ) : (
          gastos.map((gasto) => (
            <div
              key={gasto.id}
              data-tx-row
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{CATEGORIA_EMOJI[gasto.categoria]}</span>
                <div>
                  <p className="font-medium">{gasto.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {gasto.subcategoria ?? gasto.categoria} · {formatRelativeDate(gasto.created_at)}
                  </p>
                </div>
              </div>
              <span className={cn("font-mono font-semibold", "text-fd-red")}>
                -{formatCurrency(gasto.valor)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
