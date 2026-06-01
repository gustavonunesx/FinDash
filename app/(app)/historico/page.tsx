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
          <IconLock className="h-12 w-12 text-fd-purple" />
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

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico Mensal</h1>
        <p className="mt-2 text-muted-foreground">Evolução financeira dos últimos 6 meses</p>
      </div>
      <HistoricoCharts historico={historico} />
    </AppShell>
  );
}
