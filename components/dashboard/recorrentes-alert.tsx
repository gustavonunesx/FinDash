"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmarRecorrente } from "@/app/(app)/gastos/import-actions";
import type { Gasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RecorrentesAlertProps {
  gastos: Gasto[];
}

export function RecorrentesAlert({ gastos }: RecorrentesAlertProps) {
  const [pending, startTransition] = useTransition();

  const hoje = new Date().getDate();
  const sugestoes = gastos.filter(
    (g) =>
      g.recorrente &&
      g.dia_recorrencia !== null &&
      Math.abs(g.dia_recorrencia - hoje) <= 2
  );

  if (sugestoes.length === 0) return null;

  function handleConfirm(id: string, nome: string) {
    startTransition(async () => {
      const result = await confirmarRecorrente(id);
      if (result.error) toast.error(result.error);
      else toast.success(`Gasto "${nome}" confirmado para este mês`);
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-fd-amber/30 bg-fd-amber/10 p-4">
      <div className="flex items-center gap-2">
        <IconRefresh className="h-4 w-4 text-fd-amber" />
        <p className="font-medium">Gastos recorrentes sugeridos</p>
        <Badge variant="amber">{sugestoes.length}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {sugestoes.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-4 rounded-lg bg-background/50 px-4 py-3"
          >
            <div>
              <p className="font-medium">{g.nome}</p>
              <p className="font-mono text-sm text-muted-foreground">
                {formatCurrency(g.valor)} · dia {g.dia_recorrencia}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleConfirm(g.id, g.nome)}
            >
              Confirmar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
