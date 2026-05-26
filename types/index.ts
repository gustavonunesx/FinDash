export type Categoria = "necessidade" | "objetivo" | "qualidade"
export type Fase = "construindo" | "investindo"
export type TipoRendimento = "percentual_cdi" | "prefixado" | "ipca_mais" | "poupanca"

export interface Custodia {
  instituicao: string
  tipo: TipoRendimento
  taxa: number
  data_inicio: string
  aporte_inicial: number
}
export type Plano = "free" | "premium"
export type AssinaturaStatus = "active" | "canceled" | "trialing" | null

export interface Profile {
  id: string
  nome: string | null
  plano: Plano
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  assinatura_status: AssinaturaStatus
  created_at: string
}

export interface Gasto {
  id: string
  user_id: string
  nome: string
  valor: number
  categoria: Categoria
  recorrente: boolean
  dia_recorrencia: number | null
  created_at: string
}

export interface Fundo {
  id: string
  user_id: string
  nome: string
  saldo_atual: number
  meta: number
  aporte_mensal: number
  cor: string
  ordem: number
  created_at: string
  custodia: Custodia | null
}

export interface Configuracoes {
  user_id: string
  salario: number
  renda_extra: number
  fase: Fase
  custo_vida: number
  updated_at: string
}

export interface HistoricoMensal {
  id: string
  user_id: string
  mes: string
  salario: number | null
  total_gastos: number | null
  snapshot_fundos: SnapshotFundo[] | null
  created_at: string
}

export interface SnapshotFundo {
  id: string
  nome: string
  saldo_atual: number
  meta: number
  aporte_mensal: number
}

export interface TotaisPorCategoria {
  necessidade: number
  objetivo: number
  qualidade: number
}

export interface StatusBloco {
  cor: "verde" | "amarelo" | "vermelho"
  mensagem?: string
}

export interface ResultadoCalcSalario {
  limiteNecessidades: number
  limiteObjetivos: number
  limiteQualidade: number
  comprometidoNecessidades: number
  comprometidoObjetivos: number
  comprometidoQualidade: number
  saldoLivre: number
  statusNecessidades: StatusBloco
  statusObjetivos: StatusBloco
}

export interface BlocoRendaExtra {
  label: string
  percentual: number
  valor: number
  descricao: string
}

export interface ProjecaoFundo {
  fundo: Fundo
  mesesComExtra: number | null
  mesesSemExtra: number | null
  aporteExtra: number
}

export interface ResultadoCalcExtra {
  blocos: BlocoRendaExtra[]
  projecoes: ProjecaoFundo[]
}
