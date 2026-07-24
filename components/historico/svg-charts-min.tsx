"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const PAD = { top: 14, right: 20, bottom: 26, left: 40 };
const VW = 640;
const VH = 220;

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function fmtK(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${v}`;
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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface LineSeries {
  key: string;
  name: string;
  color: string;
  points: SeriesPoint[];
}

/** Line chart editorial: traços finos, grid quase invisível, sem preenchimento pesado. */
export function LineChartMin({ series, height = 220 }: { series: LineSeries[]; height?: number }) {
  const uid = useId().replace(/:/g, "");
  const [wrapRef, visible] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const n = labels.length;
  const allVals = series.flatMap((s) => s.points.map((p) => p.value));
  const max = niceMax(Math.max(...allVals, 0) * 1.08);
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const y = (v: number) => PAD.top + chartH - (v / max) * chartH;

  return (
    <div ref={wrapRef} className="w-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`gmin-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.10" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {[0, 0.5, 1].map((g) => {
          const gy = PAD.top + chartH - g * chartH;
          return (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={VW - PAD.right}
                y1={gy}
                y2={gy}
                stroke="var(--color-border)"
                strokeWidth={1}
                opacity={g === 0 ? 0.8 : 0.4}
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-[var(--color-muted-foreground)] font-mono"
                fontSize={9.5}
              >
                {fmtK(Math.round(g * max))}
              </text>
            </g>
          );
        })}

        {labels.map((l, i) => (
          <text
            key={l + i}
            x={x(i)}
            y={VH - 8}
            textAnchor="middle"
            className="fill-[var(--color-muted-foreground)] font-mono uppercase"
            fontSize={9}
            letterSpacing="0.04em"
          >
            {l}
          </text>
        ))}

        {series.map((s) => {
          const pts = s.points.map((p, i) => [x(i), y(p.value)] as const);
          const line = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
          const area =
            n > 1 ? `${line} L${x(n - 1)},${PAD.top + chartH} L${x(0)},${PAD.top + chartH} Z` : "";
          return (
            <g key={s.key}>
              {n > 1 && (
                <path
                  d={area}
                  fill={`url(#gmin-${uid}-${s.key})`}
                  opacity={visible ? 1 : 0}
                  style={{ transition: "opacity 0.6s ease 0.3s" }}
                />
              )}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: visible ? 0 : 1,
                  transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </g>
          );
        })}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + chartH}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        )}
        {series.map((s) =>
          s.points.map((p, i) => (
            <circle
              key={s.key + i}
              cx={x(i)}
              cy={y(p.value)}
              r={hover === i ? 3.5 : 0}
              fill="var(--color-card)"
              stroke={s.color}
              strokeWidth={1.75}
              style={{ transition: "r 0.15s ease" }}
            />
          ))
        )}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={x(i) - chartW / (2 * Math.max(n - 1, 1))}
            y={PAD.top}
            width={chartW / Math.max(n - 1, 1)}
            height={chartH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 text-xs">
          <span className="font-mono uppercase tracking-wide text-muted-foreground">{labels[hover]}</span>
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(s.points[hover]?.value ?? 0)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bar chart editorial: barras finas, cantos 2px, grid discreto, suporta negativo. */
export function BarChartMin({
  points,
  color,
  negativeColor,
  height = 200,
}: {
  points: SeriesPoint[];
  color: string;
  negativeColor?: string;
  height?: number;
}) {
  const [wrapRef, visible] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = points.length;
  const vals = points.map((p) => p.value);
  const rawMax = Math.max(...vals, 0);
  const rawMin = Math.min(...vals, 0);
  const max = niceMax(rawMax * 1.08 || 1);
  const min = rawMin < 0 ? -niceMax(Math.abs(rawMin) * 1.08) : 0;
  const range = max - min || 1;

  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;
  const slot = chartW / Math.max(n, 1);
  const bw = Math.min(slot * 0.4, 34);
  const y = (v: number) => PAD.top + chartH - ((v - min) / range) * chartH;
  const zeroY = y(0);

  return (
    <div ref={wrapRef} className="w-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.5, 1].map((g) => {
          const gy = PAD.top + g * chartH;
          const val = max - g * range;
          return (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={VW - PAD.right}
                y1={gy}
                y2={gy}
                stroke="var(--color-border)"
                strokeWidth={1}
                opacity={0.4}
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-[var(--color-muted-foreground)] font-mono"
                fontSize={9.5}
              >
                {fmtK(Math.round(val))}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={VW - PAD.right} y1={zeroY} y2={zeroY} stroke="var(--color-border)" strokeWidth={1} opacity={0.8} />

        {points.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const barColor = p.value < 0 ? negativeColor ?? color : color;
          const top = p.value >= 0 ? y(p.value) : zeroY;
          const full = Math.abs(zeroY - y(p.value));
          return (
            <g key={p.label + i} onMouseEnter={() => setHover(i)}>
              <rect
                x={cx - bw / 2}
                y={visible ? top : zeroY}
                width={bw}
                height={visible ? full : 0}
                rx={2}
                fill={barColor}
                opacity={hover === null || hover === i ? 0.9 : 0.35}
                style={{
                  transition: `y 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s, height 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s, opacity 0.2s ease`,
                }}
              >
                <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
              </rect>
              <text
                x={cx}
                y={VH - 8}
                textAnchor="middle"
                className="fill-[var(--color-muted-foreground)] font-mono uppercase"
                fontSize={9}
                letterSpacing="0.04em"
              >
                {p.label}
              </text>
              {hover === i && (
                <text
                  x={cx}
                  y={(p.value >= 0 ? top : zeroY + full) - (p.value >= 0 ? 6 : -13)}
                  textAnchor="middle"
                  className="fill-[var(--color-foreground)] font-mono"
                  fontSize={10}
                >
                  {fmtK(Math.round(p.value))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Sparkline compacta pra uso inline em tabela — sem eixos, sem grid, só a linha. */
export function Sparkline({ points, color, width = 96, height = 28 }: { points: number[]; color: string; width?: number; height?: number }) {
  if (points.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const x = (i: number) => pad + (i / (points.length - 1)) * w;
  const y = (v: number) => pad + h - ((v - min) / range) * h;
  const line = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={x(points.length - 1)} cy={y(last)} r={2} fill={color} />
    </svg>
  );
}
