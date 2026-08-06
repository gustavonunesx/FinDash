import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardFullscreen } from "@/components/dashboard/dashboard-fullscreen";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { CheckoutToast } from "@/components/shared/checkout-toast";
import { getAppData, getBancos, getHistorico, getRendaExtraHistorico } from "@/lib/data";
import { calcularScore502030, totalPorCategoria } from "@/lib/score";

export default async function DashboardPage() {
  const [{ profile, config, gastos, fundos }, bancos, historico, rendaExtraHistorico] = await Promise.all([
    getAppData(),
    getBancos(),
    getHistorico(),
    getRendaExtraHistorico(),
  ]);

  const scoreData = calcularScore502030(config, gastos);
  const totais = totalPorCategoria(gastos);
  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade;
  const isEmpty = scoreData.rendaTotal <= 0 && gastos.length === 0 && fundos.length === 0;

  return (
    <AppShell pageBg="#F4F7F5">
      <Suspense fallback={null}>
        <CheckoutToast />
      </Suspense>
      {isEmpty ? (
        <DashboardEmpty />
      ) : (
      <DashboardFullscreen
        profile={profile}
        config={config}
        scoreData={scoreData}
        totalGastos={totalGastos}
        fundos={fundos}
        gastos={gastos}
        bancos={bancos}
        historico={historico}
        metaEconomia={config?.meta_economia_mensal ?? null}
        rendaExtraHistorico={rendaExtraHistorico}
      />
      )}
    </AppShell>
  );
}
