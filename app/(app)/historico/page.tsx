import { AppShell } from "@/components/layout/app-shell";
import { HistoricoCharts } from "@/components/historico/historico-charts";
import { Button } from "@/components/ui/button";
import { IconLock, IconChartHistogram } from "@tabler/icons-react";
import Link from "next/link";
import { getHistorico, getProfile, getRendaExtraHistorico } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";
import { registrarSnapshotMensal } from "@/app/(app)/historico/actions";

export default async function HistoricoPage() {
  const [profile, historico, rendaExtra] = await Promise.all([
    getProfile(),
    getHistorico(),
    getRendaExtraHistorico(),
  ]);
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
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fd-green/15">
              <IconChartHistogram size={22} stroke={2} className="text-fd-green" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Histórico Mensal</h1>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                Evolução da sua renda, gastos e patrimônio
              </p>
            </div>
          </div>
          {meses > 0 && (
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
              {meses} {meses === 1 ? "mês registrado" : "meses registrados"}
            </span>
          )}
        </header>

        {historico.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-[var(--card-shadow)]">
            <p className="leading-relaxed text-muted-foreground">
              Ainda não há snapshots mensais. Seus dados aparecerão aqui conforme os meses passam.
            </p>
          </div>
        ) : (
          <HistoricoCharts historico={historico} rendaExtra={rendaExtra} />
        )}
      </div>
    </AppShell>
  );
}
