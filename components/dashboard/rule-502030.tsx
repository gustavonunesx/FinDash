"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui/badge";
import { CATEGORIA_COLORS, CATEGORIA_LABELS, type CategoriaGasto } from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Rule502030Props {
  data: Score502030Result;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

export function Rule502030({ data, sectionRef }: Rule502030Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      if (!containerRef.current || data.categorias.length === 0) return;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const cat = data.categorias[i];
        const targetWidth = Math.min((cat.gasto / cat.limite) * 100, 120);

        gsap.fromTo(
          bar,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: targetWidth / 100,
            duration: 1.2,
            ease: "elastic.out(1, 0.6)",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.15,
          }
        );
      });

      labelsRef.current.forEach((label, i) => {
        if (!label) return;
        const cat = data.categorias[i];
        const targetPct = Math.round(cat.percentual * 100);

        gsap.fromTo(
          label,
          { innerText: "0%" },
          {
            innerText: `${targetPct}%`,
            duration: 1,
            snap: { innerText: 1 },
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.15 + 0.3,
          }
        );
      });
    },
    { scope: containerRef, dependencies: [data], revertOnUpdate: true }
  );

  const bgClass =
    data.status === "saudavel"
      ? "from-fd-green/5"
      : data.status === "atencao"
        ? "from-fd-amber/5"
        : "from-fd-red/5";

  return (
    <div
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "rounded-2xl border border-border/60 bg-gradient-to-br to-transparent p-8 md:p-12",
        bgClass
      )}
    >
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Regra 50/30/20</h2>
          <p className="mt-2 text-muted-foreground">
            Distribuição ideal vs. gastos reais do mês
          </p>
        </div>
        <div className="font-mono text-4xl font-bold text-gradient md:text-5xl">
          {data.score}
        </div>
      </div>

      <div ref={containerRef} className="space-y-8">
        {data.categorias.map((cat, i) => (
          <CategoryBar
            key={cat.categoria}
            categoria={cat.categoria}
            gasto={cat.gasto}
            limite={cat.limite}
            meta={cat.meta}
            status={cat.status}
            barRef={(el) => {
              barsRef.current[i] = el;
            }}
            labelRef={(el) => {
              labelsRef.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryBar({
  categoria,
  gasto,
  limite,
  meta,
  status,
  barRef,
  labelRef,
}: {
  categoria: CategoriaGasto;
  gasto: number;
  limite: number;
  meta: number;
  status: "ok" | "atencao" | "excedido";
  barRef: (el: HTMLDivElement | null) => void;
  labelRef: (el: HTMLSpanElement | null) => void;
}) {
  const color = CATEGORIA_COLORS[categoria];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-medium">{CATEGORIA_LABELS[categoria]}</span>
          <Badge variant="outline" className="font-mono text-xs">
            meta {Math.round(meta * 100)}%
          </Badge>
          {status === "excedido" && <Badge variant="destructive">EXCEDIDO</Badge>}
          {status === "atencao" && <Badge variant="amber">ATENÇÃO</Badge>}
        </div>
        <div className="text-right">
          <span ref={labelRef} className="font-mono text-lg font-bold">
            0%
          </span>
          <p className="font-mono text-sm text-muted-foreground">
            {formatCurrency(gasto)} / {formatCurrency(limite)}
          </p>
        </div>
      </div>
      <div className="relative h-6 overflow-hidden rounded-full bg-secondary/80 md:h-8">
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color, width: "100%", transform: "scaleX(0)" }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-foreground/40"
          style={{ left: `${meta * 100}%` }}
        />
      </div>
    </div>
  );
}
