import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buscarContas,
  buscarTransacoes,
  deveVirarGasto,
  mapearTransacao,
  type GastoImportado,
} from "./open-finance";
import type { Banco, Gasto } from "./types";

/**
 * Sincronização de saldo e transações. Roda fora do ciclo de request do usuário
 * (webhook e cron), então usa o service client e sempre recebe o `user_id` do
 * banco já resolvido — nunca de um payload externo.
 */

/** Janela padrão de importação. Cobre atraso de liquidação sem varrer o histórico inteiro. */
const DIAS_JANELA = 30;

/** Tolerância de centavos ao casar transação com gasto manual. */
const TOLERANCIA_VALOR = 0.01;

/** Dias de folga entre a data da transação e a do gasto manual equivalente. */
const TOLERANCIA_DIAS = 3;

export type ResultadoSync = {
  bancos: number;
  saldosAtualizados: number;
  gastosImportados: number;
  gastosConciliados: number;
  erros: string[];
};

function janelaInicial(): Date {
  const d = new Date();
  d.setDate(d.getDate() - DIAS_JANELA);
  return d;
}

/**
 * Casa uma transação importada com um gasto que o usuário já digitou à mão.
 * Sem isso, quem registra os gastos manualmente veria tudo duplicado no primeiro
 * sync. Em vez de criar outro gasto, marcamos o existente como sendo aquela
 * transação — o índice único então impede que ela entre de novo.
 */
function acharGastoEquivalente(
  importado: GastoImportado,
  candidatos: Gasto[]
): Gasto | undefined {
  const dataImportada = new Date(importado.data).getTime();
  const folga = TOLERANCIA_DIAS * 24 * 60 * 60 * 1000;

  return candidatos.find((g) => {
    if (g.provider_transaction_id) return false;
    // Recorrente e parcelado são modelos de lançamento repetido, não uma compra
    // única: casar um deles com a transação deste mês travaria a importação dos
    // meses seguintes e ainda apagaria o caráter recorrente do gasto.
    if (g.recorrente || g.parcelas_total) return false;
    if (Math.abs(g.valor - importado.valor) > TOLERANCIA_VALOR) return false;
    const dataGasto = new Date(g.created_at).getTime();
    return Math.abs(dataGasto - dataImportada) <= folga;
  });
}

async function sincronizarBanco(
  supabase: SupabaseClient,
  banco: Banco,
  resultado: ResultadoSync
): Promise<void> {
  if (!banco.provider_account_id || !banco.provider_item_id) return;

  const transacoes = await buscarTransacoes(banco.provider_account_id, janelaInicial());
  const importaveis = transacoes.filter(deveVirarGasto).map(mapearTransacao);
  if (importaveis.length === 0) return;

  // Só os gastos deste banco podem ser conciliados: valor igual em contas
  // diferentes são compras diferentes.
  const { data: existentes } = await supabase
    .from("gastos")
    .select("*")
    .eq("user_id", banco.user_id)
    .eq("banco_id", banco.id);

  const candidatos = (existentes ?? []) as Gasto[];
  const jaImportadas = new Set(
    candidatos.map((g) => g.provider_transaction_id).filter(Boolean) as string[]
  );

  const novos: Record<string, unknown>[] = [];
  const conciliados: { id: string; provider_transaction_id: string }[] = [];
  const usados = new Set<string>();

  for (const t of importaveis) {
    if (jaImportadas.has(t.provider_transaction_id)) continue;

    const equivalente = acharGastoEquivalente(
      t,
      candidatos.filter((g) => !usados.has(g.id))
    );

    if (equivalente) {
      usados.add(equivalente.id);
      conciliados.push({
        id: equivalente.id,
        provider_transaction_id: t.provider_transaction_id,
      });
      continue;
    }

    novos.push({
      user_id: banco.user_id,
      nome: t.nome,
      valor: t.valor,
      categoria: t.categoria,
      subcategoria: null,
      recorrente: false,
      dia_recorrencia: null,
      parcelas_total: null,
      parcela_inicio: null,
      banco_id: banco.id,
      origem: "open_finance",
      provider_transaction_id: t.provider_transaction_id,
      // Sugestão do provider; o usuário confirma o bucket 50/30/20 depois.
      categoria_confirmada: false,
      created_at: t.data,
    });
  }

  for (const c of conciliados) {
    const { error } = await supabase
      .from("gastos")
      .update({ provider_transaction_id: c.provider_transaction_id })
      .eq("id", c.id);
    if (!error) resultado.gastosConciliados++;
  }

  if (novos.length > 0) {
    // `ignoreDuplicates` deixa o índice único absorver a reentrega do webhook em
    // vez de estourar a importação inteira.
    const { data, error } = await supabase
      .from("gastos")
      .upsert(novos, {
        onConflict: "user_id,provider_transaction_id",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) resultado.erros.push(`gastos ${banco.nome}: ${error.message}`);
    else resultado.gastosImportados += data?.length ?? 0;
  }
}

/**
 * Sincroniza todas as contas de um item. `item/updated` chega por item, não por
 * conta, e um item pode ter conta corrente + cartão.
 */
export async function sincronizarItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<ResultadoSync> {
  const resultado: ResultadoSync = {
    bancos: 0,
    saldosAtualizados: 0,
    gastosImportados: 0,
    gastosConciliados: 0,
    erros: [],
  };

  const { data: bancos } = await supabase
    .from("bancos")
    .select("*")
    .eq("provider_item_id", itemId);

  const lista = (bancos ?? []) as Banco[];
  resultado.bancos = lista.length;
  if (lista.length === 0) return resultado;

  const agora = new Date().toISOString();

  let contas;
  try {
    contas = await buscarContas(itemId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro ao buscar contas";
    resultado.erros.push(msg);
    // Marca o erro para a UI mostrar o selo vermelho em vez de um saldo velho
    // que parece atual.
    await supabase
      .from("bancos")
      .update({ sync_status: "erro" })
      .eq("provider_item_id", itemId);
    return resultado;
  }

  const saldoPorConta = new Map(contas.map((c) => [c.provider_account_id, c.saldo]));

  for (const banco of lista) {
    const saldo = saldoPorConta.get(banco.provider_account_id ?? "");

    if (saldo !== undefined) {
      const { error } = await supabase
        .from("bancos")
        .update({
          saldo,
          saldo_atualizado_em: agora,
          sincronizado_em: agora,
          sync_status: "ok",
        })
        .eq("id", banco.id);
      if (!error) resultado.saldosAtualizados++;
    }

    try {
      await sincronizarBanco(supabase, banco, resultado);
    } catch (e) {
      resultado.erros.push(
        `${banco.nome}: ${e instanceof Error ? e.message : "erro ao importar transações"}`
      );
    }
  }

  return resultado;
}

/** Marca as contas de um item como falhas — usado no evento `item/error`. */
export async function marcarErroItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<void> {
  await supabase
    .from("bancos")
    .update({ sync_status: "erro" })
    .eq("provider_item_id", itemId);
}
