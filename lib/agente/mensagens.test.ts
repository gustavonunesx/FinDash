import { describe, expect, it } from "vitest";
import {
  janelaDeMensagens,
  mensagemDeFechamento,
  paraExibicao,
  sanitizarPares,
  validarMensagemUsuario,
} from "./mensagens";
import type { LinhaMensagem, MensagemAgente } from "./tipos";

const texto = (papel: "user" | "assistant", t: string): MensagemAgente => ({
  papel,
  conteudo: [{ type: "text", text: t }],
});
const uso = (id: string): MensagemAgente => ({
  papel: "assistant",
  conteudo: [{ type: "tool_use", id, name: "ler_ficha_financeira", input: {} }],
});
const resultado = (id: string): MensagemAgente => ({
  papel: "user",
  conteudo: [{ type: "tool_result", tool_use_id: id, content: "{}" }],
});
const linha = (ordem: number, msg: MensagemAgente, inicio = false): LinhaMensagem => ({
  ...msg,
  id: `l${ordem}`,
  ordem,
  inicio_rodada: inicio,
  criado_em: "2026-11-11T10:00:00Z",
});

describe("validarMensagemUsuario", () => {
  it("remove espacos das pontas", () => {
    expect(validarMensagemUsuario("  oi  ")).toEqual({ ok: true, texto: "oi" });
  });

  it.each(["", "   ", 42, null])("rejeita %j como vazia", (entrada) => {
    expect(validarMensagemUsuario(entrada)).toEqual({ ok: false, erro: "Escreva uma mensagem." });
  });

  it("rejeita acima de 2.000 caracteres", () => {
    expect(validarMensagemUsuario("a".repeat(2001))).toEqual({
      ok: false,
      erro: "Mensagem longa demais (máximo 2.000 caracteres).",
    });
  });

  it("aceita exatamente 2.000 caracteres", () => {
    expect(validarMensagemUsuario("a".repeat(2000)).ok).toBe(true);
  });
});

describe("sanitizarPares", () => {
  it("mantem uma rodada completa intacta", () => {
    const msgs = [texto("user", "oi"), uso("a"), resultado("a"), texto("assistant", "pronto")];
    expect(sanitizarPares(msgs)).toEqual(msgs);
  });

  it("remove tool_use sem resultado e descarta a mensagem que ficou vazia", () => {
    expect(sanitizarPares([texto("user", "oi"), uso("a")])).toEqual([texto("user", "oi")]);
  });

  it("mantem o texto da mensagem quando so o tool_use e removido", () => {
    const mista: MensagemAgente = {
      papel: "assistant",
      conteudo: [
        { type: "text", text: "vou ver" },
        { type: "tool_use", id: "a", name: "ler_ficha_financeira", input: {} },
      ],
    };
    expect(sanitizarPares([texto("user", "oi"), mista])).toEqual([
      texto("user", "oi"),
      texto("assistant", "vou ver"),
    ]);
  });

  it("remove tool_result orfao no inicio", () => {
    expect(sanitizarPares([resultado("a"), texto("assistant", "oi")])).toEqual([
      texto("assistant", "oi"),
    ]);
  });
});

describe("janelaDeMensagens", () => {
  const linhas = [
    linha(1, texto("user", "primeira"), true),
    linha(2, uso("a")),
    linha(3, resultado("a")),
    linha(4, texto("assistant", "resposta 1")),
    linha(5, texto("user", "segunda"), true),
    linha(6, texto("assistant", "resposta 2")),
  ];

  it("corta o inicio na primeira abertura de rodada dentro da janela", () => {
    const janela = janelaDeMensagens(linhas, 4);
    expect(janela).toEqual([texto("user", "segunda"), texto("assistant", "resposta 2")]);
  });

  it("devolve tudo quando a janela comporta o historico", () => {
    expect(janelaDeMensagens(linhas)).toHaveLength(6);
  });

  it("devolve vazio quando nao ha abertura de rodada na janela", () => {
    expect(janelaDeMensagens([linha(3, resultado("a")), linha(4, texto("assistant", "x"))], 2)).toEqual(
      []
    );
  });

  it("nunca comeca por tool_result", () => {
    for (let max = 1; max <= 6; max++) {
      const janela = janelaDeMensagens(linhas, max);
      if (janela.length > 0) {
        expect(janela[0].papel).toBe("user");
        expect(janela[0].conteudo[0].type).toBe("text");
      }
    }
  });
});

describe("mensagemDeFechamento", () => {
  it("fecha rodada que termina em tool_result", () => {
    const m = mensagemDeFechamento([uso("a"), resultado("a")], "erro");
    expect(m).toEqual(
      texto(
        "assistant",
        "(Resposta interrompida. Confira acima o que foi salvo e me avise se faltou algo.)"
      )
    );
  });

  it("usa texto proprio para o limite de passos", () => {
    expect(mensagemDeFechamento([uso("a"), resultado("a")], "limite")).toEqual(
      texto("assistant", "Parei aqui para não me estender. Me diga se quer que eu continue.")
    );
  });

  it("nao fecha rodada que ja terminou em texto do assistente", () => {
    expect(mensagemDeFechamento([texto("assistant", "oi")], "ok")).toBeNull();
  });

  it("nao fecha rodada vazia", () => {
    expect(mensagemDeFechamento([], "erro")).toBeNull();
  });
});

describe("paraExibicao", () => {
  it("mostra so o texto do usuario e a resposta final", () => {
    const linhas = [
      linha(1, texto("user", "oi"), true),
      linha(2, uso("a")),
      linha(3, resultado("a")),
      linha(4, texto("assistant", "olá")),
    ];
    expect(paraExibicao(linhas)).toEqual([
      { id: "l1", papel: "user", texto: "oi" },
      { id: "l4", papel: "assistant", texto: "olá" },
    ]);
  });
});
