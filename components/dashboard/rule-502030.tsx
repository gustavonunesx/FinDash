"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIA_LABELS, type CategoriaGasto } from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CAT_CONFIG: Record<CategoriaGasto, { color: string; glow: string; bg: string }> = {
  necessidade: {
    color: "var(--color-fd-amber)",
    glow: "rgba(232,146,58,0.25)",
    bg: "bg-fd-amber/10 text-fd-amber",
  },
  objetivo: {
    color: "var(--color-fd-green)",
    glow: "rgba(29,158,117,0.25)",
    bg: "bg-fd-green/10 text-fd-green",
  },
  qualidade: {
    color: "var(--color-fd-blue)",
    glow: "rgba(55,138,221,0.25)",
    bg: "bg-fd-blue/10 text-fd-blue",
  },
};

interface Rule502030Props {
  data: Score502030Result;
}

export function Rule502030({ data }: Rule502030Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pctRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current || data.categorias.length === 0) return;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const cat = data.categorias[i];
        const targetWidth = Math.min((cat.gasto / cat.limite) * 100, 110);

        gsap.fromTo(
          bar,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: targetWidth / 100,
            duration: 1.1,
            ease: "power4.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.12,
          }
        );
      });

      pctRefs.current.forEach((el, i) => {
        if (!el) return;
        const cat = data.categorias[i];
        const target = Math.round(cat.percentual * 100);

        gsap.fromTo(
          el,
          { innerText: "0%" },
          {
            innerText: `${target}%`,
            duration: 0.9,
            snap: { innerText: 1 },
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.12 + 0.2,
          }
        );
      });
    },
    { scope: containerRef, dependencies: [data], revertOnUpdate: true }
  );

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-border bg-card p-6 shadow-card md:p-7"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Regra 50/30/20</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Distribuição real vs. meta do mês
          </p>
        </div>
        <div className={cn(
          "rounded-xl px-3 py-1.5 font-mono text-lg font-bold",
          data.status === "saudavel" ? "bg-fd-green/10 text-fd-green" :
          data.status === "atencao" ? "bg-fd-amber/10 text-fd-amber" :
          "bg-fd-red/10 text-fd-red"
        )}>
          {data.score}
        </div>
      </div>

      <div className="space-y-5">
        {data.categorias.map((cat, i) => {
          const cfg = CAT_CONFIG[cat.categoria];
          const pct = Math.min((cat.gasto / (cat.limite || 1)) * 100, 110);

          return (
            <div key={cat.categoria}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", cfg.bg)}>
                    {CATEGORIA_LABELS[cat.categoria]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    meta {Math.round(cat.meta * 100)}%
                  </span>
                  {cat.status === "excedido" && (
                    <span className="rounded-md bg-fd-red/10 px-2 py-0.5 text-xs font-medium text-fd-red">
                      EXCEDIDO
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span ref={(el) => { pctRefs.current[i] = el; }} className="font-mono text-sm font-bold">
                    0%
                  </span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {formatCurrency(cat.gasto)} / {formatCurrency(cat.limite)}
                  </span>
                </div>
              </div>

              {/* Track */}
              <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                {/* Meta marker */}
                <div
                  className="absolute top-0 h-full w-px bg-border z-10"
                  style={{ left: `${cat.meta * 100}%` }}
                />
                {/* Bar */}
                <div
                  ref={(el) => { barsRef.current[i] = el; }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: "100%",
                    transform: "scaleX(0)",
                    transformOrigin: "left center",
                    background: cfg.color,
                    boxShadow: pct > 50 ? `0 0 8px ${cfg.glow}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
