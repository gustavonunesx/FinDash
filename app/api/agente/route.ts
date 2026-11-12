import { hojeSaoPaulo } from "@/lib/agente/datas";
import { executarFerramenta } from "@/lib/agente/executar-ferramenta";
import { ROTULOS_FERRAMENTA } from "@/lib/agente/ferramentas";
import { executarLoop } from "@/lib/agente/loop";
import {
  LIMITE_RODADAS_POR_HORA,
  janelaDeMensagens,
  mensagemDeFechamento,
  removerPensamento,
  validarMensagemUsuario,
} from "@/lib/agente/mensagens";
import { criarChamarModelo } from "@/lib/agente/modelo";
import { formatarEventoSse, type EventoSse } from "@/lib/agente/sse";
import type { LinhaMensagem, MensagemAgente } from "@/lib/agente/tipos";
import { isDemoMode } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;
export const runtime = "nodejs";

const MODELO_PADRAO = "claude-sonnet-5-5";
const MENSAGEM_ERRO = "Não consegui responder agora. Tente de novo.";
// Folga de 10s sobre maxDuration para gravar o fechamento e avisar o cliente.
const TEMPO_MAXIMO_MS = 50_000;

const falha = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(req: Request): Promise<Response> {
  if (isDemoMode()) return falha(503, "O agente exige uma conta real.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return falha(401, "Faça login para usar o agente.");

  const { data: profile } = await supabase.from("profiles").select("plano").eq("id", user.id).single();
  if (profile?.plano !== "premium") {
    return falha(403, "O agente financeiro está disponível apenas no plano Premium.");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return falha(503, "O agente não está configurado.");

  const corpo = await req.json().catch(() => null);
  const validada = validarMensagemUsuario(corpo?.mensagem);
  if (!validada.ok) return falha(400, validada.erro);

  const { data: recentes, error: erroLeitura } = await supabase
    .from("agente_mensagens")
    .select("id, ordem, papel, conteudo, inicio_rodada, criado_em")
    .eq("user_id", user.id)
    .order("ordem", { ascending: false })
    .limit(60);
  if (erroLeitura) {
    console.error("agente: falha ao ler o historico", erroLeitura);
    return falha(500, MENSAGEM_ERRO);
  }

  const mensagemUsuario: MensagemAgente = {
    papel: "user",
    conteudo: [{ type: "text", text: validada.texto }],
  };

  // A rodada é reservada (e contada no limite) antes de qualquer chamada ao modelo: se ela só
  // fosse gravada na primeira resposta, abortar ou falhar logo no início escaparia do limite.
  const { data: reservada, error: erroReserva } = await supabase
    .from("agente_mensagens")
    .insert({ papel: "user", conteudo: mensagemUsuario.conteudo, inicio_rodada: true })
    .select("id")
    .single();
  if (erroReserva || !reservada) {
    console.error("agente: falha ao gravar a mensagem", erroReserva);
    return falha(500, MENSAGEM_ERRO);
  }

  const umaHoraAtras = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase
    .from("agente_mensagens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("inicio_rodada", true)
    .gte("criado_em", umaHoraAtras);
  if ((count ?? 0) > LIMITE_RODADAS_POR_HORA) {
    await supabase.from("agente_mensagens").delete().eq("id", reservada.id);
    return falha(429, "Você atingiu o limite de mensagens por hora. Tente de novo mais tarde.");
  }

  const historico = [
    ...janelaDeMensagens(((recentes ?? []) as LinhaMensagem[]).slice().reverse()),
    mensagemUsuario,
  ];
  const hoje = hojeSaoPaulo();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let aberto = true;
      const enviar = (evento: EventoSse, dados: unknown) => {
        if (!aberto) return;
        try {
          controller.enqueue(encoder.encode(formatarEventoSse(evento, dados)));
        } catch {
          aberto = false;
        }
      };

      const persistidas: MensagemAgente[] = [];
      const gravar = async (msgs: MensagemAgente[]) => {
        const linhas = msgs
          .flatMap((m) => removerPensamento(m) ?? [])
          .map((m) => ({ papel: m.papel, conteudo: m.conteudo, inicio_rodada: false }));
        if (linhas.length === 0) return;
        const { error } = await supabase.from("agente_mensagens").insert(linhas);
        if (error) throw error;
        persistidas.push(...(linhas as MensagemAgente[]));
      };

      try {
        const chamarModelo = criarChamarModelo({
          apiKey,
          modelo: process.env.AGENTE_MODELO || MODELO_PADRAO,
          hoje,
        });
        const { status } = await executarLoop(historico, {
          chamarModelo,
          executar: (nome, input) => executarFerramenta(nome, input, supabase, hoje),
          aoTexto: (t) => enviar("texto", { t }),
          aoFerramenta: (nome) =>
            enviar("ferramenta", { nome, rotulo: ROTULOS_FERRAMENTA[nome] ?? "Trabalhando…" }),
          aoNovas: gravar,
          signal: AbortSignal.any([req.signal, AbortSignal.timeout(TEMPO_MAXIMO_MS)]),
        });

        const gravou = persistidas.length > 0;
        const fechamento = mensagemDeFechamento(persistidas, status);
        if (fechamento) {
          await gravar([fechamento]);
          const bloco = fechamento.conteudo[0];
          if (bloco.type === "text") enviar("texto", { t: `\n\n${bloco.text}` });
        }

        if (status === "erro") enviar("erro", { mensagem: MENSAGEM_ERRO, gravou });
        else enviar("fim", {});
      } catch (e) {
        console.error("agente: falha no atendimento", e);
        enviar("erro", { mensagem: MENSAGEM_ERRO, gravou: persistidas.length > 0 });
      } finally {
        if (aberto) {
          try {
            controller.close();
          } catch {
            aberto = false;
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
