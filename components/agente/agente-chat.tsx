"use client";

import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { MarkdownResposta } from "@/components/agente/markdown-resposta";
import {
  aoFecharStream,
  aplicarEvento,
  estadoInicial,
  type EstadoResposta,
  type ErroChat,
} from "@/lib/agente/chat-estado";
import { separarEventosSse } from "@/lib/agente/sse";
import type { MensagemExibicao } from "@/lib/agente/tipos";
import { cn } from "@/lib/utils";

const ERRO_PADRAO = "Não consegui responder agora. Tente de novo.";
const ATALHOS = ["Recebi um dinheiro", "Como estou?", "Quero tirar da reserva"];

function Digitando({ rotulo }: { rotulo: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(([entrada]) => setVisivel(entrada.isIntersecting));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full bg-fd-green", visivel && "animate-pulse")} />
      {rotulo ?? "Pensando…"}
    </div>
  );
}

export function AgenteChat({ mensagensIniciais }: { mensagensIniciais: MensagemExibicao[] }) {
  const [mensagens, setMensagens] = useState<MensagemExibicao[]>(mensagensIniciais);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [erro, setErro] = useState<ErroChat | null>(null);
  const ultimaEnviada = useRef("");
  const lista = useRef<HTMLDivElement>(null);
  const aborto = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens, status, erro]);

  useEffect(() => () => aborto.current?.abort(), []);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || enviando) return;

    const idUsuario = crypto.randomUUID();
    const idAssistente = crypto.randomUUID();
    ultimaEnviada.current = limpo;
    setErro(null);
    setStatus(null);
    setEntrada("");
    setEnviando(true);
    setMensagens((m) => [
      ...m,
      { id: idUsuario, papel: "user", texto: limpo },
      { id: idAssistente, papel: "assistant", texto: "" },
    ]);

    const controle = new AbortController();
    aborto.current = controle;
    let resposta: EstadoResposta = estadoInicial;
    let iniciouStream = false;

    const aplicar = (novo: EstadoResposta) => {
      resposta = novo;
      setMensagens((m) => m.map((x) => (x.id === idAssistente ? { ...x, texto: novo.texto } : x)));
      setStatus(novo.status);
      if (novo.erro) setErro(novo.erro);
    };

    try {
      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: limpo }),
        signal: controle.signal,
      });
      if (!res.ok || !res.body) {
        const corpo = await res.json().catch(() => null);
        throw new Error(corpo?.error ?? ERRO_PADRAO);
      }

      iniciouStream = true;
      const leitor = res.body.getReader();
      const decodificador = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        buffer += decodificador.decode(value, { stream: true });
        const separado = separarEventosSse(buffer);
        buffer = separado.resto;
        for (const { evento, dados } of separado.eventos) aplicar(aplicarEvento(resposta, evento, dados));
      }
      aplicar(aoFecharStream(resposta));
    } catch (e) {
      if (controle.signal.aborted) return;
      if (iniciouStream) {
        aplicar(aoFecharStream(resposta));
      } else {
        setMensagens((m) => m.filter((x) => x.id !== idAssistente && x.id !== idUsuario));
        setEntrada((atual) => atual || limpo);
        setErro({ mensagem: e instanceof Error ? e.message : ERRO_PADRAO, podeTentarDeNovo: true });
      }
    } finally {
      setEnviando(false);
      setStatus(null);
    }
  }

  function aoTeclar(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void enviar(entrada);
    }
  }

  const ultimo = mensagens[mensagens.length - 1];
  const aguardando = enviando && (!ultimo || ultimo.papel !== "assistant" || ultimo.texto === "");

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={lista}
        className="flex min-h-[50vh] max-h-[calc(100vh-17rem)] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-[var(--card-shadow)]"
      >
        {mensagens.length === 0 && !enviando && (
          <div className="m-auto max-w-md py-10 text-center">
            <p className="text-lg font-extrabold tracking-tight">Vamos olhar o seu dinheiro?</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Conte quanto entra, o que você paga e o que já guardou. Eu organizo, mostro o que é de verdade e o que
              ainda é promessa.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {ATALHOS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => void enviar(a)}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-fd-green hover:text-fd-green"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((m) =>
          m.texto === "" ? null : (
            <div key={m.id} className={cn("flex", m.papel === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-4 py-3 text-sm",
                  m.papel === "user"
                    ? "border border-fd-green/20 bg-fd-green/15 text-foreground"
                    : "border border-border bg-background text-foreground"
                )}
              >
                {m.papel === "user" ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                ) : (
                  <MarkdownResposta texto={m.texto} />
                )}
              </div>
            </div>
          )
        )}

        {(aguardando || (enviando && status)) && <Digitando rotulo={status} />}
      </div>

      {erro && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fd-amber/30 bg-fd-amber/10 px-4 py-3 text-sm font-medium"
        >
          <span>{erro.mensagem}</span>
          {erro.podeTentarDeNovo && (
            <button
              type="button"
              onClick={() => void enviar(ultimaEnviada.current)}
              disabled={enviando}
              className="rounded-full bg-fd-amber/20 px-3 py-1 text-xs font-bold text-foreground disabled:opacity-50"
            >
              Tentar de novo
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(entrada);
        }}
        className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--card-shadow)]"
      >
        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={aoTeclar}
          disabled={enviando}
          rows={2}
          maxLength={2000}
          placeholder="Escreva aqui. Enter envia, Shift+Enter quebra a linha."
          className="min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={enviando || !entrada.trim()}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fd-green text-white transition-opacity disabled:opacity-40"
        >
          <IconSend size={18} stroke={2} />
        </button>
      </form>
      <p className="px-1 text-[11px] font-medium text-muted-foreground">
        Respostas geradas por IA. Confira os valores antes de decidir.
      </p>
    </div>
  );
}
