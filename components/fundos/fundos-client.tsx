"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import { FundoMiniCard } from "@/components/dashboard/fundo-mini-card";
import {
  criarFundo,
  editarFundo,
  deletarFundo,
  type FundoFormData,
} from "@/app/(app)/fundos/actions";
import { LIMITES_FREE, type Fundo, type Plano } from "@/lib/types";

interface FundosClientProps {
  fundos: Fundo[];
  plano: Plano;
}

const emptyForm: FundoFormData = {
  nome: "",
  saldo_atual: 0,
  meta: 0,
  aporte_mensal: 0,
  cor: "#1D9E75",
};

export function FundosClient({ fundos, plano }: FundosClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState<Fundo | null>(null);
  const [form, setForm] = useState<FundoFormData>(emptyForm);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    if (plano === "free" && fundos.length >= LIMITES_FREE.fundos) {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(fundo: Fundo) {
    setEditing(fundo);
    setForm({
      nome: fundo.nome,
      saldo_atual: fundo.saldo_atual,
      meta: fundo.meta,
      meta_data: fundo.meta_data ?? undefined,
      aporte_mensal: fundo.aporte_mensal,
      cor: fundo.cor,
      custodia: fundo.custodia ?? undefined,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = editing
        ? await editarFundo(editing.id, form)
        : await criarFundo(form);

      if (result.error) {
        if (result.error.includes("Limite")) setUpgradeOpen(true);
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Fundo atualizado" : "Fundo criado");
      setModalOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletarFundo(id);
      if (result.error) toast.error(result.error);
      else toast.success("Fundo removido");
    });
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fundos</h1>
          <p className="mt-2 text-muted-foreground">
            {fundos.length}/{plano === "free" ? LIMITES_FREE.fundos : "∞"} fundos ativos
          </p>
        </div>
        <Button onClick={openCreate}>
          <IconPlus className="h-4 w-4" />
          Novo fundo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fundos.map((f) => (
          <div key={f.id} className="relative group">
            <FundoMiniCard fundo={f} />
            <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                <IconPencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleDelete(f.id)}>
                <IconTrash className="h-3.5 w-3.5 text-fd-red" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {fundos.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          Crie seu primeiro fundo para começar a construir patrimônio.
        </p>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fundo" : "Novo fundo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Saldo atual</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="font-mono"
                  value={form.saldo_atual || ""}
                  onChange={(e) =>
                    setForm({ ...form, saldo_atual: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="font-mono"
                  value={form.meta || ""}
                  onChange={(e) => setForm({ ...form, meta: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aporte mensal</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="font-mono"
                  value={form.aporte_mensal || ""}
                  onChange={(e) =>
                    setForm({ ...form, aporte_mensal: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.meta_data ?? ""}
                  onChange={(e) => setForm({ ...form, meta_data: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Salvando..." : editing ? "Salvar" : "Criar fundo"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
