# FinDash — Contexto do projeto

## Estrutura atual

| Item | Valor |
|---|---|
| Repositório | `https://github.com/gustavonunesx/FinDash` |
| Branch principal | `findash-2.0` |
| Dev server | `localhost:3000` (Next.js 15 + Turbopack) |
| Stack | Next.js 15, React 19, Tailwind v4, Supabase, Stripe, Framer Motion |
| Fontes | Plus Jakarta Sans + JetBrains Mono |

---

## Arquitetura de rotas

```
app/
  (marketing)/   → landing (/), preços (/precos)
  (app)/         → dashboard, gastos, fundos, historico, familia, calculadora, configuracoes
  (auth)/        → login, cadastro, recuperar-senha
  api/           → stripe, supabase webhooks
```

---

## Design system (globals.css)

| Token | Valor |
|---|---|
| `--color-background` | `#0f0f13` |
| `--color-primary` (fd-green) | `#1d9e75` |
| `--color-fd-blue` | `#378add` |
| `--color-fd-amber` | `#e8923a` |
| `--color-fd-purple` | `#7c5cbf` |
| `--color-card` | `#1a1a24` |
| `--color-muted-foreground` | `#8888a0` |

Utilities relevantes: `.glass`, `.glass-subtle`, `.text-gradient`, `.animate-glow-pulse-green`, `.shadow-premium`

---

## Componentes de marketing

| Arquivo | Descrição |
|---|---|
| `components/marketing/landing-page.tsx` | Landing page completa (hero, como funciona, DeviceShowcaseSection, pricing, FAQ, CTA, footer) |
| `components/marketing/DeviceShowcaseSection.tsx` | Section dedicada com MacBook + iPhone CSS puro lado a lado |
| `components/marketing/DeviceShowcase.tsx` | Showcase antigo (laptop + phone sobrepostos no hero) — mantido mas não usado |
| `components/marketing/CardNav.tsx` | Nav animado com cards expansíveis |
| `components/marketing/faq-section.tsx` | FAQ expansível |

---

## O que foi feito — histórico recente

### Sessão atual (2026-06-01)

**1. Erro de refresh token silenciado (`proxy.ts`)**
- `AuthApiError: refresh_token_not_found` era log de ruído — não um bug
- Middleware já tratava corretamente (redireciona para /login)
- Adicionado filtro: só loga erros de auth que não sejam `refresh_token_not_found`

**2. DeviceShowcaseSection criado**
- `components/marketing/DeviceShowcaseSection.tsx` — section separada com MacBook + iPhone CSS puro
- MacBook: lid com câmera, teclado com grid de teclas decorativas, trackpad, hinge, shadow
- iPhone: Dynamic Island, botões laterais, home bar, glare
- Ambos com telas reais (gráficos recharts animados, métricas do FinDash)
- Layout responsivo: lado a lado desktop, stack em mobile, textos laterais hidden < lg
- Inserido na landing entre "Como funciona" e "Pricing"

**3. Hero centralizada verticalmente**
- Problema: conteúdo aparecia no topo da viewport, não no centro
- Fix: `section` ganhou `flex flex-col`, div interno ganhou `flex-1` → `justify-center` passa a funcionar

**4. DeviceShowcase removido do hero**
- Hero agora é só texto + CTAs (limpa, sem preview de tela)
- Preview de dispositivos movido para section dedicada

### Commits recentes
```
ab98886 feat(landing): DeviceShowcaseSection + hero centralizado + auth log silenciado
41da9f0 refactor(DeviceShowcase): px → em/clamp para escala responsiva automática
f85e72f feat(precos): redesign completo da página de planos + pricing section da landing
861afa7 feat(landing): CardNav animado + DeviceShowcase laptop/mobile
86d62d6 feat: subcategorias em gastos + prazo com countdown em fundos
```

---

## Middleware / Auth (`proxy.ts`)

- Usa `@supabase/ssr` com `createServerClient`
- Rotas públicas: `/`, `/precos`, `/login`, `/cadastro`, `/recuperar-senha`, `/auth/callback`, `/familia/aceitar`
- Usuário não autenticado → redireciona para `/login`
- Usuário sem onboarding completo → redireciona para `/onboarding`
- `refresh_token_not_found` é silenciado (comportamento esperado, não bug)

---

## Próximos passos sugeridos

- [ ] Testar DeviceShowcaseSection em mobile real (breakpoints lg)
- [ ] Avaliar se o `DeviceShowcase.tsx` antigo pode ser deletado (não está sendo usado)
- [ ] Criar PRODUCT.md e DESIGN.md para o `/impeccable` ter contexto automático
