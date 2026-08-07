-- Open Finance via Pluggy. Um `item` da Pluggy é uma conexão com uma instituição
-- e pode conter várias contas, então cada linha de `bancos` guarda o par
-- (item, account) e não só o item.

alter table bancos add column if not exists origem text not null default 'manual'
  check (origem in ('manual', 'open_finance'));
alter table bancos add column if not exists provider text;
alter table bancos add column if not exists provider_item_id text;
alter table bancos add column if not exists provider_account_id text;
alter table bancos add column if not exists sincronizado_em timestamptz;
alter table bancos add column if not exists sync_status text;
alter table bancos add column if not exists consentimento_expira_em timestamptz;

-- Reconectar o mesmo banco não pode criar uma segunda linha: o upsert de
-- sincronização casa por esta chave.
create unique index if not exists bancos_provider_account_uidx
  on bancos (user_id, provider_account_id)
  where provider_account_id is not null;

create index if not exists bancos_provider_item_idx
  on bancos (provider_item_id)
  where provider_item_id is not null;

alter table gastos add column if not exists origem text not null default 'manual'
  check (origem in ('manual', 'open_finance'));
alter table gastos add column if not exists provider_transaction_id text;

-- Idempotência da importação garantida no schema, não só no código: a Pluggy
-- reentrega webhook até 9 vezes e o cron diário cobre a mesma janela, então sem
-- esta constraint a mesma transação viraria vários gastos.
create unique index if not exists gastos_provider_transaction_uidx
  on gastos (user_id, provider_transaction_id)
  where provider_transaction_id is not null;

-- Transação importada entra sem categoria confirmada: o 50/30/20 é o núcleo do
-- produto e categorizar em silêncio corromperia o score. `false` = pendente de
-- revisão do usuário. Gastos manuais já nascem confirmados.
alter table gastos add column if not exists categoria_confirmada boolean not null default true;

create index if not exists gastos_pendentes_revisao_idx
  on gastos (user_id)
  where categoria_confirmada = false;

-- Log de webhooks recebidos. Serve para descartar reentrega da Pluggy pelo
-- eventId antes de reprocessar.
create table if not exists open_finance_eventos (
  event_id text primary key,
  evento text not null,
  item_id text,
  recebido_em timestamptz not null default now()
);

alter table open_finance_eventos enable row level security;
-- Sem policy de acesso: só o service role (webhook/cron) escreve aqui. O usuário
-- final nunca lê esta tabela, e RLS sem policy bloqueia o anon/authenticated.

create index if not exists open_finance_eventos_item_idx on open_finance_eventos (item_id);
