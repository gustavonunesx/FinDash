// FinDash — executor das ferramentas do agente financeiro.
// Recebe o nome da ferramenta e o input que o modelo pediu, executa no
// Supabase e devolve o resultado para o modelo.
// Use SEMPRE o cliente Supabase com a sessão do usuário logado (não a
// service role key), para o RLS isolar os dados de cada usuário.

import type { SupabaseClient } from "@supabase/supabase-js";

type Input = Record<string, any>;

async function salvar(supabase: SupabaseClient, tabela: string, dados: Input) {
  const { id, ...campos } = dados;
  const query = id
    ? supabase.from(tabela).update(campos).eq("id", id)
    : supabase.from(tabela).insert(campos);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function executarFerramenta(
  nome: string,
  input: Input,
  supabase: SupabaseClient
): Promise<unknown> {
  try {
    switch (nome) {
      case "ler_ficha_financeira": {
        const tabelas = [
          "perfil_financeiro", "fontes_renda", "gastos_fixos", "caixinhas",
          "compromissos", "parcelas", "emprestimos_caixinha", "painel_saude",
        ];
        const ficha: Record<string, unknown> = {};
        for (const t of tabelas) {
          const { data, error } = await supabase.from(t).select("*");
          if (error) throw error;
          ficha[t] = data;
        }
        const { data: entradas, error } = await supabase
          .from("entradas").select("*")
          .order("criado_em", { ascending: false }).limit(20);
        if (error) throw error;
        ficha.entradas_recentes = entradas;
        return ficha;
      }

      case "salvar_perfil": {
        const { data, error } = await supabase
          .from("perfil_financeiro")
          .upsert({ ...input, atualizado_em: new Date().toISOString() })
          .select().single();
        if (error) throw error;
        return data;
      }

      case "salvar_fonte_renda":
        return await salvar(supabase, "fontes_renda", input);

      case "registrar_entrada":
        return await salvar(supabase, "entradas", input);

      case "atualizar_entrada":
        return await salvar(supabase, "entradas", input);

      case "salvar_gasto_fixo":
        return await salvar(supabase, "gastos_fixos", input);

      case "salvar_caixinha": {
        const { saldo_inicial, ...dados } = input;
        const caixinha = await salvar(supabase, "caixinhas", dados);
        if (!input.id && saldo_inicial && saldo_inicial > 0) {
          const { error } = await supabase.from("movimentacoes").insert({
            caixinha_id: caixinha.id, tipo: "aporte",
            valor: saldo_inicial, motivo: "Saldo inicial",
          });
          if (error) throw error;
          caixinha.saldo = saldo_inicial;
        }
        return caixinha;
      }

      case "movimentar_caixinha": {
        const { caixinha_id, tipo, valor, motivo, devolver_ate, entrada_id } = input;
        const { data: cx, error: e1 } = await supabase
          .from("caixinhas").select("id, nome, tipo, saldo").eq("id", caixinha_id).single();
        if (e1) throw e1;

        const viraEmprestimo = tipo === "retirada" && ["protecao", "meta"].includes(cx.tipo);
        if (viraEmprestimo && !devolver_ate) {
          return { erro: `Retirada da caixinha "${cx.nome}" exige devolver_ate. Combine a data com o usuário e chame de novo.` };
        }
        if (tipo === "retirada" && valor > Number(cx.saldo)) {
          return { erro: `A caixinha "${cx.nome}" tem só R$ ${cx.saldo}.` };
        }

        const { data: mov, error: e2 } = await supabase
          .from("movimentacoes")
          .insert({ caixinha_id, tipo, valor, motivo, entrada_id })
          .select().single();
        if (e2) throw e2;

        let emprestimo = null;
        if (viraEmprestimo) {
          const { data, error } = await supabase
            .from("emprestimos_caixinha")
            .insert({ caixinha_id, movimentacao_id: mov.id, valor, motivo, devolver_ate })
            .select().single();
          if (error) throw error;
          emprestimo = data;
        }
        return { movimentacao: mov, emprestimo };
      }

      case "registrar_devolucao": {
        const { emprestimo_id, valor } = input;
        const { data: emp, error: e1 } = await supabase
          .from("emprestimos_caixinha").select("*").eq("id", emprestimo_id).single();
        if (e1) throw e1;

        const { error: e2 } = await supabase.from("movimentacoes").insert({
          caixinha_id: emp.caixinha_id, tipo: "aporte", valor,
          motivo: "Devolução de empréstimo da caixinha",
        });
        if (e2) throw e2;

        const { data, error: e3 } = await supabase
          .from("emprestimos_caixinha")
          .update({ valor_devolvido: Number(emp.valor_devolvido) + valor })
          .eq("id", emprestimo_id).select().single();
        if (e3) throw e3;
        return data;
      }

      case "registrar_compromisso": {
        const { parcelas, ...dados } = input;
        const compromisso = await salvar(supabase, "compromissos", dados);
        const { data, error } = await supabase
          .from("parcelas")
          .insert(parcelas.map((p: Input) => ({ ...p, compromisso_id: compromisso.id })))
          .select();
        if (error) throw error;
        return { compromisso, parcelas: data };
      }

      case "atualizar_parcela":
        return await salvar(supabase, "parcelas", input);

      case "calcular_dinheiro_livre": {
        const { data, error } = await supabase
          .rpc("dinheiro_livre_real", { p_saldo_conta: input.saldo_conta, p_ate: input.ate })
          .single();
        if (error) throw error;
        return data;
      }

      default:
        return { erro: `Ferramenta desconhecida: ${nome}` };
    }
  } catch (e: any) {
    // Devolve o erro ao modelo para ele avisar o usuário em vez de fingir que salvou.
    return { erro: e?.message ?? String(e) };
  }
}
