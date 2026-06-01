# Sessão FinDash — Resumo de contexto

## Estrutura dos projetos

| Projeto | Caminho | Papel |
|---|---|---|
| `teste apagar` | `WORK/teste apagar/` | Projeto de referência visual — **é o que está rodando no browser** |
| `FinDash2.0` | `WORK/FinDash2.0/` | Projeto principal (main) — onde as mudanças definitivas devem ir |

> **Atenção:** durante a sessão percebemos que o dev server estava rodando a partir de `teste apagar`, não do `FinDash2.0`. Confirmar qual servidor está ativo antes de editar.

---

## O que foi feito nesta sessão

### 1. Diagnóstico: POST /api/stripe/portal retorna 503
**Arquivo:** `teste apagar/app/api/stripe/portal/route.ts`

**Causa:** Sem arquivo `.env` — apenas `.env.example` existe. A rota retorna 503 quando:
- `STRIPE_SECRET_KEY` não está definida → `stripe` é `null`
- `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não definidas → `isDemoMode()` retorna `true`

**Solução pendente:** Criar `.env.local` com os valores reais.

---

### 2. Mapeamento de arquivos de referência (design)
Identificados os arquivos do `teste apagar` que definem o design base:

**Estilo global:**
- `app/globals.css` — cores, fontes, `.glass`, `.text-gradient`, `animate-glow-pulse-green`, etc.
- `app/layout.tsx` — fonts: Plus Jakarta Sans + JetBrains Mono

**Layout compartilhado:**
- `components/layout/app-shell.tsx` — nav desktop/mobile usado em todas as telas internas

**Telas de referência:**
- Dashboard: `app/(app)/dashboard/page.tsx` + `components/dashboard/dashboard-fullscreen.tsx`
- Histórico: `app/(app)/historico/page.tsx` + `components/historico/historico-charts.tsx`
- Família: `app/(app)/familia/page.tsx` + `components/familia/familia-panel.tsx`

---

### 3. FinDash2.0 — (marketing)/layout.tsx atualizado
**Arquivo:** `FinDash2.0/app/(marketing)/layout.tsx`

Antes: nav genérico básico (sem glass, sem gradientes, sem footer).

Depois:
- ✅ Nav com `glass`, gradientes de fundo fixos, `border-border/40`
- ✅ Logo `FinDash` com estilo mono/text correto
- ✅ Links: Preços | Entrar | Criar conta grátis (ou "Ir para o app" se logado)
- ✅ Footer completo: texto decorativo `50/30/20`, colunas Produto + Conta, copyright

---

### 4. `teste apagar` — landing-page.tsx atualizado
**Arquivo:** `teste apagar/components/marketing/landing-page.tsx`

Adicionado à landing que já existia (hero + como funciona + FAQ + CTA simples):

**Seção de preços** (inserida antes do FaqSection):
- Card Gratuito: R$0, `glass-subtle`, 4 features com `IconCheck`
- Card Premium: R$19/mês, `border-primary/70`, `animate-glow-pulse-green`, badge "Recomendado" com shimmer

**CTA final** substituído por:
- Gradientes de fundo, linhas de separação com gradiente
- Badge "Grátis para começar", título com `text-gradient`, botão com `IconArrowRight`

**Footer** substituído por:
- Texto `50/30/20` decorativo em mono no fundo (`text-foreground/[0.025]`)
- Linha de gradiente no topo (`via-primary/40`)
- Bloco logo + tagline + badge "1.200+ usuários"
- Coluna Produto: Dashboard, Preços, Calculadoras, Histórico
- Coluna Conta: Entrar, Criar conta, Configurações, Plano Premium
- Rodapé: copyright + "built for financial clarity"

---

## Estado atual dos arquivos

### `teste apagar` (rodando no browser)
| Arquivo | Status |
|---|---|
| `components/marketing/landing-page.tsx` | ✅ Atualizado (preços + footer) |
| `app/globals.css` | ✅ Completo (todas as utilities) |
| `app/(app)/dashboard/page.tsx` | Não tocado |
| `app/(app)/historico/page.tsx` | Não tocado |
| `app/(app)/familia/page.tsx` | Não tocado |

### `FinDash2.0` (projeto principal)
| Arquivo | Status |
|---|---|
| `app/page.tsx` | ✅ Já tem o design completo (referência) |
| `app/(marketing)/layout.tsx` | ✅ Atualizado (nav glass + footer) |
| `app/(marketing)/precos/page.tsx` | ✅ Usa PrecosClient (toggle mensal/anual + cards) |
| `components/marketing/PrecosClient.tsx` | ✅ Completo e idêntico à referência |
| `components/marketing/LandingHero.tsx` | ✅ Idêntico à referência |
| `components/marketing/LandingFeatures.tsx` | ✅ Idêntico à referência |
| `components/marketing/LandingFaq.tsx` | ✅ Idêntico à referência |

---

## Próximos passos sugeridos

- [ ] Replicar design das telas internas (`dashboard`, `historico`, `familia`) do `teste apagar` para o `FinDash2.0`
- [ ] Criar `.env.local` no projeto desejado para resolver o 503 do Stripe portal
- [ ] Confirmar qual projeto o dev server está rodando (`cd` + `npm run dev` no caminho correto)
- [ ] Verificar se `FinDash2.0` tem os componentes internos (`AppShell`, `metric-card`, etc.) alinhados com o design de referência
