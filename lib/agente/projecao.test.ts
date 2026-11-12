import { describe, expect, it } from "vitest";
import {
  projetarCaixa,
  type FichaProjecao,
  type FonteProj,
  type ParcelaProj,
} from "./projecao";

const vazia: FichaProjecao = { fontes: [], gastosFixos: [], parcelas: [], emprestimos: [], entradas: [] };

const fonte = (p: Partial<FonteProj> & Pick<FonteProj, "id" | "nome" | "valor" | "tipo">): FonteProj => ({
  dia_pagamento: 10,
  ativo_ate: null,
  ativo: true,
  ...p,
});

const parcela = (p: Partial<ParcelaProj> & Pick<ParcelaProj, "id" | "numero" | "vencimento" | "valor">): ParcelaProj => ({
  compromisso_nome: "Notebook",
  parte_terceiros: 0,
  status_ajuda: "nenhuma",
  pago: false,
  ...p,
});

const exemploDoPrompt: FichaProjecao = {
  fontes: [
    fonte({ id: "f-emp", nome: "Emprego", valor: 2000, tipo: "fixa", dia_pagamento: 5, ativo_ate: "2026-12-31" }),
    fonte({ id: "f-a", nome: "Cliente A", valor: 1200, tipo: "contrato" }),
    fonte({ id: "f-b", nome: "Cliente B", valor: 900, tipo: "incerta" }),
  ],
  gastosFixos: [{ nome: "Contas fixas", valor: 1300, dia_vencimento: 1, ativo: true }],
  parcelas: [
    parcela({ id: "p1", numero: 1, valor: 1500, vencimento: "2026-12-15", parte_terceiros: 750, status_ajuda: "confirmada" }),
    parcela({ id: "p2", numero: 2, valor: 1500, vencimento: "2027-01-15", parte_terceiros: 750, status_ajuda: "confirmada" }),
  ],
  emprestimos: [],
  entradas: [],
};

const MESES = ["2026-11", "2026-12", "2027-01", "2027-02"];

function cenario(p: ReturnType<typeof projetarCaixa>, nome: "pessimista" | "base" | "otimista") {
  return p.cenarios.find((c) => c.nome === nome)!;
}

describe("projetarCaixa - exemplo do prompt", () => {
  const proj = projetarCaixa(exemploDoPrompt, 1000, "2026-11-10");

  it("devolve os cenarios na ordem pessimista, base, otimista com um item por mes tocado", () => {
    expect(proj.cenarios.map((c) => c.nome)).toEqual(["pessimista", "base", "otimista"]);
    for (const c of proj.cenarios) expect(c.meses.map((m) => m.mes)).toEqual(MESES);
  });

  it("cenario base: saldos, entradas, saidas e mes mais apertado", () => {
    const base = cenario(proj, "base");
    expect(base.meses.map((m) => m.saldo_final)).toEqual([1000, 1400, -200, -300]);
    expect(base.meses.map((m) => m.entradas)).toEqual([0, 3200, 1200, 1200]);
    expect(base.meses.map((m) => m.saidas)).toEqual([0, 2800, 2800, 1300]);
    expect(base.menor_saldo).toBe(-1500);
    expect(base.mes_mais_apertado).toBe("2027-02");
  });

  it("cenario pessimista remove a fonte mais fragil", () => {
    const pess = cenario(proj, "pessimista");
    expect(pess.meses.map((m) => m.saldo_final)).toEqual([1000, -600, -2200, -2300]);
    expect(pess.menor_saldo).toBe(-3500);
    expect(pess.mes_mais_apertado).toBe("2027-02");
    expect(proj.fonte_mais_fragil?.nome).toBe("Emprego");
    expect(proj.fonte_mais_fragil?.motivo).toContain("2026-12-31");
  });

  it("cenario otimista soma fontes incertas e ajuda confirmada", () => {
    const otim = cenario(proj, "otimista");
    expect(otim.meses.map((m) => m.saldo_final)).toEqual([1000, 3050, 3100, 3900]);
    expect(otim.menor_saldo).toBe(-300);
    expect(otim.mes_mais_apertado).toBe("2026-12");
  });

  it("calendario de 60 dias usa o cenario base, entradas antes de saidas", () => {
    expect(proj.calendario_60d).toEqual([
      { data: "2026-12-01", tipo: "conta", descricao: "Contas fixas", valor: -1300 },
      { data: "2026-12-05", tipo: "entrada", descricao: "Emprego", valor: 2000 },
      { data: "2026-12-10", tipo: "entrada", descricao: "Cliente A", valor: 1200 },
      { data: "2026-12-15", tipo: "parcela", descricao: "Notebook (parcela 1)", valor: -1500 },
      { data: "2027-01-01", tipo: "conta", descricao: "Contas fixas", valor: -1300 },
    ]);
  });

  it("provisao divide a parcela pelas entradas ate o vencimento", () => {
    expect(proj.provisoes).toEqual([
      { parcela_id: "p1", descricao: "Notebook (parcela 1)", vencimento: "2026-12-15", valor: 1500, entradas_ate_vencimento: 2, fatia_por_entrada: 750 },
      { parcela_id: "p2", descricao: "Notebook (parcela 2)", vencimento: "2027-01-15", valor: 1500, entradas_ate_vencimento: 3, fatia_por_entrada: 500 },
    ]);
  });

  it("sobra estrutural com e sem a fonte mais fragil", () => {
    expect(proj.sobra_estrutural).toEqual({
      renda_garantida: 3200,
      custo_fixo: 1300,
      provisoes_mensais: 1000,
      sobra: 900,
      sobra_sem_fonte_fragil: -1100,
    });
  });
});

describe("projetarCaixa - bordas", () => {
  it("limita o vencimento dia 31 ao ultimo dia do mes", () => {
    const ficha: FichaProjecao = { ...vazia, gastosFixos: [{ nome: "Aluguel", valor: 100, dia_vencimento: 31, ativo: true }] };
    const { calendario_60d } = projetarCaixa(ficha, 1000, "2026-04-10", 1);
    expect(calendario_60d).toContainEqual({ data: "2026-04-30", tipo: "conta", descricao: "Aluguel", valor: -100 });
    expect(calendario_60d).toContainEqual({ data: "2026-05-31", tipo: "conta", descricao: "Aluguel", valor: -100 });
  });

  it("fonte sem dia de pagamento cai no ultimo dia do mes", () => {
    const ficha: FichaProjecao = { ...vazia, fontes: [fonte({ id: "f", nome: "Freela", valor: 500, tipo: "fixa", dia_pagamento: null })] };
    const { calendario_60d } = projetarCaixa(ficha, 0, "2026-11-10", 1);
    expect(calendario_60d).toContainEqual({ data: "2026-11-30", tipo: "entrada", descricao: "Freela", valor: 500 });
  });

  it("parcela vencida e nao paga sai no dia de hoje", () => {
    const ficha: FichaProjecao = { ...vazia, parcelas: [parcela({ id: "p", numero: 1, valor: 300, vencimento: "2026-11-01" })] };
    const { calendario_60d } = projetarCaixa(ficha, 1000, "2026-11-10", 1);
    expect(calendario_60d).toContainEqual({ data: "2026-11-10", tipo: "parcela", descricao: "Notebook (parcela 1)", valor: -300 });
  });

  it("entrada confirmada da fonte substitui a ocorrencia do mes", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      fontes: [fonte({ id: "f1", nome: "Cliente", valor: 1200, tipo: "contrato" })],
      entradas: [{ id: "e1", descricao: "Cliente (real)", valor: 1100, status: "confirmado", data_prevista: "2026-12-10", fonte_id: "f1" }],
    };
    const { calendario_60d } = projetarCaixa(ficha, 0, "2026-11-10", 1);
    const em1210 = calendario_60d.filter((e) => e.data === "2026-12-10" && e.tipo === "entrada");
    expect(em1210).toEqual([{ data: "2026-12-10", tipo: "entrada", descricao: "Cliente (real)", valor: 1100 }]);
  });

  it("ignora entrada recebida e so conta a incerta no otimista", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      entradas: [
        { id: "e1", descricao: "Ja caiu", valor: 700, status: "recebido", data_prevista: "2026-11-20", fonte_id: null },
        { id: "e2", descricao: "Talvez", valor: 400, status: "incerto", data_prevista: "2026-11-20", fonte_id: null },
      ],
    };
    const p = projetarCaixa(ficha, 100, "2026-11-10", 1);
    expect(cenario(p, "base").meses[0].saldo_final).toBe(100);
    expect(cenario(p, "pessimista").meses[0].saldo_final).toBe(100);
    expect(cenario(p, "otimista").meses[0].saldo_final).toBe(500);
  });

  it("ajuda recebida nao vira entrada no otimista", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      parcelas: [parcela({ id: "p", numero: 1, valor: 1000, vencimento: "2026-11-20", parte_terceiros: 500, status_ajuda: "recebida" })],
    };
    const p = projetarCaixa(ficha, 2000, "2026-11-10", 1);
    expect(cenario(p, "otimista").meses[0].saldo_final).toBe(1000);
  });

  it("sem ativo_ate a fonte mais fragil e a contrato de maior valor", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      fontes: [
        fonte({ id: "c1", nome: "Contrato 800", valor: 800, tipo: "contrato" }),
        fonte({ id: "c2", nome: "Contrato 1200", valor: 1200, tipo: "contrato" }),
      ],
    };
    const p = projetarCaixa(ficha, 0, "2026-11-01", 1);
    expect(p.fonte_mais_fragil?.nome).toBe("Contrato 1200");
    expect(cenario(p, "pessimista").meses[0].entradas).toBe(800);
    expect(cenario(p, "base").meses[0].entradas).toBe(2000);
  });

  it("ficha vazia devolve o saldo constante sem quebrar", () => {
    const p = projetarCaixa(vazia, 500, "2026-11-10");
    for (const c of p.cenarios) {
      expect(c.meses.map((m) => m.saldo_final)).toEqual([500, 500, 500, 500]);
      expect(c.menor_saldo).toBe(500);
    }
    expect(p.fonte_mais_fragil).toBeNull();
    expect(p.provisoes).toEqual([]);
    expect(p.calendario_60d).toEqual([]);
    expect(p.sobra_estrutural.sobra).toBe(0);
  });
});

describe("projetarCaixa - meses parciais", () => {
  it("rotula o primeiro e o ultimo mes como parciais e informa o periodo coberto", () => {
    const base = cenario(projetarCaixa(exemploDoPrompt, 1000, "2026-11-10"), "base");
    expect(base.meses.map((m) => m.parcial)).toEqual([true, false, false, true]);
    expect(base.meses[0]).toMatchObject({ de: "2026-11-10", ate: "2026-11-30" });
    expect(base.meses[1]).toMatchObject({ de: "2026-12-01", ate: "2026-12-31" });
    expect(base.meses[3]).toMatchObject({ de: "2027-02-01", ate: "2027-02-10" });
  });

  it("nao marca como parcial o primeiro mes quando hoje e dia 1", () => {
    const meses = cenario(projetarCaixa(vazia, 100, "2026-11-01", 1), "base").meses;
    expect(meses.map((m) => m.parcial)).toEqual([false, true]);
    expect(meses[1]).toMatchObject({ de: "2026-12-01", ate: "2026-12-01" });
  });
});

describe("projetarCaixa - renda recorrente ja recebida", () => {
  const salario = fonte({ id: "f1", nome: "Salario", valor: 1200, tipo: "contrato", dia_pagamento: 5 });
  const entradasDatas = (p: ReturnType<typeof projetarCaixa>) =>
    p.calendario_60d.filter((e) => e.tipo === "entrada").map((e) => e.data);

  it("entrada recebida da fonte no mes tira a ocorrencia daquele mes", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      fontes: [salario],
      entradas: [{ id: "e1", descricao: "Salario", valor: 1200, status: "recebido", data_prevista: null, data_recebida: "2026-11-03", fonte_id: "f1" }],
    };
    const p = projetarCaixa(ficha, 5000, "2026-11-03", 1);
    expect(entradasDatas(p)).toEqual(["2026-12-05"]);
    expect(cenario(p, "base").meses[0].entradas).toBe(0);
  });

  it("recebida sem data_recebida conta como recebida no mes de hoje", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      fontes: [salario],
      entradas: [{ id: "e1", descricao: "Salario", valor: 1200, status: "recebido", data_prevista: null, data_recebida: null, fonte_id: "f1" }],
    };
    expect(entradasDatas(projetarCaixa(ficha, 5000, "2026-11-03", 1))).toEqual(["2026-12-05"]);
  });

  it("recebida de outro mes nao tira a ocorrencia deste mes", () => {
    const ficha: FichaProjecao = {
      ...vazia,
      fontes: [salario],
      entradas: [{ id: "e1", descricao: "Salario", valor: 1200, status: "recebido", data_prevista: null, data_recebida: "2026-10-05", fonte_id: "f1" }],
    };
    expect(entradasDatas(projetarCaixa(ficha, 5000, "2026-11-03", 1))).toEqual(["2026-11-05", "2026-12-05"]);
  });
});
