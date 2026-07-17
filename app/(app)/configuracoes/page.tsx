import { AppShell } from "@/components/layout/app-shell";
import { ConfigForm } from "@/components/configuracoes/config-form";
import { getAppData } from "@/lib/data";
import { isDemoMode } from "@/lib/demo-data";

export default async function ConfiguracoesPage() {
  const { profile, config } = await getAppData();
  const canExportPdf = profile.plano === "premium" || isDemoMode();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie sua conta, plano e dados financeiros</p>
      </div>
      <ConfigForm profile={profile} config={config!} canExportPdf={canExportPdf} />
    </AppShell>
  );
}
