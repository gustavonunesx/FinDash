"use client";

import { useRef, useEffect, useState } from "react";

export interface SegmentoBarra {
  key: string;
  label: string;
  peso: number;
  cor: string;
}

interface BarraProporcionalProps {
  segmentos: SegmentoBarra[];
}

export function BarraProporcional({ segmentos }: BarraProporcionalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisivel(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const total = segmentos.reduce((s, seg) => s + seg.peso, 0);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        height: 36,
        borderRadius: 10,
        overflow: "hidden",
        gap: 2,
      }}
    >
      {segmentos.map((seg, i) => {
        const pct = total > 0 ? (seg.peso / total) * 100 : 0;
        const isFirst = i === 0;
        const isLast = i === segmentos.length - 1;
        return (
          <div
            key={seg.key}
            style={{
              flex: pct,
              background: seg.cor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: isFirst ? "8px 0 0 8px" : isLast ? "0 8px 8px 0" : 0,
              overflow: "hidden",
              transition: visivel ? "flex 0.6s cubic-bezier(0.16,1,0.3,1)" : "none",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                opacity: pct > 6 ? 1 : 0,
                transition: "opacity 0.3s",
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                userSelect: "none",
              }}
            >
              {pct >= 15 ? `${seg.label} · ${seg.peso}%` : `${seg.peso}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
