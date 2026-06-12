"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconSearch,
  IconRepeat,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { CsvImportDialog } from "@/components/gastos/csv-import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CATEGORIA_COLORS,
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

const CATEGORIA_BG: Record<CategoriaGasto, string> = {
  necessidade: "bg-fd-amber/10 text-fd-amber",
  objetivo: "bg-fd-green/10 text-fd-green",
  qualidade: "bg-fd-blue/10 text-fd-blue",
};

const CATEGORIA_BAR: Record<CategoriaGasto, string> = {
  necessidade: "bg-fd-amber",
  objetivo: "bg-fd-green",
  qualidade: "bg-fd-blue",
};

const CATEGORIA_RING: Record<CategoriaGasto, string> = {
  necessidade: "ring-fd-amber/30",
  objetivo: "ring-fd-green/30",
  qualidade: "ring-fd-blue/30",
};

type FilterTab = CategoriaGasto | "todos";

export function GastosClient({ gastos, plano }: GastosClientProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<GastoFormData>(emptyForm);
  const [busca, setBusca] = useState("");
  const [tab, setTab] = useState<FilterTab>("todos");
  const [pending, startTransition] = useTransition();

  const totais = totalPorCategoria(gastos);
  const totalGeral = totais.necessidade + totais.objetivo + totais.qualidade;
  const maxTotal = Math.max(totais.necessidade, totais.objetivo, totais.qualidade, 1);

  const categorias: CategoriaGasto[] = ["necessidade", "objetivo", "qualidade"];

  const filtrados = gastos.filter((g) => {
    const matchBusca =
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.subcategoria?.toLowerCase().includes(busca.toLowerCase());
    const matchTab = tab === "todos" || g.categoria === tab;
    return matchBusca && matchTab;
  });

  function openCreate() {
    if (plano === "free" && gastos.length >= LIMITES_FREE.gastos) {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
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
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
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
      closeForm();
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
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {gastos.length}
            {plano === "free" ? `/${LIMITES_FREE.gastos}` : ""} registros &middot;{" "}
            <span className="font-mono">{formatCurrency(totalGeral)}</span> total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportDialog />
          <Button onClick={openCreate} size="sm">
            <IconPlus className="h-4 w-4" />
            Novo gasto
          </Button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-5 items-start">
        {/* ── Left column: category summary + list ── */}
        <div className="min-w-0 flex-1">
          {/* Category totals row */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {categorias.map((cat) => {
              const pct = Math.round((totais[cat] / (totalGeral || 1)) * 100);
              return (
                <button
                  key={cat}
                  onClick={() => setTab(tab === cat ? "todos" : cat)}
                  className={[
                    "group rounded-xl border bg-card p-3.5 text-left shadow-card transition-all duration-150",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    tab === cat
                      ? `ring-2 ${CATEGORIA_RING[cat]} border-transparent`
                      : "border-border",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ${CATEGORIA_BG[cat]}`}
                    >
                      {CATEGORIA_LABELS[cat]}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                  </div>
                  <p className="font-mono text-base font-semibold tabular-nums">
                    {formatCurrency(totais[cat])}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${CATEGORIA_BAR[cat]}`}
                      style={{ width: `${(totais[cat] / maxTotal) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* List card */}
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {/* List header: tabs + search */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex gap-1">
                {(["todos", ...categorias] as FilterTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      tab === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    ].join(" ")}
                  >
                    {t === "todos" ? "Todos" : CATEGORIA_LABELS[t]}
                  </button>
                ))}
              </div>
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-8 rounded-lg border border-border bg-secondary pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none w-40"
                />
              </div>
            </div>

            {/* List body */}
            {gastos.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon="💸"
                  title="Nenhum gasto cadastrado"
                  description="Adicione seu primeiro gasto ou importe um CSV para começar a acompanhar seu método 50/30/20."
                  actionLabel="Adicionar gasto"
                  onAction={openCreate}
                />
              </div>
            ) : filtrados.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum gasto encontrado.
              </p>
            ) : (
              <ul>
                {filtrados.map((g, i) => (
                  <li
                    key={g.id}
                    className={[
                      "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40",
                      i !== 0 ? "border-t border-border/60" : "",
                    ].join(" ")}
                  >
                    {/* Category icon circle */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${CATEGORIA_BG[g.categoria]}`}
                    >
                      {CATEGORIA_EMOJI[g.categoria]}
                    </div>

                    {/* Name + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{g.nome}</span>
                        {g.recorrente && (
                          <span className="flex items-center gap-0.5 rounded-full bg-fd-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-fd-blue">
                            <IconRepeat className="h-2.5 w-2.5" />
                            Recorrente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {CATEGORIA_LABELS[g.categoria]}
                        {g.subcategoria ? ` · ${g.subcategoria}` : ""}
                      </p>
                    </div>

                    {/* Amount */}
                    <span
                      className="font-mono text-sm font-semibold tabular-nums"
                      style={{ color: CATEGORIA_COLORS[g.categoria] }}
                    >
                      -{formatCurrency(g.valor)}
                    </span>

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-fd-red/10 hover:text-fd-red transition-colors"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right panel: inline form ── */}
        <div
          className={[
            "w-80 shrink-0 rounded-xl border bg-card shadow-card transition-all duration-200 sticky top-6",
            formOpen ? "border-border opacity-100" : "border-border/50 opacity-60 pointer-events-none",
          ].join(" ")}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">
              {editing ? "Editar gasto" : "Novo gasto"}
            </h2>
            {formOpen && (
              <button
                onClick={closeForm}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <IconX className="h-4 w-4" />
              </button>
            )}
          </div>

          {!formOpen ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconPlus className="h-5 w-5" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Clique em <span className="font-medium text-foreground">Novo gasto</span> para
                registrar um gasto
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              {/* From/To summary row — mirrors the transfer confirmation style */}
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${CATEGORIA_BG[form.categoria]}`}
                >
                  {CATEGORIA_EMOJI[form.categoria]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {form.nome || "Nome do gasto"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIA_LABELS[form.categoria]}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {form.valor ? formatCurrency(form.valor) : "R$ 0,00"}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Aluguel, Spotify"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="font-mono"
                  placeholder="0,00"
                  value={form.valor || ""}
                  onChange={(e) =>
                    setForm({ ...form, valor: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Subcategoria{" "}
                  <span className="text-muted-foreground/60">(opcional)</span>
                </Label>
                <Input
                  value={form.subcategoria}
                  onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
                  placeholder="Ex: Mercado, Streaming"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Recorrente</p>
                  <p className="text-xs text-muted-foreground">Repete mensalmente</p>
                </div>
                <Switch
                  checked={form.recorrente}
                  onCheckedChange={(checked: boolean) =>
                    setForm({ ...form, recorrente: checked })
                  }
                />
              </div>

              {form.recorrente && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Dia do mês</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 5"
                    value={form.dia_recorrencia ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dia_recorrencia: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                <IconCheck className="h-4 w-4" />
                {pending ? "Salvando..." : editing ? "Salvar alterações" : "Registrar gasto"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
