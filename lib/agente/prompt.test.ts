import { describe, expect, it } from "vitest";
import { FERRAMENTAS } from "./ferramentas";
import { PROMPT_SISTEMA } from "./prompt";

describe("PROMPT_SISTEMA", () => {
  it("menciona todas as ferramentas disponiveis", () => {
    for (const f of FERRAMENTAS) expect(PROMPT_SISTEMA).toContain(f.name);
  });

  it("diz que os numeros de projecao vem da ferramenta", () => {
    expect(PROMPT_SISTEMA).toContain("Quem calcula");
  });

  it("preserva blocos de codigo e crases do prompt original", () => {
    expect(PROMPT_SISTEMA).toContain("Dinheiro Livre Real = Saldo RECEBIDO");
    expect(PROMPT_SISTEMA).toContain("`ler_ficha_financeira`");
    expect(PROMPT_SISTEMA).toContain("```");
  });

  it("registra a ajuda de familia como entrada e saida de parcela integral", () => {
    expect(PROMPT_SISTEMA).toContain("a saída da parcela continua sendo o valor integral");
  });
});
