-- =====================================================================
-- FinDash — Agente Financeiro (migration 011)
-- Modulo paralelo: estas tabelas convivem com fundos/gastos/configuracoes,
-- que continuam sendo a fonte do dashboard. Todas usam RLS: cada usuario so
-- ve e altera os proprios dados (user_id = auth.uid(), preenchido por default).
-- Idempotente: pode rodar mais de uma vez.
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
  ativo_ate date,
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
  saldo numeric(12,2) not null default 0 check (saldo >= 0),
  meta numeric(12,2),
  prioridade int not null default 99,
  teto_mensal numeric(12,2),
  criado_em timestamptz not null default now()
);

-- ---------- MOVIMENTACOES DAS CAIXINHAS ----------
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

-- ---------- EMPRESTIMOS DE CAIXINHA (retiradas a devolver) ----------
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

-- ---------- COMPROMISSOS (parcelas, dividas, emprestimo de familia) ----------
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
  parte_usuario numeric(12,2) not null,
  parte_terceiros numeric(12,2) not null default 0,
  status_ajuda text not null default 'nenhuma'
    check (status_ajuda in ('nenhuma', 'confirmada', 'recebida')),
  pago boolean not null default false
);

-- ---------- CONVERSA DO AGENTE ----------
-- "ordem" e a chave de ordenacao: linhas de um mesmo insert compartilham o
-- now() de criado_em. "inicio_rodada" marca a mensagem de texto do usuario
-- que abre uma rodada (janela de mensagens e limite por hora).
create table if not exists agente_mensagens (
  id uuid primary key default gen_random_uuid(),
  ordem bigint generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  papel text not null check (papel in ('user', 'assistant')),
  conteudo jsonb not null,
  inicio_rodada boolean not null default false,
  criado_em timestamptz not null default now()
);

create index if not exists agente_mensagens_user_ordem_idx
  on agente_mensagens (user_id, ordem);

-- =====================================================================
-- TRIGGER: o saldo da caixinha acompanha as movimentacoes
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
-- RLS: cada usuario so acessa os proprios dados
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'perfil_financeiro', 'fontes_renda', 'entradas', 'gastos_fixos', 'caixinhas',
    'movimentacoes', 'emprestimos_caixinha', 'compromissos', 'parcelas', 'agente_mensagens'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists dono on %I', t);
    execute format(
      'create policy dono on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t
    );
  end loop;
end $$;

-- =====================================================================
-- VIEW: painel de saude financeira (respeita RLS via security_invoker)
-- "Hoje" e o de Sao Paulo: o banco roda em UTC.
-- retiradas_no_mes conta so retiradas de caixinhas de protecao e meta
-- (retirar da caixinha pessoal e uso normal, nao um sinal de alerta).
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
        and (f.ativo_ate is null
             or f.ativo_ate >= (now() at time zone 'America/Sao_Paulo')::date)) as renda_garantida_mensal,
    (select coalesce(sum(valor), 0) from fontes_renda f
      where f.user_id = p.user_id and f.ativo
        and (f.ativo_ate is null
             or f.ativo_ate >= (now() at time zone 'America/Sao_Paulo')::date)) as renda_provavel_mensal,
    (select coalesce(sum(saldo), 0) from caixinhas c
      where c.user_id = p.user_id and c.tipo = 'protecao') as reserva,
    (select count(*) from emprestimos_caixinha e
      where e.user_id = p.user_id and not e.quitado) as emprestimos_abertos,
    (select count(*) from movimentacoes m
      join caixinhas cx on cx.id = m.caixinha_id
      where m.user_id = p.user_id and m.tipo = 'retirada'
        and cx.tipo in ('protecao', 'meta')
        and date_trunc('month', m.data at time zone 'America/Sao_Paulo')
          = date_trunc('month', now() at time zone 'America/Sao_Paulo')) as retiradas_no_mes
  from perfil_financeiro p
) t;

-- =====================================================================
-- FUNCAO: Dinheiro Livre Real
-- O saldo da conta corrente nao fica salvo: o agente pergunta ao usuario.
-- Parcela pesa o valor integral (ajuda de terceiros so vira dinheiro
-- quando chega). Vencimento acima do tamanho do mes cai no ultimo dia.
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
      join generate_series(
             (now() at time zone 'America/Sao_Paulo')::date::timestamp,
             p_ate::timestamp,
             interval '1 day') d
        on extract(day from d) = least(
             gf.dia_vencimento,
             extract(day from (date_trunc('month', d) + interval '1 month' - interval '1 day')))
     where gf.user_id = auth.uid() and gf.ativo
  ),
  p as (
    select coalesce(sum(valor), 0) as v
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

-- =====================================================================
-- RPCs transacionais (security invoker: o RLS continua valendo)
-- =====================================================================
create or replace function criar_caixinha(
  p_nome text,
  p_tipo text,
  p_meta numeric default null,
  p_prioridade int default 99,
  p_teto_mensal numeric default null,
  p_saldo_inicial numeric default 0
) returns jsonb
language plpgsql security invoker as $$
declare
  v_id uuid;
  v_row caixinhas;
begin
  insert into caixinhas (nome, tipo, meta, prioridade, teto_mensal)
  values (p_nome, p_tipo, p_meta, coalesce(p_prioridade, 99), p_teto_mensal)
  returning id into v_id;

  if coalesce(p_saldo_inicial, 0) > 0 then
    insert into movimentacoes (caixinha_id, tipo, valor, motivo)
    values (v_id, 'aporte', p_saldo_inicial, 'Saldo inicial');
  end if;

  select * into v_row from caixinhas where id = v_id;
  return to_jsonb(v_row);
end $$;

create or replace function movimentar_caixinha(
  p_caixinha_id uuid,
  p_tipo text,
  p_valor numeric,
  p_motivo text default null,
  p_devolver_ate date default null,
  p_entrada_id uuid default null
) returns jsonb
language plpgsql security invoker as $$
declare
  v_cx caixinhas;
  v_mov movimentacoes;
  v_emp emprestimos_caixinha;
  v_vira_emprestimo boolean;
  v_saldo numeric;
begin
  select * into v_cx from caixinhas where id = p_caixinha_id for update;
  if not found then
    raise exception 'Caixinha não encontrada.';
  end if;
  if p_tipo not in ('aporte', 'retirada') then
    raise exception 'Tipo de movimentação inválido.';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'O valor precisa ser maior que zero.';
  end if;

  v_vira_emprestimo := p_tipo = 'retirada' and v_cx.tipo in ('protecao', 'meta');

  if v_vira_emprestimo and p_devolver_ate is null then
    raise exception 'Retirada de caixinha de proteção ou meta exige devolver_ate.';
  end if;
  if p_tipo = 'retirada' and p_valor > v_cx.saldo then
    raise exception 'Saldo insuficiente: a caixinha "%" tem só R$ %.', v_cx.nome, v_cx.saldo;
  end if;

  insert into movimentacoes (caixinha_id, entrada_id, tipo, valor, motivo)
  values (p_caixinha_id, p_entrada_id, p_tipo, p_valor, p_motivo)
  returning * into v_mov;

  if v_vira_emprestimo then
    insert into emprestimos_caixinha (caixinha_id, movimentacao_id, valor, motivo, devolver_ate)
    values (p_caixinha_id, v_mov.id, p_valor, p_motivo, p_devolver_ate)
    returning * into v_emp;
  end if;

  select saldo into v_saldo from caixinhas where id = p_caixinha_id;

  return jsonb_build_object(
    'movimentacao', to_jsonb(v_mov),
    'emprestimo', case when v_vira_emprestimo then to_jsonb(v_emp) else null end,
    'saldo_caixinha', v_saldo
  );
end $$;

create or replace function registrar_devolucao(
  p_emprestimo_id uuid,
  p_valor numeric
) returns jsonb
language plpgsql security invoker as $$
declare
  v_emp emprestimos_caixinha;
  v_pendente numeric;
begin
  select * into v_emp from emprestimos_caixinha where id = p_emprestimo_id for update;
  if not found then
    raise exception 'Empréstimo não encontrado.';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'O valor precisa ser maior que zero.';
  end if;

  v_pendente := v_emp.valor - v_emp.valor_devolvido;
  if p_valor > v_pendente then
    raise exception 'Devolução maior que o pendente (R$ %).', v_pendente;
  end if;

  insert into movimentacoes (caixinha_id, tipo, valor, motivo)
  values (v_emp.caixinha_id, 'aporte', p_valor, 'Devolução de empréstimo da caixinha');

  update emprestimos_caixinha
     set valor_devolvido = valor_devolvido + p_valor
   where id = p_emprestimo_id
  returning * into v_emp;

  return jsonb_build_object(
    'emprestimo', to_jsonb(v_emp),
    'restante', v_emp.valor - v_emp.valor_devolvido
  );
end $$;

create or replace function registrar_compromisso(
  p_nome text,
  p_tipo text,
  p_credor text,
  p_parcelas jsonb
) returns jsonb
language plpgsql security invoker as $$
declare
  v_comp compromissos;
  v_parcelas jsonb;
begin
  if p_parcelas is null
     or jsonb_typeof(p_parcelas) <> 'array'
     or jsonb_array_length(p_parcelas) = 0 then
    raise exception 'Informe ao menos uma parcela.';
  end if;

  insert into compromissos (nome, tipo, credor)
  values (p_nome, p_tipo, p_credor)
  returning * into v_comp;

  insert into parcelas (compromisso_id, numero, valor, vencimento, parte_usuario, parte_terceiros, status_ajuda)
  select
    v_comp.id,
    (e ->> 'numero')::int,
    (e ->> 'valor')::numeric,
    (e ->> 'vencimento')::date,
    (e ->> 'parte_usuario')::numeric,
    coalesce((e ->> 'parte_terceiros')::numeric, 0),
    coalesce(e ->> 'status_ajuda', 'nenhuma')
  from jsonb_array_elements(p_parcelas) e;

  select coalesce(jsonb_agg(to_jsonb(pa) order by pa.numero), '[]'::jsonb)
    into v_parcelas
    from parcelas pa
   where pa.compromisso_id = v_comp.id;

  return jsonb_build_object('compromisso', to_jsonb(v_comp), 'parcelas', v_parcelas);
end $$;

revoke all on function criar_caixinha(text, text, numeric, int, numeric, numeric) from public;
revoke all on function movimentar_caixinha(uuid, text, numeric, text, date, uuid) from public;
revoke all on function registrar_devolucao(uuid, numeric) from public;
revoke all on function registrar_compromisso(text, text, text, jsonb) from public;

grant execute on function criar_caixinha(text, text, numeric, int, numeric, numeric) to authenticated;
grant execute on function movimentar_caixinha(uuid, text, numeric, text, date, uuid) to authenticated;
grant execute on function registrar_devolucao(uuid, numeric) to authenticated;
grant execute on function registrar_compromisso(text, text, text, jsonb) to authenticated;
