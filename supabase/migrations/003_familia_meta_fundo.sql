-- Meta de fundo atingida (notificação única)
alter table fundos add column if not exists meta_atingida_notificada boolean not null default false;

-- Plano família
create table if not exists familias (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  nome text not null default 'Minha Família',
  created_at timestamptz not null default now()
);

create table if not exists familia_membros (
  id uuid primary key default uuid_generate_v4(),
  familia_id uuid not null references familias(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  papel text not null default 'membro' check (papel in ('owner', 'membro')),
  joined_at timestamptz not null default now(),
  unique (familia_id, user_id),
  unique (user_id)
);

create table if not exists familia_convites (
  id uuid primary key default uuid_generate_v4(),
  familia_id uuid not null references familias(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists familia_id uuid references familias(id);

alter table familias enable row level security;
alter table familia_membros enable row level security;
alter table familia_convites enable row level security;

create policy "familia_owner" on familias for all using (
  auth.uid() = owner_id or auth.uid() in (
    select user_id from familia_membros where familia_id = familias.id
  )
);

create policy "familia_membros_view" on familia_membros for select using (
  auth.uid() = user_id or auth.uid() in (
    select owner_id from familias where id = familia_membros.familia_id
  ) or auth.uid() in (
    select user_id from familia_membros fm where fm.familia_id = familia_membros.familia_id
  )
);

create policy "familia_membros_owner_write" on familia_membros for all using (
  auth.uid() in (select owner_id from familias where id = familia_membros.familia_id)
);

create policy "convites_familia" on familia_convites for all using (
  auth.uid() in (select owner_id from familias where id = familia_convites.familia_id)
);
