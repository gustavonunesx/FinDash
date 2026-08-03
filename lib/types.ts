export type Plano = "free" | "premium";
export type AssinaturaStatus = "ativa" | "trial" | "cancelada" | "inativa";
export type CategoriaGasto = "necessidade" | "objetivo" | "qualidade";
export type FaseFinanceira = "construindo" | "investindo";

export interface Profile {
  id: string;
  nome: string | null;
  plano: Plano;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  assinatura_status: AssinaturaStatus;
  onboarding_completed: boolean;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_rewards?: number;
  familia_id?: string | null;
}

export interface Familia {
  id: string;
  owner_id: string;
  nome: string;
  created_at: string;
}

export interface FamiliaMembro {
  id: string;
  familia_id: string;
  user_id: string;
  papel: "owner" | "membro";
  joined_at: string;
  nome?: string;
}

export interface FamiliaResumo {
  familia: Familia;
  membros: FamiliaMembro[];
  rendaTotal: number;
  gastosTotal: number;
  fundosTotal: number;
  scoreMedio: number;
}

export interface Configuracao {
  user_id: string;
  salario: number;
  renda_extra: number;
  fase: FaseFinanceira;
  custo_vida: number;
  meta_economia_mensal: number | null;
  ajustes_limite?: Record<string, number>;
}

export interface Gasto {
  id: string;
  user_id: string;
  nome: string;
  valor: number;
  categoria: CategoriaGasto;
  subcategoria: string | null;
  recorrente: boolean;
  dia_recorrencia: number | null;
  parcelas_total: number | null;
  parcela_inicio: string | null;
  banco_id: string | null;
  created_at: string;
}

/**
 * Conta bancária do usuário. `saldo` é informado manualmente até a integração
 * com Open Finance, que passará a preenchê-lo automaticamente.
 */
export interface Banco {
  id: string;
  user_id: string;
  nome: string;
  saldo: number;
  cor: string;
  ordem: number;
  saldo_atualizado_em: string;
  created_at: string;
}

export const BANCO_CORES = [
  "#0E8F6A",
  "#2563EB",
  "#7C3AED",
  "#C4820A",
  "#0F1729",
] as const;

export interface Custodia {
  instituicao: string;
  tipo: "cdi" | "prefixado" | "ipca" | "poupanca";
  taxa: number;
  data_inicio: string;
  aporte_inicial: number;
}

export interface Fundo {
  id: string;
  user_id: string;
  nome: string;
  saldo_atual: number;
  meta: number;
  meta_data: string | null;
  aporte_mensal: number;
  cor: string;
  ordem: number;
  custodia: Custodia | null;
  reserva_emergencia: boolean;
  meta_atingida_notificada?: boolean;
}

export interface HistoricoMensal {
  id: string;
  user_id: string;
  mes: string;
  salario: number;
  total_gastos: number;
  snapshot_fundos: Record<string, number>;
}

export interface RendaExtraItem {
  id: string;
  user_id: string;
  valor: number;
  descricao: string | null;
  created_at: string;
}

export interface DashboardData {
  profile: Profile;
  config: Configuracao | null;
  gastos: Gasto[];
  fundos: Fundo[];
  transacoesRecentes: Gasto[];
}

export const LIMITES_FREE = {
  gastos: 10,
  fundos: 3,
} as const;

export const REGRA_502030 = {
  necessidade: 0.5,
  objetivo: 0.3,
  qualidade: 0.2,
} as const;

export const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  necessidade: "Necessidades",
  objetivo: "Objetivos",
  qualidade: "Qualidade de vida",
};

export const CATEGORIA_EMOJI: Record<CategoriaGasto, string> = {
  necessidade: "🏠",
  objetivo: "🎯",
  qualidade: "✨",
};

export const CATEGORIA_COLORS: Record<CategoriaGasto, string> = {
  necessidade: "var(--color-fd-amber)",
  objetivo: "var(--color-fd-green)",
  qualidade: "var(--color-fd-blue)",
};
