"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { IconPencil, IconSettings } from "@tabler/icons-react";
import { confirmarAporte } from "@/app/(app)/fundos/actions";
import { formatCurrency } from "@/lib/utils";
import { totalPorCategoria } from "@/lib/score";
import type { Configuracao, Fundo, Gasto } from "@/lib/types";

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
  investimento: { bar: "#4F46E5", iconBg: "#E0E7FF" },
  reserva:      { bar: "#C4820A", iconBg: "#FCE8C9" },
} as const;

// ── Props ─────────────────────────────────────────────────────────────────────
interface CalculadoraClientProps {
  config: Configuracao;
  gastos: Gasto[];
  fundos: Fundo[];
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
export function CalculadoraClient({ config, gastos, fundos }: CalculadoraClientProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [salario, setSalario] = useState(config.salario);
  const [modalSalario, setModalSalario] = useState(false);
  const [modalPesos502030, setModalPesos502030] = useState(false);
  const [modalPesosExtra, setModalPesosExtra] = useState(false);
  const [valorExtra, setValorExtra] = useState("");
  const [modalAporte, setModalAporte] = useState(false);
  const [fatiaAporte, setFatiaAporte] = useState<FatiaAporte | null>(null);
  const [pendingAporte, startAporte] = useTransition();

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
    limite: salario * ((pesos502030.find((p) => p.key === c.key)?.valor ?? 0) / 100),
  }));

  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade;
  const saldoLivre = salario - totalGastos;

  // ── Cálculos Renda Extra ───────────────────────────────────────────────────
  const extraNum = parseFloat(valorExtra) || 0;
  const totalPesosExtra = pesosExtra.reduce((s, p) => s + p.valor, 0);
  const extraValido = Math.abs(totalPesosExtra - 100) < 0.01;

  const fundosSemCustodia = fundos.filter((f) => !f.custodia);
  const fundosComCustodia = fundos.filter((f) => f.custodia);

  function getFundoParaFatia(key: string): Fundo | null {
    if (key === "qualidade") return null;
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
              {/* Barra ilustrativa */}
              <BarraProporcional
                segmentos={categorias502030.map((c) => ({
                  key: c.key,
                  label: c.nome,
                  peso: c.peso,
                  cor: c.cor,
                }))}
              />

              <div style={{ borderTop: "1px solid #F0F2F4" }} />

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
                      onAportar={f.fundo ? () => abrirAporte(f) : undefined}
                    />
                    {i < fatiasExtra.length - 1 && (
                      <div style={{ borderTop: "1px solid #F0F2F4" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Validação de pesos */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: extraValido ? "#E3F6EF" : "#FEF2F2",
                  border: `1px solid ${extraValido ? "#CDEFE3" : "#FECACA"}`,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: extraValido ? "#0D7A5E" : "#DC2626",
                  }}
                >
                  {extraValido
                    ? `✓ ${totalPesosExtra}% da renda extra alocado`
                    : `⚠ Pesos somam ${totalPesosExtra}% — ajuste para 100%`}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* ── Modais ────────────────────────────────────────────────────────────── */}
      <ModalEditarSalario
        open={modalSalario}
        salarioAtual={salario}
        onClose={() => setModalSalario(false)}
        onSalvo={(novoSalario) => setSalario(novoSalario)}
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
