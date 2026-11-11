import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { executarFerramenta } from "./executar-ferramenta";

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const UUID2 = "223e4567-e89b-42d3-a456-426614174000";
const HOJE = "2026-11-10";

interface Chamada {
  tabela: string;
  metodo: string;
  args: unknown[];
}

function criarSupabase(opts: {
  tabelas?: Record<string, unknown>;
  rpc?: { data?: unknown; error?: unknown };
  rpcLanca?: boolean;
} = {}) {
  const chamadas: Chamada[] = [];
  const from = vi.fn((tabela: string) => {
    const resultado = { data: opts.tabelas?.[tabela] ?? [], error: null };
    const cadeia: unknown = new Proxy(function () {}, {
      get: (_alvo, prop) => {
        if (prop === "then") return (res: (v: unknown) => unknown) => Promise.resolve(resultado).then(res);
        return (...args: unknown[]) => {
          chamadas.push({ tabela, metodo: String(prop), args });
          return cadeia;
        };
      },
    });
    return cadeia;
  });
  const rpc = vi.fn((nome: string, args: unknown) => {
    if (opts.rpcLanca) throw new Error("conexao caiu");
    chamadas.push({ tabela: "rpc", metodo: nome, args: [args] });
    const resultado = { data: opts.rpc?.data ?? null, error: opts.rpc?.error ?? null };
    return Object.assign(Promise.resolve(resultado), { single: () => Promise.resolve(resultado) });
  });
  return { supabase: { from, rpc } as unknown as SupabaseClient, from, rpc, chamadas };
}

describe("executarFerramenta - RPCs", () => {
  it("movimentar_caixinha chama a RPC com os parametros p_*", async () => {
    const { supabase, rpc } = criarSupabase({ rpc: { data: { saldo_caixinha: 2500 } } });
    const r = await executarFerramenta(
      "movimentar_caixinha",
      { caixinha_id: UUID, tipo: "retirada", valor: 300, devolver_ate: "2026-12-05" },
      supabase,
      HOJE
    );
    expect(r).toEqual({ saldo_caixinha: 2500 });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("movimentar_caixinha", {
      p_caixinha_id: UUID,
      p_tipo: "retirada",
      p_valor: 300,
      p_motivo: null,
      p_devolver_ate: "2026-12-05",
      p_entrada_id: null,
    });
  });

  it("registrar_devolucao chama a RPC certa", async () => {
    const { supabase, rpc } = criarSupabase({ rpc: { data: { restante: 0 } } });
    await executarFerramenta("registrar_devolucao", { emprestimo_id: UUID, valor: 200 }, supabase, HOJE);
    expect(rpc).toHaveBeenCalledWith("registrar_devolucao", { p_emprestimo_id: UUID, p_valor: 200 });
  });

  it("registrar_compromisso manda as parcelas como jsonb", async () => {
    const { supabase, rpc } = criarSupabase({ rpc: { data: {} } });
    const parcelas = [{ numero: 1, valor: 1500, vencimento: "2026-12-15", parte_usuario: 1500 }];
    await executarFerramenta("registrar_compromisso", { nome: "Notebook", tipo: "parcela", parcelas }, supabase, HOJE);
    expect(rpc).toHaveBeenCalledWith("registrar_compromisso", {
      p_nome: "Notebook",
      p_tipo: "parcela",
      p_credor: null,
      p_parcelas: parcelas,
    });
  });

  it("salvar_caixinha sem id usa criar_caixinha", async () => {
    const { supabase, rpc } = criarSupabase({ rpc: { data: {} } });
    await executarFerramenta(
      "salvar_caixinha",
      { nome: "Reserva", tipo: "protecao", saldo_inicial: 3000 },
      supabase,
      HOJE
    );
    expect(rpc).toHaveBeenCalledWith("criar_caixinha", {
      p_nome: "Reserva",
      p_tipo: "protecao",
      p_meta: null,
      p_prioridade: null,
      p_teto_mensal: null,
      p_saldo_inicial: 3000,
    });
  });

  it("calcular_dinheiro_livre usa a funcao dinheiro_livre_real", async () => {
    const { supabase, rpc } = criarSupabase({ rpc: { data: { dinheiro_livre: 100 } } });
    const r = await executarFerramenta("calcular_dinheiro_livre", { saldo_conta: 1000, ate: "2026-12-05" }, supabase, HOJE);
    expect(r).toEqual({ dinheiro_livre: 100 });
    expect(rpc).toHaveBeenCalledWith("dinheiro_livre_real", { p_saldo_conta: 1000, p_ate: "2026-12-05" });
  });
});

describe("executarFerramenta - erros", () => {
  it("input invalido nao toca o supabase", async () => {
    const { supabase, rpc, from } = criarSupabase();
    const r = await executarFerramenta(
      "registrar_entrada",
      { descricao: "x", valor: "1.458", status: "recebido" },
      supabase,
      HOJE
    );
    expect(r).toEqual({ erro: 'Campo "valor" deve ser um número.' });
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("repassa a mensagem das excecoes das RPCs", async () => {
    const msg = 'Saldo insuficiente: a caixinha "Reserva" tem só R$ 100.';
    const { supabase } = criarSupabase({ rpc: { error: { code: "P0001", message: msg } } });
    const r = await executarFerramenta(
      "movimentar_caixinha",
      { caixinha_id: UUID, tipo: "retirada", valor: 900, devolver_ate: "2026-12-05" },
      supabase,
      HOJE
    );
    expect(r).toEqual({ erro: msg });
  });

  it("nao repassa texto bruto de erros desconhecidos", async () => {
    const { supabase } = criarSupabase({ rpc: { error: { code: "XX000", message: "boom interno" } } });
    const r = (await executarFerramenta("registrar_devolucao", { emprestimo_id: UUID, valor: 1 }, supabase, HOJE)) as {
      erro: string;
    };
    expect(r.erro).toBe("Não consegui gravar agora. Tente de novo em instantes.");
    expect(r.erro).not.toContain("boom");
  });

  it("ferramenta desconhecida vira erro", async () => {
    const { supabase } = criarSupabase();
    expect(await executarFerramenta("nao_existe", {}, supabase, HOJE)).toEqual({
      erro: "Ferramenta desconhecida: nao_existe",
    });
  });

  it("excecao do cliente vira erro sem lancar", async () => {
    const { supabase } = criarSupabase({ rpcLanca: true });
    const r = (await executarFerramenta("registrar_devolucao", { emprestimo_id: UUID, valor: 1 }, supabase, HOJE)) as {
      erro: string;
    };
    expect(r.erro).toBe("Não consegui gravar agora. Tente de novo em instantes.");
  });

  it("projetar_caixa rejeita horizonte fora de 1 a 6", async () => {
    const { supabase } = criarSupabase();
    expect(await executarFerramenta("projetar_caixa", { saldo_conta: 100, horizonte_meses: 7 }, supabase, HOJE)).toEqual({
      erro: 'Campo "horizonte_meses" deve estar entre 1 e 6.',
    });
  });
});

describe("executarFerramenta - tabelas", () => {
  it("registrar_entrada insere so os campos permitidos", async () => {
    const { supabase, chamadas } = criarSupabase({ tabelas: { entradas: { id: UUID } } });
    await executarFerramenta(
      "registrar_entrada",
      { descricao: "Cliente", valor: 1000, status: "recebido", user_id: "intruso" },
      supabase,
      HOJE
    );
    const insert = chamadas.find((c) => c.tabela === "entradas" && c.metodo === "insert");
    expect(insert?.args[0]).toEqual({ descricao: "Cliente", valor: 1000, status: "recebido" });
  });

  it("atualizar_entrada atualiza por id sem gravar o id no corpo", async () => {
    const { supabase, chamadas } = criarSupabase({ tabelas: { entradas: { id: UUID } } });
    await executarFerramenta("atualizar_entrada", { id: UUID, status: "recebido", data_recebida: "2026-11-10" }, supabase, HOJE);
    const update = chamadas.find((c) => c.tabela === "entradas" && c.metodo === "update");
    const eq = chamadas.find((c) => c.tabela === "entradas" && c.metodo === "eq");
    expect(update?.args[0]).toEqual({ status: "recebido", data_recebida: "2026-11-10" });
    expect(eq?.args).toEqual(["id", UUID]);
  });

  it("salvar_caixinha com id atualiza e ignora saldo_inicial", async () => {
    const { supabase, chamadas, rpc } = criarSupabase({ tabelas: { caixinhas: { id: UUID } } });
    await executarFerramenta("salvar_caixinha", { id: UUID, nome: "Reserva", tipo: "protecao", saldo_inicial: 999 }, supabase, HOJE);
    const update = chamadas.find((c) => c.tabela === "caixinhas" && c.metodo === "update");
    expect(update?.args[0]).toEqual({ nome: "Reserva", tipo: "protecao" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("salvar_perfil faz upsert com atualizado_em", async () => {
    const { supabase, chamadas } = criarSupabase({ tabelas: { perfil_financeiro: {} } });
    await executarFerramenta("salvar_perfil", { estabilidade_renda: "contratos", meta_reserva_meses: 6 }, supabase, HOJE);
    const upsert = chamadas.find((c) => c.tabela === "perfil_financeiro" && c.metodo === "upsert");
    expect(upsert?.args[0]).toMatchObject({ estabilidade_renda: "contratos", meta_reserva_meses: 6 });
    expect(typeof (upsert?.args[0] as Record<string, unknown>).atualizado_em).toBe("string");
  });
});

describe("executarFerramenta - leitura", () => {
  it("ler_ficha_financeira devolve uma chave por tabela e limita a janela a 60 dias", async () => {
    const { supabase, chamadas } = criarSupabase({ tabelas: { caixinhas: [{ id: UUID2 }] } });
    const ficha = (await executarFerramenta("ler_ficha_financeira", {}, supabase, HOJE)) as Record<string, unknown>;
    expect(Object.keys(ficha).sort()).toEqual(
      [
        "caixinhas",
        "compromissos",
        "emprestimos_caixinha",
        "entradas_recentes",
        "fontes_renda",
        "gastos_fixos",
        "movimentacoes",
        "painel_saude",
        "parcelas",
        "perfil_financeiro",
      ].sort()
    );
    expect(ficha.caixinhas).toEqual([{ id: UUID2 }]);
    const corte = "2026-09-11";
    expect(chamadas).toContainEqual({ tabela: "parcelas", metodo: "or", args: [`pago.eq.false,vencimento.gte.${corte}`] });
    expect(chamadas).toContainEqual({
      tabela: "emprestimos_caixinha",
      metodo: "or",
      args: [`quitado.eq.false,data_retirada.gte.${corte}`],
    });
    expect(chamadas).toContainEqual({ tabela: "movimentacoes", metodo: "gte", args: ["data", corte] });
    expect(chamadas).toContainEqual({ tabela: "entradas", metodo: "limit", args: [20] });
  });

  it("projetar_caixa monta a ficha a partir das tabelas e devolve os 3 cenarios", async () => {
    const { supabase } = criarSupabase({
      tabelas: {
        fontes_renda: [
          { id: "f1", nome: "Cliente A", valor: 1200, dia_pagamento: 10, tipo: "contrato", ativo_ate: null, ativo: true },
        ],
        gastos_fixos: [{ nome: "Contas", valor: 1300, dia_vencimento: 1, ativo: true }],
        parcelas: [
          {
            id: "p1",
            numero: 1,
            valor: 1500,
            vencimento: "2026-12-15",
            parte_terceiros: 750,
            status_ajuda: "confirmada",
            pago: false,
            compromissos: { nome: "Notebook" },
          },
        ],
        emprestimos_caixinha: [],
        entradas: [],
      },
    });
    const r = (await executarFerramenta("projetar_caixa", { saldo_conta: 1000 }, supabase, HOJE)) as {
      cenarios: { nome: string }[];
      calendario_60d: { descricao: string }[];
    };
    expect(r.cenarios.map((c) => c.nome)).toEqual(["pessimista", "base", "otimista"]);
    expect(r.calendario_60d.map((e) => e.descricao)).toContain("Notebook (parcela 1)");
  });
});
