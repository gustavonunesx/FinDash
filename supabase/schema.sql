
-- ============================================================
-- TABELAS
-- ============================================================

-- Perfil do usuário (extende auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                    text,
  plano                   text NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'premium')),
  stripe_customer_id      text UNIQUE,
  stripe_subscription_id  text UNIQUE,
  assinatura_status       text CHECK (assinatura_status IN ('active', 'canceled', 'trialing')),
  onboarding_completed    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Gastos mensais
CREATE TABLE IF NOT EXISTS public.gastos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  valor       numeric(10, 2) NOT NULL CHECK (valor > 0),
  categoria   text NOT NULL CHECK (categoria IN ('necessidade', 'objetivo', 'qualidade')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fundos financeiros
CREATE TABLE IF NOT EXISTS public.fundos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  saldo_atual   numeric(10, 2) NOT NULL DEFAULT 0 CHECK (saldo_atual >= 0),
  meta          numeric(10, 2) NOT NULL CHECK (meta > 0),
  aporte_mensal numeric(10, 2) NOT NULL DEFAULT 0 CHECK (aporte_mensal >= 0),
  cor           text NOT NULL DEFAULT '#1D9E75',
  ordem         int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Configurações financeiras do usuário
CREATE TABLE IF NOT EXISTS public.configuracoes (
  user_id     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  salario     numeric(10, 2) NOT NULL DEFAULT 0,
  renda_extra numeric(10, 2) NOT NULL DEFAULT 0,
  fase        text NOT NULL DEFAULT 'construindo' CHECK (fase IN ('construindo', 'investindo')),
  custo_vida  numeric(10, 2) NOT NULL DEFAULT 1200,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Histórico mensal (PREMIUM)
CREATE TABLE IF NOT EXISTS public.historico_mensal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mes             date NOT NULL,
  salario         numeric(10, 2),
  total_gastos    numeric(10, 2),
  snapshot_fundos jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mes)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_mensal  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Gastos
CREATE POLICY "users can select own gastos" ON public.gastos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own gastos" ON public.gastos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own gastos" ON public.gastos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own gastos" ON public.gastos FOR DELETE USING (auth.uid() = user_id);

-- Fundos
CREATE POLICY "users can select own fundos" ON public.fundos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own fundos" ON public.fundos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own fundos" ON public.fundos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own fundos" ON public.fundos FOR DELETE USING (auth.uid() = user_id);

-- Configurações
CREATE POLICY "users can select own config" ON public.configuracoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own config" ON public.configuracoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own config" ON public.configuracoes FOR UPDATE USING (auth.uid() = user_id);

-- Histórico mensal
CREATE POLICY "users can select own historico" ON public.historico_mensal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own historico" ON public.historico_mensal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own historico" ON public.historico_mensal FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: cria profile + configurações ao signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  INSERT INTO public.configuracoes (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS gastos_user_id_idx        ON public.gastos(user_id);
CREATE INDEX IF NOT EXISTS fundos_user_id_idx        ON public.fundos(user_id);
CREATE INDEX IF NOT EXISTS historico_user_mes_idx    ON public.historico_mensal(user_id, mes DESC);
