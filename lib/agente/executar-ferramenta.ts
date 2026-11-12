import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeSaoPaulo, somarDias } from "./datas";
import { buscarFerramenta } from "./ferramentas";
import { projetarCaixa, type FichaProjecao } from "./projecao";
import { mensagemDeErro, validarInput } from "./validacao";

type Dados = Record<string, unknown>;

const nulo = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

async function ler(consulta: PromiseLike<{ data: unknown; error: unknown }>): Promise<unknown> {
  const { data, error } = await consulta;
  if (error) throw error;
  return data;
}

async function salvar(supabase: SupabaseClient, tabela: string, dados: Dados): Promise<unknown> {
  const { id, ...campos } = dados;
  const consulta = id
    ? supabase.from(tabela).update(campos).eq("id", id)
    : supabase.from(tabela).insert(campos);
  return ler(consulta.select().single());
}

async function chamarRpc(supabase: SupabaseClient, nome: string, args: Dados): Promise<unknown> {
  return ler(supabase.rpc(nome, args));
}

async function lerFicha(supabase: SupabaseClient, hoje: string): Promise<Dados> {
  const corte = somarDias(hoje, -60);
  const [
    perfil_financeiro,
    fontes_renda,
    gastos_fixos,
    caixinhas,
    compromissos,
    painel_saude,
    parcelas,
    emprestimos_caixinha,
    movimentacoes,
    entradas_recentes,
  ] = await Promise.all([
    ler(supabase.from("perfil_financeiro").select("*")),
    ler(supabase.from("fontes_renda").select("*")),
    ler(supabase.from("gastos_fixos").select("*")),
    ler(supabase.from("caixinhas").select("*")),
    ler(supabase.from("compromissos").select("*")),
    ler(supabase.from("painel_saude").select("*")),
    ler(supabase.from("parcelas").select("*").or(`pago.eq.false,vencimento.gte.${corte}`)),
    ler(supabase.from("emprestimos_caixinha").select("*").or(`quitado.eq.false,data_retirada.gte.${corte}`)),
    ler(supabase.from("movimentacoes").select("*").gte("data", corte).order("data", { ascending: false })),
    ler(supabase.from("entradas").select("*").order("criado_em", { ascending: false }).limit(20)),
  ]);
  return {
    perfil_financeiro,
    fontes_renda,
    gastos_fixos,
    caixinhas,
    compromissos,
    parcelas,
    emprestimos_caixinha,
    movimentacoes,
    painel_saude,
    entradas_recentes,
  };
}

async function carregarFichaProjecao(supabase: SupabaseClient, hoje: string): Promise<FichaProjecao> {
  const [fontes, gastos, parcelas, emprestimos, entradas] = (await Promise.all([
    ler(supabase.from("fontes_renda").select("id, nome, valor, dia_pagamento, tipo, ativo_ate, ativo")),
    ler(supabase.from("gastos_fixos").select("nome, valor, dia_vencimento, ativo")),
    ler(
      supabase
        .from("parcelas")
        .select("id, numero, valor, vencimento, parte_terceiros, status_ajuda, pago, compromissos(nome)")
        .eq("pago", false)
    ),
    ler(
      supabase
        .from("emprestimos_caixinha")
        .select("id, valor, valor_devolvido, devolver_ate, quitado")
        .eq("quitado", false)
    ),
    ler(
      supabase
        .from("entradas")
        .select("id, descricao, valor, status, data_prevista, data_recebida, fonte_id")
        .or(`status.neq.recebido,criado_em.gte.${somarDias(hoje, -35)}`)
    ),
  ])) as Dados[][];

  return {
    fontes: fontes.map((f) => ({
      id: String(f.id),
      nome: String(f.nome),
      valor: Number(f.valor),
      dia_pagamento: f.dia_pagamento === null ? null : Number(f.dia_pagamento),
      tipo: f.tipo as FichaProjecao["fontes"][number]["tipo"],
      ativo_ate: (f.ativo_ate as string | null) ?? null,
      ativo: Boolean(f.ativo),
    })),
    gastosFixos: gastos.map((g) => ({
      nome: String(g.nome),
      valor: Number(g.valor),
      dia_vencimento: Number(g.dia_vencimento),
      ativo: Boolean(g.ativo),
    })),
    parcelas: parcelas.map((p) => {
      const compromisso = Array.isArray(p.compromissos) ? p.compromissos[0] : p.compromissos;
      return {
        id: String(p.id),
        compromisso_nome: String((compromisso as Dados | null)?.nome ?? "Compromisso"),
        numero: Number(p.numero),
        valor: Number(p.valor),
        vencimento: String(p.vencimento),
        parte_terceiros: Number(p.parte_terceiros),
        status_ajuda: p.status_ajuda as FichaProjecao["parcelas"][number]["status_ajuda"],
        pago: Boolean(p.pago),
      };
    }),
    emprestimos: emprestimos.map((e) => ({
      id: String(e.id),
      valor: Number(e.valor),
      valor_devolvido: Number(e.valor_devolvido),
      devolver_ate: String(e.devolver_ate),
      quitado: Boolean(e.quitado),
    })),
    entradas: entradas.map((e) => ({
      id: String(e.id),
      descricao: String(e.descricao),
      valor: Number(e.valor),
      status: e.status as FichaProjecao["entradas"][number]["status"],
      data_prevista: (e.data_prevista as string | null) ?? null,
      data_recebida: (e.data_recebida as string | null) ?? null,
      fonte_id: (e.fonte_id as string | null) ?? null,
    })),
  };
}

async function executar(
  nome: string,
  dados: Dados,
  supabase: SupabaseClient,
  hoje: string
): Promise<unknown> {
  switch (nome) {
    case "ler_ficha_financeira":
      return lerFicha(supabase, hoje);

    case "salvar_perfil":
      return ler(
        supabase
          .from("perfil_financeiro")
          .upsert({ ...dados, atualizado_em: new Date().toISOString() })
          .select()
          .single()
      );

    case "salvar_fonte_renda":
      return salvar(supabase, "fontes_renda", dados);
    case "registrar_entrada":
    case "atualizar_entrada":
      return salvar(supabase, "entradas", dados);
    case "salvar_gasto_fixo":
      return salvar(supabase, "gastos_fixos", dados);
    case "atualizar_parcela":
      return salvar(supabase, "parcelas", dados);

    case "salvar_caixinha": {
      const { saldo_inicial, ...campos } = dados;
      if (campos.id) return salvar(supabase, "caixinhas", campos);
      return chamarRpc(supabase, "criar_caixinha", {
        p_nome: campos.nome,
        p_tipo: campos.tipo,
        p_meta: nulo(campos.meta),
        p_prioridade: nulo(campos.prioridade),
        p_teto_mensal: nulo(campos.teto_mensal),
        p_saldo_inicial: nulo(saldo_inicial),
      });
    }

    case "movimentar_caixinha":
      return chamarRpc(supabase, "movimentar_caixinha", {
        p_caixinha_id: dados.caixinha_id,
        p_tipo: dados.tipo,
        p_valor: dados.valor,
        p_motivo: nulo(dados.motivo),
        p_devolver_ate: nulo(dados.devolver_ate),
        p_entrada_id: nulo(dados.entrada_id),
      });

    case "registrar_devolucao":
      return chamarRpc(supabase, "registrar_devolucao", {
        p_emprestimo_id: dados.emprestimo_id,
        p_valor: dados.valor,
      });

    case "registrar_compromisso":
      return chamarRpc(supabase, "registrar_compromisso", {
        p_nome: dados.nome,
        p_tipo: dados.tipo,
        p_credor: nulo(dados.credor),
        p_parcelas: dados.parcelas,
      });

    case "calcular_dinheiro_livre":
      return ler(
        supabase
          .rpc("dinheiro_livre_real", { p_saldo_conta: dados.saldo_conta, p_ate: dados.ate })
          .single()
      );

    case "projetar_caixa": {
      const horizonte = (dados.horizonte_meses as number | undefined) ?? 3;
      if (horizonte < 1 || horizonte > 6) {
        return { erro: 'Campo "horizonte_meses" deve estar entre 1 e 6.' };
      }
      const ficha = await carregarFichaProjecao(supabase, hoje);
      return projetarCaixa(ficha, dados.saldo_conta as number, hoje, horizonte);
    }

    default:
      return { erro: `Ferramenta desconhecida: ${nome}` };
  }
}

export async function executarFerramenta(
  nome: string,
  input: unknown,
  supabase: SupabaseClient,
  hoje: string = hojeSaoPaulo()
): Promise<unknown> {
  const def = buscarFerramenta(nome);
  if (!def) return { erro: `Ferramenta desconhecida: ${nome}` };

  const validado = validarInput(def, input);
  if (!validado.ok) return { erro: validado.erro };

  try {
    return await executar(nome, validado.dados, supabase, hoje);
  } catch (e) {
    return { erro: mensagemDeErro(e) };
  }
}
