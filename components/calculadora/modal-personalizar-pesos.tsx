"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Peso {
  key: string;
  label: string;
  cor: string;
  valor: number;
}

interface ModalPersonalizarPesosProps {
  open: boolean;
  titulo: string;
  pesos: Peso[];
  onClose: () => void;
  onSalvar: (pesos: Peso[]) => void;
}

export function ModalPersonalizarPesos({
  open,
  titulo,
  pesos: pesosIniciais,
  onClose,
  onSalvar,
}: ModalPersonalizarPesosProps) {
  const [pesos, setPesos] = useState<Peso[]>(pesosIniciais);

  const total = pesos.reduce((s, p) => s + p.valor, 0);
  const valido = Math.abs(total - 100) < 0.01;

  function updatePeso(key: string, valor: number) {
    setPesos((prev) => prev.map((p) => (p.key === key ? { ...p, valor } : p)));
  }

  function handleSalvar() {
    if (!valido) return;
    onSalvar(pesos);
    onClose();
  }

  function handleClose() {
    setPesos(pesosIniciais);
    onClose();
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
            onClick={handleClose}
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
              width: 440,
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
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#0F1729" }}>
                  Personalizar pesos
                </p>
                <p style={{ fontSize: 12, color: "#7C8896", marginTop: 2 }}>{titulo}</p>
              </div>
              <button
                onClick={handleClose}
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

            {/* Pesos */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {pesos.map((p) => (
                <div key={p.key}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: p.cor,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>
                        {p.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: p.cor,
                        minWidth: 40,
                        textAlign: "right",
                      }}
                    >
                      {p.valor}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={p.valor}
                    onChange={(e) => updatePeso(p.key, Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: p.cor,
                      height: 4,
                      cursor: "pointer",
                    }}
                  />
                </div>
              ))}

              {/* Rodapé de validação */}
              <div
                style={{
                  background: valido ? "#E3F6EF" : "#FEF2F2",
                  border: `1px solid ${valido ? "#CDEFE3" : "#FECACA"}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 12, color: valido ? "#0D7A5E" : "#DC2626", fontWeight: 600 }}>
                  {valido ? "✓ Soma correta" : "⚠ A soma deve ser 100%"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: valido ? "#0D7A5E" : "#DC2626",
                  }}
                >
                  {total}%
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, padding: "0 24px 22px" }}>
              <button
                type="button"
                onClick={handleClose}
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
                disabled={!valido}
                onClick={handleSalvar}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  background: valido ? "#0E8F6A" : "#9AA3AE",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: valido ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                ✓ Salvar pesos
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
