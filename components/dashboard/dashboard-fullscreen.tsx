"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  IconArrowUpRight,
  IconHome,
  IconShoppingCart,
  IconCar,
  IconHeart,
  IconStar,
} from "@tabler/icons-react";
import { RecentTransactions } from "./recent-transactions";
import { MetaAtingidaBanner } from "./meta-atingida-banner";
import { UpgradeBanner } from "./upgrade-banner";
import type { Configuracao, Fundo, Gasto, Profile } from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { calcularScore502030, totalPorCategoria } from "@/lib/score";
import { formatCurrency } from "@/lib/utils";

/* ── Static sparkline data (visual only — real data would come from history) ── */
const SALDO_DATA = [
  { m: "Jun", v: 480000 },
  { m: "Jul", v: 620000 },
  { m: "Ago", v: 590000 },
  { m: "Set", v: 710000 },
  { m: "Out", v: 680000 },
  { m: "Nov", v: 920000 },
  { m: "Dez", v: 1116670 },
];

const RECEITA_DATA = [
  { m: "Jun", v: 800 },
  { m: "Jul", v: 1100 },
  { m: "Ago", v: 950 },
  { m: "Set", v: 1300 },
  { m: "Out", v: 1050 },
  { m: "Nov", v: 1200 },
  { m: "Dez", v: 1030 },
];

const DESPESA_DATA = [
  { m: "Jun", v: 450 },
  { m: "Jul", v: 600 },
  { m: "Ago", v: 500 },
  { m: "Set", v: 700 },
  { m: "Out", v: 380 },
  { m: "Nov", v: 520 },
  { m: "Dez", v: 288 },
];

const FLUXO_DATA = [
  { m: "Jun",  v: 8000 },
  { m: "Jul",  v: 12000 },
  { m: "Ago",  v: -5000 },
  { m: "Set",  v: -12000 },
  { m: "Out",  v: 3000 },
  { m: "Nov",  v: 9000 },
  { m: "Dez",  v: 18000 },
];

const DONUT_DATA = [
  { name: "Moradia",      value: 40, color: "#065F46" },
  { name: "Saúde",        value: 25, color: "#059669" },
  { name: "Alimentação",  value: 25, color: "#34D399" },
  { name: "Outros",       value: 10, color: "#D1FAE5" },
];

const BUDGET_ITEMS = [
  { label: "Moradia",      icon: IconHome,         pct: 60, value: 3600 },
  { label: "Alimentação",  icon: IconShoppingCart,  pct: 45, value: 1350 },
  { label: "Transporte",   icon: IconCar,           pct: 30, value: 480 },
  { label: "Saúde",        icon: IconHeart,         pct: 25, value: 250 },
  { label: "Lazer",        icon: IconStar,          pct: 20, value: 200 },
];

const CARD_STYLE: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #E5E7EB",
};

const EMERALD = "#059669";
const EMERALD_DARK = "#047857";

type FluxoFilter = "Todos" | "Entradas" | "Saídas";
type PeriodFilter = "Este Mês" | "Último Mês" | "3 Meses";

interface DashboardProps {
  profile: Profile;
  config: Configuracao | null;
  scoreData: Score502030Result;
  totalGastos: number;
  fundos: Fundo[];
  gastos: Gasto[];
  metaEconomia: number | null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#111827", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700 }}>{typeof payload[0].value === "number" && payload[0].value > 1000 ? formatCurrency(payload[0].value) : formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function DashboardFullscreen({
  profile,
  config,
  scoreData,
  totalGastos,
  fundos,
  gastos,
  metaEconomia,
}: DashboardProps) {
  const [fluxoFilter, setFluxoFilter] = useState<FluxoFilter>("Todos");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("Este Mês");

  const nome = profile.nome ?? "Usuário";
  const firstName = nome.split(" ")[0];
  const totalFundos = fundos.reduce((acc, f) => acc + f.saldo_atual, 0);

  const totais = totalPorCategoria(gastos);
  const rendaTotal = scoreData.rendaTotal;

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>

      {/* ── Saudação ── */}
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 28 }}>
        Bem-vindo de volta, {firstName}!
      </h1>

      {/* ── Linha 1: 4 cards — 2fr 1fr 1fr 1fr ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* Card 1: Saldo Total */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 4 }}>Saldo Total</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: EMERALD_DARK, fontFamily: "var(--font-mono)", marginBottom: 16 }}>
            {formatCurrency(rendaTotal > 0 ? rendaTotal : 1116670)}
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={SALDO_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="v" stroke={EMERALD_DARK} strokeWidth={2.5} fill="url(#saldoGrad)" dot={false} activeDot={{ r: 5, fill: EMERALD_DARK, stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Card 2: Receitas do Mês */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Receitas do Mês</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: EMERALD, fontFamily: "var(--font-mono)", marginBottom: 12 }}>
            {formatCurrency(rendaTotal > 0 ? rendaTotal : 1030)}
          </p>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={RECEITA_DATA} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={EMERALD} strokeWidth={2} fill="url(#receitaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {RECEITA_DATA.map((d) => (
              <span key={d.m} style={{ fontSize: 10, color: "#9CA3AF" }}>{d.m}</span>
            ))}
          </div>
        </div>

        {/* Card 3: Despesas do Mês */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Despesas do Mês</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: EMERALD, fontFamily: "var(--font-mono)", marginBottom: 12 }}>
            {formatCurrency(totalGastos > 0 ? totalGastos : 288)}
          </p>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={DESPESA_DATA} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={EMERALD} strokeWidth={2} fill="url(#despesaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {DESPESA_DATA.map((d) => (
              <span key={d.m} style={{ fontSize: 10, color: "#9CA3AF" }}>{d.m}</span>
            ))}
          </div>
        </div>

        {/* Card 4: Categorias (Donut) */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>Categorias</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={DONUT_DATA}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                strokeWidth={0}
                dataKey="value"
              >
                {DONUT_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 4 }}>
            {DONUT_DATA.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#6B7280" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Linha 2: 3 cards — 2fr 1.3fr 1.3fr ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1.3fr", gap: 24 }}>

        {/* Card: Fluxo de Caixa */}
        <div style={CARD_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Fluxo de Caixa</p>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Filter select */}
              <div style={{ position: "relative" }}>
                <select
                  value={fluxoFilter}
                  onChange={(e) => setFluxoFilter(e.target.value as FluxoFilter)}
                  style={{
                    appearance: "none",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "6px 28px 6px 12px",
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <option>Todos</option>
                  <option>Entradas</option>
                  <option>Saídas</option>
                </select>
                <svg style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5L6 8L9 5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              {/* Date select */}
              <div style={{ position: "relative" }}>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  style={{
                    appearance: "none",
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    borderRadius: 10,
                    padding: "6px 28px 6px 12px",
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  <option>Este Mês</option>
                  <option>Último Mês</option>
                  <option>3 Meses</option>
                </select>
                <svg style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4h8M4 2v2M8 2v2M2.5 5.5h7a1 1 0 011 1v3a1 1 0 01-1 1h-7a1 1 0 01-1-1v-3a1 1 0 011-1z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={FLUXO_DATA} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fluxoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                domain={[-25000, 25000]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={EMERALD}
                strokeWidth={2.5}
                fill="url(#fluxoGrad)"
                dot={false}
                activeDot={{ r: 5, fill: EMERALD_DARK, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Card: Transações Recentes */}
        <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Transações Recentes</p>
            <Link
              href="/gastos"
              style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: EMERALD, fontWeight: 500, textDecoration: "none" }}
            >
              Ver todos <IconArrowUpRight size={13} />
            </Link>
          </div>
          <RecentTransactions gastos={gastos.slice(0, 5)} />
        </div>

        {/* Card: Orçamento por Categoria */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 20 }}>
            Orçamento por Categoria
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {BUDGET_ITEMS.map(({ label, icon: Icon, pct, value }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "#ECFDF5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} style={{ color: EMERALD }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{pct}%</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: "var(--font-mono)" }}>
                    {formatCurrency(value)}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: "#E5E7EB", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: 9999,
                      background: EMERALD,
                      transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banners abaixo */}
      <div className="mt-6 space-y-4">
        <MetaAtingidaBanner fundos={fundos} />
        {profile.plano === "free" && <UpgradeBanner />}
      </div>
    </div>
  );
}
