"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface MetaEconomiaProps {
  meta: number;
  atual: number;
}

export function MetaEconomia({ meta, atual }: MetaEconomiaProps) {
  const pct = meta > 0 ? Math.min((atual / meta) * 100, 100) : 0;

  return (
    <Card className="border-border/60 bg-card/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Meta de economia mensal</p>
          <p className="font-mono text-sm text-muted-foreground">
            {formatCurrency(atual)} / {formatCurrency(meta)}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="animate-progress h-full rounded-full bg-fd-green"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
