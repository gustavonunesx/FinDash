import { AppShell } from "@/components/layout/app-shell";
import { GastosClient } from "@/components/gastos/gastos-client";
import { getAppData } from "@/lib/data";

export default async function GastosPage() {
  const { profile, gastos } = await getAppData();

  return (
    <AppShell>
      <GastosClient gastos={gastos} plano={profile.plano} />
    </AppShell>
  );
}
