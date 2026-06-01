import type { Configuracao, Fundo, Gasto, Profile } from "./types";

export const DEMO_PROFILE: Profile = {
  id: "demo-user",
  nome: "Ana Silva",
  plano: "premium",
  stripe_customer_id: null,
  stripe_subscription_id: null,
  assinatura_status: "inativa",
  onboarding_completed: true,
  referral_code: "FDDEMOUSR",
  referral_rewards: 0,
};

export const DEMO_CONFIG: Configuracao = {
  user_id: "demo-user",
  salario: 4500,
  renda_extra: 800,
  fase: "construindo",
  custo_vida: 3200,
  meta_economia_mensal: 900,
};

export const DEMO_GASTOS: Gasto[] = [
  { id: "1", user_id: "demo-user", nome: "Aluguel", valor: 1200, categoria: "necessidade", subcategoria: "Moradia", recorrente: true, dia_recorrencia: 5, created_at: new Date().toISOString() },
  { id: "2", user_id: "demo-user", nome: "Mercado", valor: 650, categoria: "necessidade", subcategoria: "Alimentação", recorrente: true, dia_recorrencia: 10, created_at: new Date().toISOString() },
  { id: "3", user_id: "demo-user", nome: "Transporte", valor: 280, categoria: "necessidade", subcategoria: null, recorrente: true, dia_recorrencia: 1, created_at: new Date().toISOString() },
  { id: "4", user_id: "demo-user", nome: "Reserva emergência", valor: 500, categoria: "objetivo", subcategoria: "Reserva", recorrente: true, dia_recorrencia: 15, created_at: new Date().toISOString() },
  { id: "5", user_id: "demo-user", nome: "Curso online", valor: 199, categoria: "objetivo", subcategoria: "Educação", recorrente: false, dia_recorrencia: null, created_at: new Date().toISOString() },
  { id: "6", user_id: "demo-user", nome: "Netflix", valor: 55.9, categoria: "qualidade", subcategoria: "Streaming", recorrente: true, dia_recorrencia: 20, created_at: new Date().toISOString() },
  { id: "7", user_id: "demo-user", nome: "Restaurante", valor: 120, categoria: "qualidade", subcategoria: "Lazer", recorrente: false, dia_recorrencia: null, created_at: new Date().toISOString() },
  { id: "8", user_id: "demo-user", nome: "Academia", valor: 99.9, categoria: "qualidade", subcategoria: "Saúde", recorrente: true, dia_recorrencia: 3, created_at: new Date().toISOString() },
];

export const DEMO_FUNDOS: Fundo[] = [
  {
    id: "f1",
    user_id: "demo-user",
    nome: "Reserva de Emergência",
    saldo_atual: 9600,
    meta: 9600,
    meta_data: "2026-08-01",
    aporte_mensal: 500,
    cor: "#1D9E75",
    ordem: 0,
    custodia: { instituicao: "Nubank", tipo: "cdi", taxa: 100, data_inicio: "2025-06-01", aporte_inicial: 2000 },
  },
  {
    id: "f2",
    user_id: "demo-user",
    nome: "Viagem Europa",
    saldo_atual: 3200,
    meta: 15000,
    meta_data: "2027-03-15",
    aporte_mensal: 400,
    cor: "#378ADD",
    ordem: 1,
    custodia: { instituicao: "XP", tipo: "cdi", taxa: 110, data_inicio: "2025-09-01", aporte_inicial: 1000 },
  },
  {
    id: "f3",
    user_id: "demo-user",
    nome: "Entrada do AP",
    saldo_atual: 12000,
    meta: 50000,
    meta_data: "2028-12-01",
    aporte_mensal: 800,
    cor: "#7C5CBF",
    ordem: 2,
    custodia: { instituicao: "Inter", tipo: "ipca", taxa: 6.5, data_inicio: "2024-01-01", aporte_inicial: 5000 },
  },
];

export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
