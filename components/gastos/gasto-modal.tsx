"use client";

import { useState, useEffect, useRef } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
import { type GastoFormData } from "@/app/(app)/gastos/actions";
import {
  formatMesCurto,
  mesAtualInput,
  mesInputValue,
  mesParaDate,
  parcelaInfo,
} from "@/lib/parcelamento";
import { CATEGORIA_LABELS, type Banco, type CategoriaGasto, type Gasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type TipoGasto = "unico" | "recorrente" | "parcelado";

const TIPO_LABEL: Record<TipoGasto, string> = {
  unico: "Único",
  recorrente: "Recorrente",
  parcelado: "Parcelado",
};

const PARCELAS_RAPIDAS = [2, 3, 6, 10, 12, 18, 24];

interface GastoModalProps {
  open: boolean;
  onClose: () => void;
  editing: Gasto | null;
  onSubmit: (form: GastoFormData) => void;
  pending: boolean;
  bancos: Banco[];
  onNovoBanco: () => void;
}

const emptyForm: GastoFormData = {
  nome: "",
  valor: 0,
  categoria: "necessidade",
  subcategoria: "",
  recorrente: false,
  banco_id: null,
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

export function GastoModal({
  open,
  onClose,
  editing,
  onSubmit,
  pending,
  bancos,
  onNovoBanco,
}: GastoModalProps) {
  const [form, setForm] = useState<GastoFormData>(emptyForm);
  const [tipo, setTipo] = useState<TipoGasto>("unico");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync form when editing changes
  useEffect(() => {
    if (editing) {
      const parcelado = (editing.parcelas_total ?? 0) > 1;
      setForm({
        nome: editing.nome,
        valor: editing.valor,
        categoria: editing.categoria,
        subcategoria: editing.subcategoria ?? "",
        recorrente: editing.recorrente,
        dia_recorrencia: editing.dia_recorrencia ?? undefined,
        parcelas_total: parcelado ? editing.parcelas_total! : undefined,
        parcela_inicio: editing.parcela_inicio ?? undefined,
        banco_id: editing.banco_id,
      });
      setTipo(parcelado ? "parcelado" : editing.recorrente ? "recorrente" : "unico");
    } else {
      setForm(emptyForm);
      setTipo("unico");
    }
  }, [editing, open]);

  function selecionarTipo(next: TipoGasto) {
    setTipo(next);
    setForm((f) => ({
      ...f,
      recorrente: next === "recorrente",
      dia_recorrencia: next === "recorrente" ? f.dia_recorrencia : undefined,
      parcelas_total: next === "parcelado" ? (f.parcelas_total ?? 12) : undefined,
      parcela_inicio:
        next === "parcelado"
          ? (f.parcela_inicio ?? mesParaDate(mesAtualInput()))
          : undefined,
    }));
  }

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

  const parcelasTotal = form.parcelas_total ?? 0;
  const preview =
    tipo === "parcelado" && parcelasTotal > 1
      ? parcelaInfo({
          valor: form.valor,
          parcelas_total: parcelasTotal,
          parcela_inicio: form.parcela_inicio ?? null,
          created_at: new Date().toISOString(),
        } as Gasto)
      : null;

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
            flexShrink: 0,
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
            {preview && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 3,
                  marginLeft: 5,
                  padding: "1px 8px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  background: "#EEF0F3",
                  color: "#5A6673",
                }}
              >
                {preview.total}x
              </span>
            )}
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
              <label style={labelStyle}>
                {tipo === "parcelado" ? "Valor da parcela em R$" : "Valor em R$"}
              </label>
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

            {/* Banco */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <label style={labelStyle}>Banco</label>
                <button
                  type="button"
                  onClick={onNovoBanco}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    marginBottom: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#0E8F6A",
                    cursor: "pointer",
                  }}
                >
                  + Cadastrar banco
                </button>
              </div>
              {bancos.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9AA3AE", margin: 0 }}>
                  Nenhum banco cadastrado ainda.
                </p>
              ) : (
                <select
                  style={selectStyle}
                  value={form.banco_id ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, banco_id: e.target.value || null })
                  }
                >
                  <option value="">Não informado</option>
                  {bancos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tipo: único / recorrente / parcelado */}
            <div>
              <label style={labelStyle}>Tipo de cobrança</label>
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  padding: 3,
                  borderRadius: 10,
                  background: "#F0F1F3",
                }}
              >
                {(["unico", "recorrente", "parcelado"] as TipoGasto[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => selecionarTipo(t)}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.15s",
                      background: tipo === t ? "#FFFFFF" : "transparent",
                      color: tipo === t ? "#0F1729" : "#7C8896",
                      boxShadow: tipo === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                    }}
                  >
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#9AA3AE", margin: "6px 0 0" }}>
                {tipo === "unico" && "Cobrado uma vez neste mês."}
                {tipo === "recorrente" && "Repete todo mês, sem data de fim."}
                {tipo === "parcelado" && "Compra no cartão dividida em parcelas fixas."}
              </p>
            </div>

            {/* Dia do mês (recorrente) */}
            {tipo === "recorrente" && (
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

            {/* Parcelamento */}
            {tipo === "parcelado" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid #E6E8EC",
                  background: "#FAFAFA",
                }}
              >
                <div>
                  <label style={labelStyle}>Número de parcelas</label>
                  <input
                    style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                    type="number"
                    min="2"
                    max="72"
                    placeholder="Ex: 12"
                    value={form.parcelas_total ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        parcelas_total: parseInt(e.target.value) || undefined,
                      })
                    }
                    required
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {PARCELAS_RAPIDAS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm({ ...form, parcelas_total: n })}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "var(--font-mono)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border:
                            parcelasTotal === n ? "1.5px solid #0E8F6A" : "1.5px solid #E6E8EC",
                          background: parcelasTotal === n ? "#E3F6EF" : "#fff",
                          color: parcelasTotal === n ? "#0D7A5E" : "#7C8896",
                        }}
                      >
                        {n}x
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Mês da 1ª parcela</label>
                  <input
                    style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                    type="month"
                    value={mesInputValue(form.parcela_inicio)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        parcela_inicio: e.target.value
                          ? mesParaDate(e.target.value)
                          : undefined,
                      })
                    }
                    required
                  />
                </div>

                {preview && (
                  <div
                    style={{
                      borderTop: "1px solid #E6E8EC",
                      paddingTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#7C8896" }}>Total da compra</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0F1729",
                        }}
                      >
                        {formatCurrency(preview.valorTotal)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#7C8896" }}>Situação hoje</span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: preview.quitado ? "#9AA3AE" : "#0D7A5E",
                        }}
                      >
                        {preview.futuro
                          ? `inicia em ${formatMesCurto(preview.inicio!)}`
                          : preview.quitado
                            ? "quitado"
                            : `parcela ${preview.atual}/${preview.total} · faltam ${preview.restantes}`}
                      </span>
                    </div>
                    {!preview.quitado && !preview.futuro && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#7C8896" }}>
                          Termina em {formatMesCurto(preview.fim!)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#7C8896",
                          }}
                        >
                          restam {formatCurrency(preview.valorRestante)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 24px 20px",
              borderTop: "1px solid #F0F1F3",
              background: "#FFFFFF",
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
