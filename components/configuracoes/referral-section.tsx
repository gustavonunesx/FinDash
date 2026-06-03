"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconCopy, IconGift } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildReferralLink, REFERRAL_REWARD_BRL } from "@/lib/referral";

interface ReferralSectionProps {
  referralCode: string;
  rewards: number;
}

export function ReferralSection({ referralCode, rewards }: ReferralSectionProps) {
  const [copied, setCopied] = useState(false);
  const link = buildReferralLink(referralCode);

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="md:col-span-2 border-fd-purple/30 bg-fd-purple/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconGift className="h-5 w-5 text-fd-purple" />
          <CardTitle>Indique e ganhe</CardTitle>
          {rewards > 0 && <Badge variant="purple">{rewards} recompensa(s)</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Compartilhe seu link. Quando um amigo assinar o Premium, você ganha{" "}
          <span className="font-mono text-fd-green">R${REFERRAL_REWARD_BRL}</span> de crédito na
          fatura Stripe.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-secondary px-3 py-2 font-mono text-sm">{link}</code>
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            <IconCopy className="h-4 w-4" />
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Seu código: <span className="font-mono text-foreground">{referralCode}</span>
        </p>
      </CardContent>
    </Card>
  );
}
