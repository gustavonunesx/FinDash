import { AppShell } from "@/components/layout/app-shell";
import { ConfigForm } from "@/components/configuracoes/config-form";
import { getAppData } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";

export default async function ConfiguracoesPage() {
  const { profile, config } = await getAppData();
  const canExportPdf = profile.plano === "premium" || isDemoMode();

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>
      <ConfigForm profile={profile} config={config!} canExportPdf={canExportPdf} />
    </AppShell>
  );
}
