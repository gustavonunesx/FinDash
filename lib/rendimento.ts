import type { Custodia } from "@/types"

export interface ResultadoRendimento {
  rendimentoTotal: number
  rendimentoMensal: number
  percentualGanho: number
  diasInvestido: number
}

export function calcularRendimento(
  custodia: Custodia,
  cdiDiario: number
): ResultadoRendimento {
  const dataInicio = new Date(custodia.data_inicio)
  const hoje = new Date()
  const diasTotais = Math.max(
    Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)),
    0
  )

  let rendimentoTotal = 0

  if (diasTotais > 0 && custodia.aporte_inicial > 0) {
    switch (custodia.tipo) {
      case "percentual_cdi": {
        // taxa diária = CDI_diário × percentual; composto nos dias úteis estimados
        const diasUteis = Math.round((diasTotais * 252) / 365)
        const taxaDiaria = cdiDiario * (custodia.taxa / 100)
        rendimentoTotal = custodia.aporte_inicial * (Math.pow(1 + taxaDiaria, diasUteis) - 1)
        break
      }
      case "prefixado": {
        rendimentoTotal =
          custodia.aporte_inicial * (Math.pow(1 + custodia.taxa / 100, diasTotais / 365) - 1)
        break
      }
      case "poupanca": {
        const meses = diasTotais / 30
        rendimentoTotal = custodia.aporte_inicial * 0.005 * meses
        break
      }
      case "ipca_mais": {
        // IPCA estimado 4,5% a.a. + spread informado em taxa
        const totalAnual = 0.045 + custodia.taxa / 100
        rendimentoTotal =
          custodia.aporte_inicial * (Math.pow(1 + totalAnual, diasTotais / 365) - 1)
        break
      }
    }
  }

  rendimentoTotal = Math.max(rendimentoTotal, 0)
  const rendimentoMensal = diasTotais > 0 ? (rendimentoTotal / diasTotais) * 30 : 0
  const percentualGanho =
    custodia.aporte_inicial > 0 ? (rendimentoTotal / custodia.aporte_inicial) * 100 : 0

  return {
    rendimentoTotal,
    rendimentoMensal: Math.max(rendimentoMensal, 0),
    percentualGanho: Math.max(percentualGanho, 0),
    diasInvestido: diasTotais,
  }
}
