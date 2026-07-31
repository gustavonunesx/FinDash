"use client";

import { useState, useTransition, useMemo } from "react";
import { motion } from "framer-motion";
import { IconPencil, IconSettings, IconArrowRight, IconRefresh, IconPlus } from "@tabler/icons-react";
import { confirmarAporte } from "@/app/(app)/fundos/actions";
import { salvarAjustesLimite, registrarRendaExtra } from "@/app/(app)/calculadora/actions";
import { formatCurrency } from "@/lib/utils";
import { totalPorCategoria } from "@/lib/score";
import type { Configuracao, Fundo, Gasto, RendaExtraItem } from "@/lib/types";

import { BarraProporcional } from "./barra-proporcional";
import { LinhaStatusCategoria } from "./linha-status-categoria";
import { LinhaFatiaExtra } from "./linha-fatia-extra";
import { ModalEditarSalario } from "./modal-editar-salario";
import { ModalPersonalizarPesos, type Peso } from "./modal-personalizar-pesos";
import {
  ModalConfirmarAporteCalc,
  type FatiaAporte,
} from "./modal-confirmar-aporte-calc";

// ── Paleta ────────────────────────────────────────────────────────────────────
const CORES = {
  necessidade:  { bar: "#C4820A", iconBg: "#FCE8C9" },
  objetivo:     { bar: "#0E8F6A", iconBg: "#CDEFE3" },
  qualidade:    { bar: "#2563EB", iconBg: "#D9E6FE" },
  investimento: { bar: "#7C3AED", iconBg: "#EDE9FE" },
  reserva:      { bar: "#C4820A", iconBg: "#FCE8C9" },
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface CalculadoraClientProps {
  config: Configuracao;
  gastos: Gasto[];
  fundos: Fundo[];
  rendaExtraHistorico: RendaExtraItem[];
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E8EC",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export function CalculadoraClient({ config, gastos, fundos, rendaExtraHistorico }: CalculadoraClientProps) {
  // Salário, ajustes de limite e histórico de renda extra vêm direto das props:
  // as server actions revalidam /calculadora, então espelhar em useState só
  // congelaria valores alterados em outra rota.
  const salario = config.salario;
  const ajustes = config.ajustes_limite ?? {};

  // ── State ──────────────────────────────────────────────────────────────────
  const [modalSalario, setModalSalario] = useState(false);
  const [modalPesos502030, setModalPesos502030] = useState(false);
  const [modalPesosExtra, setModalPesosExtra] = useState(false);
  const [valorExtra, setValorExtra] = useState("");
  const [modalAporte, setModalAporte] = useState(false);
  const [fatiaAporte, setFatiaAporte] = useState<FatiaAporte | null>(null);
  const [pendingAporte, startAporte] = useTransition();
  const [descricaoExtra, setDescricaoExtra] = useState("");
  const [, startAjustes] = useTransition();
  const [pendingRegistrar, startRegistrar] = useTransition();
  const [realocarAberto, setRealocarAberto] = useState(false);
  const [realocarOrigem, setRealocarOrigem] = useState<string | null>(null);
  const [realocarDestino, setRealocarDestino] = useState<string | null>(null);
  const [realocarValor, setRealocarValor] = useState("");
  const [fundosPorFatia, setFundosPorFatia] = useState<Record<string, string | null>>({});

  const [pesos502030, setPesos502030] = useState<Peso[]>([
    { key: "necessidade", label: "Necessidades",      cor: CORES.necessidade.bar,  valor: 50 },
    { key: "objetivo",    label: "Objetivos",          cor: CORES.objetivo.bar,     valor: 30 },
    { key: "qualidade",   label: "Qualidade de vida",  cor: CORES.qualidade.bar,    valor: 20 },
  ]);

  const [pesosExtra, setPesosExtra] = useState<Peso[]>([
    { key: "reserva",      label: "Reserva",       cor: CORES.reserva.bar,      valor: 40 },
    { key: "objetivos",    label: "Objetivos",     cor: CORES.objetivo.bar,     valor: 30 },
    { key: "qualidade",    label: "Qualidade",     cor: CORES.qualidade.bar,    valor: 20 },
    { key: "investimento", label: "Investimentos", cor: CORES.investimento.bar, valor: 10 },
  ]);

  // ── Cálculos 50/30/20 ──────────────────────────────────────────────────────
  const totais = totalPorCategoria(gastos);

  const categorias502030 = [
    { key: "necessidade", nome: "Necessidades",     cor: CORES.necessidade.bar,  gasto: totais.necessidade },
    { key: "objetivo",    nome: "Objetivos",         cor: CORES.objetivo.bar,     gasto: totais.objetivo    },
    { key: "qualidade",   nome: "Qualidade de vida", cor: CORES.qualidade.bar,    gasto: totais.qualidade   },
  ].map((c) => ({
    ...c,
    peso: pesos502030.find((p) => p.key === c.key)?.valor ?? 0,
    limite: salario * ((pesos502030.find((p) => p.key === c.key)?.valor ?? 0) / 100) + (ajustes[c.key] ?? 0),
  }));

  const temAjustes = Object.values(ajustes).some((v) => v !== 0);

  function aplicarRealocacao() {
    const val = parseFloat(realocarValor);
    if (!realocarOrigem || !realocarDestino || !val || val <= 0) return;
    const novos = {
      ...ajustes,
      [realocarOrigem]: (ajustes[realocarOrigem] ?? 0) - val,
      [realocarDestino]: (ajustes[realocarDestino] ?? 0) + val,
    };
    startAjustes(async () => {
      await salvarAjustesLimite(novos);
    });
    setRealocarValor("");
    setRealocarOrigem(null);
    setRealocarDestino(null);
  }

  function resetarAjustes() {
    startAjustes(async () => {
      await salvarAjustesLimite({});
    });
    setRealocarOrigem(null);
    setRealocarDestino(null);
    setRealocarValor("");
  }

  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade;
  const saldoLivre = salario - totalGastos;

  // ── Cálculos Renda Extra ───────────────────────────────────────────────────
  const extraNum = parseFloat(valorExtra) || 0;
  const totalPesosExtra = pesosExtra.reduce((s, p) => s + p.valor, 0);
  const extraValido = Math.abs(totalPesosExtra - 100) < 0.01;

  const mesAtual = new Date().toISOString().slice(0, 7);
  const historicoMes = useMemo(
    () => rendaExtraHistorico.filter((r) => r.created_at.slice(0, 7) === mesAtual),
    [rendaExtraHistorico, mesAtual]
  );
  const totalExtraMes = historicoMes.reduce((s, r) => s + r.valor, 0);

  const fundosSemCustodia = fundos.filter((f) => !f.custodia);
  const fundosComCustodia = fundos.filter((f) => f.custodia);
  const fundoReserva = fundos.find((f) => f.reserva_emergencia) ?? null;

  function getFundoParaFatia(key: string): Fundo | null {
    const override = fundosPorFatia[key];
    if (override !== undefined) {
      return fundos.find((f) => f.id === override) ?? null;
    }
    if (key === "qualidade") return null;
    if (key === "reserva") return fundoReserva;
    if (key === "investimento") return fundosComCustodia[0] ?? fundosSemCustodia[0] ?? null;
    return fundosSemCustodia[0] ?? null;
  }

  const fatiasExtra = pesosExtra.map((p) => {
    const coreKey = (p.key in CORES ? p.key : "investimento") as keyof typeof CORES;
    const cores = CORES[coreKey];
    return {
      key: p.key,
      label: p.label,
      cor: cores.bar,
      iconBg: cores.iconBg,
      valor: extraNum * (p.valor / 100),
      fundo: getFundoParaFatia(p.key),
      peso: p.valor,
    };
  });

  // ── Aporte ─────────────────────────────────────────────────────────────────
  function abrirAporte(fatia: typeof fatiasExtra[0]) {
    if (!fatia.fundo) return;
    setFatiaAporte({ label: fatia.label, cor: fatia.cor, iconBg: fatia.iconBg, valor: fatia.valor, fundo: fatia.fundo });
    setModalAporte(true);
  }

  function handleConfirmarAporte(fundoId: string, valor: number) {
    startAporte(async () => {
      await confirmarAporte(fundoId, valor);
      setModalAporte(false);
      setFatiaAporte(null);
    });
  }

  function handleRegistrarRendaExtra() {
    if (!extraNum || extraNum <= 0) return;
    startRegistrar(async () => {
      const result = await registrarRendaExtra(extraNum, descricaoExtra.trim() || null);
      if (result.data) {
        setValorExtra("");
        setDescricaoExtra("");
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 36px", background: "#F7F8FA", minHeight: "100%" }}>

      {/* Cabeçalho */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F1729", margin: 0 }}>
          Calculadoras
        </h1>
        <p style={{ fontSize: 14, color: "#7C8896", marginTop: 4, margin: "4px 0 0" }}>
          Método 50/30/20 e distribuição de renda extra
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Card 50/30/20 ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            {/* Cabeçalho do card */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "20px 24px 0",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#0F1729", margin: 0 }}>50/30/20</p>
                <p style={{ fontSize: 12, color: "#7C8896", marginTop: 2 }}>
                  Distribuição ideal do seu salário
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* Chip salário */}
                <button
                  type="button"
                  onClick={() => setModalSalario(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1.5px solid #E6E8EC",
                    background: "#F7F8FA",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0F1729",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0E8F6A")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E6E8EC")}
                >
                  <span style={{ color: "#7C8896", fontSize: 12, fontWeight: 500 }}>Salário base</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#0E8F6A" }}>
                    {formatCurrency(salario)}
                  </span>
                  <IconPencil style={{ width: 13, height: 13, color: "#9AA3AE" }} />
                </button>

                {/* Editar pesos */}
                <button
                  type="button"
                  onClick={() => setModalPesos502030(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #E6E8EC",
                    background: "#F7F8FA",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#7C8896",
                    cursor: "pointer",
                  }}
                >
                  <IconSettings style={{ width: 13, height: 13 }} />
                  Pesos
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Linhas de status */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {categorias502030.map((c, i) => (
                  <div key={c.key}>
                    <LinhaStatusCategoria
                      cor={c.cor}
                      nome={c.nome}
                      gasto={c.gasto}
                      limite={c.limite}
                    />
                    {i < categorias502030.length - 1 && (
                      <div style={{ borderTop: "1px solid #F0F2F4" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Realocar limites */}
              <div>
                <button
                  type="button"
                  onClick={() => setRealocarAberto((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${realocarAberto ? "#0E8F6A" : "#E6E8EC"}`,
                    background: realocarAberto ? "#E3F6EF" : "#F7F8FA",
                    fontSize: 12,
                    fontWeight: 600,
                    color: realocarAberto ? "#0E8F6A" : "#7C8896",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <IconArrowRight style={{ width: 13, height: 13 }} />
                  Realocar limites entre categorias
                  {temAjustes && (
                    <span style={{
                      background: "#0E8F6A",
                      color: "#fff",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      marginLeft: 2,
                    }}>ativo</span>
                  )}
                </button>

                {realocarAberto && (
                  <div style={{
                    marginTop: 12,
                    padding: "16px",
                    background: "#F7F8FA",
                    border: "1px solid #E6E8EC",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}>
                    <p style={{ fontSize: 12, color: "#7C8896", margin: 0 }}>
                      Mova valor do limite de uma categoria para outra
                    </p>

                    {/* Seletor de origem e destino */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Origem */}
                      <div style={{ display: "flex", gap: 4 }}>
                        {categorias502030.map((c) => (
                          <button
                            key={`orig-${c.key}`}
                            type="button"
                            onClick={() => {
                              setRealocarOrigem(c.key);
                              if (realocarDestino === c.key) setRealocarDestino(null);
                            }}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 6,
                              border: `1.5px solid ${realocarOrigem === c.key ? c.cor : "#E6E8EC"}`,
                              background: realocarOrigem === c.key ? c.cor + "18" : "#fff",
                              fontSize: 11,
                              fontWeight: 600,
                              color: realocarOrigem === c.key ? c.cor : "#7C8896",
                              cursor: "pointer",
                              transition: "all 0.12s",
                              opacity: realocarDestino === c.key ? 0.4 : 1,
                            }}
                            disabled={realocarDestino === c.key}
                          >
                            {c.nome.split(" ")[0]}
                          </button>
                        ))}
                      </div>

                      <IconArrowRight style={{ width: 16, height: 16, color: "#D1D5DB", flexShrink: 0 }} />

                      {/* Destino */}
                      <div style={{ display: "flex", gap: 4 }}>
                        {categorias502030.map((c) => (
                          <button
                            key={`dest-${c.key}`}
                            type="button"
                            onClick={() => {
                              setRealocarDestino(c.key);
                              if (realocarOrigem === c.key) setRealocarOrigem(null);
                            }}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 6,
                              border: `1.5px solid ${realocarDestino === c.key ? c.cor : "#E6E8EC"}`,
                              background: realocarDestino === c.key ? c.cor + "18" : "#fff",
                              fontSize: 11,
                              fontWeight: 600,
                              color: realocarDestino === c.key ? c.cor : "#7C8896",
                              cursor: "pointer",
                              transition: "all 0.12s",
                              opacity: realocarOrigem === c.key ? 0.4 : 1,
                            }}
                            disabled={realocarOrigem === c.key}
                          >
                            {c.nome.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input valor + aplicar */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{
                          padding: "7px 10px",
                          background: "#fff",
                          border: "1px solid #E1E5EA",
                          borderRight: "none",
                          borderRadius: "7px 0 0 7px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#7C8896",
                        }}>R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={realocarValor}
                          onChange={(e) => setRealocarValor(e.target.value)}
                          placeholder="0,00"
                          style={{
                            width: 100,
                            padding: "7px 10px",
                            border: "1px solid #E1E5EA",
                            borderRadius: "0 7px 7px 0",
                            background: "#fff",
                            fontSize: 13,
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "#0F1729",
                            outline: "none",
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={aplicarRealocacao}
                        disabled={!realocarOrigem || !realocarDestino || !realocarValor || realocarOrigem === realocarDestino}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 7,
                          border: "none",
                          background: (realocarOrigem && realocarDestino && realocarValor && realocarOrigem !== realocarDestino) ? "#0E8F6A" : "#E6E8EC",
                          color: (realocarOrigem && realocarDestino && realocarValor && realocarOrigem !== realocarDestino) ? "#fff" : "#9AA3AE",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: (realocarOrigem && realocarDestino && realocarValor && realocarOrigem !== realocarDestino) ? "pointer" : "not-allowed",
                          transition: "all 0.15s",
                        }}
                      >
                        Aplicar
                      </button>

                      {temAjustes && (
                        <button
                          type="button"
                          onClick={resetarAjustes}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "7px 12px",
                            borderRadius: 7,
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <IconRefresh style={{ width: 12, height: 12 }} />
                          Resetar
                        </button>
                      )}
                    </div>

                    {/* Resumo dos ajustes ativos */}
                    {temAjustes && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {categorias502030.filter((c) => ajustes[c.key] && ajustes[c.key] !== 0).map((c) => {
                          const delta = ajustes[c.key] ?? 0;
                          return (
                            <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.cor, flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: "#7C8896" }}>{c.nome}</span>
                              <span style={{
                                fontSize: 11,
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: delta > 0 ? "#0E8F6A" : "#EF4444",
                              }}>
                                {delta > 0 ? "+" : ""}{formatCurrency(delta)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saldo livre */}
              {salario > 0 && (
                <div
                  style={{
                    background: "#F7F8FA",
                    border: "1px solid #E6E8EC",
                    borderRadius: 10,
                    padding: "10px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#7C8896", fontWeight: 500 }}>
                    Saldo livre este mês
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: saldoLivre < 0 ? "#EF4444" : "#0E8F6A",
                    }}
                  >
                    {formatCurrency(saldoLivre)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Card Renda Extra ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card>
            {/* Cabeçalho do card */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "20px 24px 0",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#0F1729", margin: 0 }}>Renda Extra</p>
                <p style={{ fontSize: 12, color: "#7C8896", marginTop: 2 }}>
                  Divida um valor extra entre seus objetivos
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Input valor extra */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      padding: "7px 10px",
                      background: "#F7F8FA",
                      border: "1px solid #E1E5EA",
                      borderRight: "none",
                      borderRadius: "8px 0 0 8px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7C8896",
                    }}
                  >
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorExtra}
                    onChange={(e) => setValorExtra(e.target.value)}
                    placeholder="0,00"
                    style={{
                      width: 110,
                      padding: "7px 10px",
                      border: "1px solid #E1E5EA",
                      borderRadius: "0 8px 8px 0",
                      background: "#F7F8FA",
                      fontSize: 14,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: "#0F1729",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Editar pesos */}
                <button
                  type="button"
                  onClick={() => setModalPesosExtra(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #E6E8EC",
                    background: "#F7F8FA",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#7C8896",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <IconSettings style={{ width: 13, height: 13 }} />
                  Editar pesos
                </button>
              </div>
            </div>

            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {/* Campo de descrição + botão registrar */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={descricaoExtra}
                  onChange={(e) => setDescricaoExtra(e.target.value)}
                  placeholder="Descrição (opcional)"
                  style={{
                    flex: 1,
                    minWidth: 140,
                    padding: "7px 12px",
                    border: "1px solid #E1E5EA",
                    borderRadius: 8,
                    background: "#F7F8FA",
                    fontSize: 13,
                    color: "#0F1729",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleRegistrarRendaExtra}
                  disabled={!extraNum || extraNum <= 0 || pendingRegistrar}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: extraNum > 0 ? "#0E8F6A" : "#E6E8EC",
                    color: extraNum > 0 ? "#fff" : "#9AA3AE",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: extraNum > 0 ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <IconPlus style={{ width: 14, height: 14 }} />
                  {pendingRegistrar ? "Registrando..." : "Registrar"}
                </button>
              </div>

              {/* Aviso de pesos inválidos */}
              {!extraValido && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
                    ⚠ Pesos somam {totalPesosExtra}% — ajuste para 100%
                  </span>
                </div>
              )}

              {/* Barra das fatias */}
              <BarraProporcional
                segmentos={pesosExtra.map((p) => {
                  const coreKey = (p.key in CORES ? p.key : "investimento") as keyof typeof CORES;
                  return {
                    key: p.key,
                    label: p.label,
                    peso: p.valor,
                    cor: CORES[coreKey].bar,
                  };
                })}
              />

              <div style={{ borderTop: "1px solid #F0F2F4" }} />

              {/* Linhas das fatias */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {fatiasExtra.map((f, i) => (
                  <div key={f.key}>
                    <LinhaFatiaExtra
                      cor={f.cor}
                      iconBg={f.iconBg}
                      label={f.label}
                      valor={f.valor}
                      fundo={f.fundo}
                      isReserva={f.key === "reserva"}
                      todosFundos={f.key === "qualidade" ? undefined : fundos}
                      onAportar={f.fundo ? () => abrirAporte(f) : undefined}
                      onTrocarFundo={f.key !== "qualidade" ? (fundoId) => {
                        setFundosPorFatia((prev) => ({ ...prev, [f.key]: fundoId }));
                      } : undefined}
                    />
                    {i < fatiasExtra.length - 1 && (
                      <div style={{ borderTop: "1px solid #F0F2F4" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Histórico do mês */}
              {historicoMes.length > 0 && (
                <>
                  <div style={{ borderTop: "1px solid #F0F2F4" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>
                        Registrado este mês
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0E8F6A",
                      }}>
                        {formatCurrency(totalExtraMes)}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {historicoMes.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: "#F7F8FA",
                            border: "1px solid #E6E8EC",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>
                              {item.descricao ?? "Renda extra"}
                            </span>
                            <span style={{ fontSize: 11, color: "#9AA3AE" }}>
                              {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0E8F6A",
                          }}>
                            +{formatCurrency(item.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

      </div>

      {/* ── Modais ────────────────────────────────────────────────────────────── */}
      <ModalEditarSalario
        open={modalSalario}
        salarioAtual={salario}
        onClose={() => setModalSalario(false)}
      />

      <ModalPersonalizarPesos
        open={modalPesos502030}
        titulo="Regra 50/30/20"
        pesos={pesos502030}
        onClose={() => setModalPesos502030(false)}
        onSalvar={(novos) => setPesos502030(novos)}
      />

      <ModalPersonalizarPesos
        open={modalPesosExtra}
        titulo="Distribuição de Renda Extra"
        pesos={pesosExtra}
        onClose={() => setModalPesosExtra(false)}
        onSalvar={(novos) => setPesosExtra(novos)}
      />

      <ModalConfirmarAporteCalc
        open={modalAporte}
        fatia={fatiaAporte}
        pending={pendingAporte}
        onClose={() => { setModalAporte(false); setFatiaAporte(null); }}
        onConfirmar={handleConfirmarAporte}
      />
    </div>
  );
}
