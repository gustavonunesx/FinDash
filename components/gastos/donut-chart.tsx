"use client";

import { formatCurrency } from "@/lib/utils";

interface DonutChartProps {
  necessidade: number;
  objetivo: number;
  qualidade: number;
  total: number;
}

const COLORS = {
  necessidade: "#C4820A",
  objetivo:    "#0E8F6A",
  qualidade:   "#2563EB",
};

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const GAP_DEG = 3;

export function DonutChart({ necessidade, objetivo, qualidade, total }: DonutChartProps) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const R = 50;
  const strokeWidth = 16;

  const segments = [
    { key: "necessidade", value: necessidade, color: COLORS.necessidade },
    { key: "objetivo",    value: objetivo,    color: COLORS.objetivo },
    { key: "qualidade",   value: qualidade,   color: COLORS.qualidade },
  ].filter((s) => s.value > 0);

  // Start at top = -90°
  let cursor = -90;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const sweep = fraction * 360;
    const startDeg = cursor + GAP_DEG / 2;
    const endDeg = cursor + sweep - GAP_DEG / 2;
    cursor += sweep;
    return { ...seg, d: describeArc(cx, cy, R, startDeg, endDeg) };
  });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#F0F1F3"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc) => (
          <path
            key={arc.key}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
        {/* White center */}
        <circle cx={cx} cy={cy} r={R - strokeWidth / 2 - 1} fill="#fff" />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 7}
          textAnchor="middle"
          fill="#9AA3AE"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
        >
          Total
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="#0F1729"
          fontSize={10}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
        >
          {formatCurrency(total)}
        </text>
      </svg>
    </div>
  );
}
