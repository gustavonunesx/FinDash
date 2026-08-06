"use client";

import { useState, useEffect, useRef } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
import { type BancoFormData } from "@/app/(app)/bancos/actions";
import { BANCO_CORES, type Banco } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BancoModalProps {
  open: boolean;
  onClose: () => void;
  editing: Banco | null;
  onSubmit: (form: BancoFormData) => void;
  pending: boolean;
}

const emptyForm: BancoFormData = {
  nome: "",
  saldo: 0,
  cor: BANCO_CORES[0],
};

const SUGESTOES = ["Inter", "Nubank", "Itaú", "Bradesco", "Caixa", "Santander", "BB", "C6"];

export function BancoModal({ open, onClose, editing, onSubmit, pending }: BancoModalProps) {
  const [form, setForm] = useState<BancoFormData>(emptyForm);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) {
      setForm({ nome: editing.nome, saldo: editing.saldo, cor: editing.cor });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  const cor = form.cor ?? BANCO_CORES[0];

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10,14,20,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          borderRadius: 18,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
          overflow: "hidden",
          animation: "modalIn 0.18s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #F0F1F3",
            flexShrink: 0,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F1729", margin: 0 }}>
            {editing ? "Editar banco" : "Novo banco"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "#F7F8FA",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7C8896",
            }}
          >
            <IconX style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Preview */}
        <div
          style={{
            background: "#F7F8FA",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: cor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(form.nome.trim()[0] ?? "?").toUpperCase()}
          </span>
          <p
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#0F1729",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {form.nome || "Nome do banco"}
          </p>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 700,
              color: "#0F1729",
              flexShrink: 0,
            }}
          >
            {formatCurrency(form.saldo || 0)}
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputStyle}
                placeholder="Ex: Inter, Nubank, Itaú"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, nome: s })}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      border:
                        form.nome === s ? "1.5px solid #0E8F6A" : "1.5px solid #E6E8EC",
                      background: form.nome === s ? "#E3F6EF" : "#fff",
                      color: form.nome === s ? "#0D7A5E" : "#7C8896",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Saldo em conta (R$)</label>
              <input
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.saldo || ""}
                onChange={(e) =>
                  setForm({ ...form, saldo: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p style={{ fontSize: 11, color: "#9AA3AE", margin: "6px 0 0" }}>
                Valor informado manualmente. Com o Open Finance, será sincronizado
                automaticamente.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Cor</label>
              <div style={{ display: "flex", gap: 8 }}>
                {BANCO_CORES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Cor ${c}`}
                    onClick={() => setForm({ ...form, cor: c })}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: c,
                      cursor: "pointer",
                      border: cor === c ? "2.5px solid #0F1729" : "2.5px solid transparent",
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 24px 20px",
              borderTop: "1px solid #F0F1F3",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                border: "1.5px solid #E6E8EC",
                background: "#fff",
                color: "#0F1729",
                fontSize: 13,
                fontWeight: 600,
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
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: pending ? "#7BC4AE" : "#0E8F6A",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: pending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <IconCheck style={{ width: 15, height: 15 }} />
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar banco"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#7C8896",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid #E6E8EC",
  background: "#fff",
  fontSize: 13,
  color: "#0F1729",
  outline: "none",
  boxSizing: "border-box",
};
