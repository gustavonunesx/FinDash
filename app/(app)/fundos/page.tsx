import { AppShell } from "@/components/layout/app-shell";
import { FundosClient } from "@/components/fundos/fundos-client";
import { getAppData } from "@/lib/data";
import { fetchCdiRate } from "@/lib/rendimento";

export default async function FundosPage() {
  const { profile, fundos } = await getAppData();
  const cdi = await fetchCdiRate();

  return (
    <AppShell>
      <FundosClient fundos={fundos} plano={profile.plano} cdi={cdi} />
    </AppShell>
  );
}
