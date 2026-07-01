"use client";

import { useState } from "react";
import { IconDotsVertical, IconPencil, IconTrash, IconTrophy } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import type { Fundo } from "@/lib/types";

// Paleta de 3 cores ciclando
export const FUNDO_CORES = [
  {
    id: "#C4820A",
    bar: "#C4820A",
    bg: "#FBF3E2",
    text: "#92620A",
    iconBg: "#FCE8C9",
    btn: "#C4820A",
    btnHover: "#A86D08",
  },
  {
    id: "#2563EB",
    bar: "#2563EB",
    bg: "#EAF1FE",
    text: "#1D4ED8",
    iconBg: "#D9E6FE",
    btn: "#2563EB",
    btnHover: "#1D4ED8",
  },
  {
    id: "#0E8F6A",
    bar: "#0E8F6A",
    bg: "#E3F6EF",
    text: "#0D7A5E",
    iconBg: "#CDEFE3",
    btn: "#0E8F6A",
    btnHover: "#0D7A5E",
  },
] as const;

export function getFundoCor(cor: string, index: number) {
  const found = FUNDO_CORES.find((c) => c.id === cor);
  return found ?? FUNDO_CORES[index % FUNDO_CORES.length];
}

function estimativaMeses(saldo: number, meta: number, aporte: number): number | null {
  if (aporte <= 0 || saldo >= meta) return null;
  return Math.ceil((meta - saldo) / aporte);
}

function getFundoInitial(nome: string) {
  return nome.trim().charAt(0).toUpperCase();
}

interface FundoRowProps {
  fundo: Fundo;
  index: number;
  onAportar: (fundo: Fundo) => void;
  onEdit: (fundo: Fundo) => void;
  onDelete: (id: string) => void;
}

export function FundoRow({ fundo, index, onAportar, onEdit, onDelete }: FundoRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const cor = getFundoCor(fundo.cor, index);
  const pct = fundo.meta > 0 ? Math.min((fundo.saldo_atual / fundo.meta) * 100, 100) : 0;
  const meses = estimativaMeses(fundo.saldo_atual, fundo.meta, fundo.aporte_mensal);
  const metaAtingida = fundo.saldo_atual >= fundo.meta && fundo.meta > 0;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E8EC",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "relative",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Barra vertical colorida */}
      <div
        style={{
          width: 4,
          alignSelf: "stretch",
          borderRadius: 2,
          background: cor.bar,
          flexShrink: 0,
        }}
      />

      {/* Ícone circular */}
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
        {getFundoInitial(fundo.nome)}
      </div>

      {/* Nome + custódia — largura fixa */}
      <div style={{ width: 170, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F1729", lineHeight: 1.3 }}>
          {fundo.nome}
        </p>
        <p style={{ fontSize: 11, color: "#9AA3AE", marginTop: 2, lineHeight: 1.2 }}>
          {fundo.custodia?.instituicao ?? "Sem custódia"}
        </p>
      </div>

      {/* Barra de progresso + labels */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 600,
              color: cor.text,
            }}
          >
            {pct.toFixed(0)}%
          </span>
          {meses !== null && (
            <span style={{ fontSize: 11, color: "#9AA3AE" }}>~{meses} meses no ritmo atual</span>
          )}
          {metaAtingida && (
            <span style={{ fontSize: 11, color: "#0D7A5E" }}>Meta atingida 🎉</span>
          )}
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 999,
            background: "#F0F1F3",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              background: cor.bar,
              width: `${pct}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* Saldo + meta */}
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 110 }}>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 700,
            color: "#0F1729",
          }}
        >
          {formatCurrency(fundo.saldo_atual)}
        </p>
        <p style={{ fontSize: 11, color: "#9AA3AE", marginTop: 2 }}>
          meta {formatCurrency(fundo.meta)}
        </p>
      </div>

      {/* Badge meta ok */}
      {metaAtingida && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 9px",
            borderRadius: 999,
            background: "#E3F6EF",
            color: "#0D7A5E",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <IconTrophy style={{ width: 11, height: 11 }} />
          Meta ok
        </div>
      )}

      {/* Botão Aportar */}
      <button
        onClick={() => onAportar(fundo)}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          padding: "6px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          border: "none",
          background: btnHover ? cor.btnHover : cor.btn,
          color: "#fff",
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        Aportar
      </button>

      {/* Kebab menu */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
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
          <IconDotsVertical style={{ width: 16, height: 16 }} />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop invisível para fechar */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 10 }}
              onClick={() => setMenuOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 36,
                background: "#fff",
                border: "1px solid #E6E8EC",
                borderRadius: 10,
                padding: "4px",
                zIndex: 20,
                minWidth: 130,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); onEdit(fundo); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "#0F1729",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F7F8FA"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <IconPencil style={{ width: 14, height: 14, color: "#7C8896" }} />
                Editar
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(fundo.id); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "#D9232D",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <IconTrash style={{ width: 14, height: 14 }} />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
