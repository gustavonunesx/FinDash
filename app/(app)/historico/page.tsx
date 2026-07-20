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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fd-purple/10">
            <IconLock className="h-8 w-8 text-fd-purple" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Histórico Mensal</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Gráficos comparativos, tendências e snapshots mensais estão disponíveis no plano Premium.
          </p>
          <Link href="/precos" className="mt-8">
            <Button className="bg-fd-purple hover:bg-fd-purple/90">Upgrade para Premium</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const meses = historico.length;

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico Mensal</h1>
          <p className="mt-2 text-muted-foreground">Evolução financeira dos últimos 6 meses</p>
        </div>
        {meses > 0 && (
          <span className="rounded-full bg-fd-green/10 px-3 py-1 text-xs font-semibold text-fd-green">
            {meses} {meses === 1 ? "mês registrado" : "meses registrados"}
          </span>
        )}
      </div>
      {historico.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">
            Ainda não há snapshots mensais. Seus dados aparecerão aqui conforme os meses passam.
          </p>
        </div>
      ) : (
        <HistoricoCharts historico={historico} />
      )}
    </AppShell>
  );
}
