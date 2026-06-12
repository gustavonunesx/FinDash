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
    scoreData.status === "atencao"  ? "Atenção"  : "Crítico";

  const statusStyle =
    scoreData.status === "saudavel" ? "bg-emerald-50 text-fd-green border-emerald-200" :
    scoreData.status === "atencao"  ? "bg-amber-50  text-fd-amber  border-amber-200"  :
                                      "bg-red-50    text-fd-red    border-red-200";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">{getGreeting()}</p>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {firstName}
        </h1>
        <span className={cn(
          "rounded-full border px-3 py-1 text-xs font-semibold",
          statusStyle
        )}>
          Score {Math.round(displayScore)} — {statusLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{scoreData.mensagem}</p>
    </div>
  );
}
