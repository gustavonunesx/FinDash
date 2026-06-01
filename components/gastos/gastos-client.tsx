"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { CsvImportDialog } from "@/components/gastos/csv-import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import { EmptyState } from "@/components/shared/empty-state";
import {
  criarGasto,
  editarGasto,
  deletarGasto,
  type GastoFormData,
} from "@/app/(app)/gastos/actions";
import {
  CATEGORIA_EMOJI,
  CATEGORIA_LABELS,
  LIMITES_FREE,
  type CategoriaGasto,
  type Gasto,
  type Plano,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { totalPorCategoria } from "@/lib/score";

interface GastosClientProps {
  gastos: Gasto[];
  plano: Plano;
}

const emptyForm: GastoFormData = {
  nome: "",
  valor: 0,
  categoria: "necessidade",
  subcategoria: "",
  recorrente: false,
};

export function GastosClient({ gastos, plano }: GastosClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [form, setForm] = useState<GastoFormData>(emptyForm);
  const [busca, setBusca] = useState("");
  const [pending, startTransition] = useTransition();

  const totais = totalPorCategoria(gastos);
  const totalGeral = totais.necessidade + totais.objetivo + totais.qualidade;
  const maxTotal = Math.max(totais.necessidade, totais.objetivo, totais.qualidade, 1);

  const filtrados = gastos.filter(
    (g) =>
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.subcategoria?.toLowerCase().includes(busca.toLowerCase())
  );

  function openCreate() {
    if (plano === "free" && gastos.length >= LIMITES_FREE.gastos) {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(gasto: Gasto) {
    setEditing(gasto);
    setForm({
      nome: gasto.nome,
      valor: gasto.valor,
      categoria: gasto.categoria,
      subcategoria: gasto.subcategoria ?? "",
      recorrente: gasto.recorrente,
      dia_recorrencia: gasto.dia_recorrencia ?? undefined,
    });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = editing
        ? await editarGasto(editing.id, form)
        : await criarGasto(form);

      if (result.error) {
        if (result.error.includes("Limite")) setUpgradeOpen(true);
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Gasto atualizado" : "Gasto criado");
      setModalOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletarGasto(id);
      if (result.error) toast.error(result.error);
      else toast.success("Gasto removido");
    });
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gastos</h1>
          <p className="mt-2 text-muted-foreground">
            {gastos.length}/{plano === "free" ? LIMITES_FREE.gastos : "∞"} gastos · Total{" "}
            <span className="font-mono">{formatCurrency(totalGeral)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <CsvImportDialog />
          <Button onClick={openCreate}>
            <IconPlus className="h-4 w-4" />
            Novo gasto
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {(Object.keys(totais) as CategoriaGasto[]).map((cat) => (
          <Card key={cat} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{CATEGORIA_LABELS[cat]}</span>
                <span className="font-mono font-semibold">{formatCurrency(totais[cat])}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(totais[cat] / maxTotal) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de gastos</CardTitle>
          {gastos.length > 0 && (
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-xs"
            />
          )}
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {gastos.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="💸"
                title="Nenhum gasto cadastrado"
                description="Adicione seu primeiro gasto ou importe um CSV para começar a acompanhar seu método 50/30/20."
                actionLabel="Adicionar gasto"
                onAction={openCreate}
              />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">Nenhum gasto encontrado.</p>
          ) : (
            filtrados.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORIA_EMOJI[g.categoria]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{g.nome}</p>
                      {g.recorrente && <Badge variant="outline">Recorrente</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORIA_LABELS[g.categoria]}
                      {g.subcategoria ? ` · ${g.subcategoria}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-fd-red">
                    -{formatCurrency(g.valor)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                    <IconPencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
                    <IconTrash className="h-4 w-4 text-fd-red" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar gasto" : "Novo gasto"}</DialogTitle>
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
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="font-mono"
                value={form.valor || ""}
                onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v as CategoriaGasto })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_LABELS) as CategoriaGasto[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORIA_EMOJI[c]} {CATEGORIA_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategoria (opcional)</Label>
              <Input
                value={form.subcategoria}
                onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                placeholder="Ex: Mercado, Streaming"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Recorrente</Label>
              <Switch
                checked={form.recorrente}
                onCheckedChange={(checked: boolean) =>
                  setForm({ ...form, recorrente: checked })
                }
              />
            </div>
            {form.recorrente && (
              <div className="space-y-2">
                <Label>Dia do mês</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dia_recorrencia ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, dia_recorrencia: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Salvando..." : editing ? "Salvar" : "Criar gasto"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
