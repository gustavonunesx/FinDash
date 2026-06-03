import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Configuracao, Fundo, Gasto, Profile } from "./types";
import { CATEGORIA_LABELS } from "./types";
import { calcularScore502030, totalPorCategoria } from "./score";
import { formatCurrency } from "./utils";

interface ReportData {
  profile: Profile;
  config: Configuracao;
  gastos: Gasto[];
  fundos: Fundo[];
  geradoEm: Date;
}

export function generatePdfReport(data: ReportData): ArrayBuffer {
  const doc = new jsPDF();
  const { profile, config, gastos, fundos } = data;
  const score = calcularScore502030(config, gastos);
  const totais = totalPorCategoria(gastos);
  const mes = data.geradoEm.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  doc.setFontSize(20);
  doc.setTextColor(29, 158, 117);
  doc.text("FinDash — Relatório Financeiro", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${profile.nome ?? "Usuário"} · ${mes}`, 14, 28);
  doc.text(`Gerado em ${data.geradoEm.toLocaleString("pt-BR")}`, 14, 34);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Resumo", 14, 46);

  autoTable(doc, {
    startY: 50,
    head: [["Métrica", "Valor"]],
    body: [
      ["Renda total", formatCurrency(score.rendaTotal)],
      ["Total gastos", formatCurrency(totais.necessidade + totais.objetivo + totais.qualidade)],
      ["Saldo livre", formatCurrency(score.saldoLivre)],
      ["Score 50/30/20", String(score.score)],
    ],
    theme: "grid",
    headStyles: { fillColor: [29, 158, 117] },
  });

  const y1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text("Gastos por categoria", 14, y1);

  autoTable(doc, {
    startY: y1 + 4,
    head: [["Categoria", "Total", "% da renda"]],
    body: (["necessidade", "objetivo", "qualidade"] as const).map((cat) => [
      CATEGORIA_LABELS[cat],
      formatCurrency(totais[cat]),
      score.rendaTotal > 0 ? `${Math.round((totais[cat] / score.rendaTotal) * 100)}%` : "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [55, 138, 221] },
  });

  const y2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (gastos.length > 0) {
    doc.setFontSize(14);
    doc.text("Detalhamento de gastos", 14, y2);

    autoTable(doc, {
      startY: y2 + 4,
      head: [["Nome", "Categoria", "Valor"]],
      body: gastos.slice(0, 30).map((g) => [
        g.nome,
        CATEGORIA_LABELS[g.categoria],
        formatCurrency(g.valor),
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 92, 191] },
    });
  }

  const y3 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (fundos.length > 0 && y3 < 250) {
    doc.setFontSize(14);
    doc.text("Fundos", 14, y3);

    autoTable(doc, {
      startY: y3 + 4,
      head: [["Fundo", "Saldo", "Meta", "Progresso"]],
      body: fundos.map((f) => [
        f.nome,
        formatCurrency(f.saldo_atual),
        formatCurrency(f.meta),
        f.meta > 0 ? `${Math.round((f.saldo_atual / f.meta) * 100)}%` : "—",
      ]),
      theme: "grid",
      headStyles: { fillColor: [29, 158, 117] },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("FinDash · findash.app · Relatório Premium", 14, 285);

  return doc.output("arraybuffer");
}
