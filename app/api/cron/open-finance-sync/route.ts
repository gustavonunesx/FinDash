import { NextResponse } from "next/server";

import { isOpenFinanceConfigurado } from "@/lib/open-finance";
import { sincronizarItem } from "@/lib/open-finance-sync";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Varredura diária de todos os itens conectados. O webhook é o caminho normal;
 * este cron existe porque uma entrega pode se perder de vez (a Pluggy desiste
 * após 9 tentativas) e o usuário ficaria com saldo velho sem nenhum sinal.
 *
 * O aviso de consentimento a vencer sai do próprio sync (`statusConsentimento`),
 * então esta varredura também o mantém em dia para quem não recebe webhook.
 */

function authorize(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOpenFinanceConfigurado()) {
    return NextResponse.json({ error: "Open Finance não configurado" }, { status: 503 });
  }

  const supabase = createServiceClient();

  const { data: bancos } = await supabase
    .from("bancos")
    .select("provider_item_id")
    .eq("origem", "open_finance")
    .not("provider_item_id", "is", null);

  if (!bancos?.length) {
    return NextResponse.json({ items: 0, message: "Nenhuma conta conectada" });
  }

  // Um item pode ter várias contas; sincronizar por item evita repetir a mesma
  // chamada à Pluggy uma vez por conta.
  const itemIds = [...new Set(bancos.map((b) => b.provider_item_id as string))];

  let saldos = 0;
  let importados = 0;
  let conciliados = 0;
  const erros: string[] = [];

  for (const itemId of itemIds) {
    try {
      const r = await sincronizarItem(supabase, itemId);
      saldos += r.saldosAtualizados;
      importados += r.gastosImportados;
      conciliados += r.gastosConciliados;
      erros.push(...r.erros);
    } catch (e) {
      erros.push(`${itemId}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }

  return NextResponse.json({
    items: itemIds.length,
    saldosAtualizados: saldos,
    gastosImportados: importados,
    gastosConciliados: conciliados,
    erros,
  });
}
