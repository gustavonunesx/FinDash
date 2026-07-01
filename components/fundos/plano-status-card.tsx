import Link from "next/link";
import { LIMITES_FREE, type Plano } from "@/lib/types";

interface PlanoStatusCardProps {
  plano: Plano;
  usado: number;
}

export function PlanoStatusCard({ plano, usado }: PlanoStatusCardProps) {
  // Só renderiza para usuários Free que atingiram o limite
  if (plano !== "free" || usado < LIMITES_FREE.fundos) return null;

  const limite = LIMITES_FREE.fundos;
  const pct = Math.min((usado / limite) * 100, 100);

  return (
    <div
      style={{
        background: "#FBF3E2",
        border: "1px solid #F1DDB0",
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#92620A" }}>Plano Free</p>
      </div>

      <p style={{ fontSize: 12, color: "#92620A", marginBottom: 10 }}>
        {usado} de {limite} fundos utilizados
      </p>

      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: "#F1DDB0",
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 999,
            background: "#C4820A",
            width: `${pct}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      <Link
        href="/precos"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#92620A",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Fazer upgrade para Premium →
      </Link>
    </div>
  );
}
