import { describe, expect, it } from "vitest";
import { formatarEventoSse, separarEventosSse } from "./sse";

describe("sse", () => {
  it("formata um evento com nome e dados em JSON", () => {
    expect(formatarEventoSse("texto", { t: "oi" })).toBe('event: texto\ndata: {"t":"oi"}\n\n');
  });

  it("separa eventos completos e devolve o pedaco incompleto como resto", () => {
    const buffer =
      formatarEventoSse("texto", { t: "a" }) +
      formatarEventoSse("ferramenta", { nome: "x", rotulo: "Lendo…" }) +
      'event: texto\ndata: {"t":"o';
    const { eventos, resto } = separarEventosSse(buffer);
    expect(eventos).toEqual([
      { evento: "texto", dados: { t: "a" } },
      { evento: "ferramenta", dados: { nome: "x", rotulo: "Lendo…" } },
    ]);
    expect(resto).toBe('event: texto\ndata: {"t":"o');
  });

  it("completa o evento quando o resto recebe o fim do pedaco", () => {
    const parte1 = 'event: texto\ndata: {"t":"o';
    const parte2 = 'i"}\n\n';
    const primeiro = separarEventosSse(parte1);
    expect(primeiro.eventos).toEqual([]);
    const segundo = separarEventosSse(primeiro.resto + parte2);
    expect(segundo.eventos).toEqual([{ evento: "texto", dados: { t: "oi" } }]);
    expect(segundo.resto).toBe("");
  });

  it("preserva acentos e quebras de linha dentro do texto", () => {
    const texto = "Olá!\nSaldo: R$ 1.500 — ação";
    const { eventos } = separarEventosSse(formatarEventoSse("texto", { t: texto }));
    expect(eventos).toEqual([{ evento: "texto", dados: { t: texto } }]);
  });

  it("ignora evento com JSON invalido sem quebrar os demais", () => {
    const buffer = 'event: texto\ndata: {quebrado\n\n' + formatarEventoSse("fim", {});
    expect(separarEventosSse(buffer).eventos).toEqual([{ evento: "fim", dados: {} }]);
  });
});
