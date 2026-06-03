import { AppShell } from "@/components/layout/app-shell";
import { FundosClient } from "@/components/fundos/fundos-client";
import { FundoCard } from "@/components/fundos/fundo-card";
import { getAppData } from "@/lib/data";
import { fetchCdiRate, calcularRendimento } from "@/lib/rendimento";

export default async function FundosPage() {
  const { profile, fundos } = await getAppData();
  const cdi = await fetchCdiRate();

  const fundosComRendimento = fundos.map((f) => ({
    fundo: f,
    rendimento: calcularRendimento(f.saldo_atual, f.custodia, cdi),
  }));

  return (
    <AppShell>
      <FundosClient fundos={fundos} plano={profile.plano} />
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-bold">Detalhes e rendimento (CDI { (cdi * 100).toFixed(2)}% a.a.)</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fundosComRendimento.map(({ fundo, rendimento }) => (
            <FundoCard key={fundo.id} fundo={fundo} rendimento={rendimento} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
