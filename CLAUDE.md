@AGENTS.md

# FinDash v2.0 — Project Context

## Stack (actual installed versions)
- Next.js 16.2.5 (App Router, Turbopack) — see AGENTS.md for breaking changes
- React 19.2.4
- TypeScript 5
- Tailwind v4 — NO `tailwind.config.ts`; all tokens in `app/globals.css` via `@theme inline`
- shadcn/ui v4 — `toast` is deprecated, use `sonner`
- Supabase Auth + PostgreSQL + RLS (`@supabase/ssr`)
- Stripe (Milestone 5, keys empty in `.env.local`)

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
- Fonts: DM Sans (body, `var(--font-sans)`) + DM Mono (numbers, `var(--font-mono)`)

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
- [ ] M2 — Dashboard & Gastos
- [ ] M3 — Calculadoras
- [ ] M4 — Fundos
- [ ] M5 — Stripe & Assinatura
- [ ] M6 — Premium & Polish

## Key Files
- `proxy.ts` — route protection
- `app/(auth)/actions.ts` — signIn, signUp, signInWithGoogle, resetPassword, signOut
- `app/auth/callback/route.ts` — OAuth callback + seed defaults
- `lib/supabase/seed-defaults.ts` — inserts 8 default gastos + 3 default fundos
- `supabase/schema.sql` — full DB schema (run once in Supabase SQL Editor)
- `types/index.ts` — all TypeScript types
- `.env.local` — Supabase keys filled; Stripe keys empty (M5)
