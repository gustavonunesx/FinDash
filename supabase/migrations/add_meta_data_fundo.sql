-- Prazo da meta por fundo (opcional)
ALTER TABLE public.fundos
  ADD COLUMN IF NOT EXISTS meta_data date;
