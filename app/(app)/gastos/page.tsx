import { AppShell } from "@/components/layout/app-shell";
import { GastosClient } from "@/components/gastos/gastos-client";
import { getAppData, getBancos } from "@/lib/data";

export default async function GastosPage() {
  const [{ profile, gastos }, bancos] = await Promise.all([getAppData(), getBancos()]);

  return (
    <AppShell>
      <GastosClient gastos={gastos} bancos={bancos} plano={profile.plano} />
    </AppShell>
  );
}
