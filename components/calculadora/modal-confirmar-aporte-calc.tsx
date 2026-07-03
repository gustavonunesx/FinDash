"use client";

import { IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

export interface FatiaAporte {
  label: string;
  cor: string;
  iconBg: string;
  valor: number;
  fundo: Fundo;
}

interface ModalConfirmarAporteCalcProps {
  open: boolean;
  fatia: FatiaAporte | null;
  pending: boolean;
  onClose: () => void;
  onConfirmar: (fundoId: string, valor: number) => void;
}

export function ModalConfirmarAporteCalc({
  open,
  fatia,
  pending,
  onClose,
  onConfirmar,
}: ModalConfirmarAporteCalcProps) {
  if (!open || !fatia) return null;

  function handleConfirmar() {
    if (!fatia) return;
    onConfirmar(fatia.fundo.id, fatia.valor);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,14,20,0.55)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#FFFFFF",
              borderRadius: 18,
              width: 400,
              maxWidth: "calc(100vw - 32px)",
              zIndex: 101,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
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
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0F1729" }}>
                Confirmar aporte
              </p>
              <button
                onClick={onClose}
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

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Faixa fatia → fundo */}
              <div
                style={{
                  background: "#F7F8FA",
                  border: "1px solid #E6E8EC",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Fatia */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: fatia.iconBg,
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
                        background: fatia.cor,
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#9AA3AE", fontWeight: 500 }}>Fatia</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>{fatia.label}</p>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: fatia.cor,
                    }}
                  >
                    {formatCurrency(fatia.valor)}
                  </span>
                </div>

                {/* Seta */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 4,
                  }}
                >
                  <div style={{ width: 24, borderTop: "1px dashed #D1D5DB" }} />
                  <span style={{ fontSize: 11, color: "#9AA3AE" }}>destino</span>
                  <div style={{ flex: 1, borderTop: "1px dashed #D1D5DB" }} />
                </div>

                {/* Fundo de destino */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: fatia.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: fatia.cor,
                      flexShrink: 0,
                    }}
                  >
                    {fatia.fundo.nome.trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#9AA3AE", fontWeight: 500 }}>Fundo</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729" }}>{fatia.fundo.nome}</p>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "#9AA3AE",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    saldo atual: {formatCurrency(fatia.fundo.saldo_atual)}
                  </span>
                </div>
              </div>

              {/* Preview novo saldo */}
              <div
                style={{
                  background: "#F7F8FA",
                  border: "1px solid #E6E8EC",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "#7C8896" }}>Novo saldo após aporte</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0F1729",
                  }}
                >
                  {formatCurrency(fatia.fundo.saldo_atual + fatia.valor)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, padding: "0 24px 22px" }}>
              <button
                type="button"
                onClick={onClose}
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
                type="button"
                disabled={pending}
                onClick={handleConfirmar}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: pending ? "#9AA3AE" : fatia.cor,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: pending ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {pending ? "Confirmando..." : "✓ Confirmar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
