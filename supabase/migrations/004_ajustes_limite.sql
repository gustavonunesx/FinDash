alter table configuracoes
  add column if not exists ajustes_limite jsonb not null default '{}';
