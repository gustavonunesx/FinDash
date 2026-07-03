"use client";

import { useState, useTransition } from "react";
import { IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { salvarSalario } from "@/app/(app)/calculadora/actions";
import { formatCurrency } from "@/lib/utils";

interface ModalEditarSalarioProps {
  open: boolean;
  salarioAtual: number;
  onClose: () => void;
  onSalvo: (novoSalario: number) => void;
}

export function ModalEditarSalario({
  open,
  salarioAtual,
  onClose,
  onSalvo,
}: ModalEditarSalarioProps) {
  const [valor, setValor] = useState(String(salarioAtual || ""));
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  function handleOpen() {
    setValor(String(salarioAtual || ""));
    setErro("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(valor);
    if (!num || num <= 0) {
      setErro("Informe um salário válido.");
      return;
    }
    setErro("");
    startTransition(async () => {
      const res = await salvarSalario(num);
      if (res.error) {
        setErro(res.error);
        return;
      }
      onSalvo(num);
      onClose();
    });
  }

  return (
    <AnimatePresence onExitComplete={handleOpen}>
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
                Editar salário base
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

            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
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
                    Salário líquido mensal (R$)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <span
                      style={{
                        padding: "10px 12px",
                        background: "#F7F8FA",
                        border: "1.5px solid #E6E8EC",
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#7C8896",
                      }}
                    >
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      autoFocus
                      value={valor}
                      onChange={(e) => { setValor(e.target.value); setErro(""); }}
                      placeholder="0,00"
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1.5px solid #E6E8EC",
                        borderRadius: "0 8px 8px 0",
                        background: "#F7F8FA",
                        fontSize: 16,
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "#0F1729",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {erro && (
                    <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{erro}</p>
                  )}
                </div>

                <div
                  style={{
                    background: "#F7F8FA",
                    border: "1px solid #E6E8EC",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: "#7C8896",
                    lineHeight: 1.5,
                  }}
                >
                  Os limites do 50/30/20 recalculam automaticamente ao salvar.
                  {salarioAtual > 0 && (
                    <span style={{ display: "block", marginTop: 4, color: "#9AA3AE" }}>
                      Valor atual: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#0F1729" }}>{formatCurrency(salarioAtual)}</span>
                    </span>
                  )}
                </div>
              </div>

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
                  type="submit"
                  disabled={pending}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: pending ? "#9AA3AE" : "#0E8F6A",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: pending ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {pending ? "Salvando..." : "✓ Salvar"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
