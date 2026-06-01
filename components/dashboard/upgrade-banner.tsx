import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function UpgradeBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-glow-pulse-green flex flex-col items-start justify-between gap-4 rounded-xl border border-fd-purple/30 bg-fd-purple/10 p-6 sm:flex-row sm:items-center",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconSparkles className="mt-0.5 h-5 w-5 text-fd-purple" />
        <div>
          <p className="font-semibold">Desbloqueie o FinDash Premium</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Histórico mensal, gráficos comparativos e exportação PDF por R$19/mês.
          </p>
        </div>
      </div>
      <Link
        href="/precos"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-fd-purple px-4 text-sm font-medium text-white transition-transform hover:bg-fd-purple/90 active:scale-[0.97]"
      >
        Ver planos
      </Link>
    </div>
  );
}
