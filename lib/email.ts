const RESEND_API = "https://api.resend.com/emails";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "FinDash <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
      attachments,
    }),
  });

  return res.ok;
}

export function buildOrcamentoAlertEmail(params: {
  nome: string;
  categoria: string;
  percentual: number;
  gasto: string;
  limite: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1D9E75;">FinDash — Alerta de orçamento</h2>
      <p>Olá, ${params.nome}!</p>
      <p>Você atingiu <strong>${params.percentual}%</strong> do limite de <strong>${params.categoria}</strong> este mês.</p>
      <p style="font-family: monospace;">Gasto: ${params.gasto} · Limite: ${params.limite}</p>
      <p style="color: #888;">Revise seus gastos no dashboard para manter o equilíbrio 50/30/20.</p>
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Ver dashboard</a>
    </div>
  `;
}

export function buildRelatorioMensalEmail(params: {
  nome: string;
  mes: string;
  score: number;
  saldoLivre: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1D9E75;">FinDash — Relatório de ${params.mes}</h2>
      <p>Olá, ${params.nome}!</p>
      <p>Seu relatório financeiro de ${params.mes} está em anexo (PDF).</p>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;">Score 50/30/20: <strong>${params.score}</strong></p>
        <p style="margin:8px 0 0;font-family:monospace;">Saldo livre: ${params.saldoLivre}</p>
      </div>
      <p style="color:#888;">Continue construindo patrimônio com consistência.</p>
      <a href="${appUrl}/historico" style="display:inline-block;background:#378ADD;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Ver histórico</a>
    </div>
  `;
}

export async function checkAndSendOrcamentoAlert(params: {
  email: string;
  nome: string;
  categoria: string;
  gasto: number;
  limite: number;
}): Promise<boolean> {
  if (params.limite <= 0) return false;
  const percentual = Math.round((params.gasto / params.limite) * 100);
  if (percentual < 80) return false;

  return sendEmail({
    to: params.email,
    subject: `FinDash: ${params.categoria} em ${percentual}% do limite`,
    html: buildOrcamentoAlertEmail({
      nome: params.nome,
      categoria: params.categoria,
      percentual,
      gasto: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        params.gasto
      ),
      limite: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        params.limite
      ),
    }),
  });
}

export function buildMetaFundoEmail(params: {
  nome: string;
  fundo: string;
  saldo: number;
  meta: number;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1D9E75;">🎯 Meta atingida!</h2>
      <p>Parabéns, ${params.nome}!</p>
      <p>Você atingiu a meta do fundo <strong>${params.fundo}</strong>.</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;font-family:monospace;">
        <p style="margin:0;">Saldo: ${fmt(params.saldo)}</p>
        <p style="margin:8px 0 0;">Meta: ${fmt(params.meta)}</p>
      </div>
      <p style="color:#888;">Continue construindo patrimônio — defina uma nova meta ou celebre essa conquista!</p>
      <a href="${appUrl}/fundos" style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Ver fundos</a>
    </div>
  `;
}

export async function sendRelatorioMensalEmail(params: {
  email: string;
  nome: string;
  mes: string;
  score: number;
  saldoLivre: number;
  pdfBase64: string;
}): Promise<boolean> {
  const mesLabel = new Date(params.mes + "-01").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return sendEmail({
    to: params.email,
    subject: `FinDash — Relatório ${mesLabel}`,
    html: buildRelatorioMensalEmail({
      nome: params.nome,
      mes: mesLabel,
      score: params.score,
      saldoLivre: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        params.saldoLivre
      ),
    }),
    attachments: [
      {
        filename: `findash-${params.mes}.pdf`,
        content: params.pdfBase64,
      },
    ],
  });
}
