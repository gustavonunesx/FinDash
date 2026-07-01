import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

interface ResumoGeralCardProps {
  fundos: Fundo[];
}

export function ResumoGeralCard({ fundos }: ResumoGeralCardProps) {
  const totalSaldo = fundos.reduce((s, f) => s + f.saldo_atual, 0);
  const totalMeta = fundos.reduce((s, f) => s + f.meta, 0);
  const pct = totalMeta > 0 ? Math.min((totalSaldo / totalMeta) * 100, 100) : 0;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E8EC",
        borderRadius: 14,
        padding: "20px",
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729", marginBottom: 14 }}>
        Resumo geral
      </p>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          fontWeight: 700,
          color: "#0F1729",
          lineHeight: 1.1,
          marginBottom: 2,
        }}
      >
        {formatCurrency(totalSaldo)}
      </p>
      <p style={{ fontSize: 12, color: "#9AA3AE", marginBottom: 14 }}>
        de {formatCurrency(totalMeta)} em metas
      </p>

      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#F0F1F3",
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 999,
            background: "#0E8F6A",
            width: `${pct}%`,
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#9AA3AE" }}>
          {fundos.length} {fundos.length === 1 ? "fundo ativo" : "fundos ativos"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
            color: "#0E8F6A",
          }}
        >
          {pct.toFixed(0)}% do total
        </span>
      </div>
    </div>
  );
}
