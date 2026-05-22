@AGENTS.md

# FinDash v2.0 — Project Context

## Stack (actual installed versions)
- Next.js 16.2.5 (App Router, Turbopack) — see AGENTS.md for breaking changes
- React 19.2.4
- TypeScript 5
- Tailwind v4 — NO `tailwind.config.ts`; all tokens in `app/globals.css` via `@theme inline`
- shadcn/ui v4 — `toast` is deprecated, use `sonner`
- Supabase Auth + PostgreSQL + RLS (`@supabase/ssr`)
- Stripe (subscriptions + webhook + portal, keys filled in `.env.local`)

## Next.js 16 Breaking Changes (already applied)
- `middleware.ts` → renamed to `proxy.ts`, export named `proxy` (not `middleware` or default)
- Cache refresh after mutation: use `refresh()` from `next/cache` OR `revalidatePath()`
- `cookies()` from `next/headers` is async — must `await` it

## Project Architecture
- Route groups: `(auth)` login/cadastro/recuperar-senha, `(app)` dashboard/gastos/fundos/calculadora/configuracoes/historico, `(marketing)` landing/precos
- Route protection: `proxy.ts` at root
- Server Actions: `'use server'` at top of file; call `revalidatePath` after mutations
- Supabase clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server + admin)
- All TypeScript types: `types/index.ts`

## Design Tokens (globals.css)
- `--background: #0F0F13` / `--card: #1A1A24` / `--border: #2A2A38`
- `--foreground: #F0F0F5` / `--muted-foreground: #8888A0`
- `--primary: #1D9E75` (green)
- `--fd-amber: #BA7517` / `--fd-green: #1D9E75` / `--fd-blue: #378ADD` / `--fd-red: #E24B4A`
- Fonts: Plus Jakarta Sans (body, `var(--font-sans)`) + JetBrains Mono (numbers, `var(--font-mono)`)
- Loaded via `next/font/google` em `app/layout.tsx` como `--font-sans` e `--font-mono`

## shadcn Components Installed
button, input, label, card, badge, alert, separator, dialog, select, switch, progress, sonner

## @base-ui API Notes (discovered at runtime)
- **Button**: no `asChild` prop — use styled `<Link>` directly for link-buttons
- **Switch**: `onCheckedChange={(checked: boolean) => ...}` (not `onChange`)
- **Progress**: multi-part — ProgressTrack + ProgressIndicator sub-components; for simple colored bars use a plain `<div>` instead

## Business Rules
- FREE plan: max 10 gastos, max 3 fundos, no histórico mensal
- PREMIUM: unlimited + histórico + PDF export
- Categoria: `necessidade` | `objetivo` | `qualidade`
- Calculadora 50/30/20: necessidades ≤ 50%, objetivos ≥ 30%, qualidade ≤ 20%
- Phase auto-detection: `reserva.saldo >= 3 × custo_vida` → switch to `investindo`

## Milestone Status
- [x] M1 — Base & Auth (scaffold, design tokens, Supabase clients, SQL schema, auth pages, proxy)
- [x] M2 — Dashboard & Gastos (layout, CRUD gastos, CategoryTotals, UpgradeModal, free limit 10)
- [x] M3 — Calculadoras (lib/finance.ts, CalculadoraSalario, CalculadoraRendaExtra, 50/30/20)
- [x] M4 — Fundos (FundoCard, FundoModal, FundosGrid, phase auto-detection, free limit 3)
- [x] M5 — Stripe & Assinatura (checkout, webhook, portal, /precos, /configuracoes)
- [x] M6 — Premium & Polish (histórico+Recharts, PDF export, landing page, loading skeletons, 404)
- [x] M7 — Dashboard Visual Upgrade (MetricCard animado, Rule502030, StreakBar, RecentTransactions, novas fontes)

## Environment Variables (.env)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_APP_URL` — app base URL (ex: `http://localhost:3000` em dev, domínio real em prod)
- `STRIPE_SECRET_KEY` — Stripe secret key (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (`whsec_...`)
- `STRIPE_PRICE_MONTHLY` — Price ID do plano mensal (`price_...`)
- `STRIPE_PRICE_ANNUAL` — Price ID do plano anual (`price_...`)

## Stripe Setup Notes
- Webhook events ouvidos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Em dev local: usar `stripe listen --forward-to localhost:3000/api/stripe/webhook` (CLI gera o `whsec_` temporário)
- Em produção: registrar endpoint no Dashboard com URL pública + copiar o Signing Secret
- Price IDs: Stripe Dashboard → Product catalog → produto → seção Pricing
- Cartões de teste: `4242 4242 4242 4242` (aprovado), `4000 0000 0000 0002` (recusado)
- Supabase: desativar "Confirm email" em Authentication → Providers → Email para dev local

## Dashboard Components (components/dashboard/)
- `MetricCard.tsx` — card animado: fadeUp escalonado, counter rAF, barra elástica, badge contextual, hover glow
- `Rule502030.tsx` — 3 barras animadas (necessidades/objetivos/qualidade), status verde/âmbar/vermelho, badges EXCEDIDO/ATENÇÃO
- `StreakBar.tsx` — pílulas dos últimos 7 dias, pulse no dia atual, checkins calculados pelos gastos do dia
- `RecentTransactions.tsx` — lista com emoji por categoria, valor negativo em vermelho, data relativa, hover row

## CSS Utilities (globals.css)
- `.animate-fade-up` — fadeUp 0.5s cubic-bezier(0.22,1,0.36,1), use `animationDelay` inline para escalonar
- `.animate-progress` — largura de 0% até valor real, cubic-bezier elástico, delay 0.4s
- `.animate-pulse-soft` — glow pulsante suave (usado no dia atual do StreakBar)
- `.glass` / `.glass-subtle` — glassmorphism utilities
- `.hover-lift` — translateY(-2px) no hover
- `.text-gradient` — gradiente verde→azul no texto

## Key Files
- `proxy.ts` — route protection
- `app/(auth)/actions.ts` — signIn, signUp, signInWithGoogle, resetPassword, signOut
- `app/auth/callback/route.ts` — OAuth callback + seed defaults
- `lib/supabase/seed-defaults.ts` — inserts 8 default gastos + 3 default fundos
- `supabase/schema.sql` — full DB schema (run once in Supabase SQL Editor)
- `types/index.ts` — all TypeScript types
- `.env.local` — all keys filled (Supabase + Stripe)
- `lib/stripe.ts` — Stripe instance + getOrCreateStripeCustomer
- `app/api/stripe/checkout/route.ts` — creates Checkout Session (14d trial)
- `app/api/stripe/webhook/route.ts` — handles subscription lifecycle events
- `app/api/stripe/portal/route.ts` — Billing Portal session
- `components/marketing/PrecosClient.tsx` — pricing toggle + checkout CTA
- `components/configuracoes/ConfiguracoesClient.tsx` — account + subscription management
