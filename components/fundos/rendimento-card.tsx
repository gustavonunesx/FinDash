import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

interface RendimentoCardProps {
  fundos: Fundo[];
  cdi: number; // taxa anual, ex: 0.1065
}

export function RendimentoCard({ fundos, cdi }: RendimentoCardProps) {
  const totalSaldo = fundos.reduce((s, f) => s + f.saldo_atual, 0);
  // Rendimento mensal estimado = saldo × (CDI anual / 12)
  const rendimentoMensal = totalSaldo * (cdi / 12);

  return (
    <div
      style={{
        background: "#0E8F6A",
        borderRadius: 14,
        padding: "20px",
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.75)",
          marginBottom: 8,
        }}
      >
        Rendimento estimado do mês
      </p>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.1,
          marginBottom: 10,
        }}
      >
        +{formatCurrency(rendimentoMensal)}
      </p>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.65)",
          lineHeight: 1.5,
        }}
      >
        CDI {(cdi * 100).toFixed(2)}% a.a. sobre o saldo atual de {formatCurrency(totalSaldo)}
      </p>
    </div>
  );
}
