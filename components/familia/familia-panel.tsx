"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconUsers, IconUserPlus, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { criarFamilia, convidarMembro } from "@/app/(app)/familia/actions";
import type { FamiliaResumo, Plano } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface FamiliaPanelProps {
  resumo: FamiliaResumo | null;
  plano: Plano;
  isOwner: boolean;
}

export function FamiliaPanel({ resumo, plano, isOwner }: FamiliaPanelProps) {
  const [nomeFamilia, setNomeFamilia] = useState("Minha Família");
  const [emailConvite, setEmailConvite] = useState("");
  const [pending, startTransition] = useTransition();

  if (plano !== "premium") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <IconUsers className="h-12 w-12 text-fd-purple" />
        <h1 className="mt-6 text-3xl font-bold">Plano Família</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Compartilhe visibilidade financeira com até 3 membros. Disponível no Premium.
        </p>
        <Link href="/precos" className="mt-8">
          <Button className="bg-fd-purple hover:bg-fd-purple/90">Upgrade para Premium</Button>
        </Link>
      </div>
    );
  }

  if (!resumo) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Criar família</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convide até 2 pessoas para ver o panorama financeiro conjunto.
          </p>
          <div className="space-y-2">
            <Label>Nome da família</Label>
            <Input value={nomeFamilia} onChange={(e) => setNomeFamilia(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await criarFamilia(nomeFamilia);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Família criada!");
                  window.location.reload();
                }
              })
            }
          >
            Criar família
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handleConvite() {
    startTransition(async () => {
      const r = await convidarMembro(emailConvite);
      if (r.error) toast.error(r.error);
      else if (r.link) {
        await navigator.clipboard.writeText(r.link);
        toast.success("Link de convite copiado!");
        setEmailConvite("");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{resumo.familia.nome}</h1>
        <p className="mt-2 text-muted-foreground">
          {resumo.membros.length}/3 membros · Visibilidade financeira conjunta
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Renda total", value: formatCurrency(resumo.rendaTotal) },
          { label: "Gastos total", value: formatCurrency(resumo.gastosTotal) },
          { label: "Patrimônio fundos", value: formatCurrency(resumo.fundosTotal) },
          { label: "Score médio", value: String(resumo.scoreMedio) },
        ].map((m) => (
          <Card key={m.label} className="border-border/60">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="mt-2 font-mono text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Membros
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {resumo.membros.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{m.nome}</p>
                <Badge variant={m.papel === "owner" ? "purple" : "outline"} className="mt-1">
                  {m.papel === "owner" ? "Titular" : "Membro"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {isOwner && resumo.membros.length < 3 && (
        <Card className="border-fd-purple/30 bg-fd-purple/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUserPlus className="h-5 w-5" />
              Convidar membro
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={emailConvite}
              onChange={(e) => setEmailConvite(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleConvite} disabled={pending || !emailConvite}>
              <IconCopy className="h-4 w-4" />
              Gerar link de convite
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
