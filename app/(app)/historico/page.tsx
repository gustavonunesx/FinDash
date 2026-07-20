import { AppShell } from "@/components/layout/app-shell";
import { HistoricoCharts } from "@/components/historico/historico-charts";
import { Button } from "@/components/ui/button";
import { IconLock } from "@tabler/icons-react";
import Link from "next/link";
import { getHistorico, getProfile } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";
import { registrarSnapshotMensal } from "@/app/(app)/historico/actions";

export default async function HistoricoPage() {
  const [profile, historico] = await Promise.all([getProfile(), getHistorico()]);
  const isPremium = profile?.plano === "premium" || isDemoMode();

  if (isPremium) {
    await registrarSnapshotMensal();
  }

  if (!isPremium) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary/50">
            <IconLock className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Premium
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Histórico Mensal</h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Gráficos comparativos, tendências e snapshots mensais estão disponíveis no plano Premium.
          </p>
          <Link href="/precos" className="mt-8">
            <Button className="rounded-md bg-foreground text-background hover:bg-foreground/85">
              Upgrade para Premium
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const meses = historico.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Análise financeira
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Histórico Mensal
            </h1>
            <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
              Evolução da sua renda, gastos e patrimônio ao longo dos últimos meses.
            </p>
          </div>
          {meses > 0 && (
            <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              {meses} {meses === 1 ? "mês" : "meses"}
            </span>
          )}
        </header>

        {historico.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="leading-relaxed text-muted-foreground">
              Ainda não há snapshots mensais. Seus dados aparecerão aqui conforme os meses passam.
            </p>
          </div>
        ) : (
          <HistoricoCharts historico={historico} />
        )}
      </div>
    </AppShell>
  );
}
