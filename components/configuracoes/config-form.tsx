"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReferralSection } from "@/components/configuracoes/referral-section";
import { salvarConfiguracoes } from "@/app/(app)/configuracoes/actions";
import type { Configuracao, Profile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ConfigFormProps {
  profile: Profile;
  config: Configuracao;
  canExportPdf?: boolean;
}

export function ConfigForm({ profile, config, canExportPdf = false }: ConfigFormProps) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await salvarConfiguracoes({
        nome: fd.get("nome") as string,
        salario: parseFloat(fd.get("salario") as string) || 0,
        renda_extra: parseFloat(fd.get("renda_extra") as string) || 0,
        custo_vida: parseFloat(fd.get("custo_vida") as string) || 0,
        meta_economia_mensal: parseFloat(fd.get("meta_economia") as string) || null,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Configurações salvas");
    });
  }

  async function openPortal() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Stripe não configurado");
    } catch {
      toast.error("Erro ao abrir portal");
    }
  }

  async function exportPdf() {
    try {
      const res = await fetch("/api/exportar-pdf");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erro ao exportar PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `findash-relatorio-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exportado");
    } catch {
      toast.error("Erro ao exportar PDF");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome de exibição</Label>
            <Input id="nome" name="nome" defaultValue={profile.nome ?? ""} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Assinatura:</span>
            <Badge variant={profile.plano === "premium" ? "purple" : "outline"}>
              {profile.plano === "premium" ? profile.assinatura_status : "Free"}
            </Badge>
          </div>
          {profile.plano === "premium" && (
            <Button type="button" variant="outline" onClick={openPortal}>
              Gerenciar assinatura
            </Button>
          )}
          {canExportPdf && (
            <Button type="button" variant="outline" onClick={exportPdf}>
              <IconDownload className="h-4 w-4" />
              Exportar relatório PDF
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salario">Salário mensal</Label>
            <Input
              id="salario"
              name="salario"
              type="number"
              step="0.01"
              className="font-mono"
              defaultValue={config.salario}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="renda_extra">Renda extra</Label>
            <Input
              id="renda_extra"
              name="renda_extra"
              type="number"
              step="0.01"
              className="font-mono"
              defaultValue={config.renda_extra}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custo_vida">Custo de vida mensal</Label>
            <Input
              id="custo_vida"
              name="custo_vida"
              type="number"
              step="0.01"
              className="font-mono"
              defaultValue={config.custo_vida}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_economia">Meta de economia mensal</Label>
            <Input
              id="meta_economia"
              name="meta_economia"
              type="number"
              step="0.01"
              className="font-mono"
              defaultValue={config.meta_economia_mensal ?? ""}
              placeholder={formatCurrency(900)}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>

      {profile.referral_code && (
        <ReferralSection
          referralCode={profile.referral_code}
          rewards={profile.referral_rewards ?? 0}
        />
      )}
    </form>
  );
}
