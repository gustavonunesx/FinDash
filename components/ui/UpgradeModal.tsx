"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconSparkles } from "@tabler/icons-react"

interface Props {
  open: boolean
  onClose: () => void
  recurso?: string
}

export function UpgradeModal({ open, onClose, recurso = "gastos" }: Props) {
  const limites: Record<string, string> = {
    gastos: "10 gastos",
    fundos: "3 fundos",
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <IconSparkles size={20} className="text-primary" />
            <DialogTitle>Limite do plano free</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            Você atingiu o limite de {limites[recurso] ?? recurso} no plano gratuito.
            Faça upgrade para o Premium e tenha acesso ilimitado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/precos"
            onClick={onClose}
            className="inline-flex items-center justify-center w-full rounded-lg px-4 h-8 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Ver planos Premium
          </Link>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
