"use client"

import { useEffect, useRef, useState } from "react"

interface MetricCardProps {
  label: string
  value: number
  formatted: string
  icon: React.ReactNode
  accentColor: string
  badge?: { text: string; variant: "success" | "danger" | "warning" | "info" | "neutral" }
  progress?: number
  index?: number
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [current, setCurrent] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const step = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCurrent(Math.round(target * eased))
        if (progress < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timeout)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, duration, delay])

  return current
}

const badgeStyles = {
  success: "bg-[color-mix(in_srgb,var(--fd-green)_15%,transparent)] text-[var(--fd-green)] border border-[color-mix(in_srgb,var(--fd-green)_30%,transparent)]",
  danger:  "bg-[color-mix(in_srgb,var(--fd-red)_15%,transparent)] text-[var(--fd-red)] border border-[color-mix(in_srgb,var(--fd-red)_30%,transparent)]",
  warning: "bg-[color-mix(in_srgb,var(--fd-amber)_15%,transparent)] text-[var(--fd-amber)] border border-[color-mix(in_srgb,var(--fd-amber)_30%,transparent)]",
  info:    "bg-[color-mix(in_srgb,var(--fd-blue)_15%,transparent)] text-[var(--fd-blue)] border border-[color-mix(in_srgb,var(--fd-blue)_30%,transparent)]",
  neutral: "bg-[color-mix(in_srgb,var(--muted-foreground)_12%,transparent)] text-[var(--muted-foreground)] border border-[color-mix(in_srgb,var(--muted-foreground)_20%,transparent)]",
}

export function MetricCard({
  label,
  value,
  formatted,
  icon,
  accentColor,
  badge,
  progress,
  index = 0,
}: MetricCardProps) {
  const animDelay = index * 80
  const count = useCountUp(value, 1100, animDelay + 300)
  const displayRaw = count.toLocaleString("pt-BR")

  const isCurrency = formatted.includes("R$")
  const animatedFormatted = isCurrency
    ? count.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : displayRaw

  return (
    <div
      className="group relative rounded-xl bg-card border border-border overflow-hidden
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]
        animate-fade-up"
      style={{
        animationDelay: `${animDelay}ms`,
        // @ts-expect-error css var
        "--accent": accentColor,
      }}
    >
      {/* accent line topo */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* glow border no hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 40%, transparent)` }}
      />

      <div className="p-4 pt-5 space-y-3">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
            >
              {icon}
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight">
              {label}
            </span>
          </div>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badgeStyles[badge.variant]}`}>
              {badge.text}
            </span>
          )}
        </div>

        {/* value */}
        <div className="font-mono text-2xl font-semibold text-foreground tabular-nums tracking-tight">
          {isCurrency ? animatedFormatted : displayRaw}
        </div>

        {/* progress bar */}
        {progress !== undefined && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full animate-progress"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: accentColor,
                  animationDelay: `${animDelay + 400}ms`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
