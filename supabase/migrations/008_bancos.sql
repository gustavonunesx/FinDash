-- Bancos do usuário. `saldo` é manual por enquanto; o Open Finance vai
-- sobrescrever esse campo quando a integração entrar (ver docs/PLAN.md).
create table if not exists bancos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  nome text not null,
  saldo numeric not null default 0,
  cor text not null default '#0E8F6A',
  ordem int not null default 0,
  saldo_atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table bancos enable row level security;
create policy "bancos_own" on bancos for all using (auth.uid() = user_id);

create index if not exists bancos_user_id_idx on bancos (user_id);

alter table gastos add column if not exists banco_id uuid references bancos(id) on delete set null;
create index if not exists gastos_banco_id_idx on gastos (banco_id);
