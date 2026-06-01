import { AppShell } from "@/components/layout/app-shell";
import { CalculadoraClient } from "@/components/calculadora/calculadora-client";
import { getAppData } from "@/lib/data";

export default async function CalculadoraPage() {
  const { config, gastos, fundos } = await getAppData();

  return (
    <AppShell>
      <CalculadoraClient config={config!} gastos={gastos} fundos={fundos} />
    </AppShell>
  );
}
