import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/auth-bootstrap";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` é concatenado ao origin: "?next=@evil.com" vira userinfo e o browser
  // vai para evil.com. Só caminho interno passa.
  const nextParam = searchParams.get("next");
  const next =
    nextParam?.startsWith("/") && !nextParam.startsWith("//") && !/[\\\r\n\t]/.test(nextParam)
      ? nextParam
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { onboardingCompleted } = await ensureUserProfile(user);
        const destination = onboardingCompleted ? next : "/onboarding";
        return NextResponse.redirect(`${origin}${destination}`);
      }
      console.error("[auth/callback] sem erro na troca de code, mas getUser() veio vazio");
    } else {
      console.error("[auth/callback] exchangeCodeForSession falhou:", error.message);
    }
  } else {
    console.error("[auth/callback] request sem ?code=");
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
