import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChamarModelo } from "@/lib/agente/loop";
import { separarEventosSse } from "@/lib/agente/sse";
import type { Bloco } from "@/lib/agente/tipos";

const FECHAMENTO = "(Resposta interrompida. Confira acima o que foi salvo e me avise se faltou algo.)";

const estado = vi.hoisted(() => ({
  demo: false,
  usuario: { id: "u1" } as { id: string } | null,
  plano: "premium",
  contagem: 1,
  linhas: [] as unknown[],
  insercoes: [] as Record<string, unknown>[][],
  remocoes: [] as unknown[][],
  respostas: [] as Bloco[][],
  chamadasModelo: [] as unknown[],
  insercoesAntesDoModelo: [] as number[],
  executar: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/lib/demo-data", () => ({ isDemoMode: () => estado.demo }));

vi.mock("@/lib/agente/executar-ferramenta", () => ({
  executarFerramenta: (...args: unknown[]) => estado.executar(...args),
}));

vi.mock("@/lib/agente/modelo", () => ({
  criarChamarModelo: (): ChamarModelo => async ({ mensagens, onTexto }) => {
    estado.chamadasModelo.push(mensagens);
    estado.insercoesAntesDoModelo.push(estado.insercoes.length);
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
              const remocao = chamadas.find((c) => c.metodo === "delete");
              if (remocao) {
                estado.remocoes.push(chamadas.find((c) => c.metodo === "eq")?.args ?? []);
                return Promise.resolve({ error: null }).then(resolver);
              }
              const insert = chamadas.find((c) => c.metodo === "insert");
              if (insert) {
                const linhas = insert.args[0];
                estado.insercoes.push((Array.isArray(linhas) ? linhas : [linhas]) as Record<string, unknown>[]);
                return Promise.resolve({ data: { id: "linha-nova" }, error: null }).then(resolver);
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
  estado.contagem = 1;
  estado.linhas = [];
  estado.insercoes = [];
  estado.remocoes = [];
  estado.respostas = [];
  estado.chamadasModelo = [];
  estado.insercoesAntesDoModelo = [];
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

  it("nao chama o modelo nem grava nada quando o gate bloqueia", async () => {
    estado.plano = "free";
    await POST(requisicao({ mensagem: "oi" }));
    expect(estado.chamadasModelo).toHaveLength(0);
    expect(estado.insercoes).toHaveLength(0);
  });
});

describe("POST /api/agente - limite por hora", () => {
  it("429 na 41a rodada, desfaz a linha reservada e nao chama o modelo", async () => {
    estado.contagem = 41;
    const resposta = await POST(requisicao({ mensagem: "oi" }));
    expect(resposta.status).toBe(429);
    expect(estado.remocoes).toEqual([["id", "linha-nova"]]);
    expect(estado.chamadasModelo).toHaveLength(0);
  });

  it("aceita a 40a rodada", async () => {
    estado.contagem = 40;
    expect((await POST(requisicao({ mensagem: "oi" }))).status).toBe(200);
  });

  it("conta a rodada antes de chamar o modelo, entao abortar ou falhar nao libera o limite", async () => {
    estado.respostas = [[]];
    await eventosDe(await POST(requisicao({ mensagem: "oi" })));
    expect(estado.insercoesAntesDoModelo).toEqual([1]);
    expect(estado.insercoes[0]).toEqual([
      { papel: "user", conteudo: [{ type: "text", text: "oi" }], inicio_rodada: true },
    ]);
  });
});

describe("POST /api/agente - streaming", () => {
  it("responde por SSE e grava a mensagem do usuario e depois a resposta", async () => {
    estado.respostas = [[{ type: "text", text: "Olá!" }]];
    const resposta = await POST(requisicao({ mensagem: "  Oi  " }));
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("text/event-stream");
    const eventos = await eventosDe(resposta);
    expect(eventos).toEqual([
      { evento: "texto", dados: { t: "Olá!" } },
      { evento: "fim", dados: {} },
    ]);
    expect(estado.insercoes).toEqual([
      [{ papel: "user", conteudo: [{ type: "text", text: "Oi" }], inicio_rodada: true }],
      [{ papel: "assistant", conteudo: [{ type: "text", text: "Olá!" }], inicio_rodada: false }],
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
    expect(estado.insercoes).toHaveLength(3);
    expect(estado.insercoes[0][0]).toMatchObject({ papel: "user", inicio_rodada: true });
    expect(estado.insercoes[1].map((l) => l.papel)).toEqual(["assistant", "user"]);
    expect(estado.insercoes[1][0].conteudo).toEqual([
      { type: "tool_use", id: "t1", name: "ler_ficha_financeira", input: {} },
    ]);
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

  it("falha do modelo antes de qualquer rodada: fecha o historico, mostra o fechamento e libera tentar de novo", async () => {
    estado.respostas = [[]];
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "oi" })));
    expect(eventos).toEqual([
      { evento: "texto", dados: { t: `

${FECHAMENTO}` } },
      { evento: "erro", dados: { mensagem: "Não consegui responder agora. Tente de novo.", gravou: false } },
    ]);
    expect(estado.insercoes).toEqual([
      [{ papel: "user", conteudo: [{ type: "text", text: "oi" }], inicio_rodada: true }],
      [{ papel: "assistant", conteudo: [{ type: "text", text: FECHAMENTO }], inicio_rodada: false }],
    ]);
  });

  it("falha depois de gravar algo avisa que houve gravacao, para o cliente nao oferecer repetir", async () => {
    estado.respostas = [[{ type: "tool_use", id: "t1", name: "registrar_entrada", input: {} }], []];
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "Recebi 1000" })));
    const erro = eventos.find((e) => e.evento === "erro");
    expect(erro?.dados).toMatchObject({ gravou: true });
    expect(JSON.stringify(estado.insercoes.at(-1))).toContain("Resposta interrompida");
  });

  it("no limite de iteracoes fecha a rodada e mostra o fechamento ao cliente", async () => {
    estado.respostas = Array.from({ length: 8 }, () => [{ type: "tool_use", id: "t", name: "ler_ficha_financeira", input: {} } as Bloco]);
    const eventos = await eventosDe(await POST(requisicao({ mensagem: "oi" })));
    expect(eventos.at(-1)?.evento).toBe("fim");
    const textos = eventos.filter((e) => e.evento === "texto").map((e) => (e.dados as { t: string }).t);
    expect(textos.join("")).toContain("Parei aqui");
    const ultima = estado.insercoes.at(-1)!;
    expect(ultima).toHaveLength(1);
    expect(ultima[0]).toMatchObject({ papel: "assistant", inicio_rodada: false });
    expect(JSON.stringify(ultima[0].conteudo)).toContain("Parei aqui");
  });
});
