import { AppShell } from "@/components/layout/app-shell";
import { CalculadoraClient } from "@/components/calculadora/calculadora-client";
import { getAppData, getRendaExtraHistorico } from "@/lib/data";

export default async function CalculadoraPage() {
  const [{ config, gastos, fundos }, rendaExtraHistorico] = await Promise.all([
    getAppData(),
    getRendaExtraHistorico(),
  ]);

  return (
    <AppShell>
      <CalculadoraClient
        config={config!}
        gastos={gastos}
        fundos={fundos}
        rendaExtraHistorico={rendaExtraHistorico}
      />
    </AppShell>
  );
}
