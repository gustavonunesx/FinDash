import { NextResponse } from "next/server";
import { getAppData } from "@/lib/data";
import { calcularScore502030 } from "@/lib/score";
import { CATEGORIA_LABELS, type CategoriaGasto } from "@/lib/types";
import { checkAndSendOrcamentoAlert } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile, config, gastos } = await getAppData();
  if (!config || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ sent: 0, reason: "not configured" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email;

  if (!email) {
    return NextResponse.json({ sent: 0, reason: "no email" });
  }

  const score = calcularScore502030(config, gastos);
  let sent = 0;

  for (const cat of score.categorias) {
    if (cat.limite <= 0) continue;
    const ok = await checkAndSendOrcamentoAlert({
      email,
      nome: profile.nome ?? "Usuário",
      categoria: CATEGORIA_LABELS[cat.categoria as CategoriaGasto],
      gasto: cat.gasto,
      limite: cat.limite,
    });
    if (ok) sent++;
  }

  return NextResponse.json({ sent });
}
