"use client";

import { IconCheck } from "@tabler/icons-react";
import { CATEGORIA_LABELS, type CategoriaGasto, type Gasto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const CATEGORIA_COR: Record<CategoriaGasto, string> = {
  necessidade: "#C4820A",
  objetivo: "#0E8F6A",
  qualidade: "#2563EB",
};

const CATEGORIAS: CategoriaGasto[] = ["necessidade", "objetivo", "qualidade"];

interface RevisaoImportadosProps {
  /** Gastos vindos do banco que ainda aguardam confirmação do bucket. */
  pendentes: Gasto[];
  onConfirmar: (id: string, categoria: CategoriaGasto) => void;
  onConfirmarTodos: () => void;
  pending: boolean;
}

export function RevisaoImportados({
  pendentes,
  onConfirmar,
  onConfirmarTodos,
  pending,
}: RevisaoImportadosProps) {
  if (pendentes.length === 0) return null;

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
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F1729" }}>Revisar importados</p>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color: "#C4820A",
          }}
        >
          {pendentes.length}
        </span>
      </div>
      <p style={{ fontSize: 11, color: "#9AA3AE", marginBottom: 14 }}>
        Confirme a categoria — só depois disso eles entram no 50/30/20
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 320, overflowY: "auto" }}>
        {pendentes.map((g) => (
          <div key={g.id}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <p
                title={g.nome}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0F1729",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {g.nome}
              </p>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0F1729",
                  flexShrink: 0,
                }}
              >
                {formatCurrency(g.valor)}
              </span>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              {CATEGORIAS.map((cat) => {
                const sugerida = g.categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={pending}
                    onClick={() => onConfirmar(g.id, cat)}
                    title={sugerida ? "Sugestão do banco" : undefined}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      borderRadius: 7,
                      border: sugerida
                        ? `1.5px solid ${CATEGORIA_COR[cat]}`
                        : "1px solid #E6E8EC",
                      background: sugerida ? `${CATEGORIA_COR[cat]}14` : "#fff",
                      color: sugerida ? CATEGORIA_COR[cat] : "#7C8896",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: pending ? "default" : "pointer",
                      opacity: pending ? 0.6 : 1,
                    }}
                  >
                    {CATEGORIA_LABELS[cat].split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={onConfirmarTodos}
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
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <IconCheck style={{ width: 13, height: 13 }} />
        Aceitar todas as sugestões
      </button>
    </div>
  );
}
