"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { FundoRow } from "./fundo-row";
import { ModalNovoFundo } from "./modal-novo-fundo";
import { ModalConfirmarAporte } from "./modal-confirmar-aporte";
import { ResumoGeralCard } from "./resumo-geral-card";
import { RendimentoCard } from "./rendimento-card";
import { PlanoStatusCard } from "./plano-status-card";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import {
  criarFundo,
  editarFundo,
  deletarFundo,
  confirmarAporte,
  type FundoFormData,
} from "@/app/(app)/fundos/actions";
import { LIMITES_FREE, type Fundo, type Plano } from "@/lib/types";

interface FundosClientProps {
  fundos: Fundo[];
  plano: Plano;
  cdi: number;
}

export function FundosClient({ fundos, plano, cdi }: FundosClientProps) {
  const [modalFundoOpen, setModalFundoOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [editing, setEditing] = useState<Fundo | null>(null);

  // Modal de aporte
  const [aporteOpen, setAporteOpen] = useState(false);
  const [aporteAlvo, setAporteAlvo] = useState<{ fundo: Fundo; index: number } | null>(null);

  const [pending, startTransition] = useTransition();

  function openCreate() {
    if (plano === "free" && fundos.length >= LIMITES_FREE.fundos) {
      setUpgradeOpen(true);
      return;
    }
    setEditing(null);
    setModalFundoOpen(true);
  }

  function openEdit(fundo: Fundo) {
    setEditing(fundo);
    setModalFundoOpen(true);
  }

  function openAporte(fundo: Fundo, index: number) {
    setAporteAlvo({ fundo, index });
    setAporteOpen(true);
  }

  function handleFundoSubmit(data: FundoFormData) {
    startTransition(async () => {
      const result = editing
        ? await editarFundo(editing.id, data)
        : await criarFundo(data);

      if (result.error) {
        if (result.error.includes("Limite")) setUpgradeOpen(true);
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Fundo atualizado" : "Fundo criado");
      setModalFundoOpen(false);
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletarFundo(id);
      if (result.error) toast.error(result.error);
      else toast.success("Fundo removido");
    });
  }

  function handleConfirmarAporte(fundoId: string, valor: number) {
    startTransition(async () => {
      const result = await confirmarAporte(fundoId, valor);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.metaAtingida) {
        toast.success(`🎉 Meta do fundo "${result.fundoNome}" atingida!`, {
          duration: 5000,
        });
      } else {
        toast.success("Aporte confirmado!");
      }
      setAporteOpen(false);
      setAporteAlvo(null);
    });
  }

  return (
    <>
      {/* ── Cabeçalho ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F1729", lineHeight: 1.2 }}>
            Fundos
          </h1>
          <p style={{ fontSize: 13, color: "#7C8896", marginTop: 4 }}>
            {fundos.length} {fundos.length === 1 ? "fundo ativo" : "fundos ativos"} &middot; CDI{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {(cdi * 100).toFixed(2)}%
            </span>{" "}
            a.a.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            background: "#0E8F6A",
            color: "#fff",
            cursor: "pointer",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#0D7A5E")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#0E8F6A")}
        >
          <IconPlus style={{ width: 15, height: 15 }} />
          Novo fundo
        </button>
      </div>

      {/* ── Layout duas colunas ── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* Coluna esquerda: lista compacta */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {fundos.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "1px dashed #E6E8EC",
                borderRadius: 14,
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 32, marginBottom: 12 }}>🏦</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0F1729", marginBottom: 6 }}>
                Nenhum fundo criado ainda
              </p>
              <p style={{ fontSize: 13, color: "#9AA3AE", marginBottom: 20 }}>
                Crie seu primeiro fundo para começar a construir patrimônio.
              </p>
              <button
                onClick={openCreate}
                style={{
                  padding: "9px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  background: "#0E8F6A",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                + Criar primeiro fundo
              </button>
            </div>
          ) : (
            fundos.map((fundo, index) => (
              <FundoRow
                key={fundo.id}
                fundo={fundo}
                index={index}
                onAportar={(f) => openAporte(f, index)}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Coluna direita: 300px com 3 cards */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <ResumoGeralCard fundos={fundos} />
          <RendimentoCard fundos={fundos} cdi={cdi} />
          <PlanoStatusCard plano={plano} usado={fundos.length} />
        </div>
      </div>

      {/* ── Modais ── */}
      <ModalNovoFundo
        open={modalFundoOpen}
        onClose={() => { setModalFundoOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={handleFundoSubmit}
        pending={pending}
      />

      <ModalConfirmarAporte
        open={aporteOpen}
        fundo={aporteAlvo?.fundo ?? null}
        fundoIndex={aporteAlvo?.index ?? 0}
        onClose={() => { setAporteOpen(false); setAporteAlvo(null); }}
        onConfirmar={handleConfirmarAporte}
        pending={pending}
      />

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
