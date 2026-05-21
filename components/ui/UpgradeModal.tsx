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
import { IconSparkles, IconArrowRight, IconLock } from "@tabler/icons-react"

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
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto size-14 rounded-full bg-primary/15 flex items-center justify-center">
            <IconLock size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl">Limite do plano gratuito</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Você atingiu o limite de {limites[recurso] ?? recurso} no plano gratuito.
              Faça upgrade para o Premium e tenha acesso ilimitado.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/precos"
            onClick={onClose}
            className="group inline-flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            <IconSparkles size={16} />
            Ver planos Premium
            <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
