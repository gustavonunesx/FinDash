"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FundoCard } from "./FundoCard"
import { FundoModal } from "./FundoModal"
import { UpgradeModal } from "@/components/ui/UpgradeModal"
import { IconPlus, IconPigMoney } from "@tabler/icons-react"
import type { Fundo } from "@/types"

interface Props {
  fundos: Fundo[]
  plano: "free" | "premium"
}

export function FundosGrid({ fundos, plano }: Props) {
  const [criando, setCriando] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  function handleFaseTrocada() {
    toast.success("Reserva de emergência concluída! Fase alterada para Investindo.", {
      duration: 6000,
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          {fundos.length} {fundos.length === 1 ? "fundo" : "fundos"}
          {plano === "free" && <span className="text-muted-foreground/60"> · limite: 3</span>}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCriando(true)}
        >
          <IconPlus size={15} />
          Novo fundo
        </Button>
      </div>

      {fundos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <IconPigMoney size={32} className="text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Nenhum fundo cadastrado</h3>
          <p className="text-muted-foreground text-sm mb-4">Comece criando seu primeiro fundo</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setCriando(true)}
          >
            <IconPlus size={14} />
            Criar fundo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fundos.map((f) => (
            <FundoCard
              key={f.id}
              fundo={f}
              onLimitReached={() => setShowUpgrade(true)}
              onFaseTrocada={handleFaseTrocada}
            />
          ))}
        </div>
      )}

      <FundoModal
        open={criando}
        onClose={() => setCriando(false)}
        onLimitReached={() => setShowUpgrade(true)}
        onFaseTrocada={handleFaseTrocada}
      />

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        recurso="fundos"
      />
    </>
  )
}
