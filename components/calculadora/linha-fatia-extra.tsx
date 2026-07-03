"use client";

import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

interface LinhaFatiaExtraProps {
  cor: string;
  iconBg: string;
  label: string;
  valor: number;
  fundo: Fundo | null;
  onAportar?: () => void;
}

export function LinhaFatiaExtra({
  cor,
  iconBg,
  label,
  valor,
  fundo,
  onAportar,
}: LinhaFatiaExtraProps) {
  const useLivre = !fundo;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
      }}
    >
      {/* Ícone colorido */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: cor,
          }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>{label}</p>
        <p style={{ fontSize: 12, color: "#7C8896", marginTop: 1 }}>
          {useLivre ? (
            <span style={{ color: "#9AA3AE", fontStyle: "italic" }}>
              Uso livre, sem aporte necessário
            </span>
          ) : (
            <span>
              →{" "}
              <span style={{ color: "#0F1729", fontWeight: 600 }}>{fundo!.nome}</span>
            </span>
          )}
        </p>
      </div>

      {/* Valor */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          fontWeight: 700,
          color: "#0F1729",
          flexShrink: 0,
        }}
      >
        {formatCurrency(valor)}
      </span>

      {/* Botão Aportar */}
      {!useLivre && onAportar && (
        <button
          type="button"
          onClick={onAportar}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: `1.5px solid ${cor}`,
            background: "transparent",
            fontSize: 12,
            fontWeight: 700,
            color: cor,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.12s, color 0.12s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = cor;
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = cor;
          }}
        >
          Aportar
        </button>
      )}
    </div>
  );
}
