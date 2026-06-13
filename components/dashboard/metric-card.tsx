"use client";

import { useEffect, useRef, useState } from "react";
import { animateCounter, formatCurrency, handleCardGlow } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TrendProps {
  value: number;
  label: string;
  formatAsCurrency?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  progress?: number;
  formatAsCurrency?: boolean;
  formatTrendAsCount?: boolean;
  className?: string;
  icon: React.ReactNode;
  iconColor?: "green" | "blue" | "amber" | "purple";
  trend?: TrendProps;
  statusLabel?: string;
  statusVariant?: "green" | "amber" | "blue" | "purple" | "destructive";
}

const iconStyles: Record<string, string> = {
  green:  "bg-emerald-50  text-fd-green",
  blue:   "bg-blue-50     text-fd-blue",
  amber:  "bg-amber-50    text-fd-amber",
  purple: "bg-purple-50   text-fd-purple",
};

const statusStyles: Record<string, string> = {
  green:       "bg-emerald-50  text-fd-green",
  blue:        "bg-blue-50     text-fd-blue",
  amber:       "bg-amber-50    text-fd-amber",
  purple:      "bg-purple-50   text-fd-purple",
  destructive: "bg-red-50      text-fd-red",
};

const progressColors: Record<string, string> = {
  green:  "var(--color-fd-green)",
  blue:   "var(--color-fd-blue)",
  amber:  "var(--color-fd-amber)",
  purple: "var(--color-fd-purple)",
};

export function MetricCard({
  title,
  value,
  progress,
  formatAsCurrency = true,
  formatTrendAsCount = false,
  className,
  icon,
  iconColor = "green",
  trend,
  statusLabel,
  statusVariant,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animateCounter(0, value, 1200, setDisplayValue);
  }, [value]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "card-glow group relative rounded-xl border border-border bg-card p-5 cursor-default shadow-card",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      onMouseMove={handleCardGlow}
    >
      {/* Linha superior: ícone + badge de status */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconStyles[iconColor])}>
          {icon}
        </div>
        {statusLabel && statusVariant && (
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", statusStyles[statusVariant])}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <p className="mt-4 text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {formatAsCurrency ? formatCurrency(displayValue) : Math.round(displayValue)}
      </p>

      {/* Trend */}
      {trend && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatTrendAsCount
            ? <><span className="font-semibold text-foreground">{Math.round(trend.value)}</span> {trend.label}</>
            : trend.formatAsCurrency
              ? <><span className="font-semibold text-fd-green">+{formatCurrency(trend.value)}</span> {trend.label}</>
              : <><span className="font-semibold text-fd-green">↑ {trend.value}%</span> {trend.label}</>
          }
        </p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: progressColors[iconColor],
            }}
          />
        </div>
      )}
    </div>
  );
}
