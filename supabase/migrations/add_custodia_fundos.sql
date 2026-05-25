-- P3a: adiciona coluna custodia na tabela fundos
-- Rodar no Supabase SQL Editor

ALTER TABLE public.fundos
  ADD COLUMN IF NOT EXISTS custodia jsonb;

-- Estrutura esperada do jsonb:
-- {
--   "instituicao": "Nubank",
--   "tipo": "percentual_cdi",  -- "percentual_cdi" | "prefixado" | "ipca_mais" | "poupanca"
--   "taxa": 100,               -- 100 = 100% do CDI; 12.5 = 12,5% a.a.
--   "data_inicio": "2024-01-15",
--   "aporte_inicial": 500.00
-- }
