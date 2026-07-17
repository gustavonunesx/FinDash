"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { marcarFundoReserva } from "@/app/(app)/fundos/actions";
import type { Fundo } from "@/lib/types";

interface LinhaFatiaExtraProps {
  cor: string;
  iconBg: string;
  label: string;
  valor: number;
  fundo: Fundo | null;
  isReserva?: boolean;
  todosFundos?: Fundo[];
  onAportar?: () => void;
}

export function LinhaFatiaExtra({
  cor,
  iconBg,
  label,
  valor,
  fundo,
  isReserva,
  todosFundos,
  onAportar,
}: LinhaFatiaExtraProps) {
  const [selecionando, setSelecionando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const useLivre = !fundo && !isReserva;
  const semReservaConfigurada = isReserva && !fundo;

  async function handleSelecionarReserva(fundoId: string) {
    setSalvando(true);
    await marcarFundoReserva(fundoId);
    setSelecionando(false);
    setSalvando(false);
  }

  return (
    <div style={{ padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: cor }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>{label}</p>
          <p style={{ fontSize: 12, color: "#7C8896", marginTop: 1 }}>
            {useLivre ? (
              <span style={{ color: "#9AA3AE", fontStyle: "italic" }}>Uso livre, sem aporte necessário</span>
            ) : semReservaConfigurada ? (
              <button
                type="button"
                onClick={() => setSelecionando((v) => !v)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#C4820A",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textDecorationStyle: "dashed",
                }}
              >
                Nenhum fundo de reserva configurado — clique para selecionar
              </button>
            ) : (
              <span>
                →{" "}
                <span style={{ color: "#0F1729", fontWeight: 600 }}>{fundo!.nome}</span>
                {isReserva && (
                  <button
                    type="button"
                    onClick={() => setSelecionando((v) => !v)}
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#9AA3AE",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    trocar
                  </button>
                )}
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
        {fundo && onAportar && (
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

      {/* Seletor de fundo de reserva */}
      {selecionando && todosFundos && todosFundos.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "12px 14px",
            background: "#FBF3E2",
            border: "1.5px solid #F3D68A",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "#7C5B0A", margin: 0 }}>
            Selecione o fundo de reserva de emergência:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {todosFundos.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={salvando}
                onClick={() => handleSelecionarReserva(f.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${f.reserva_emergencia ? "#C4820A" : "#E6E8EC"}`,
                  background: f.reserva_emergencia ? "#FEF3D7" : "#fff",
                  cursor: salvando ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0F1729",
                  textAlign: "left",
                  transition: "border-color 0.12s",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: f.cor,
                    flexShrink: 0,
                  }}
                />
                {f.nome}
                {f.reserva_emergencia && (
                  <span style={{ fontSize: 11, color: "#C4820A", marginLeft: "auto" }}>atual</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
