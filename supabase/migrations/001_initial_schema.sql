-- FinDash schema
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  plano text not null default 'free' check (plano in ('free', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  assinatura_status text not null default 'inativa',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists configuracoes (
  user_id uuid primary key references profiles(id) on delete cascade,
  salario numeric not null default 0,
  renda_extra numeric not null default 0,
  fase text not null default 'construindo' check (fase in ('construindo', 'investindo')),
  custo_vida numeric not null default 0,
  meta_economia_mensal numeric
);

create table if not exists gastos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  nome text not null,
  valor numeric not null,
  categoria text not null check (categoria in ('necessidade', 'objetivo', 'qualidade')),
  subcategoria text,
  recorrente boolean not null default false,
  dia_recorrencia int,
  created_at timestamptz not null default now()
);

create table if not exists fundos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  nome text not null,
  saldo_atual numeric not null default 0,
  meta numeric not null default 0,
  meta_data date,
  aporte_mensal numeric not null default 0,
  cor text not null default '#1D9E75',
  ordem int not null default 0,
  custodia jsonb
);

create table if not exists historico_mensal (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  mes date not null,
  salario numeric not null,
  total_gastos numeric not null,
  snapshot_fundos jsonb not null default '{}',
  unique (user_id, mes)
);

alter table profiles enable row level security;
alter table configuracoes enable row level security;
alter table gastos enable row level security;
alter table fundos enable row level security;
alter table historico_mensal enable row level security;

create policy "profiles_own" on profiles for all using (auth.uid() = id);
create policy "config_own" on configuracoes for all using (auth.uid() = user_id);
create policy "gastos_own" on gastos for all using (auth.uid() = user_id);
create policy "fundos_own" on fundos for all using (auth.uid() = user_id);
create policy "historico_own" on historico_mensal for all using (auth.uid() = user_id);
