import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="text-muted-foreground">Carregando...</div>}>
        <AuthCard />
      </Suspense>
    </div>
  );
}
