import { describe, expect, it } from "vitest";
import { dataValida, diasNoMes, hojeSaoPaulo, somarDias, somarMeses } from "./datas";

describe("hojeSaoPaulo", () => {
  it("usa a data de Sao Paulo quando o UTC ja virou o dia", () => {
    expect(hojeSaoPaulo(new Date("2026-11-11T02:00:00Z"))).toBe("2026-11-10");
  });

  it("mantem a data quando UTC e Sao Paulo estao no mesmo dia", () => {
    expect(hojeSaoPaulo(new Date("2026-11-11T12:00:00Z"))).toBe("2026-11-11");
  });
});

describe("somarDias", () => {
  it("soma 60 dias atravessando meses e ano", () => {
    expect(somarDias("2026-11-10", 60)).toBe("2027-01-09");
  });

  it("aceita dias negativos", () => {
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("somarMeses", () => {
  it("soma 3 meses mantendo o dia", () => {
    expect(somarMeses("2026-11-10", 3)).toBe("2027-02-10");
  });

  it("limita o dia ao ultimo dia do mes de destino", () => {
    expect(somarMeses("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("diasNoMes", () => {
  it("conta 30 dias em abril", () => {
    expect(diasNoMes(2026, 4)).toBe(30);
  });

  it("conta 29 dias em fevereiro de ano bissexto", () => {
    expect(diasNoMes(2028, 2)).toBe(29);
  });
});

describe("dataValida", () => {
  it("rejeita dia inexistente", () => {
    expect(dataValida("2026-02-30")).toBe(false);
  });

  it("rejeita texto livre", () => {
    expect(dataValida("amanhã")).toBe(false);
  });

  it("aceita data real", () => {
    expect(dataValida("2026-12-31")).toBe(true);
  });
});
