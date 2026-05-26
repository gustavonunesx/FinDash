-- Subcategoria / tag livre por gasto (opcional)
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS subcategoria text;
