"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressRingProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  centerValue: string;
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

/** Anel de progresso estilo analytics dashboard: track claro + arco colorido animado. */
export function ProgressRing({ value, max, color, size = 88, strokeWidth = 9, label, centerValue }: ProgressRingProps) {
  const [ref, visible] = useInView<HTMLDivElement>();
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const offset = c * (1 - pct);

  return (
    <div ref={ref} className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-border/60" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={visible ? offset : c}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div>
        <p className="text-lg font-extrabold tracking-tight text-foreground">{centerValue}</p>
        <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
