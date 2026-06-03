import { Suspense } from "react";
import AceitarConviteClient from "./aceitar-client";

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>}>
      <AceitarConviteClient />
    </Suspense>
  );
}
