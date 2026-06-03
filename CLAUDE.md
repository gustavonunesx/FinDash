# FinDash 2.0 — CLAUDE.md

## Sobre o Projeto

FinDash é um SaaS de finanças pessoais com planos Free, Premium e Família.
Stack: Next.js 15 (App Router) + TypeScript + Supabase + Stripe + Tailwind CSS v4.

## Regras de Workflow (OBRIGATÓRIO)

### Branches e PRs
- Toda nova feature ou ajuste deve ser desenvolvido em uma branch dedicada: `feature/<descricao-curta>`
- Nunca commitar diretamente em `main` ou `findash-2.0`
- Quando o usuário disser **"pode commitar"**: criar PR para `main`, commitar, push e deletar a branch da feature

### Commits
- Usar Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Mensagens em português são aceitas
- Sempre adicionar `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

## Regras de Desenvolvimento

### Animações
- **Toda animação (Framer Motion, CSS keyframes, Recharts, GSAP) deve ser ativada apenas quando o elemento está visível na viewport** — usar IntersectionObserver ou ScrollTrigger. Nunca animar elementos fora da viewport.

### Código
- Sem comentários desnecessários; apenas quando o WHY for não-óbvio
- Sem features extra além do que foi pedido
- Sem backwards-compatibility hacks
- Preferir editar arquivos existentes a criar novos

### UI/UX
- Design system: tokens `--fd-green`, `--fd-amber`, `--fd-blue`, `--fd-purple`
- Fonte: Plus Jakarta Sans (body), JetBrains Mono (números/moeda/percentual)
- Tema escuro: background `#0f0f13`, card `#1a1a24`
- Glassmorphism: classe `.glass` e `.glass-subtle`
- Cards internos (app): `rounded-2xl border border-white/[0.06] bg-[#1a1a24]` + `box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.4)`
- Ícones dos KPIs: círculo `rounded-xl` com bg tintado (`bg-fd-green/15`, etc.)
- Badges inline: `rounded-full px-2 py-0.5 text-[11px]` com bg tintado na cor do token
- Glow ambiental de fundo: `fixed inset-0` com blobs `blur-[120px]` em verde/azul/roxo, opacidade ≤ 0.03
- Progress bars: altura `h-1` ou `h-1.5`, fundo `bg-white/5`, cor do token como background inline
- Hover em cards: `hover:-translate-y-1 transition-all duration-300`
- **Nunca usar laranja — usar apenas os 4 tokens FinDash**

### Planos e Gates
- Free: 10 gastos, 3 fundos, sem histórico, sem PDF export
- Premium: tudo ilimitado + histórico + PDF + alertas
- Família: até 3 membros + view agregada

## Estrutura Rápida

```
app/
  (marketing)/precos/     — Página de planos
  (app)/                  — Rotas protegidas (auth + onboarding)
    dashboard/            — Dashboard premium (scroll único, 3 blocos: hero+KPIs / 50/30/20+sidebar / fundos+transações)
    gastos/               — CRUD de gastos + importação CSV
    fundos/               — Fundos de investimento + CDI
    calculadora/          — Regra 50/30/20
    historico/            — Analytics (Premium)
    familia/              — Plano Família
    configuracoes/        — Perfil, referral, exportar PDF
    onboarding/           — Wizard 3 etapas
  (auth)/                 — login, cadastro, recuperar-senha
  api/                    — stripe, cron, notificacoes, exportar-pdf, taxas
  page.tsx                — Landing page
components/               — 47 componentes React
lib/                      — 19 módulos utilitários
supabase/migrations/      — 3 migrations SQL
```

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY
STRIPE_PRICE_ANNUAL
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
RESEND_FROM
CRON_SECRET
```

## Comandos Úteis

```bash
npm run dev       # Dev server (Turbopack) — localhost:3000
npm run build     # Build de produção
npm run lint      # ESLint
npm run test:e2e  # Playwright E2E tests
```
