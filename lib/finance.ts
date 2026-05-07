import type {
  Fase,
  Fundo,
  TotaisPorCategoria,
  ResultadoCalcSalario,
  ResultadoCalcExtra,
  BlocoRendaExtra,
  ProjecaoFundo,
  StatusBloco,
} from "@/types"

export function calcularSalario(salario: number, totais: TotaisPorCategoria): ResultadoCalcSalario {
  const limiteNecessidades = salario * 0.5
  const limiteObjetivos = salario * 0.3
  const limiteQualidade = salario * 0.2

  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade
  const saldoLivre = salario - totalGastos

  const pctNecessidades = salario > 0 ? (totais.necessidade / salario) * 100 : 0
  const pctObjetivos = salario > 0 ? (totais.objetivo / salario) * 100 : 0

  let statusNecessidades: StatusBloco
  if (pctNecessidades > 50) {
    statusNecessidades = { cor: "vermelho", mensagem: "Necessidades acima de 50% do salário" }
  } else if (pctNecessidades > 45) {
    statusNecessidades = { cor: "amarelo", mensagem: "Necessidades próximas do limite (45–50%)" }
  } else {
    statusNecessidades = { cor: "verde" }
  }

  let statusObjetivos: StatusBloco
  if (pctObjetivos < 20) {
    statusObjetivos = { cor: "vermelho", mensagem: "Objetivos abaixo de 20% do salário" }
  } else if (pctObjetivos < 30) {
    statusObjetivos = { cor: "amarelo", mensagem: "Objetivos abaixo de 30% do salário" }
  } else {
    statusObjetivos = { cor: "verde" }
  }

  return {
    limiteNecessidades,
    limiteObjetivos,
    limiteQualidade,
    comprometidoNecessidades: totais.necessidade,
    comprometidoObjetivos: totais.objetivo,
    comprometidoQualidade: totais.qualidade,
    saldoLivre,
    statusNecessidades,
    statusObjetivos,
  }
}

export function calcularRendaExtra(extra: number, fase: Fase, fundos: Fundo[]): ResultadoCalcExtra {
  const blocos: BlocoRendaExtra[] =
    fase === "construindo"
      ? [
          { label: "Reserva de Emergência", percentual: 40, valor: extra * 0.4, descricao: "Prioridade: construa 3–6× seu custo de vida" },
          { label: "Objetivos", percentual: 30, valor: extra * 0.3, descricao: "Distribuído entre seus fundos ativos" },
          { label: "Qualidade de Vida", percentual: 20, valor: extra * 0.2, descricao: "Invista em experiências e bem-estar" },
          { label: "Investimentos", percentual: 10, valor: extra * 0.1, descricao: "Primeiros passos no mercado financeiro" },
        ]
      : [
          { label: "Investimentos", percentual: 40, valor: extra * 0.4, descricao: "Renda passiva e construção de patrimônio" },
          { label: "Objetivos", percentual: 30, valor: extra * 0.3, descricao: "Distribuído entre seus fundos ativos" },
          { label: "Qualidade de Vida", percentual: 20, valor: extra * 0.2, descricao: "Invista em experiências e bem-estar" },
          { label: "Reserva extra", percentual: 10, valor: extra * 0.1, descricao: "Colchão de segurança adicional" },
        ]

  const objetivosValor = extra * 0.3
  const aporteExtraPorFundo = fundos.length > 0 ? objetivosValor / fundos.length : 0

  const projecoes: ProjecaoFundo[] = fundos.map((fundo) => {
    const restante = Math.max(fundo.meta - fundo.saldo_atual, 0)

    if (restante === 0) {
      return { fundo, mesesComExtra: 0, mesesSemExtra: 0, aporteExtra: aporteExtraPorFundo }
    }

    const mesesSemExtra = fundo.aporte_mensal > 0
      ? Math.ceil(restante / fundo.aporte_mensal)
      : null

    const totalAporte = fundo.aporte_mensal + aporteExtraPorFundo
    const mesesComExtra = totalAporte > 0
      ? Math.ceil(restante / totalAporte)
      : null

    return { fundo, mesesComExtra, mesesSemExtra, aporteExtra: aporteExtraPorFundo }
  })

  return { blocos, projecoes }
}
