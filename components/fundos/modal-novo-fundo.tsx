"use client";

import { useEffect, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { FUNDO_CORES } from "./fundo-row";
import type { FundoFormData } from "@/app/(app)/fundos/actions";
import type { Fundo } from "@/lib/types";

const COR_OPCOES = FUNDO_CORES.map((c) => c.id);

const emptyForm: FundoFormData = {
  nome: "",
  saldo_atual: 0,
  meta: 0,
  aporte_mensal: 0,
  cor: COR_OPCOES[2], // verde por padrão
  meta_data: undefined,
  custodia: undefined,
};

interface ModalNovoFundoProps {
  open: boolean;
  onClose: () => void;
  editing: Fundo | null;
  onSubmit: (data: FundoFormData) => void;
  pending: boolean;
}

export function ModalNovoFundo({ open, onClose, editing, onSubmit, pending }: ModalNovoFundoProps) {
  const [form, setForm] = useState<FundoFormData>(emptyForm);
  const [semData, setSemData] = useState(true);

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome,
        saldo_atual: editing.saldo_atual,
        meta: editing.meta,
        aporte_mensal: editing.aporte_mensal,
        cor: editing.cor,
        meta_data: editing.meta_data ?? undefined,
        custodia: editing.custodia ?? undefined,
      });
      setSemData(!editing.meta_data);
    } else {
      setForm(emptyForm);
      setSemData(true);
    }
  }, [editing, open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ ...form, meta_data: semData ? undefined : form.meta_data });
  }

  const corSelecionada = FUNDO_CORES.find((c) => c.id === form.cor) ?? FUNDO_CORES[2];

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
          width: 460,
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
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0F1729" }}>
              {editing ? "Editar fundo" : "Novo fundo"}
            </p>
            <p style={{ fontSize: 12, color: "#9AA3AE", marginTop: 2 }}>
              {editing ? "Atualize os dados do fundo" : "Defina sua meta e comece a investir"}
            </p>
          </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Nome */}
            <div>
              <label style={labelStyle}>Nome do fundo</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Reserva de emergência"
                required
                style={inputStyle}
              />
            </div>

            {/* Meta + Aporte mensal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Meta (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.meta || ""}
                  onChange={(e) => setForm({ ...form, meta: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Aporte mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.aporte_mensal || ""}
                  onChange={(e) => setForm({ ...form, aporte_mensal: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
                />
              </div>
            </div>

            {/* Saldo atual (só na criação faz sentido preencher) */}
            <div>
              <label style={labelStyle}>Saldo atual (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.saldo_atual || ""}
                onChange={(e) => setForm({ ...form, saldo_atual: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </div>

            {/* Data da meta */}
            <div>
              <label style={labelStyle}>Data da meta</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#7C8896" }}>
                  <input
                    type="checkbox"
                    checked={semData}
                    onChange={(e) => setSemData(e.target.checked)}
                    style={{ accentColor: "#0E8F6A" }}
                  />
                  Sem data definida
                </label>
                {!semData && (
                  <input
                    type="date"
                    value={form.meta_data ?? ""}
                    onChange={(e) => setForm({ ...form, meta_data: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                )}
              </div>
            </div>

            {/* Custódia */}
            <div>
              <label style={labelStyle}>Custódia (instituição)</label>
              <input
                value={form.custodia?.instituicao ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    custodia: e.target.value
                      ? {
                          instituicao: e.target.value,
                          tipo: form.custodia?.tipo ?? "cdi",
                          taxa: form.custodia?.taxa ?? 100,
                          data_inicio: form.custodia?.data_inicio ?? new Date().toISOString().split("T")[0],
                          aporte_inicial: form.custodia?.aporte_inicial ?? 0,
                        }
                      : undefined,
                  })
                }
                placeholder="Ex: Nubank, Inter, XP..."
                style={inputStyle}
              />
            </div>

            {/* Seletor de cor */}
            <div>
              <label style={labelStyle}>Cor do fundo</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {FUNDO_CORES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, cor: c.id })}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c.bar,
                      border: form.cor === c.id ? `3px solid ${c.bar}` : "3px solid transparent",
                      outline: form.cor === c.id ? `2px solid ${c.bar}` : "2px solid transparent",
                      outlineOffset: 2,
                      cursor: "pointer",
                      transition: "outline 0.1s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "0 24px 22px",
            }}
          >
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
                background: pending ? "#9AA3AE" : corSelecionada.bar,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: pending ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {pending ? "Salvando..." : editing ? "✓ Salvar fundo" : "✓ Criar fundo"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#7C8896",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #E6E8EC",
  background: "#F7F8FA",
  fontSize: 13,
  color: "#0F1729",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
