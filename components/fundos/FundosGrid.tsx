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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {fundos.length} {fundos.length === 1 ? "fundo" : "fundos"}
          {plano === "free" && " · limite: 3"}
        </p>
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-white gap-1.5"
          onClick={() => setCriando(true)}
        >
          <IconPlus size={15} />
          Novo fundo
        </Button>
      </div>

      {fundos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconPigMoney size={40} className="text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum fundo cadastrado.</p>
          <Button
            variant="link"
            className="text-primary mt-1 text-sm h-auto p-0"
            onClick={() => setCriando(true)}
          >
            Criar primeiro fundo
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
