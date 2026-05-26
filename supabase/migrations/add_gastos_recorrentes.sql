-- Migration: gastos recorrentes
-- Run in Supabase SQL Editor

ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS recorrente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dia_recorrencia smallint CHECK (dia_recorrencia BETWEEN 1 AND 31);
