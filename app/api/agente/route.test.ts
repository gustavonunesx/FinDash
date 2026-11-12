import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChamarModelo } from "@/lib/agente/loop";
import { separarEventosSse } from "@/lib/agente/sse";
import type { Bloco } from "@/lib/agente/tipos";

const estado = vi.hoisted(() => ({
  demo: false,
  usuario: { id: "u1" } as { id: string } | null,
  plano: "premium",
  contagem: 0,
  linhas: [] as unknown[],
  insercoes: [] as Record<string, unknown>[][],
  respostas: [] as Bloco[][],
  chamadasModelo: [] as unknown[],
  executar: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/lib/demo-data", () => ({ isDemoMode: () => estado.demo }));

vi.mock("@/lib/agente/executar-ferramenta", () => ({
  executarFerramenta: (...args: unknown[]) => estado.executar(...args),
}));

vi.mock("@/lib/agente/modelo", () => ({
  criarChamarModelo: (): ChamarModelo => async ({ mensagens, onTexto }) => {
    estado.chamadasModelo.push(mensagens);
    const conteudo = estado.respostas.shift() ?? [{ type: "text", text: "fim" }];
    for (const b of conteudo) if (b.type === "text") onTexto(b.text);
    return { conteudo };
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: estado.usuario } }) },
    from: (tabela: string) => {
      const chamadas: { metodo: string; args: unknown[] }[] = [];
      const cadeia: unknown = new Proxy(function () {}, {
        get: (_alvo, prop) => {
          if (prop === "then") {
            return (resolver: (v: unknown) => unknown) => {
              const insert = chamadas.find((c) => c.metodo === "insert");
              if (insert) {
                estado.insercoes.push(insert.args[0] as Record<string, unknown>[]);
                return Promise.resolve({ error: null }).then(resolver);
              }
              const select = chamadas.find((c) => c.metodo === "select");
              const opcoes = select?.args[1] as { head?: boolean } | undefined;
              if (tabela === "agente_mensagens" && opcoes?.head) {
                return Promise.resolve({ count: estado.contagem, error: null }).then(resolver);
              }
              if (tabela === "agente_mensagens") {
                return Promise.resolve({ data: estado.linhas, error: null }).then(resolver);
              }
              return Promise.resolve({ data: { plano: estado.plano }, error: null }).then(resolver);
            };
          }
          return (...args: unknown[]) => {
            chamadas.push({ metodo: String(prop), args });
            return cadeia;
          };
        },
      });
      return cadeia;
    },
  }),
}));

import { POST } from "./route";

function requisicao(corpo: unknown) {
  return new Request("http://localhost/api/agente", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

async function eventosDe(resposta: Response) {
  return separarEventosSse(await resposta.text()).eventos;
}

beforeEach(() => {
  estado.demo = false;
  estado.usuario = { id: "u1" };
  estado.plano = "premium";
  estado.contagem = 0;
  estado.linhas = [];
  estado.insercoes = [];
  estado.respostas = [];
  estado.chamadasModelo = [];
  estado.executar.mockReset();
  estado.executar.mockResolvedValue({ ok: true });
  process.env.ANTHROPIC_API_KEY = "chave-de-teste";
});

describe("POST /api/agente - gates", () => {
  it("503 em modo demo", async () => {
    estado.demo = true;
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(503);
  });

  it("401 sem usuario", async () => {
    estado.usuario = null;
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(401);
  });

  it("403 para plano free", async () => {
    estado.plano = "free";
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(403);
  });

  it("503 sem ANTHROPIC_API_KEY", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(503);
  });

  it.each([["   "], [""], ["a".repeat(2001)]])("400 para mensagem invalida (%#)", async (mensagem) => {
    expect((await POST(requisicao({ mensagem }))).status).toBe(400);
  });

  it("400 para corpo que nao e JSON", async () => {
    expect((await POST(requisicao("isso nao e json"))).status).toBe(400);
  });

  it("429 quando o limite por hora foi atingido", async () => {
    estado.contagem = 40;
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(429);
  });

  it("nao chama o modelo nem grava nada quando o gate bloqueia", async () => {
    estado.plano = "free";
    await POST(requisicao({ mensagem: "oi" }));
    expect(estado.chamadasModelo).toHaveLength(0);
    expect(estado.insercoes).toHaveLength(0);
  });
});

describe("POST /api/agente - streaming", () => {
  it("responde por SSE e grava a mensagem do usuario junto com a resposta", async () => {
    estado.respostas = [[{ type: "text", text: "Olá!" }]];
    const resposta = await POST(requisicao({ mensagem: "  Oi  " }));
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("text/event-stream");
    const eventos = await eventosDe(resposta);
    expect(eventos).toEqual([
      { evento: "texto", dados: { t: "Olá!" } },
      { evento: "fim", dados: {} },
    ]);
    expect(estado.insercoes).toHaveLength(1);
    expect(estado.insercoes[0]).toEqual([
      { papel: "user", conteudo: [{ type: "text", text: "Oi" }], inicio_rodada: true },
      { papel: "assistant", conteudo: [{ type: "text", text: "Olá!" }], inicio_rodada: false },
    ]);
  });

  it("executa ferramentas, avisa o cliente e persiste cada rodada sem blocos de pensamento", async () => {
    estado.respostas = [
      [
        { type: "thinking", thinking: "", signature: "sig" },
        { type: "tool_use", id: "t1", name: "ler_ficha_financeira", input: {} },
      ],
      [{ type: "text", text: "Pronto" }],
    ];
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "Recebi 1000" })));
    expect(eventos.map((e) => e.evento)).toEqual(["ferramenta", "texto", "fim"]);
    expect(eventos[0].dados).toEqual({ nome: "ler_ficha_financeira", rotulo: "Lendo sua ficha…" });
    expect(estado.executar).toHaveBeenCalledTimes(1);
    expect(estado.insercoes).toHaveLength(2);
    const primeira = estado.insercoes[0];
    expect(primeira.map((l) => l.papel)).toEqual(["user", "assistant", "user"]);
    expect(primeira[0].inicio_rodada).toBe(true);
    expect(primeira[1].conteudo).toEqual([{ type: "tool_use", id: "t1", name: "ler_ficha_financeira", input: {} }]);
    expect(JSON.stringify(estado.insercoes)).not.toContain("thinking");
  });

  it("envia o historico persistido, cortado em fronteira de rodada, antes da mensagem nova", async () => {
    estado.linhas = [
      { id: "l2", ordem: 2, papel: "assistant", conteudo: [{ type: "text", text: "resposta velha" }], inicio_rodada: false, criado_em: "x" },
      { id: "l1", ordem: 1, papel: "user", conteudo: [{ type: "text", text: "pergunta velha" }], inicio_rodada: true, criado_em: "x" },
    ];
    estado.respostas = [[{ type: "text", text: "ok" }]];
    await eventosDe(await POST(requisicao({ mensagem: "nova" })));
    const enviado = estado.chamadasModelo[0] as { papel: string; conteudo: { text?: string }[] }[];
    expect(enviado.map((m) => m.conteudo[0].text)).toEqual(["pergunta velha", "resposta velha", "nova"]);
  });

  it("falha do modelo antes de qualquer rodada nao grava nada e avisa o cliente", async () => {
    estado.respostas = [[]];
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "oi" })));
    expect(eventos).toEqual([{ evento: "erro", dados: { mensagem: "Não consegui responder agora. Tente de novo." } }]);
    expect(estado.insercoes).toHaveLength(0);
  });

  it("no limite de iteracoes fecha a rodada com mensagem do assistente", async () => {
    estado.respostas = Array.from({ length: 8 }, () => [{ type: "tool_use", id: "t", name: "ler_ficha_financeira", input: {} } as Bloco]);
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "oi" })));
    expect(eventos.at(-1)?.evento).toBe("fim");
    const ultima = estado.insercoes.at(-1)!;
    expect(ultima).toHaveLength(1);
    expect(ultima[0]).toMatchObject({ papel: "assistant", inicio_rodada: false });
    expect(JSON.stringify(ultima[0].conteudo)).toContain("Parei aqui");
  });
});
