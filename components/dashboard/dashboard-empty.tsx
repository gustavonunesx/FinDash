import { EmptyState } from "@/components/shared/empty-state";

export function DashboardEmpty() {
  return (
    <EmptyState
      icon="📊"
      title="Configure suas finanças"
      description="Complete o onboarding para definir sua renda, gastos e fundos. Em poucos minutos você terá um dashboard completo com score 50/30/20."
      actionLabel="Iniciar onboarding"
      actionHref="/onboarding"
    />
  );
}
