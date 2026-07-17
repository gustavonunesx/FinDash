alter table fundos
  add column if not exists reserva_emergencia boolean not null default false;
