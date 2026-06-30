"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  House,
  Target,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Calendar,
  WalletMinimal,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import type {
  CategoriaGasto,
  Configuracao,
  Fundo,
  Gasto,
  HistoricoMensal,
  Profile,
} from "@/lib/types";
import type { Score502030Result } from "@/lib/score";
import { CATEGORIA_LABELS } from "@/lib/types";

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F7F5",
  card: "#FFFFFF",
  border: "rgba(11,58,36,.08)",
  shadow: "0 1px 2px rgba(11,58,36,.05)",
  text: "#16241D",
  textSec: "#5E6E66",
  textMut: "#9AA8A0",
  track: "#EDF2EE",
  green: "#0B6B3F",
  greenMid: "#16A35A",
  greenLight: "#4FB87E",
  alertText: "#C0341D",
  alertBg: "#FBEAE5",
  alertBorder: "#F1C7BC",
  alertIconBg: "#F3D2C8",
  alertIconText: "#B23A1E",
  warnText: "#9A6410",
  warnBg: "#FAF0DC",
} as const;

// ── Bucket visual definitions (por categoria do banco) ──────────────────────────
const BUCKET_META: Record<
  CategoriaGasto,
  { sub: string; cor: string; bg: string; Icon: typeof House; pct: number }
> = {
  necessidade: { sub: "moradia e essenciais", cor: "#0B6B3F", bg: "#E6F0EA", Icon: House, pct: 50 },
  objetivo: { sub: "investimentos e metas", cor: "#16A35A", bg: "#E3F4EA", Icon: Target, pct: 30 },
  qualidade: { sub: "lazer e extras", cor: "#4FB87E", bg: "#EAF7EF", Icon: Sparkles, pct: 20 },
};

const TX_BUCKET: Record<CategoriaGasto, { label: string; cor: string; bg: string }> = {
  necessidade: { label: "Necessidades", cor: "#0B6B3F", bg: "#E6F0EA" },
  objetivo: { label: "Objetivos", cor: "#16A35A", bg: "#E3F4EA" },
  qualidade: { label: "Qualidade de vida", cor: "#2E8B57", bg: "#EAF7EF" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBRL(v: number): string {
  return (
    "R$ " +
    Number(v).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function txDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── SVG Donut Ring ────────────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 34; // ≈ 213.63

function DonutRing({ ratio, color }: { ratio: number; color: string }) {
  const dash = clamp(ratio, 0, 1) * CIRC;
  const pctLabel = Math.round(ratio * 100);

  return (
    <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto" }}>
      <svg width="132" height="132" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke={T.track} strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          strokeDasharray={`${dash} ${CIRC}`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: color,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {pctLabel}%
        </span>
        <span style={{ fontSize: 10, color: T.textMut }}>do limite</span>
      </div>
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────────────────
function StatusPill({
  label,
  textColor,
  bgColor,
}: {
  label: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: textColor,
        background: bgColor,
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </span>
  );
}

interface BucketView {
  categoria: CategoriaGasto;
  nome: string;
  sub: string;
  cor: string;
  bg: string;
  Icon: typeof House;
  pct: number;
  orcamento: number;
  gasto: number;
  ratio: number;
  over: boolean;
  cats: { nome: string; valor: number }[];
}

// ── Bucket Card ───────────────────────────────────────────────────────────────
function BucketCard({ bucket, privacy }: { bucket: BucketView; privacy: boolean }) {
  const { orcamento, gasto, ratio, over } = bucket;
  const ringColor = over ? T.alertText : bucket.cor;

  let pillLabel: string;
  let pillText: string;
  let pillBg: string;

  if (bucket.categoria === "objetivo") {
    if (gasto >= orcamento) {
      pillLabel = "Meta batida";
      pillText = T.green;
      pillBg = "#E3F4EA";
    } else {
      pillLabel = "Em progresso";
      pillText = T.greenMid;
      pillBg = "#E3F4EA";
    }
  } else if (over) {
    pillLabel = "Estourou";
    pillText = T.alertText;
    pillBg = "#FBE3DC";
  } else if (ratio >= 0.85) {
    pillLabel = "No limite";
    pillText = T.warnText;
    pillBg = T.warnBg;
  } else {
    pillLabel = "No caminho";
    pillText = T.green;
    pillBg = "#E6F0EA";
  }

  const diff = Math.abs(orcamento - gasto);
  const diffLabel = over
    ? "acima do limite"
    : bucket.categoria === "objetivo"
    ? "para completar a meta"
    : "ainda disponível";
  const diffColor = over ? T.alertText : T.green;

  const BktIcon = bucket.Icon;

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 18,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: bucket.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BktIcon size={16} color={bucket.cor} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{bucket.nome}</div>
          <div style={{ fontSize: 11, color: T.textMut, marginTop: 1 }}>{bucket.pct}% da renda</div>
        </div>
      </div>

      {/* Donut */}
      <DonutRing ratio={ratio} color={ringColor} />

      {/* Status pill */}
      <div style={{ textAlign: "center" }}>
        <StatusPill label={pillLabel} textColor={pillText} bgColor={pillBg} />
      </div>

      {/* Valores */}
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          color: T.textSec,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <strong style={{ color: T.text, fontWeight: 700 }}>
          {privacy ? "R$ ••••" : fmtBRL(gasto)}
        </strong>{" "}
        de {privacy ? "R$ ••••" : fmtBRL(orcamento)}
      </div>

      {/* Diff */}
      <div
        style={{
          textAlign: "center",
          fontSize: 12,
          color: diffColor,
          fontWeight: 500,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {privacy ? "R$ ••••" : fmtBRL(diff)} {diffLabel}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: T.border }} />

      {/* Category list */}
      {bucket.cats.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bucket.cats.map((cat) => (
            <div key={cat.nome} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: "#F2F6F3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: bucket.cor,
                }}
              >
                {cat.nome.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: T.textSec,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.nome}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {privacy ? "R$ ••••" : fmtBRL(cat.valor)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: T.textMut, textAlign: "center", padding: "4px 0" }}>
          Sem lançamentos neste grupo.
        </p>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface DashboardProps {
  profile: Profile;
  config: Configuracao | null;
  scoreData: Score502030Result;
  totalGastos: number;
  fundos: Fundo[];
  gastos: Gasto[];
  historico: HistoricoMensal[];
  metaEconomia: number | null;
}

// ── Main component ────────────────────────────────────────────────────────────
export function DashboardFullscreen({
  profile,
  scoreData,
  fundos,
  gastos,
  historico,
}: DashboardProps) {
  const [privacy, setPrivacy] = useState(false);

  const nome = profile?.nome ?? "Usuário";
  const firstName = nome.split(" ")[0];

  // ── Lista de meses disponíveis (histórico + mês atual) ──────────────────────
  const currentKey = monthKey(new Date());
  const monthKeys = useMemo(() => {
    const set = new Set<string>([currentKey]);
    for (const h of historico) set.add(h.mes.slice(0, 7));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [historico, currentKey]);

  const [mesKey, setMesKey] = useState(currentKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const isCurrentMonth = mesKey === currentKey;

  // ── Buckets a partir do score (mês atual) ───────────────────────────────────
  const catGastos = useMemo(() => {
    const map: Record<CategoriaGasto, { nome: string; valor: number }[]> = {
      necessidade: [],
      objetivo: [],
      qualidade: [],
    };
    for (const g of gastos) map[g.categoria].push({ nome: g.nome, valor: g.valor });
    for (const k of Object.keys(map) as CategoriaGasto[]) {
      map[k].sort((a, b) => b.valor - a.valor);
    }
    return map;
  }, [gastos]);

  const buckets: BucketView[] = useMemo(() => {
    return scoreData.categorias.map((c) => {
      const meta = BUCKET_META[c.categoria];
      const orcamento = c.limite;
      const over = c.categoria !== "objetivo" && c.gasto > orcamento;
      const ratio = orcamento > 0 ? c.gasto / orcamento : 0;
      return {
        categoria: c.categoria,
        nome: CATEGORIA_LABELS[c.categoria],
        sub: meta.sub,
        cor: meta.cor,
        bg: meta.bg,
        Icon: meta.Icon,
        pct: meta.pct,
        orcamento,
        gasto: c.gasto,
        ratio,
        over,
        cats: catGastos[c.categoria].slice(0, 4),
      };
    });
  }, [scoreData.categorias, catGastos]);

  const overBuckets = buckets.filter((b) => b.over);

  // ── Aderência (já calculada no score) ───────────────────────────────────────
  const score = scoreData.score;
  let scoreLabel: string;
  let scoreColor: string;
  if (score >= 90) {
    scoreLabel = "Ótima aderência";
    scoreColor = T.greenMid;
  } else if (score >= 75) {
    scoreLabel = "Boa aderência";
    scoreColor = T.greenMid;
  } else if (score >= 60) {
    scoreLabel = "Requer atenção";
    scoreColor = "#C9821F";
  } else {
    scoreLabel = "Fora do plano";
    scoreColor = T.alertText;
  }

  // ── Fundos / metas reais ────────────────────────────────────────────────────
  const fundosOrdenados = [...fundos].sort((a, b) => a.ordem - b.ordem);
  const fundosTotal = fundos.reduce((a, f) => a + f.saldo_atual, 0);

  // Investimentos (agregado dos fundos com custódia)
  const investidos = fundos.filter((f) => f.custodia);
  const totalAplicado = investidos.reduce((a, f) => a + f.saldo_atual, 0);

  // ── Transações reais ────────────────────────────────────────────────────────
  const transacoes = gastos.slice(0, 5);

  const cardStyle: React.CSSProperties = {
    background: T.card,
    borderRadius: 18,
    border: `1px solid ${T.border}`,
    boxShadow: T.shadow,
    padding: 20,
  };

  const mesLabelFull = capitalize(monthLabel(mesKey));
  const mesNome = mesLabelFull.split(" ")[0];

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: T.text, minHeight: "100%" }}>
      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: T.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WalletMinimal size={16} color="#fff" />
          </div>
          <span
            style={{ fontSize: 18, fontWeight: 800, color: T.green, letterSpacing: "-0.02em" }}
          >
            FinDash
          </span>
        </div>

        {/* Right: privacy + adherence chip + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setPrivacy((v) => !v)}
            title={privacy ? "Mostrar valores" : "Ocultar valores"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: T.textSec,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              padding: "7px 12px",
              boxShadow: T.shadow,
              cursor: "pointer",
            }}
          >
            {privacy ? <EyeOff size={14} color={T.green} /> : <Eye size={14} color={T.green} />}
            {privacy ? "Mostrar" : "Privacidade"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              padding: "6px 14px",
              boxShadow: T.shadow,
            }}
          >
            <span
              style={{ fontSize: 10, fontWeight: 700, color: T.textMut, letterSpacing: "0.06em" }}
            >
              ADERÊNCIA
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: scoreColor,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{scoreLabel}</span>
          </div>

          <Link
            href="/gastos"
            style={{
              background: T.green,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + Registrar gasto
          </Link>
        </div>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: T.text,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Olá, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: T.textSec, margin: "4px 0 0" }}>
            Seus 3 grupos da regra 50/30/20 em {mesNome}.
          </p>
        </div>

        {/* Month dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              padding: "6px 14px",
              boxShadow: T.shadow,
              fontSize: 13,
              fontWeight: 600,
              color: T.textSec,
              cursor: monthKeys.length > 1 ? "pointer" : "default",
            }}
          >
            <Calendar size={14} color={T.textMut} />
            {mesLabelFull}
            {monthKeys.length > 1 && (
              <ChevronDown
                size={14}
                color={T.textMut}
                style={{
                  transition: "transform 0.18s ease",
                  transform: menuOpen ? "rotate(180deg)" : "none",
                }}
              />
            )}
          </button>

          {menuOpen && monthKeys.length > 1 && (
            <>
              <div
                onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  minWidth: 160,
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(11,58,36,.12)",
                  padding: 6,
                  zIndex: 41,
                  maxHeight: 280,
                  overflowY: "auto",
                }}
              >
                {monthKeys.map((k) => {
                  const active = k === mesKey;
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setMesKey(k);
                        setMenuOpen(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        background: active ? "#E6F0EA" : "transparent",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? T.green : T.textSec,
                        cursor: "pointer",
                      }}
                    >
                      {capitalize(monthLabel(k))}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Aviso de mês histórico ─────────────────────────────────────────── */}
      {!isCurrentMonth && (
        <div
          style={{
            background: T.warnBg,
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: T.warnText,
            fontWeight: 500,
          }}
        >
          Você está vendo um resumo de {mesLabelFull}. Os grupos detalhados mostram sempre o mês
          atual.
        </div>
      )}

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {isCurrentMonth && overBuckets.length > 0 && (
        <div
          style={{
            background: T.alertBg,
            border: `1px solid ${T.alertBorder}`,
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.alertIconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} color={T.alertIconText} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#8F2A18" }}>
              Atenção ao orçamento
            </div>
            {overBuckets.map((b) => {
              const excesso = b.gasto - b.orcamento;
              return (
                <div key={b.categoria} style={{ fontSize: 13, color: "#A8503F", marginTop: 2 }}>
                  {b.nome} passou em <strong>{privacy ? "R$ ••••" : fmtBRL(excesso)}</strong>.
                </div>
              );
            })}
          </div>
          <Link
            href="/calculadora"
            style={{
              background: "none",
              border: `1px solid ${T.alertBorder}`,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#A8503F",
              cursor: "pointer",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            Ajustar limites
          </Link>
        </div>
      )}

      {/* ── Hero: 3 bucket cards ───────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {buckets.map((b) => (
          <BucketCard key={b.categoria} bucket={b} privacy={privacy} />
        ))}
      </div>

      {/* ── Bottom block: transactions + right column ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 16 }}>
        {/* Transactions card */}
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px 12px",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
              Transações recentes
            </h3>
            <Link
              href="/gastos"
              style={{ fontSize: 12, fontWeight: 600, color: T.green, textDecoration: "none" }}
            >
              Ver todas →
            </Link>
          </div>

          {transacoes.length === 0 ? (
            <p
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontSize: 13,
                color: T.textMut,
              }}
            >
              Nenhum gasto registrado ainda.
            </p>
          ) : (
            <div>
              {transacoes.map((tx) => {
                const bkt = TX_BUCKET[tx.categoria];
                const initial = tx.nome.charAt(0).toUpperCase();
                return (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 20px",
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: bkt.bg,
                        color: bkt.cor,
                        fontWeight: 800,
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: T.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.nome}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            borderRadius: 999,
                            padding: "1px 7px",
                            fontSize: 10,
                            fontWeight: 600,
                            color: bkt.cor,
                            background: bkt.bg,
                          }}
                        >
                          {bkt.label}
                        </span>
                        <span style={{ fontSize: 11, color: T.textMut }}>
                          · {txDateLabel(tx.created_at)}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: T.alertText,
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                      }}
                    >
                      {privacy
                        ? "−R$ •••"
                        : `−R$ ${Number(tx.valor).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: metas + investimentos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Metas e fundos */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
                Metas e fundos
              </h3>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.green,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {privacy ? "R$ ••••" : fmtBRL(fundosTotal)}
              </span>
            </div>

            {fundosOrdenados.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMut, padding: "8px 0" }}>
                Nenhum fundo criado ainda.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {fundosOrdenados.map((fundo) => {
                  const pct = fundo.meta > 0 ? Math.min(fundo.saldo_atual / fundo.meta, 1) : 0;
                  const done = fundo.meta > 0 && fundo.saldo_atual >= fundo.meta;

                  return (
                    <div key={fundo.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: fundo.cor || T.greenMid,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: T.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fundo.nome}
                        </span>
                        <StatusPill
                          label={done ? "Atingida" : `${Math.round(pct * 100)}%`}
                          textColor={done ? T.green : T.textSec}
                          bgColor={done ? "#E3F4EA" : T.track}
                        />
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 5,
                          background: T.track,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct * 100}%`,
                            borderRadius: 5,
                            background: T.greenMid,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Investimentos */}
          {investidos.length > 0 && (
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
                  Investimentos
                </h3>
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: 999,
                    padding: "2px 9px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.green,
                    background: "#E6F0EA",
                  }}
                >
                  {investidos.length} {investidos.length === 1 ? "ativo" : "ativos"}
                </span>
              </div>

              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: T.text,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {privacy ? "R$ ••••" : fmtBRL(totalAplicado)}
              </div>
              <div style={{ fontSize: 12, color: T.textMut, marginTop: 2, marginBottom: 10 }}>
                total aplicado
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={15} color={T.green} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: T.textSec,
                  }}
                >
                  {investidos.length} {investidos.length === 1 ? "fundo aplicado" : "fundos aplicados"} com custódia
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
