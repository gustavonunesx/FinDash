import { supabase } from './supabase';

const DEFAULT_GASTOS = [
  { nome: 'Aluguel', valor: 800, categoria: 'necessidade' as const },
  { nome: 'Mercado', valor: 400, categoria: 'necessidade' as const },
  { nome: 'Transporte', valor: 200, categoria: 'necessidade' as const },
  { nome: 'Internet', valor: 100, categoria: 'necessidade' as const },
  { nome: 'Academia', valor: 80, categoria: 'qualidade' as const },
  { nome: 'Streaming', valor: 45, categoria: 'qualidade' as const },
  { nome: 'Poupança', valor: 300, categoria: 'objetivo' as const },
];

const DEFAULT_FUNDOS = [
  { nome: 'Reserva de Emergência', meta: 15000, saldo_atual: 2000, aporte_mensal: 500, cor: '#1D9E75', ordem: 1 },
  { nome: 'Viagem', meta: 5000, saldo_atual: 800, aporte_mensal: 200, cor: '#378ADD', ordem: 2 },
  { nome: 'Investimentos', meta: 50000, saldo_atual: 0, aporte_mensal: 300, cor: '#BA7517', ordem: 3 },
];

const DEFAULT_CONFIG = {
  salario: 3000,
  renda_extra: 0,
  custo_vida: 1500,
  fase: 'construindo' as const,
};

export async function seedUserData(userId: string) {
  // Check if user already has data
  const { data: existing } = await supabase
    .from('configuracoes')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return; // already seeded

  await Promise.all([
    supabase.from('configuracoes').insert({ user_id: userId, ...DEFAULT_CONFIG }),
    supabase.from('gastos').insert(
      DEFAULT_GASTOS.map((g) => ({ ...g, user_id: userId }))
    ),
    supabase.from('fundos').insert(
      DEFAULT_FUNDOS.map((f) => ({ ...f, user_id: userId }))
    ),
  ]);
}
