import type { Fundo } from "./types";
import { sendEmail, buildMetaFundoEmail } from "./email";
import { createClient } from "./supabase/server";
import { isDemoMode } from "./demo-data";
import { getDemoFundos, updateDemoFundo } from "./demo-store";

export async function checkAndNotifyMetaAtingida(
  fundoId: string,
  saldoAtual: number,
  meta: number,
  nomeFundo: string
): Promise<{ atingida: boolean; notificada: boolean }> {
  if (meta <= 0 || saldoAtual < meta) {
    return { atingida: false, notificada: false };
  }

  if (isDemoMode()) {
    const fundos = getDemoFundos();
    const fundo = fundos.find((f) => f.id === fundoId);
    if (fundo?.meta_atingida_notificada) {
      return { atingida: true, notificada: false };
    }
    updateDemoFundo(fundoId, { meta_atingida_notificada: true });
    return { atingida: true, notificada: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { atingida: true, notificada: false };

  const { data: fundo } = await supabase
    .from("fundos")
    .select("meta_atingida_notificada")
    .eq("id", fundoId)
    .single();

  if (fundo?.meta_atingida_notificada) {
    return { atingida: true, notificada: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();

  const sent = await sendEmail({
    to: user.email,
    subject: `🎯 Meta atingida: ${nomeFundo}`,
    html: buildMetaFundoEmail({
      nome: profile?.nome ?? "Usuário",
      fundo: nomeFundo,
      saldo: saldoAtual,
      meta,
    }),
  });

  await supabase
    .from("fundos")
    .update({ meta_atingida_notificada: true })
    .eq("id", fundoId);

  return { atingida: true, notificada: sent };
}

export function getFundosMetaAtingida(fundos: Fundo[]): Fundo[] {
  return fundos.filter((f) => f.meta > 0 && f.saldo_atual >= f.meta);
}
