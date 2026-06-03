import { NextResponse } from "next/server";
import { getAppData } from "@/lib/data";
import { generatePdfReport } from "@/lib/pdf-report";
import { isDemoMode } from "@/lib/demo-data";

export async function GET() {
  const { profile, config, gastos, fundos } = await getAppData();

  const isPremium = profile.plano === "premium" || isDemoMode();
  if (!isPremium) {
    return NextResponse.json(
      { error: "Exportação PDF disponível apenas no plano Premium." },
      { status: 403 }
    );
  }

  if (!config) {
    return NextResponse.json({ error: "Configuração não encontrada" }, { status: 400 });
  }

  const pdfBytes = generatePdfReport({
    profile,
    config,
    gastos,
    fundos,
    geradoEm: new Date(),
  });

  const mes = new Date().toISOString().slice(0, 7);
  const filename = `findash-relatorio-${mes}.pdf`;

  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
