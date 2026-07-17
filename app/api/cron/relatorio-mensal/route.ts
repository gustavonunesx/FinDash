import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { generatePdfReport } from "@/lib/pdf-report";
import { sendRelatorioMensalEmail } from "@/lib/email";
import { calcularScore502030 } from "@/lib/score";
import type { Configuracao, Fundo, Gasto, Profile } from "@/lib/types";

function authorize(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend não configurado" }, { status: 503 });
  }

  const supabase = createServiceClient();
  const mes = new Date().toISOString().slice(0, 7);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, plano")
    .eq("plano", "premium");

  if (!profiles?.length) {
    return NextResponse.json({ sent: 0, message: "Nenhum usuário premium" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const profile of profiles as Profile[]) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const [{ data: config }, { data: gastos }, { data: fundos }] = await Promise.all([
        supabase.from("configuracoes").select("*").eq("user_id", profile.id).single(),
        supabase.from("gastos").select("*").eq("user_id", profile.id),
        supabase.from("fundos").select("*").eq("user_id", profile.id),
      ]);

      if (!config) continue;

      const score = calcularScore502030(config as Configuracao, (gastos ?? []) as Gasto[]);
      const pdfBuffer = generatePdfReport({
        profile,
        config: config as Configuracao,
        gastos: (gastos ?? []) as Gasto[],
        fundos: (fundos ?? []) as Fundo[],
        geradoEm: new Date(),
      });

      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      const ok = await sendRelatorioMensalEmail({
        email,
        nome: profile.nome ?? "Usuário",
        mes,
        score: score.score,
        saldoLivre: score.saldoLivre,
        pdfBase64,
      });

      if (ok) sent++;
    } catch (e) {
      errors.push(`${profile.id}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }

  return NextResponse.json({ sent, total: profiles.length, errors });
}
