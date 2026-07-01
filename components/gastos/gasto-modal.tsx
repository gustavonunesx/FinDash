"use client";

import { useState, useEffect, useRef } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
import { type GastoFormData } from "@/app/(app)/gastos/actions";
import { CATEGORIA_LABELS, type CategoriaGasto, type Gasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface GastoModalProps {
  open: boolean;
  onClose: () => void;
  editing: Gasto | null;
  onSubmit: (form: GastoFormData) => void;
  pending: boolean;
}

const emptyForm: GastoFormData = {
  nome: "",
  valor: 0,
  categoria: "necessidade",
  subcategoria: "",
  recorrente: false,
};

const CATEGORIA_EMOJI: Record<CategoriaGasto, string> = {
  necessidade: "🏠",
  objetivo: "🎯",
  qualidade: "✨",
};

const CATEGORIA_ICON_BG: Record<CategoriaGasto, string> = {
  necessidade: "#FCE8C9",
  objetivo: "#CDEFE3",
  qualidade: "#D9E6FE",
};

const CATEGORIA_BADGE_BG: Record<CategoriaGasto, string> = {
  necessidade: "#FBF3E2",
  objetivo: "#E3F6EF",
  qualidade: "#EAF1FE",
};

const CATEGORIA_BADGE_TEXT: Record<CategoriaGasto, string> = {
  necessidade: "#92620A",
  objetivo: "#0D7A5E",
  qualidade: "#1D4ED8",
};

export function GastoModal({ open, onClose, editing, onSubmit, pending }: GastoModalProps) {
  const [form, setForm] = useState<GastoFormData>(emptyForm);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync form when editing changes
  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome,
        valor: editing.valor,
        categoria: editing.categoria,
        subcategoria: editing.subcategoria ?? "",
        recorrente: editing.recorrente,
        dia_recorrencia: editing.dia_recorrencia ?? undefined,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
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
          maxWidth: 460,
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
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F1729", margin: 0 }}>
            {editing ? "Editar gasto" : "Novo gasto"}
          </h2>
          <button
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E6E8EC")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F7F8FA")}
          >
            <IconX style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Preview strip */}
        <div
          style={{
            background: "#F7F8FA",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: CATEGORIA_ICON_BG[form.categoria],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {CATEGORIA_EMOJI[form.categoria]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0F1729",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {form.nome || "Nome do gasto"}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: 3,
                padding: "1px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: CATEGORIA_BADGE_BG[form.categoria],
                color: CATEGORIA_BADGE_TEXT[form.categoria],
              }}
            >
              {CATEGORIA_LABELS[form.categoria]}
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 700,
              color: "#0F1729",
              flexShrink: 0,
            }}
          >
            {form.valor ? formatCurrency(form.valor) : "R$ 0,00"}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Nome */}
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputStyle}
                placeholder="Ex: Aluguel, Spotify, Academia"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label style={labelStyle}>Valor em R$</label>
              <input
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valor || ""}
                onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                style={selectStyle}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaGasto })}
              >
                <option value="necessidade">🏠 Necessidades</option>
                <option value="objetivo">🎯 Objetivos</option>
                <option value="qualidade">✨ Qualidade de vida</option>
              </select>
            </div>

            {/* Subcategoria */}
            <div>
              <label style={labelStyle}>
                Subcategoria{" "}
                <span style={{ color: "#9AA3AE", fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                style={inputStyle}
                placeholder="Ex: Mercado, Streaming, Lazer"
                value={form.subcategoria}
                onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
              />
            </div>

            {/* Recorrente toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #E6E8EC",
                background: "#FAFAFA",
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729", margin: 0 }}>
                  Recorrente
                </p>
                <p style={{ fontSize: 11, color: "#9AA3AE", margin: "2px 0 0" }}>
                  Repete mensalmente
                </p>
              </div>
              {/* Custom toggle */}
              <button
                type="button"
                onClick={() => setForm({ ...form, recorrente: !form.recorrente })}
                style={{
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: form.recorrente ? "#0E8F6A" : "#D1D5DB",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: form.recorrente ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Dia do mês (condicional) */}
            {form.recorrente && (
              <div>
                <label style={labelStyle}>Dia do mês</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 5"
                  value={form.dia_recorrencia ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dia_recorrencia: parseInt(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "0 24px 24px",
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
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F7F8FA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
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
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!pending) e.currentTarget.style.background = "#0D7A5E";
              }}
              onMouseLeave={(e) => {
                if (!pending) e.currentTarget.style.background = "#0E8F6A";
              }}
            >
              <IconCheck style={{ width: 15, height: 15 }} />
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Registrar gasto"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
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
  transition: "border-color 0.15s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237C8896' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 36,
};
