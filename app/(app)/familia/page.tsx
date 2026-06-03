import { AppShell } from "@/components/layout/app-shell";
import { FamiliaPanel } from "@/components/familia/familia-panel";
import { getFamiliaResumo, isFamiliaOwner } from "@/lib/familia";
import { getProfile } from "@/lib/data";

export default async function FamiliaPage() {
  const [resumo, profile, isOwner] = await Promise.all([
    getFamiliaResumo(),
    getProfile(),
    isFamiliaOwner(),
  ]);

  return (
    <AppShell>
      <FamiliaPanel resumo={resumo} plano={profile?.plano ?? "free"} isOwner={isOwner} />
    </AppShell>
  );
}
