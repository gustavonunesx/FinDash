-- Migration: add meta_economia_mensal to configuracoes
-- Run in Supabase SQL Editor

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS meta_economia_mensal numeric DEFAULT 0;
