import { after, NextResponse } from "next/server";

import { marcarErroItem, sincronizarItem } from "@/lib/open-finance-sync";
import { revalidarEntidade } from "@/lib/revalidate";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Webhook da Pluggy. A entrega falha se não devolvermos 2XX em 5 segundos, e um
 * sync pode demorar bem mais que isso — então a resposta sai na hora e o
 * processamento vai para `after()`.
 *
 * Roda com o service client: quem chama é a Pluggy, não o usuário, então não há
 * sessão para o RLS resolver.
 */
export async function POST(request: Request) {
  let evento: {
    event?: string;
    eventId?: string;
    itemId?: string;
  };

  try {
    evento = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { event, eventId, itemId } = evento;
  if (!event || !eventId) {
    return NextResponse.json({ error: "Evento incompleto" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // A Pluggy reentrega o mesmo evento até 9 vezes. A PK de `open_finance_eventos`
  // faz o segundo insert falhar, e é isso que corta o reprocessamento.
  const { error: duplicado } = await supabase
    .from("open_finance_eventos")
    .insert({ event_id: eventId, evento: event, item_id: itemId ?? null });

  if (duplicado) {
    // Conflito de PK = entrega repetida, que é sucesso do ponto de vista da
    // Pluggy. Qualquer outro erro também não deve gerar retry: o evento já se
    // perderia igual, e responder 5xx só multiplicaria a carga.
    return NextResponse.json({ received: true, duplicated: true });
  }

  if (itemId) {
    after(async () => {
      try {
        if (event === "item/error") {
          await marcarErroItem(supabase, itemId);
        } else if (
          event === "item/created" ||
          event === "item/updated" ||
          event === "transactions/created" ||
          event === "transactions/updated"
        ) {
          const resultado = await sincronizarItem(supabase, itemId);
          if (resultado.erros.length > 0) {
            console.error("[open-finance] sync com erros", event, itemId, resultado.erros);
          }
        } else {
          return;
        }

        revalidarEntidade("bancos", "gastos");
      } catch (e) {
        console.error("[open-finance] falha ao processar webhook", event, itemId, e);
      }
    });
  }

  return NextResponse.json({ received: true });
}
