"use client";

import { useState } from "react";
import { IconPencil, IconPlus, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import type { Banco } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BancosCardProps {
  bancos: Banco[];
  /** Total de gastos ativos por banco, chaveado por `banco_id`. */
  gastosPorBanco: Record<string, number>;
  semBanco: number;
  onNovo: () => void;
  onEditar: (banco: Banco) => void;
  onExcluir: (id: string) => void;
  onSalvarSaldo: (id: string, saldo: number) => void;
}

export function BancosCard({
  bancos,
  gastosPorBanco,
  semBanco,
  onNovo,
  onEditar,
  onExcluir,
  onSalvarSaldo,
}: BancosCardProps) {
  const [editandoSaldo, setEditandoSaldo] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  const total = bancos.reduce((s, b) => s + b.saldo, 0);

  function abrirEdicao(banco: Banco) {
    setEditandoSaldo(banco.id);
    setRascunho(String(banco.saldo));
  }

  function confirmar(id: string) {
    const valor = parseFloat(rascunho);
    if (!Number.isNaN(valor) && valor >= 0) onSalvarSaldo(id, valor);
    setEditandoSaldo(null);
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E6E8EC",
        borderRadius: 14,
        padding: "20px 20px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>Meus bancos</p>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color: "#0E8F6A",
          }}
        >
          {formatCurrency(total)}
        </span>
      </div>
      <p style={{ fontSize: 11, color: "#9AA3AE", marginBottom: 14 }}>
        Saldo informado manualmente
      </p>

      {bancos.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: "#9AA3AE",
            textAlign: "center",
            padding: "12px 0 16px",
          }}
        >
          Nenhum banco cadastrado
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bancos.map((b) => {
            const gastoDoBanco = gastosPorBanco[b.id] ?? 0;
            const editando = editandoSaldo === b.id;

            return (
              <div
                key={b.id}
                className="group"
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: b.cor,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {b.nome[0]?.toUpperCase()}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#0F1729",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {b.nome}
                  </p>
                  <p style={{ fontSize: 11, color: "#9AA3AE" }}>
                    {gastoDoBanco > 0
                      ? `${formatCurrency(gastoDoBanco)} em gastos`
                      : "sem gastos vinculados"}
                  </p>
                </div>

                {editando ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      autoFocus
                      type="number"
                      step="0.01"
                      min="0"
                      value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmar(b.id);
                        if (e.key === "Escape") setEditandoSaldo(null);
                      }}
                      style={{
                        width: 84,
                        padding: "5px 7px",
                        borderRadius: 7,
                        border: "1.5px solid #0E8F6A",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "#0F1729",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => confirmar(b.id)}
                      aria-label="Salvar saldo"
                      style={iconBtn("#0E8F6A")}
                    >
                      <IconCheck style={{ width: 13, height: 13 }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoSaldo(null)}
                      aria-label="Cancelar"
                      style={iconBtn("#9AA3AE")}
                    >
                      <IconX style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(b)}
                      title="Editar saldo"
                      style={{
                        border: "none",
                        background: "none",
                        padding: "2px 4px",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0F1729",
                      }}
                    >
                      {formatCurrency(b.saldo)}
                    </button>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEditar(b)}
                        aria-label={`Editar ${b.nome}`}
                        style={iconBtn("#7C8896")}
                      >
                        <IconPencil style={{ width: 13, height: 13 }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onExcluir(b.id)}
                        aria-label={`Excluir ${b.nome}`}
                        style={iconBtn("#DC2626")}
                      >
                        <IconTrash style={{ width: 13, height: 13 }} />
                      </button>
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {semBanco > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                borderTop: "1px solid #F0F1F3",
                paddingTop: 10,
              }}
            >
              <span style={{ fontSize: 12, color: "#9AA3AE" }}>Sem banco definido</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#7C8896",
                }}
              >
                {formatCurrency(semBanco)}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onNovo}
        style={{
          marginTop: 14,
          width: "100%",
          padding: "8px 0",
          borderRadius: 9,
          border: "1.5px dashed #D8DCE2",
          background: "#fff",
          color: "#0E8F6A",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <IconPlus style={{ width: 13, height: 13 }} />
        Cadastrar banco
      </button>
    </div>
  );
}

function iconBtn(color: string): React.CSSProperties {
  return {
    border: "none",
    background: "none",
    padding: 3,
    cursor: "pointer",
    color,
    display: "inline-flex",
    alignItems: "center",
  };
}
