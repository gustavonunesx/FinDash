"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function UpgradeToast() {
  useEffect(() => {
    toast.success("Bem-vindo ao Premium! 🎉 Todos os recursos foram desbloqueados.", {
      duration: 6000,
    })
  }, [])
  return null
}
