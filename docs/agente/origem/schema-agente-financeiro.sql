-- =====================================================================
-- FinDash — Memória do Agente Financeiro (Supabase / Postgres)
-- Rode no SQL Editor do Supabase.
-- Todas as tabelas usam RLS (Row Level Security): cada usuário só vê e
-- altera os próprios dados. user_id é preenchido automaticamente com o
-- usuário logado (auth.uid()).
-- Se você já rodou o schema antigo do FinDash, a tabela "caixinhas"
-- substitui "fundos" e "gastos_fixos" substitui "gastos".
-- =====================================================================

-- ---------- PERFIL ----------
create table if not exists perfil_financeiro (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  estabilidade_renda text not null default 'contratos'
    check (estabilidade_renda in ('fixa', 'contratos', 'transicao')),
  meta_reserva_meses numeric(4,1) not null default 6,
  observacoes text,
  atualizado_em timestamptz not null default now()
);

-- ---------- FONTES DE RENDA ----------
create table if not exists fontes_renda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric(12,2) not null check (valor >= 0),
  dia_pagamento int check (dia_pagamento between 1 and 31),
  tipo text not null check (tipo in ('fixa', 'contrato', 'variavel', 'incerta')),
  ativo_ate date,              -- ex: salário que acaba em dezembro
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ---------- ENTRADAS DE DINHEIRO (com status) ----------
create table if not exists entradas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fonte_id uuid references fontes_renda(id) on delete set null,
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  status text not null check (status in ('recebido', 'confirmado', 'incerto')),
  data_prevista date,
  data_recebida date,
  criado_em timestamptz not null default now()
);

-- ---------- GASTOS FIXOS ----------
create table if not exists gastos_fixos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  valor numeric(12,2) not null check (valor >= 0),
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  categoria text not null check (categoria in ('necessidade', 'qualidade_vida')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ---------- CAIXINHAS ----------
create table if not exists caixinhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('protecao', 'meta', 'pessoal', 'negocio')),
  saldo numeric(12,2) not null default 0 check (saldo >= 0),  -- atualizado por trigger
  meta numeric(12,2),
  prioridade int not null default 99,
  teto_mensal numeric(12,2),    -- usado na caixinha pessoal
  criado_em timestamptz not null default now()
);

-- ---------- MOVIMENTAÇÕES DAS CAIXINHAS ----------
create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  caixinha_id uuid not null references caixinhas(id) on delete cascade,
  entrada_id uuid references entradas(id) on delete set null,
  tipo text not null check (tipo in ('aporte', 'retirada')),
  valor numeric(12,2) not null check (valor > 0),
  motivo text,
  data timestamptz not null default now()
);

-- ---------- EMPRÉSTIMOS DE CAIXINHA (retiradas a devolver) ----------
create table if not exists emprestimos_caixinha (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  caixinha_id uuid not null references caixinhas(id) on delete cascade,
  movimentacao_id uuid references movimentacoes(id) on delete set null,
  valor numeric(12,2) not null check (valor > 0),
  motivo text,
  data_retirada date not null default current_date,
  devolver_ate date not null,
  valor_devolvido numeric(12,2) not null default 0,
  quitado boolean generated always as (valor_devolvido >= valor) stored
);

-- ---------- COMPROMISSOS (parcelas, dívidas, empréstimo de família) ----------
create table if not exists compromissos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('parcela', 'divida', 'emprestimo_familia')),
  credor text,
  criado_em timestamptz not null default now()
);

create table if not exists parcelas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  compromisso_id uuid not null references compromissos(id) on delete cascade,
  numero int not null,
  valor numeric(12,2) not null check (valor > 0),
  vencimento date not null,
  parte_usuario numeric(12,2) not null,      -- quanto o usuário paga
  parte_terceiros numeric(12,2) not null default 0,  -- ajuda de família etc.
  status_ajuda text not null default 'nenhuma'
    check (status_ajuda in ('nenhuma', 'confirmada', 'recebida')),
  pago boolean not null default false
);

-- =====================================================================
-- TRIGGER: mantém o saldo da caixinha sempre igual à soma das movimentações
-- =====================================================================
create or replace function atualizar_saldo_caixinha()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update caixinhas
       set saldo = saldo + case when new.tipo = 'aporte' then new.valor else -new.valor end
     where id = new.caixinha_id;
  elsif tg_op = 'DELETE' then
    update caixinhas
       set saldo = saldo - case when old.tipo = 'aporte' then old.valor else -old.valor end
     where id = old.caixinha_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_saldo_caixinha on movimentacoes;
create trigger trg_saldo_caixinha
after insert or delete on movimentacoes
for each row execute function atualizar_saldo_caixinha();

-- =====================================================================
-- RLS: cada usuário só acessa os próprios dados
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'perfil_financeiro', 'fontes_renda', 'entradas', 'gastos_fixos', 'caixinhas',
    'movimentacoes', 'emprestimos_caixinha', 'compromissos', 'parcelas'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists dono on %I', t);
    execute format(
      'create policy dono on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t
    );
  end loop;
end $$;

-- =====================================================================
-- VIEW: painel de saúde financeira (respeita RLS via security_invoker)
-- =====================================================================
create or replace view painel_saude with (security_invoker = true) as
select
  t.*,
  round(t.reserva / nullif(t.custo_fixo_mensal, 0), 1) as meses_sobrevivencia,
  t.custo_fixo_mensal * t.meta_reserva_meses as meta_reserva_valor,
  t.renda_garantida_mensal - t.custo_fixo_mensal as sobra_estrutural
from (
  select
    p.user_id,
    p.meta_reserva_meses,
    (select coalesce(sum(valor), 0) from gastos_fixos g
      where g.user_id = p.user_id and g.ativo) as custo_fixo_mensal,
    (select coalesce(sum(valor), 0) from fontes_renda f
      where f.user_id = p.user_id and f.ativo
        and f.tipo in ('fixa', 'contrato')
        and (f.ativo_ate is null or f.ativo_ate >= current_date)) as renda_garantida_mensal,
    (select coalesce(sum(valor), 0) from fontes_renda f
      where f.user_id = p.user_id and f.ativo
        and (f.ativo_ate is null or f.ativo_ate >= current_date)) as renda_provavel_mensal,
    (select coalesce(sum(saldo), 0) from caixinhas c
      where c.user_id = p.user_id and c.tipo = 'protecao') as reserva,
    (select count(*) from emprestimos_caixinha e
      where e.user_id = p.user_id and not e.quitado) as emprestimos_abertos,
    (select count(*) from movimentacoes m
      where m.user_id = p.user_id and m.tipo = 'retirada'
        and date_trunc('month', m.data) = date_trunc('month', now())) as retiradas_no_mes
  from perfil_financeiro p
) t;

-- =====================================================================
-- FUNÇÃO: Dinheiro Livre Real
-- O saldo da conta corrente não fica salvo: o agente pergunta ao usuário
-- e passa como parâmetro.
-- Observação: gasto com vencimento dia 31 não aparece em meses mais curtos.
-- =====================================================================
create or replace function dinheiro_livre_real(p_saldo_conta numeric, p_ate date)
returns table (
  saldo_conta numeric,
  contas_a_vencer numeric,
  parcelas_a_vencer numeric,
  emprestimos_a_devolver numeric,
  dinheiro_livre numeric
)
language sql stable security invoker as $$
  with
  g as (
    select coalesce(sum(gf.valor), 0) as v
      from gastos_fixos gf
      join generate_series(current_date, p_ate, interval '1 day') d
        on extract(day from d) = gf.dia_vencimento
     where gf.user_id = auth.uid() and gf.ativo
  ),
  p as (
    select coalesce(sum(parte_usuario), 0) as v
      from parcelas
     where user_id = auth.uid() and not pago and vencimento <= p_ate
  ),
  e as (
    select coalesce(sum(valor - valor_devolvido), 0) as v
      from emprestimos_caixinha
     where user_id = auth.uid() and not quitado and devolver_ate <= p_ate
  )
  select p_saldo_conta, g.v, p.v, e.v, p_saldo_conta - g.v - p.v - e.v
    from g, p, e;
$$;
