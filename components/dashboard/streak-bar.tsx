"use client";

import { cn } from "@/lib/utils";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function StreakBar() {
  const today = new Date().getDay();
  const streak = 4;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Sequência de organização</p>
        <p className="font-mono text-sm text-fd-green">{streak} dias seguidos</p>
      </div>
      <div className="mt-3 flex gap-2">
        {DAYS.map((day, i) => (
          <div
            key={i}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-lg text-xs font-medium",
              i <= today - 1 || (today === 0 && i === 6)
                ? "bg-fd-green/20 text-fd-green"
                : "bg-secondary text-muted-foreground",
              i === (today === 0 ? 6 : today - 1) && "animate-pulse-soft ring-2 ring-fd-green/40"
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
