"use client";

import { useRef, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type StatusCategoria = "ok" | "atencao" | "excedido";

interface LinhaStatusCategoriaProps {
  cor: string;
  nome: string;
  gasto: number;
  limite: number;
}

const STATUS_COR: Record<StatusCategoria, string> = {
  ok: "#0E8F6A",
  atencao: "#C4820A",
  excedido: "#EF4444",
};

const STATUS_LABEL: Record<StatusCategoria, string> = {
  ok: "Dentro do limite",
  atencao: "Perto do limite",
  excedido: "Acima do limite",
};

const STATUS_BG: Record<StatusCategoria, string> = {
  ok: "#E3F6EF",
  atencao: "#FBF3E2",
  excedido: "#FEF2F2",
};

export function LinhaStatusCategoria({ cor, nome, gasto, limite }: LinhaStatusCategoriaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisivel(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pctRaw = limite > 0 ? (gasto / limite) * 100 : 0;
  const pct = Math.min(pctRaw, 100);

  let status: StatusCategoria = "ok";
  if (pctRaw > 100) status = "excedido";
  else if (pctRaw >= 80) status = "atencao";

  const barCor = STATUS_COR[status];

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
      }}
    >
      {/* Bolinha da categoria */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: cor,
          flexShrink: 0,
        }}
      />

      {/* Nome + barra */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>{nome}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                color: "#7C8896",
                whiteSpace: "nowrap",
              }}
            >
              {formatCurrency(gasto)}{" "}
              <span style={{ color: "#D1D5DB" }}>/</span>{" "}
              {formatCurrency(limite)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: STATUS_COR[status],
                background: STATUS_BG[status],
                borderRadius: 999,
                padding: "2px 8px",
                whiteSpace: "nowrap",
              }}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div
          style={{
            height: 5,
            borderRadius: 999,
            background: "#F0F2F4",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              background: barCor,
              width: visivel ? `${pct}%` : "0%",
              transition: visivel ? "width 0.7s cubic-bezier(0.16,1,0.3,1)" : "none",
            }}
          />
        </div>

        {/* Over-limit indicator */}
        {pctRaw > 100 && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "#EF4444",
              fontWeight: 600,
            }}
          >
            +{formatCurrency(gasto - limite)} acima do limite
          </div>
        )}
      </div>
    </div>
  );
}
