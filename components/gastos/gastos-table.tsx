"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconPencil,
  IconTrash,
  IconSearch,
  IconRepeat,
  IconChevronDown,
  IconCreditCard,
} from "@tabler/icons-react";
import {
  CATEGORIA_EMOJI,
  CATEGORIA_LABELS,
  type CategoriaGasto,
  type Gasto,
} from "@/lib/types";
import { formatMesCurto, gastoAtivo, parcelaInfo } from "@/lib/parcelamento";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CAT_BADGE: Record<CategoriaGasto, string> = {
  necessidade: "bg-fd-amber/10 text-fd-amber border-fd-amber/20",
  objetivo:    "bg-fd-green/10 text-fd-green border-fd-green/20",
  qualidade:   "bg-fd-blue/10  text-fd-blue  border-fd-blue/20",
};

const CAT_DOT: Record<CategoriaGasto, string> = {
  necessidade: "bg-fd-amber",
  objetivo:    "bg-fd-green",
  qualidade:   "bg-fd-blue",
};

const CAT_VALUE: Record<CategoriaGasto, string> = {
  necessidade: "text-fd-amber",
  objetivo:    "text-fd-green",
  qualidade:   "text-fd-blue",
};

const VISIBLE_COLS_DEFAULT = ["Nome", "Categoria", "Subcategoria", "Parcelas", "Valor", "Data", "Ações"] as const;
type Col = typeof VISIBLE_COLS_DEFAULT[number];

interface GastosTableProps {
  gastos: Gasto[];
  onEdit: (gasto: Gasto) => void;
  onDelete: (id: string) => void;
  busca: string;
  onBuscaChange: (v: string) => void;
  tab: CategoriaGasto | "todos";
  onTabChange: (v: CategoriaGasto | "todos") => void;
}

export function GastosTable({
  gastos,
  onEdit,
  onDelete,
  busca,
  onBuscaChange,
  tab,
  onTabChange,
}: GastosTableProps) {
  const [visibleCols, setVisibleCols] = useState<Col[]>([...VISIBLE_COLS_DEFAULT]);
  const [colsOpen, setColsOpen] = useState(false);

  const toggleCol = (col: Col) => {
    setVisibleCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  const filtrados = gastos.filter((g) => {
    const matchBusca =
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.subcategoria?.toLowerCase().includes(busca.toLowerCase());
    const matchTab = tab === "todos" || g.categoria === tab;
    return matchBusca && matchTab;
  });

  const tabs: Array<CategoriaGasto | "todos"> = ["todos", "necessidade", "objetivo", "qualidade"];

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        {/* Tab pills */}
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t === "todos" ? "Todos" : CATEGORIA_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="h-8 w-40 pl-8 text-sm"
            />
          </div>

          {/* Column toggle */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setColsOpen((v) => !v)}
            >
              Colunas
              <motion.span animate={{ rotate: colsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <IconChevronDown className="h-3 w-3" />
              </motion.span>
            </Button>

            <AnimatePresence>
              {colsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-card shadow-lg p-1"
                >
                  {VISIBLE_COLS_DEFAULT.map((col) => (
                    <button
                      key={col}
                      onClick={() => toggleCol(col)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-secondary",
                        visibleCols.includes(col) ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors",
                          visibleCols.includes(col)
                            ? "bg-primary border-primary"
                            : "border-border bg-transparent",
                        )}
                      >
                        {visibleCols.includes(col) && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {col}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {visibleCols.includes("Nome") && (
              <TableHead className="w-[220px]">Nome</TableHead>
            )}
            {visibleCols.includes("Categoria") && (
              <TableHead className="w-[140px]">Categoria</TableHead>
            )}
            {visibleCols.includes("Subcategoria") && (
              <TableHead className="w-[160px]">Subcategoria</TableHead>
            )}
            {visibleCols.includes("Parcelas") && (
              <TableHead className="w-[130px]">Parcelas</TableHead>
            )}
            {visibleCols.includes("Valor") && (
              <TableHead className="w-[120px]">Valor</TableHead>
            )}
            {visibleCols.includes("Data") && (
              <TableHead className="w-[110px]">Data</TableHead>
            )}
            {visibleCols.includes("Ações") && (
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filtrados.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleCols.length}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                Nenhum gasto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            filtrados.map((g) => {
              const info = parcelaInfo(g);
              const inativo = !gastoAtivo(g);

              return (
              <TableRow key={g.id} className={cn("group", inativo && "opacity-55")}>
                {/* Nome */}
                {visibleCols.includes("Nome") && (
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                          CAT_BADGE[g.categoria].split(" ").slice(0, 2).join(" "),
                        )}
                      >
                        {CATEGORIA_EMOJI[g.categoria]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground leading-tight">
                          {g.nome}
                        </p>
                        {g.recorrente && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-fd-blue">
                            <IconRepeat className="h-2.5 w-2.5" />
                            Recorrente
                          </span>
                        )}
                        {info.parcelado && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px]",
                              info.quitado ? "text-muted-foreground" : "text-fd-purple",
                            )}
                          >
                            <IconCreditCard className="h-2.5 w-2.5" />
                            {info.quitado
                              ? `Quitado em ${formatMesCurto(info.fim!)}`
                              : info.futuro
                                ? `Inicia em ${formatMesCurto(info.inicio!)}`
                                : `${info.total}x de ${formatCurrency(info.valorParcela)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                )}

                {/* Categoria */}
                {visibleCols.includes("Categoria") && (
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        CAT_BADGE[g.categoria],
                      )}
                    >
                      <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", CAT_DOT[g.categoria])} />
                      {CATEGORIA_LABELS[g.categoria]}
                    </Badge>
                  </TableCell>
                )}

                {/* Subcategoria */}
                {visibleCols.includes("Subcategoria") && (
                  <TableCell className="text-sm text-muted-foreground">
                    {g.subcategoria || (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                )}

                {/* Parcelas */}
                {visibleCols.includes("Parcelas") && (
                  <TableCell>
                    {!info.parcelado ? (
                      <span className="text-sm text-muted-foreground/40">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                            {info.futuro ? `0/${info.total}` : `${info.atual}/${info.total}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {info.quitado
                              ? "quitado"
                              : info.futuro
                                ? "a iniciar"
                                : `faltam ${info.restantes}`}
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              "h-full rounded-full transition-[width] duration-500",
                              info.quitado ? "bg-muted-foreground/40" : "bg-fd-purple",
                            )}
                            style={{ width: `${(info.atual / info.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </TableCell>
                )}

                {/* Valor */}
                {visibleCols.includes("Valor") && (
                  <TableCell>
                    <span
                      className={cn(
                        "font-mono text-sm font-semibold tabular-nums",
                        inativo ? "text-muted-foreground line-through" : CAT_VALUE[g.categoria],
                      )}
                    >
                      -{formatCurrency(g.valor)}
                    </span>
                  </TableCell>
                )}

                {/* Data */}
                {visibleCols.includes("Data") && (
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeDate(g.created_at)}
                  </TableCell>
                )}

                {/* Ações */}
                {visibleCols.includes("Ações") && (
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onEdit(g)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onDelete(g.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Excluir</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                )}
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Footer count */}
      {filtrados.length > 0 && (
        <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            {filtrados.length} {filtrados.length === 1 ? "gasto" : "gastos"} encontrado{filtrados.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(
              filtrados.reduce((acc, g) => (gastoAtivo(g) ? acc + g.valor : acc), 0),
            )}{" "}
            <span className="font-sans font-normal text-muted-foreground">no mês</span>
          </span>
        </div>
      )}
    </div>
  );
}
