"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const VW = 640;
const VH = 240;

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

/**
 * IntersectionObserver — anima somente quando visível na viewport (regra do projeto).
 * Retorna [ref, visible].
 */
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
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

interface AreaLineChartProps {
  series: LineSeries[];
  height?: number;
}

/** Line/Area chart em SVG puro, theme-aware, com hover crosshair. */
export function AreaLineChart({ series, height = 240 }: AreaLineChartProps) {
  const uid = useId().replace(/:/g, "");
  const [wrapRef, visible] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const n = labels.length;
  const allVals = series.flatMap((s) => s.points.map((p) => p.value));
  const max = niceMax(Math.max(...allVals, 0) * 1.1);
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;

  const x = (i: number) => PAD.left + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const y = (v: number) => PAD.top + chartH - (v / max) * chartH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div ref={wrapRef} className="w-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        className="overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid + Y labels */}
        {gridLines.map((g) => {
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
                strokeDasharray={g === 0 ? "0" : "3 4"}
                opacity={g === 0 ? 1 : 0.6}
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-[var(--color-muted-foreground)] font-mono"
                fontSize={10}
              >
                {fmtK(Math.round(g * max))}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((l, i) => (
          <text
            key={l + i}
            x={x(i)}
            y={VH - 8}
            textAnchor="middle"
            className="fill-[var(--color-muted-foreground)]"
            fontSize={10}
          >
            {l}
          </text>
        ))}

        {/* Áreas + linhas */}
        {series.map((s) => {
          const pts = s.points.map((p, i) => [x(i), y(p.value)] as const);
          const line = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");
          const area =
            n > 1
              ? `${line} L${x(n - 1)},${PAD.top + chartH} L${x(0)},${PAD.top + chartH} Z`
              : "";
          return (
            <g key={s.key}>
              {n > 1 && <path d={area} fill={`url(#grad-${uid}-${s.key})`} opacity={visible ? 1 : 0} style={{ transition: "opacity 0.6s ease 0.3s" }} />}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: visible ? 0 : 1,
                  transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </g>
          );
        })}

        {/* Crosshair + pontos no hover */}
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
              r={hover === i ? 4 : 0}
              fill="var(--color-card)"
              stroke={s.color}
              strokeWidth={2.5}
              style={{ transition: "r 0.15s ease" }}
            />
          ))
        )}

        {/* Zonas de hover invisíveis */}
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

      {/* Tooltip */}
      {hover !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">{labels[hover]}</span>
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(s.points[hover]?.value ?? 0)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  points: SeriesPoint[];
  color: string;
  height?: number;
  negativeColor?: string;
}

/** Bar chart em SVG puro, theme-aware, suporta valores negativos. */
export function BarChart({ points, color, negativeColor, height = 220 }: BarChartProps) {
  const [wrapRef, visible] = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = points.length;
  const vals = points.map((p) => p.value);
  const rawMax = Math.max(...vals, 0);
  const rawMin = Math.min(...vals, 0);
  const max = niceMax(rawMax * 1.1 || 1);
  const min = rawMin < 0 ? -niceMax(Math.abs(rawMin) * 1.1) : 0;
  const range = max - min || 1;

  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;
  const slot = chartW / Math.max(n, 1);
  const bw = Math.min(slot * 0.55, 48);

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
        className="overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
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
                strokeDasharray="3 4"
                opacity={0.6}
              />
              <text
                x={PAD.left - 8}
                y={gy + 3}
                textAnchor="end"
                className="fill-[var(--color-muted-foreground)] font-mono"
                fontSize={10}
              >
                {fmtK(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* Linha do zero */}
        <line x1={PAD.left} x2={VW - PAD.right} y1={zeroY} y2={zeroY} stroke="var(--color-border)" strokeWidth={1} />

        {/* Barras */}
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
                rx={4}
                fill={barColor}
                opacity={hover === null || hover === i ? 1 : 0.45}
                style={{
                  transition: `y 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s, height 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s, opacity 0.2s ease`,
                }}
              >
                <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
              </rect>
              <text
                x={cx}
                y={VH - 8}
                textAnchor="middle"
                className="fill-[var(--color-muted-foreground)]"
                fontSize={10}
              >
                {p.label}
              </text>
              {hover === i && (
                <text
                  x={cx}
                  y={(p.value >= 0 ? top : zeroY + full) - (p.value >= 0 ? 6 : -14)}
                  textAnchor="middle"
                  className="fill-[var(--color-foreground)] font-mono font-semibold"
                  fontSize={11}
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
