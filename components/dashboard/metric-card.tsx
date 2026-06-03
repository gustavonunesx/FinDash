"use client";

import { useEffect, useRef, useState } from "react";
import { animateCounter, formatCurrency, handleCardGlow } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  progress?: number;
  badge?: { label: string; variant: "green" | "amber" | "blue" | "purple" | "destructive" };
  formatAsCurrency?: boolean;
  className?: string;
  icon: React.ReactNode;
  iconColor?: "green" | "blue" | "amber" | "purple";
  trend?: { value: number; label: string };
}

const iconBg: Record<string, string> = {
  green: "bg-fd-green/15 text-fd-green",
  blue: "bg-fd-blue/15 text-fd-blue",
  amber: "bg-fd-amber/15 text-fd-amber",
  purple: "bg-fd-purple/15 text-fd-purple",
};

const trendColor: Record<string, string> = {
  green: "text-fd-green",
  blue: "text-fd-blue",
  amber: "text-fd-amber",
  purple: "text-fd-purple",
  destructive: "text-fd-red",
};

export function MetricCard({
  title,
  value,
  progress,
  badge,
  formatAsCurrency = true,
  className,
  icon,
  iconColor = "green",
  trend,
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
        "card-glow group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1a1a24] p-5 cursor-default",
        "transition-all duration-300 hover:-translate-y-1",
        className
      )}
      onMouseMove={handleCardGlow}
      style={{
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      {/* Glow no hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(180px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(29,158,117,0.06), transparent)" }}
      />

      <div className="flex items-start justify-between gap-3">
        {/* Ícone circular */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBg[iconColor])}>
          {icon}
        </div>

        {badge && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            badge.variant === "green" && "bg-fd-green/15 text-fd-green",
            badge.variant === "blue" && "bg-fd-blue/15 text-fd-blue",
            badge.variant === "amber" && "bg-fd-amber/15 text-fd-amber",
            badge.variant === "purple" && "bg-fd-purple/15 text-fd-purple",
            badge.variant === "destructive" && "bg-fd-red/15 text-fd-red",
          )}>
            {badge.label}
          </span>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-tight md:text-3xl">
        {formatAsCurrency ? formatCurrency(displayValue) : Math.round(displayValue)}
      </p>

      {trend && (
        <p className={cn("mt-1 text-xs font-medium", trendColor[badge?.variant ?? "green"])}>
          ▲ {trend.value}% {trend.label}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: "var(--color-fd-green)",
            }}
          />
        </div>
      )}
    </div>
  );
}
