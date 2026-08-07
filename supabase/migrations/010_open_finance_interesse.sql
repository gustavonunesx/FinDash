-- Fila de espera do Open Finance. O plano de Dados da Pluggy tem mínimo de
-- R$ 2.500/mês, então a conexão fica como "Em breve" até a base justificar o
-- custo. Cada clique aqui é o sinal de demanda que decide a hora de assinar.
create table if not exists open_finance_interesse (
  user_id uuid primary key references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table open_finance_interesse enable row level security;
create policy "open_finance_interesse_own" on open_finance_interesse
  for all using (auth.uid() = user_id);

-- OFX guarda o FITID (id único da transação no extrato) no mesmo campo que a
-- Pluggy usa, então a dedup pelo índice único já existente vale para as duas.
-- `ofx` é origem própria, e não 'open_finance', porque o saldo do banco continua
-- manual: o usuário subiu um arquivo, não autorizou sincronização contínua.
alter table gastos drop constraint if exists gastos_origem_check;
alter table gastos add constraint gastos_origem_check
  check (origem in ('manual', 'open_finance', 'ofx'));

comment on column gastos.provider_transaction_id is
  'Id da transação na origem: FITID no OFX, transaction.id na Pluggy.';
