"use client";

import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

interface KpiCardProps {
  icon: TablerIcon;
  iconColor: string;
  label: string;
  value: string;
  trendPct?: number;
  trendPositive?: boolean;
  index?: number;
}

/** Card estilo analytics-dashboard: chip de ícone tintado, número grande, badge de tendência. */
export function KpiCard({ icon: Icon, iconColor, label, value, trendPct, trendPositive, index = 0 }: KpiCardProps) {
  return (
    <div
      data-reveal
      style={{ "--index": index } as React.CSSProperties}
      className="reveal rounded-2xl border border-border bg-card p-5 shadow-[var(--card-shadow)] transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-bold text-muted-foreground">{label}</p>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${iconColor}26` }}
        >
          <Icon size={19} stroke={2} color={iconColor} />
        </span>
      </div>
      <p className="mt-4 font-mono text-[1.7rem] font-extrabold leading-none tracking-tight text-foreground">{value}</p>
      {trendPct !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{
              color: trendPositive ? "var(--color-fd-green)" : "var(--color-fd-red)",
              background: trendPositive ? "color-mix(in srgb, var(--color-fd-green) 15%, transparent)" : "color-mix(in srgb, var(--color-fd-red) 15%, transparent)",
            }}
          >
            {trendPositive ? <IconArrowUpRight size={12} stroke={2.5} /> : <IconArrowDownRight size={12} stroke={2.5} />}
            {trendPct > 0 ? "+" : ""}
            {trendPct}%
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
}
