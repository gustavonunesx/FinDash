export interface Propriedade {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  enum?: string[];
  description?: string;
  items?: EsquemaObjeto;
}

export interface EsquemaObjeto {
  type: "object";
  properties: Record<string, Propriedade>;
  required: string[];
}

export interface Ferramenta {
  name: string;
  description: string;
  input_schema: EsquemaObjeto;
}

export const FERRAMENTAS: Ferramenta[] = [
  {
    name: "ler_ficha_financeira",
    description:
      "Lê toda a ficha financeira do usuário: perfil, fontes de renda, entradas recentes, gastos fixos, caixinhas, compromissos e parcelas, empréstimos de caixinha e o painel de saúde. Chame no início de TODA conversa, antes de qualquer conselho.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "salvar_perfil",
    description:
      "Cria ou atualiza o perfil financeiro: estabilidade da renda e meta da reserva em meses de custo fixo.",
    input_schema: {
      type: "object",
      properties: {
        estabilidade_renda: { type: "string", enum: ["fixa", "contratos", "transicao"] },
        meta_reserva_meses: {
          type: "number",
          description: "fixa: 3 a 6; contratos: 6 a 12; transicao: mínimo 6",
        },
        observacoes: { type: "string" },
      },
      required: ["estabilidade_renda"],
    },
  },
  {
    name: "salvar_fonte_renda",
    description:
      "Cria (sem id) ou atualiza (com id) uma fonte de renda recorrente: salário, contrato de cliente, freela.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        valor: { type: "number" },
        dia_pagamento: { type: "integer" },
        tipo: { type: "string", enum: ["fixa", "contrato", "variavel", "incerta"] },
        ativo_ate: {
          type: "string",
          description: "Data AAAA-MM-DD em que a fonte termina, se o usuário souber",
        },
        ativo: { type: "boolean" },
      },
      required: ["nome", "valor", "tipo"],
    },
  },
  {
    name: "registrar_entrada",
    description:
      "Registra um dinheiro citado pelo usuário com o status correto. recebido = está na conta agora; confirmado = tem data e origem certas; incerto = talvez. Só distribua dinheiro com status recebido.",
    input_schema: {
      type: "object",
      properties: {
        descricao: { type: "string" },
        valor: { type: "number" },
        status: { type: "string", enum: ["recebido", "confirmado", "incerto"] },
        data_prevista: { type: "string" },
        data_recebida: { type: "string" },
        fonte_id: { type: "string" },
      },
      required: ["descricao", "valor", "status"],
    },
  },
  {
    name: "atualizar_entrada",
    description:
      "Muda o status de uma entrada, por exemplo de confirmado para recebido quando o dinheiro cai na conta.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: ["recebido", "confirmado", "incerto"] },
        data_recebida: { type: "string" },
      },
      required: ["id", "status"],
    },
  },
  {
    name: "salvar_gasto_fixo",
    description:
      "Cria (sem id) ou atualiza (com id) um gasto fixo mensal. Para encerrar um gasto, envie ativo=false.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        valor: { type: "number" },
        dia_vencimento: { type: "integer" },
        categoria: { type: "string", enum: ["necessidade", "qualidade_vida"] },
        ativo: { type: "boolean" },
      },
      required: ["nome", "valor", "dia_vencimento", "categoria"],
    },
  },
  {
    name: "salvar_caixinha",
    description:
      "Cria (sem id) ou atualiza (com id) uma caixinha. A reserva de emergência é tipo protecao. A caixinha de gastos pessoais é tipo pessoal e deve ter teto_mensal. Use saldo_inicial só na criação, quando o usuário já tem dinheiro guardado nela.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        tipo: { type: "string", enum: ["protecao", "meta", "pessoal", "negocio"] },
        meta: { type: "number" },
        prioridade: { type: "integer", description: "1 = mais importante" },
        teto_mensal: { type: "number" },
        saldo_inicial: { type: "number" },
      },
      required: ["nome", "tipo"],
    },
  },
  {
    name: "movimentar_caixinha",
    description:
      "Registra aporte ou retirada em uma caixinha. Retirada de caixinha protecao ou meta vira automaticamente um empréstimo e EXIGE devolver_ate, combinado com o usuário antes de chamar.",
    input_schema: {
      type: "object",
      properties: {
        caixinha_id: { type: "string" },
        tipo: { type: "string", enum: ["aporte", "retirada"] },
        valor: { type: "number" },
        motivo: { type: "string" },
        devolver_ate: { type: "string", description: "AAAA-MM-DD" },
        entrada_id: { type: "string", description: "De qual entrada saiu o dinheiro do aporte" },
      },
      required: ["caixinha_id", "tipo", "valor"],
    },
  },
  {
    name: "registrar_devolucao",
    description:
      "Devolve dinheiro a uma caixinha de onde o usuário tinha retirado. Gera um aporte e abate do empréstimo.",
    input_schema: {
      type: "object",
      properties: {
        emprestimo_id: { type: "string" },
        valor: { type: "number" },
      },
      required: ["emprestimo_id", "valor"],
    },
  },
  {
    name: "registrar_compromisso",
    description:
      "Registra uma compra parcelada, dívida ou empréstimo de família com todas as parcelas. Se alguém ajuda a pagar, preencha parte_terceiros e status_ajuda. Antes de chamar, confirme se o valor informado é o total ou o de cada parcela.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        tipo: { type: "string", enum: ["parcela", "divida", "emprestimo_familia"] },
        credor: { type: "string" },
        parcelas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              numero: { type: "integer" },
              valor: { type: "number" },
              vencimento: { type: "string" },
              parte_usuario: { type: "number" },
              parte_terceiros: { type: "number" },
              status_ajuda: { type: "string", enum: ["nenhuma", "confirmada", "recebida"] },
            },
            required: ["numero", "valor", "vencimento", "parte_usuario"],
          },
        },
      },
      required: ["nome", "tipo", "parcelas"],
    },
  },
  {
    name: "atualizar_parcela",
    description: "Marca uma parcela como paga ou atualiza o status da ajuda de terceiros.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        pago: { type: "boolean" },
        status_ajuda: { type: "string", enum: ["nenhuma", "confirmada", "recebida"] },
        parte_usuario: { type: "number" },
        parte_terceiros: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "calcular_dinheiro_livre",
    description:
      "Calcula o Dinheiro Livre Real: saldo da conta menos contas, parcelas e devoluções de caixinha que vencem até a data informada. Pergunte ao usuário o saldo atual da conta antes de chamar.",
    input_schema: {
      type: "object",
      properties: {
        saldo_conta: { type: "number" },
        ate: { type: "string", description: "AAAA-MM-DD, normalmente a data da próxima entrada de dinheiro" },
      },
      required: ["saldo_conta", "ate"],
    },
  },
  {
    name: "projetar_caixa",
    description:
      "Projeta o caixa dos próximos meses em 3 cenários (pessimista, base, otimista), o calendário dos próximos 60 dias, a provisão das parcelas e a sobra estrutural. Chame em todo 'recebi X' e sempre que a renda for mudar. Pergunte o saldo atual da conta antes.",
    input_schema: {
      type: "object",
      properties: {
        saldo_conta: { type: "number" },
        horizonte_meses: { type: "integer", description: "De 1 a 6; padrão 3" },
      },
      required: ["saldo_conta"],
    },
  },
];

export const ROTULOS_FERRAMENTA: Record<string, string> = {
  ler_ficha_financeira: "Lendo sua ficha…",
  salvar_perfil: "Salvando seu perfil…",
  salvar_fonte_renda: "Salvando fonte de renda…",
  registrar_entrada: "Registrando a entrada…",
  atualizar_entrada: "Atualizando a entrada…",
  salvar_gasto_fixo: "Salvando gasto fixo…",
  salvar_caixinha: "Salvando caixinha…",
  movimentar_caixinha: "Movimentando a caixinha…",
  registrar_devolucao: "Registrando a devolução…",
  registrar_compromisso: "Registrando o compromisso…",
  atualizar_parcela: "Atualizando a parcela…",
  calcular_dinheiro_livre: "Calculando seu dinheiro livre…",
  projetar_caixa: "Projetando os próximos meses…",
};

export function buscarFerramenta(nome: string): Ferramenta | undefined {
  return FERRAMENTAS.find((f) => f.name === nome);
}
