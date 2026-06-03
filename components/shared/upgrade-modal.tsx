"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function UpgradeModal({ open, onOpenChange, message }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade para Premium</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {message ??
            "Você atingiu o limite do plano Free. Desbloqueie recursos ilimitados com 14 dias grátis."}
        </p>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
          <Link href="/precos" className="flex-1">
            <Button className="w-full bg-fd-purple hover:bg-fd-purple/90">Ver planos</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
