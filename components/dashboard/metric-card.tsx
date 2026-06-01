"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { animateCounter, formatCurrency, handleCardGlow } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  progress?: number;
  badge?: { label: string; variant: "green" | "amber" | "blue" | "purple" | "destructive" };
  formatAsCurrency?: boolean;
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  progress,
  badge,
  formatAsCurrency = true,
  className,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animateCounter(0, value, 1200, setDisplayValue);
  }, [value]);

  return (
    <Card
      ref={cardRef}
      className={cn(
        "card-glow hover-lift glass-subtle border-border/60 transition-all",
        className
      )}
      onMouseMove={handleCardGlow}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
        <p className="mt-3 font-mono text-3xl font-bold tracking-tight md:text-4xl">
          {formatAsCurrency ? formatCurrency(displayValue) : displayValue}
        </p>
        {progress !== undefined && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="animate-progress h-full rounded-full bg-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
