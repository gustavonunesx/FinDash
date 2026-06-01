"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function CheckoutToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Bem-vindo ao Premium! Seu trial de 14 dias começou.");
    } else if (checkout === "cancel") {
      toast.info("Checkout cancelado. Você continua no plano Free.");
    }

    if (checkout) {
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
