import { describe, expect, it } from "vitest";
import { FERRAMENTAS, buscarFerramenta, ROTULOS_FERRAMENTA } from "./ferramentas";
import { mensagemDeErro, validarInput } from "./validacao";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

function def(nome: string) {
  const f = buscarFerramenta(nome);
  if (!f) throw new Error(`ferramenta ausente: ${nome}`);
  return f;
}

describe("FERRAMENTAS", () => {
  it("expoe as 13 ferramentas, cada uma com rotulo de status", () => {
    expect(FERRAMENTAS).toHaveLength(13);
    expect(FERRAMENTAS.map((f) => f.name)).toContain("projetar_caixa");
    for (const f of FERRAMENTAS) expect(ROTULOS_FERRAMENTA[f.name]).toBeTruthy();
  });

  it("projetar_caixa exige saldo_conta", () => {
    expect(def("projetar_caixa").input_schema.required).toEqual(["saldo_conta"]);
  });
});

describe("validarInput", () => {
  it("descarta campos fora do schema", () => {
    const r = validarInput(def("salvar_gasto_fixo"), {
      nome: "Aluguel",
      valor: 900,
      dia_vencimento: 5,
      categoria: "necessidade",
      user_id: "outro-usuario",
    });
    expect(r).toEqual({
      ok: true,
      dados: { nome: "Aluguel", valor: 900, dia_vencimento: 5, categoria: "necessidade" },
    });
  });

  it("exige campo obrigatorio", () => {
    expect(validarInput(def("salvar_gasto_fixo"), { valor: 1, dia_vencimento: 1, categoria: "necessidade" })).toEqual({
      ok: false,
      erro: 'Campo obrigatório ausente: "nome".',
    });
  });

  it.each([["1.458"], [Number.NaN], [Number.POSITIVE_INFINITY]])("rejeita valor %j que nao e numero finito", (valor) => {
    expect(validarInput(def("registrar_entrada"), { descricao: "x", valor, status: "recebido" })).toEqual({
      ok: false,
      erro: 'Campo "valor" deve ser um número.',
    });
  });

  it("rejeita inteiro fracionado", () => {
    expect(
      validarInput(def("salvar_gasto_fixo"), { nome: "x", valor: 1, dia_vencimento: 5.5, categoria: "necessidade" })
    ).toEqual({ ok: false, erro: 'Campo "dia_vencimento" deve ser um número inteiro.' });
  });

  it("rejeita valor fora do enum", () => {
    expect(
      validarInput(def("salvar_gasto_fixo"), { nome: "x", valor: 1, dia_vencimento: 5, categoria: "luxo" })
    ).toEqual({ ok: false, erro: 'Campo "categoria" deve ser um de: necessidade, qualidade_vida.' });
  });

  it.each([["amanhã"], ["2026-02-30"]])("rejeita data invalida %j", (data) => {
    expect(
      validarInput(def("movimentar_caixinha"), { caixinha_id: UUID, tipo: "retirada", valor: 10, devolver_ate: data })
    ).toEqual({ ok: false, erro: 'Campo "devolver_ate" deve ser uma data AAAA-MM-DD válida.' });
  });

  it("rejeita id que nao e uuid", () => {
    expect(validarInput(def("movimentar_caixinha"), { caixinha_id: "abc", tipo: "aporte", valor: 10 })).toEqual({
      ok: false,
      erro: 'Campo "caixinha_id" deve ser um id válido.',
    });
  });

  it("aceita movimentacao valida", () => {
    const r = validarInput(def("movimentar_caixinha"), {
      caixinha_id: UUID,
      tipo: "retirada",
      valor: 300,
      devolver_ate: "2026-12-05",
    });
    expect(r.ok).toBe(true);
  });

  it("valida os itens de parcelas e cita o indice", () => {
    const r = validarInput(def("registrar_compromisso"), {
      nome: "Notebook",
      tipo: "parcela",
      parcelas: [{ numero: 1, valor: 1500, vencimento: "2026-12-15" }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toContain("parcelas[0]");
      expect(r.erro).toContain("parte_usuario");
    }
  });

  it.each([[null], ["texto"], [[1, 2]]])("rejeita entrada que nao e objeto: %j", (entrada) => {
    expect(validarInput(def("ler_ficha_financeira"), entrada)).toEqual({
      ok: false,
      erro: "Os dados da ferramenta precisam ser um objeto.",
    });
  });

  it("aceita objeto vazio em ferramenta sem parametros", () => {
    expect(validarInput(def("ler_ficha_financeira"), {})).toEqual({ ok: true, dados: {} });
  });
});

describe("mensagemDeErro", () => {
  it("repassa a mensagem de excecoes levantadas pelas RPCs", () => {
    expect(mensagemDeErro({ code: "P0001", message: "Caixinha não encontrada." })).toBe("Caixinha não encontrada.");
  });

  it("traduz violacao de check", () => {
    expect(mensagemDeErro({ code: "23514", message: 'new row violates check constraint "x"' })).toBe(
      "Algum valor está fora do permitido (ex.: zero ou negativo)."
    );
  });

  it("traduz registro nao encontrado", () => {
    expect(mensagemDeErro({ code: "PGRST116", message: "JSON object requested" })).toBe("Registro não encontrado.");
  });

  it("nunca repassa o texto bruto de outros erros", () => {
    const msg = mensagemDeErro({ code: "42P01", message: 'relation "x" does not exist' });
    expect(msg).toBe("Não consegui gravar agora. Tente de novo em instantes.");
    expect(mensagemDeErro(new Error("boom interno"))).toBe("Não consegui gravar agora. Tente de novo em instantes.");
  });
});
