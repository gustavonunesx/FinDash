"use client";

import { useEffect, useState } from "react";
import { animateCounter, getGreeting } from "@/lib/utils";
import { scoreColor } from "@/lib/score";
import { cn } from "@/lib/utils";
import type { Score502030Result } from "@/lib/score";

interface DashboardHeroProps {
  nome: string;
  scoreData: Score502030Result;
}

export function DashboardHero({ nome, scoreData }: DashboardHeroProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    return animateCounter(0, scoreData.score, 1400, setDisplayScore);
  }, [scoreData.score]);

  const firstName = nome.split(" ")[0];

  const statusLabel =
    scoreData.status === "saudavel" ? "Saudável" :
    scoreData.status === "atencao" ? "Atenção" : "Crítico";

  const statusRing =
    scoreData.status === "saudavel" ? "ring-fd-green/30 bg-fd-green/8" :
    scoreData.status === "atencao" ? "ring-fd-amber/30 bg-fd-amber/8" :
    "ring-fd-red/30 bg-fd-red/8";

  const statusTextColor =
    scoreData.status === "saudavel" ? "text-fd-green" :
    scoreData.status === "atencao" ? "text-fd-amber" : "text-fd-red";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Saudação */}
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-3xl">
          {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {scoreData.mensagem}
        </p>
      </div>

      {/* Score pill */}
      <div className={cn(
        "flex items-center gap-3 self-start rounded-2xl px-5 py-3 ring-1 sm:self-auto",
        statusRing
      )}>
        <div>
          <p className="text-xs text-muted-foreground">Score financeiro</p>
          <p className={cn("font-mono text-4xl font-bold leading-none tracking-tighter", scoreColor(scoreData.status))}>
            {Math.round(displayScore)}
          </p>
        </div>
        <div className="h-10 w-px bg-border/60" />
        <span className={cn("text-xs font-medium", statusTextColor)}>{statusLabel}</span>
      </div>
    </div>
  );
}
