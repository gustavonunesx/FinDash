"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { CsvImportDialog } from "@/components/gastos/csv-import-dialog";
import { GastosTable } from "@/components/gastos/gastos-table";
import { GastoModal } from "@/components/gastos/gasto-modal";
import { DonutChart } from "@/components/gastos/donut-chart";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import { EmptyState } from "@/components/shared/empty-state";
import {
  criarGasto,
  editarGasto,
  deletarGasto,
  type GastoFormData,
} from "@/app/(app)/gastos/actions";
import {
  CATEGORIA_LABELS,
  LIMITES_FREE,
  type CategoriaGasto,
  type Gasto,
  type Plano,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { formatMesCurto, gastoAtivo, parcelaInfo } from "@/lib/parcelamento";
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

type FilterTab = CategoriaGasto | "todos";
type ViewTab = "lista" | "analise";

const CATEGORIA_BAR_COLOR: Record<CategoriaGasto, string> = {
  necessidade: "#C4820A",
  objetivo:    "#0E8F6A",
  qualidade:   "#2563EB",
};

const CATEGORIA_BADGE_BG: Record<CategoriaGasto, string> = {
  necessidade: "#FBF3E2",
  objetivo:    "#E3F6EF",
  qualidade:   "#EAF1FE",
};

const CATEGORIA_BADGE_TEXT: Record<CategoriaGasto, string> = {
  necessidade: "#92620A",
  objetivo:    "#0D7A5E",
  qualidade:   "#1D4ED8",
};

const CATEGORIA_ICON_BG: Record<CategoriaGasto, string> = {
  necessidade: "#FCE8C9",
  objetivo:    "#CDEFE3",
  qualidade:   "#D9E6FE",
};

const CATEGORIA_EMOJI: Record<CategoriaGasto, string> = {
  necessidade: "🏠",
  objetivo: "🎯",
  qualidade: "✨",
};

export function GastosClient({ gastos, plano }: GastosClientProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GastoFormData>(emptyForm);
  const [busca, setBusca] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("todos");
  const [viewTab, setViewTab] = useState<ViewTab>("lista");
  const [pending, startTransition] = useTransition();

  const totais = totalPorCategoria(gastos);
  const totalGeral = totais.necessidade + totais.objetivo + totais.qualidade;
  const categorias: CategoriaGasto[] = ["necessidade", "objetivo", "qualidade"];

  // Maiores gastos (top 3)
  const maioresGastos = gastos
    .filter((g) => gastoAtivo(g))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 3);

  // Parcelamentos em aberto, ordenados por quantas parcelas ainda faltam
  const parcelamentos = gastos
    .map((g) => ({ gasto: g, info: parcelaInfo(g) }))
    .filter((p) => p.info.parcelado && !p.info.quitado)
    .sort((a, b) => a.info.restantes - b.info.restantes);

  const comprometidoFuturo = parcelamentos.reduce((s, p) => s + p.info.valorRestante, 0);
  const parcelasDoMes = parcelamentos
    .filter((p) => !p.info.futuro)
    .reduce((s, p) => s + p.info.valorParcela, 0);

  // Média diária do mês atual
  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const mediaDiaria = totalGeral / diasNoMes;

  const mesAtual = hoje.toLocaleString("pt-BR", { month: "long" });

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

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSubmit(formData: GastoFormData) {
    startTransition(async () => {
      const result = editing
        ? await editarGasto(editing.id, formData)
        : await criarGasto(formData);

      if (result.error) {
        if (result.error.includes("Limite")) setUpgradeOpen(true);
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Gasto atualizado" : "Gasto criado");
      closeModal();
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
      {/* ── Page header ── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F1729", lineHeight: 1.2 }}>
            Gastos
          </h1>
          <p style={{ fontSize: 13, color: "#7C8896", marginTop: 4 }}>
            {gastos.length}
            {plano === "free" ? `/${LIMITES_FREE.gastos}` : ""} registros &middot;{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {formatCurrency(totalGeral)}
            </span>{" "}
            total
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Toggle Lista / Análise */}
          <div
            style={{
              display: "flex",
              background: "#E6E8EC",
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            {(["lista", "analise"] as ViewTab[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewTab(v)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: viewTab === v ? "#0F1729" : "transparent",
                  color: viewTab === v ? "#fff" : "#7C8896",
                }}
              >
                {v === "lista" ? "Lista" : "Análise"}
              </button>
            ))}
          </div>

          {/* Importar CSV */}
          <CsvImportDialog />

          {/* + Novo gasto */}
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: "#0E8F6A",
              color: "#fff",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0D7A5E")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0E8F6A")}
          >
            <IconPlus style={{ width: 15, height: 15 }} />
            Novo gasto
          </button>
        </div>
      </div>

      {/* ── 3 summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {categorias.map((cat) => {
          const pct = totalGeral > 0 ? Math.round((totais[cat] / totalGeral) * 100) : 0;
          return (
            <div
              key={cat}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E8EC",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    background: CATEGORIA_BADGE_BG[cat],
                    color: CATEGORIA_BADGE_TEXT[cat],
                  }}
                >
                  {CATEGORIA_LABELS[cat]}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "#9AA3AE",
                    fontWeight: 500,
                  }}
                >
                  {pct}%
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0F1729",
                  marginBottom: 10,
                  tabularNums: true,
                } as React.CSSProperties}
              >
                {formatCurrency(totais[cat])}
              </p>
              <div
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: "#F0F1F3",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 999,
                    background: CATEGORIA_BAR_COLOR[cat],
                    width: `${pct}%`,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main two-column layout ── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* ── Left column: table ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {gastos.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E8EC",
                borderRadius: 14,
                padding: 32,
              }}
            >
              <EmptyState
                icon="💸"
                title="Nenhum gasto cadastrado"
                description="Adicione seu primeiro gasto ou importe um CSV para começar a acompanhar seu método 50/30/20."
                actionLabel="Adicionar gasto"
                onAction={openCreate}
              />
            </div>
          ) : (
            <GastosTable
              gastos={gastos}
              onEdit={openEdit}
              onDelete={handleDelete}
              busca={busca}
              onBuscaChange={setBusca}
              tab={filterTab}
              onTabChange={setFilterTab}
            />
          )}
        </div>

        {/* ── Right column: 300px ── */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Card: Distribuição por categoria (donut) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E8EC",
              borderRadius: 14,
              padding: "20px 20px 18px",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729", marginBottom: 16 }}>
              Distribuição por categoria
            </p>

            {totalGeral > 0 ? (
              <>
                <DonutChart
                  necessidade={totais.necessidade}
                  objetivo={totais.objetivo}
                  qualidade={totais.qualidade}
                  total={totalGeral}
                />

                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  {categorias.map((cat) => {
                    const pct = Math.round((totais[cat] / totalGeral) * 100);
                    return (
                      <div
                        key={cat}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: CATEGORIA_BAR_COLOR[cat],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 12, color: "#7C8896" }}>
                            {CATEGORIA_LABELS[cat]}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#0F1729",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: "#9AA3AE", textAlign: "center", padding: "20px 0" }}>
                Nenhum gasto registrado
              </p>
            )}
          </div>

          {/* Card: Parcelas do cartão */}
          {parcelamentos.length > 0 && (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6E8EC",
                borderRadius: 14,
                padding: "20px 20px 18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>
                  Parcelas do cartão
                </p>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#7C3AED",
                  }}
                >
                  {formatCurrency(parcelasDoMes)}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#9AA3AE", marginBottom: 14 }}>
                Neste mês &middot; {formatCurrency(comprometidoFuturo)} nos próximos
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {parcelamentos.map(({ gasto, info }) => (
                  <div key={gasto.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 5,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#0F1729",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                        }}
                      >
                        {gasto.nome}
                      </p>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#0F1729",
                          flexShrink: 0,
                        }}
                      >
                        {formatCurrency(info.valorParcela)}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 5,
                        borderRadius: 999,
                        background: "#F0F1F3",
                        overflow: "hidden",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 999,
                          background: "#7C3AED",
                          width: `${(info.atual / info.total) * 100}%`,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "#7C8896",
                        }}
                      >
                        {info.futuro ? `inicia em ${formatMesCurto(info.inicio!)}` : `${info.atual}/${info.total}`}
                      </span>
                      <span style={{ fontSize: 11, color: "#9AA3AE" }}>
                        {info.futuro
                          ? `${info.total}x`
                          : `faltam ${info.restantes} · até ${formatMesCurto(info.fim!)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Maiores gastos */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E8EC",
              borderRadius: 14,
              padding: "20px 20px 18px",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729", marginBottom: 14 }}>
              Maiores gastos
            </p>

            {maioresGastos.length === 0 ? (
              <p style={{ fontSize: 12, color: "#9AA3AE", textAlign: "center", padding: "12px 0" }}>
                Nenhum gasto ainda
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {maioresGastos.map((g) => (
                  <div
                    key={g.id}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: CATEGORIA_ICON_BG[g.categoria],
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {CATEGORIA_EMOJI[g.categoria]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#0F1729",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {g.nome}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: CATEGORIA_BAR_COLOR[g.categoria],
                        flexShrink: 0,
                      }}
                    >
                      -{formatCurrency(g.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Média diária (verde sólido) */}
          <div
            style={{
              background: "#0E8F6A",
              borderRadius: 14,
              padding: "20px 20px 18px",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
              Média diária em {mesAtual}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.1,
                marginBottom: 8,
              }}
            >
              {formatCurrency(mediaDiaria)}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
              Baseado em {diasNoMes} dias no mês e {formatCurrency(totalGeral)} em gastos registrados.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal centralizado ── */}
      <GastoModal
        open={modalOpen}
        onClose={closeModal}
        editing={editing}
        onSubmit={handleSubmit}
        pending={pending}
      />

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
