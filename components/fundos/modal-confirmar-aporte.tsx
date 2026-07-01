"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { getFundoCor } from "./fundo-row";
import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

interface ModalConfirmarAporteProps {
  open: boolean;
  fundo: Fundo | null;
  fundoIndex: number;
  onClose: () => void;
  onConfirmar: (fundoId: string, valor: number) => void;
  pending: boolean;
}

export function ModalConfirmarAporte({
  open,
  fundo,
  fundoIndex,
  onClose,
  onConfirmar,
  pending,
}: ModalConfirmarAporteProps) {
  const [valor, setValor] = useState("");

  if (!open || !fundo) return null;

  const cor = getFundoCor(fundo.cor, fundoIndex);
  const valorNum = parseFloat(valor) || 0;
  const novoSaldo = fundo.saldo_atual + valorNum;
  const metaAtingida = fundo.meta > 0 && novoSaldo >= fundo.meta;

  const atalhos = [
    { label: formatCurrency(fundo.aporte_mensal), value: fundo.aporte_mensal, hint: "mensal" },
    { label: "+ R$ 50", value: 50, hint: null },
    { label: "+ R$ 100", value: 100, hint: null },
  ].filter((a) => a.value > 0);

  function handleConfirmar(e: React.FormEvent) {
    e.preventDefault();
    if (valorNum <= 0) return;
    onConfirmar(fundo!.id, valorNum);
    setValor("");
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,14,20,0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#FFFFFF",
          borderRadius: 18,
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          zIndex: 101,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 24px 0",
          }}
        >
          <p style={{ fontSize: 17, fontWeight: 700, color: "#0F1729" }}>Confirmar aporte</p>
          <button
            onClick={() => { onClose(); setValor(""); }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #E6E8EC",
              background: "#F7F8FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#7C8896",
            }}
          >
            <IconX style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <form onSubmit={handleConfirmar}>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Faixa cinza com info do fundo */}
            <div
              style={{
                background: "#F7F8FA",
                border: "1px solid #E6E8EC",
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: cor.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: cor.text,
                  flexShrink: 0,
                }}
              >
                {fundo.nome.trim().charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>{fundo.nome}</p>
                <p style={{ fontSize: 12, color: "#9AA3AE", marginTop: 1 }}>
                  Saldo atual:{" "}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    {formatCurrency(fundo.saldo_atual)}
                  </span>
                </p>
              </div>
            </div>

            {/* Campo de valor */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#7C8896",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Valor do aporte (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${valor ? cor.bar : "#E6E8EC"}`,
                  background: "#F7F8FA",
                  fontSize: 16,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  color: "#0F1729",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            {/* Atalhos rápidos */}
            {atalhos.length > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                {atalhos.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setValor(String(a.value))}
                    style={{
                      flex: 1,
                      padding: "7px 4px",
                      borderRadius: 8,
                      border: `1px solid ${cor.bar}`,
                      background: valor === String(a.value) ? cor.bg : "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      color: cor.text,
                      cursor: "pointer",
                      transition: "background 0.1s",
                      lineHeight: 1.3,
                    }}
                  >
                    {a.label}
                    {a.hint && (
                      <span
                        style={{ display: "block", fontSize: 10, fontWeight: 400, color: "#9AA3AE" }}
                      >
                        {a.hint}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Preview do novo saldo */}
            {valorNum > 0 && (
              <div
                style={{
                  background: metaAtingida ? "#E3F6EF" : "#F7F8FA",
                  border: `1px solid ${metaAtingida ? "#CDEFE3" : "#E6E8EC"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: metaAtingida ? "#0D7A5E" : "#7C8896" }}>
                  {metaAtingida ? "🎉 Você atingirá a meta!" : "Novo saldo"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: metaAtingida ? "#0D7A5E" : "#0F1729",
                  }}
                >
                  {formatCurrency(novoSaldo)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: 10, padding: "0 24px 22px" }}>
            <button
              type="button"
              onClick={() => { onClose(); setValor(""); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "1px solid #E6E8EC",
                background: "#fff",
                fontSize: 14,
                fontWeight: 600,
                color: "#0F1729",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || valorNum <= 0}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: pending || valorNum <= 0 ? "#9AA3AE" : cor.bar,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: pending || valorNum <= 0 ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {pending ? "Confirmando..." : "✓ Confirmar aporte"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
