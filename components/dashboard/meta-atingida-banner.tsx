"use client";

import Link from "next/link";
import { IconTarget } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Fundo } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface MetaAtingidaBannerProps {
  fundos: Fundo[];
}

export function MetaAtingidaBanner({ fundos }: MetaAtingidaBannerProps) {
  const atingidos = fundos.filter((f) => f.meta > 0 && f.saldo_atual >= f.meta);
  if (atingidos.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-fd-green/40 bg-fd-green/10 p-4">
      <div className="flex items-center gap-2">
        <IconTarget className="h-5 w-5 text-fd-green" />
        <p className="font-semibold text-fd-green">Meta(s) atingida(s)! 🎉</p>
        <Badge variant="green">{atingidos.length}</Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {atingidos.map((f) => (
          <li key={f.id} className="flex items-center justify-between text-sm">
            <span>{f.nome}</span>
            <span className="font-mono font-semibold">{formatCurrency(f.saldo_atual)}</span>
          </li>
        ))}
      </ul>
      <Link href="/fundos" className="mt-3 inline-block">
        <Button size="sm" variant="outline">
          Ver fundos
        </Button>
      </Link>
    </div>
  );
}
