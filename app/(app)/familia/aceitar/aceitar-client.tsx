"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { aceitarConvite } from "@/app/(app)/familia/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AceitarConviteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (token === "demo") return;
    if (!token) return;
    startTransition(async () => {
      const r = await aceitarConvite(token);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Você entrou na família!");
        router.push("/familia");
      }
    });
  }, [token, router]);

  if (token === "demo") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Convite demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em produção, este link vincularia sua conta à família do convidante.
            </p>
            <Link href="/familia">
              <Button className="mt-4 w-full">Ir para Família</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-muted-foreground">{pending ? "Aceitando convite..." : "Processando..."}</p>
    </div>
  );
}
