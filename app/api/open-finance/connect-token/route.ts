import { NextResponse } from "next/server";

import { criarConnectToken, isOpenFinanceConfigurado } from "@/lib/open-finance";
import { createClient } from "@/lib/supabase/server";

/**
 * Emite o connect token que o widget da Pluggy usa no browser. É o único token
 * que pode sair do servidor: vale 30 min e só dá acesso ao item que ele mesmo
 * cria. O clientSecret nunca trafega para o client.
 */
export async function POST(request: Request) {
  if (!isOpenFinanceConfigurado()) {
    return NextResponse.json(
      { error: "Open Finance não configurado neste ambiente." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Reconexão de um banco que expirou o consentimento: o widget precisa saber
  // qual item revalidar em vez de criar outro.
  let itemId: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.itemId === "string") itemId = body.itemId;
  } catch {
    // Sem body é o caso normal (conexão nova).
  }

  if (itemId) {
    const { data: banco } = await supabase
      .from("bancos")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider_item_id", itemId)
      .maybeSingle();

    // Não deixar o usuário pedir token de reconexão para um item que não é dele.
    if (!banco) {
      return NextResponse.json({ error: "Conexão não encontrada." }, { status: 404 });
    }
  }

  try {
    const accessToken = await criarConnectToken(user.id, itemId);
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("[open-finance] falha ao criar connect token", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar a conexão com o banco." },
      { status: 502 }
    );
  }
}
