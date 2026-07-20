create table if not exists renda_extra_historico (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  valor numeric not null,
  descricao text,
  created_at timestamptz not null default now()
);

alter table renda_extra_historico enable row level security;
create policy "renda_extra_own" on renda_extra_historico for all using (auth.uid() = user_id);
