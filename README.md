# FinDash

SaaS de finanças pessoais com método 50/30/20, dashboard imersivo e integração Stripe/Supabase.

## Stack

- Next.js 15 (App Router, Turbopack)
- React 19, TypeScript, Tailwind CSS v4
- GSAP + ScrollTrigger (animações)
- Supabase (Auth + PostgreSQL + RLS)
- Stripe (Checkout, Webhook, Portal)
- Recharts (histórico Premium)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Sem variáveis Supabase configuradas, o app roda em **modo demo** com dados de exemplo e acesso direto ao dashboard.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_*` (checkout e webhook)
- `NEXT_PUBLIC_APP_URL`

## P1 implementado

- Token `--fd-amber: #E8923A`
- Dashboard fullscreen com scroll-snap (5 seções 100vh)
- Hero pessoal com score animado (GSAP fromTo + contador RAF)
- Rule502030 com barras elásticas via ScrollTrigger
- Micro-interações: modal scale, botões ripple, labels flutuantes
- Landing page com GSAP hero + mock dashboard

## P2 implementado (continuação)

- **Server Actions** — CRUD gastos/fundos, configurações, onboarding, aporte calculadora
- **Modo demo mutável** — `lib/demo-store.ts` persiste alterações na sessão do dev server
- **Gastos** — tabela com busca, modal CRUD, totais por categoria, UpgradeModal (limite 10)
- **Fundos** — CRUD com modal, limite 3 no Free
- **Onboarding** — 3 etapas em `/onboarding` + seeds automáticos
- **Calculadora** — 50/30/20 + renda extra com fases construindo/investindo
- **Histórico Premium** — Recharts (linha, barras, evolução fundos) + gate Free
- **Stripe** — `/api/stripe/checkout`, `/webhook`, `/portal` (14d trial)
- **Auth** — login/cadastro via Supabase Server Actions

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login`, `/cadastro` | Auth unificado (AuthCard) |
| `/dashboard` | Dashboard fullscreen |
| `/gastos`, `/fundos`, `/calculadora` | Módulos principais |
| `/historico` | Gate Premium |
| `/precos` | Planos Free/Premium |
| `/configuracoes` | Perfil e financeiro |

## Supabase

Aplique `supabase/migrations/001_initial_schema.sql` no seu projeto Supabase.

## P3 implementado

- **Google OAuth** — login/cadastro via Supabase + callback `/auth/callback`
- **Recuperação de senha** — formulário funcional com Supabase
- **Relatório mensal automático** — `GET /api/cron/relatorio-mensal` (dia 1, 8h UTC) + PDF anexo via Resend
- **Programa de referral** — código único, link em Configurações, crédito R$19 no Stripe ao indicado assinar
- **vercel.json** — cron jobs para relatório e alertas de orçamento

### Configurar Google OAuth (Supabase)

1. Supabase Dashboard → Authentication → Providers → Google
2. Redirect URL: `{APP_URL}/auth/callback`
3. Google Cloud Console → OAuth credentials com mesmo redirect

## Roadmap concluído nesta fase

- **Notificação meta de fundo** — email via Resend ao atingir meta + banner no dashboard
- **Plano Família** — `/familia` com até 3 membros, convites por link, visão agregada
- **Gráfico categorias** — barras agrupadas Necessidade/Objetivo/Qualidade no histórico
- Demo atualizado: Premium + Reserva de Emergência com meta atingida

## Recém adicionado

- **Importação CSV** — preview + mapeamento automático de categorias (`/gastos`, arquivo exemplo em `/exemplo-gastos.csv`)
- **Exportação PDF Premium** — `/api/exportar-pdf` + botão em Configurações
- **RecorrentesAlert** — sugestões no dashboard com confirmação inline
- **FundoCard expandível** — rendimento CDI em tempo real na página Fundos
- **Snapshot mensal** — idempotente ao acessar `/historico` (Supabase)
- **Alertas de orçamento** — `POST /api/notificacoes/orcamento` + Resend (80% do limite)
