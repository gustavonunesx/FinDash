import { describe, expect, it } from "vitest";
import { aoFecharStream, aplicarEvento, estadoInicial, type EstadoResposta } from "./chat-estado";

function aplicar(eventos: [string, unknown][], inicio: EstadoResposta = estadoInicial): EstadoResposta {
  return eventos.reduce((e, [evento, dados]) => aplicarEvento(e, evento, dados), inicio);
}

describe("aplicarEvento", () => {
  it("acumula os trechos de texto", () => {
    expect(aplicar([["texto", { t: "Olá" }], ["texto", { t: ", mundo" }]]).texto).toBe("Olá, mundo");
  });

  it("separa por paragrafo o texto que volta depois de uma ferramenta, mesmo com eventos em sequencia", () => {
    const e = aplicar([
      ["texto", { t: "Vou ver" }],
      ["ferramenta", { nome: "ler_ficha_financeira", rotulo: "Lendo sua ficha…" }],
      ["texto", { t: "| Destino | Valor |" }],
    ]);
    expect(e.texto).toBe("Vou ver\n\n| Destino | Valor |");
  });

  it("nao abre com paragrafo quando ainda nao havia texto", () => {
    const e = aplicar([["ferramenta", { rotulo: "Lendo…" }], ["texto", { t: "Oi" }]]);
    expect(e.texto).toBe("Oi");
  });

  it("mostra o rotulo da ferramenta e limpa quando o texto volta", () => {
    const meio = aplicar([["ferramenta", { rotulo: "Lendo sua ficha…" }]]);
    expect(meio.status).toBe("Lendo sua ficha…");
    expect(aplicarEvento(meio, "texto", { t: "ok" }).status).toBeNull();
  });

  it("ignora texto vazio ou ausente", () => {
    expect(aplicar([["texto", {}], ["texto", { t: "" }]]).texto).toBe("");
  });

  it("fim marca a resposta como terminada sem erro", () => {
    const e = aplicar([["texto", { t: "ok" }], ["fim", {}]]);
    expect(e.terminou).toBe(true);
    expect(e.erro).toBeNull();
  });

  it("erro sem nada salvo permite tentar de novo", () => {
    const e = aplicar([["erro", { mensagem: "Falhou", gravou: false }]]);
    expect(e.terminou).toBe(true);
    expect(e.erro).toEqual({ mensagem: "Falhou", podeTentarDeNovo: true });
  });

  it("erro depois de gravar algo nao oferece tentar de novo", () => {
    const e = aplicar([["erro", { mensagem: "Falhou", gravou: true }]]);
    expect(e.erro).toEqual({ mensagem: "Falhou", podeTentarDeNovo: false });
  });

  it("erro sem mensagem usa o texto padrao", () => {
    expect(aplicar([["erro", {}]]).erro?.mensagem).toBe("Não consegui responder agora. Tente de novo.");
  });
});

describe("aoFecharStream", () => {
  it("stream que fecha sem fim nem erro vira interrupcao, sem tentar de novo", () => {
    const e = aoFecharStream(aplicar([["texto", { t: "meio da resposta" }]]));
    expect(e.terminou).toBe(true);
    expect(e.erro?.podeTentarDeNovo).toBe(false);
    expect(e.erro?.mensagem).toContain("interrompida");
  });

  it("nao altera uma resposta que terminou normalmente", () => {
    const fim = aplicar([["texto", { t: "ok" }], ["fim", {}]]);
    expect(aoFecharStream(fim)).toEqual(fim);
  });

  it("nao sobrescreve um erro ja informado pelo servidor", () => {
    const comErro = aplicar([["erro", { mensagem: "Falhou", gravou: false }]]);
    expect(aoFecharStream(comErro)).toEqual(comErro);
  });
});
