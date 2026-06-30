# FinDash 2.0 — Plano e Checklist do Projeto

> Atualizado em: 2026-06-03 (dashboard remodelagem em andamento — branch `feature/dashboard-remodelagem`)

---

## Legenda
- ✅ Concluído
- 🔄 Em progresso / parcial
- ⬜ Pendente
- 🔒 Premium gate

---

## Fase 1 — Fundação

- ✅ Design system: tokens de cor (`--fd-green`, `--fd-amber`, `--fd-blue`, `--fd-purple`)
- ✅ Tipografia: Plus Jakarta Sans + JetBrains Mono
- ✅ Tema escuro com glassmorphism (`.glass`, `.glass-subtle`)
- ✅ Next.js 15 App Router + TypeScript + Tailwind CSS v4
- ✅ Supabase: Auth + PostgreSQL + RLS
- ✅ Middleware de autenticação
- ✅ Layout raiz com providers

---

## Fase 2 — Autenticação

- ✅ Login com email e senha
- ✅ Cadastro com email e senha
- ✅ Login com Google OAuth
- ✅ Callback do OAuth (`/auth/callback`)
- ✅ Recuperação de senha
- ✅ Proteção de rotas (middleware)

---

## Fase 3 — Onboarding

- ✅ Wizard de 3 etapas (salário, objetivos, fase financeira)
- ✅ Auto-seeding de dados de exemplo após onboarding
- ✅ Redirecionamento pós-onboarding para dashboard

---

## Fase 4 — Dashboard

### v1 (original — substituída)
- ~~Layout fullscreen scroll-snap (5 seções, 100vh cada)~~ — removido
- ~~Alert de gastos recorrentes sugeridos~~ — removido
- ~~Streak bar (consistência)~~ — removido

### v2 (remodelagem premium — branch `feature/dashboard-remodelagem`)
- ✅ Scroll único sem conflito (removido `dashboard-snap` / `dashboard-section`)
- ✅ Hero compacto com score em pill colorido por status (verde/âmbar/vermelho)
- ✅ Filtro temporal (Esta semana / Este mês / Últimos 3 meses / Este ano)
- ✅ 4 KPIs em grid 2×2 / 4 colunas: Saldo Livre, Gastos, Patrimônio em Fundos, Score
- ✅ Ícones circulares tintados por token de cor em cada KPI
- ✅ Card de Regra 50/30/20 com barras finas + glow + marcador de meta
- ✅ Painel lateral: meta de economia + visão geral renda vs. categorias
- ✅ Seção Fundos & Metas: cards horizontais com barra lateral colorida
- ✅ Seção Transações recentes: dot de categoria + badge tintado
- ✅ Glow ambiental de fundo (blobs fixos verde/azul/roxo, opacidade ≤ 0.03)
- ✅ MetaAtingidaBanner mantido
- ✅ UpgradeBanner mantido (Free only)
- ✅ Animações por ScrollTrigger (KPIs, colunas inferiores, barras 50/30/20, linhas de transação)

### v3 (redesign 50/30/20-first — branch `feat/dashboard-502030-redesign`)
- ✅ Identidade verde clara (fundo `#F4F7F5`, cards brancos) — `AppShell` recebe prop `pageBg`
- ✅ Foco na pergunta "Estou seguindo a regra 50/30/20 este mês?"
- ✅ Removido Recharts do dashboard (rota caiu de ~334 kB para 6.4 kB) — anéis em SVG puro, barras em CSS
- ✅ 3 cards-bucket (Necessidades/Objetivos/Qualidade) com anel donut SVG, status pill, diff e lista de categorias
- ✅ Anéis/status/score derivam de `scoreData.categorias` (dados reais do usuário; Objetivos nunca "estoura")
- ✅ Chip de aderência (score 0–100 + rótulo) e CTA "Registrar gasto" no topbar
- ✅ Banner de alerta de estouro (só mês atual, quando há bucket acima do limite)
- ✅ Transações recentes reais (5 últimos gastos) + Metas/fundos reais + card Investimentos (fundos com custódia)
- ✅ Modo privacidade (toggle que oculta todos os valores → `R$ ••••`)
- ✅ Seletor de mês no header (dropdown alimentado pelo `historico_mensal` + mês atual)
- ✅ Renda vem de `config.salario + renda_extra` (removido slider de tweaks)

---

## Fase 5 — Gastos

- ✅ Listagem de gastos com pesquisa
- ✅ Criar / editar / excluir gasto
- ✅ Categorias: necessidade, objetivo, qualidade
- ✅ Totais por categoria
- ✅ Suporte a gastos recorrentes
- ✅ Importação via CSV (preview + mapeamento automático de categoria)
- ✅ Gate Free: limite de 10 gastos (modal de upgrade)

---

## Fase 6 — Fundos de Investimento

- ✅ Listagem de fundos com card expansível
- ✅ Criar / editar / excluir fundo
- ✅ Rastreamento de CDI em tempo real (`/api/taxas/cdi`)
- ✅ Cálculo de rendimento com CDI
- ✅ Meta do fundo com barra de progresso
- ✅ Gate Free: limite de 3 fundos

---

## Fase 7 — Calculadora 50/30/20

- ✅ Calculadora interativa da regra 50/30/20
- ✅ Seletor de fase financeira (construindo / investindo)
- ✅ Resultados por categoria

---

## Fase 8 — Histórico e Analytics (Premium)

- ✅ Snapshots mensais idempotentes (criados no acesso a `/historico`)
- ✅ Gráfico de linha de evolução mensal
- ✅ Gráfico de barras por categoria
- ✅ Gráfico de evolução dos fundos
- ✅ Indicadores de tendência (setas + comparação com mês anterior)
- 🔒 Gate Premium: bloqueia acesso para Free

---

## Fase 9 — Planos e Pagamentos (Stripe)

- ✅ Stripe Checkout Sessions
- ✅ Webhooks de assinatura (create, update, cancel)
- ✅ Portal do cliente Stripe
- ✅ Trial de 14 dias
- ✅ Planos: Gratuito, Premium (mensal/anual), Família
- ✅ `UpgradeModal` com gate Free
- ✅ Banner de upgrade no dashboard

---

## Fase 10 — Email e Notificações

- ✅ Relatório mensal automatizado (cron dia 1, 8h UTC via Vercel)
- ✅ Alerta de orçamento (80% do limite por categoria)
- ✅ Email de convite para plano Família
- ✅ Integração com Resend

---

## Fase 11 — Exportação PDF (Premium)

- ✅ Geração de PDF com jsPDF + autoTable
- ✅ Rota `/api/exportar-pdf`
- ✅ Botão de exportação em `/configuracoes`
- 🔒 Gate Premium

---

## Fase 12 — Plano Família

- ✅ Criação de grupo familiar
- ✅ Convite via link único
- ✅ Página de aceite do convite
- ✅ View agregada de até 3 membros
- ✅ Painel de gerenciamento da família

---

## Fase 13 — Referral Program

- ✅ Código de referral único por usuário
- ✅ Crédito de R$19 na Stripe para o referido
- ✅ Seção de referral em `/configuracoes`

---

## Fase 14 — Landing Page e Marketing

- ✅ Landing page completa (hero, features, pricing, FAQ)
- ✅ Seção DeviceShowcase (MacBook + iPhone CSS mockups)
- ✅ CardNav animado
- ✅ Página `/precos` com 3 cards (Gratuito/Premium/Família)
- ✅ Starfield magnético na página de preços
- ✅ Confetti ao selecionar plano anual
- ✅ NumberFlow nos preços
- ✅ VerticalCutReveal animations
- ✅ Globe 3D (Three.js) no hero
- ✅ SEO: robots.ts, sitemap.ts, manifest PWA

---

## Fase 15 — Demo Mode

- ✅ Dados de exemplo em `lib/demo-data.ts`
- ✅ Estado persistente em sessão (`lib/demo-store.ts`)
- ✅ Mutações funcionando sem Supabase
- ✅ Demo com perfil Premium + Reserva de Emergência atingida

---

## Fase 16 — Configurações e Perfil

- ✅ Formulário de configurações (salário, renda extra, fase, meta)
- ✅ Edição de perfil (nome, email)
- ✅ Seção de referral
- ✅ Exportar PDF
- ✅ Link para portal de assinatura Stripe

---

## Infraestrutura e DevOps

- ✅ Supabase migrations (001, 002, 003)
- ✅ Vercel cron jobs (`vercel.json`)
- ✅ PWA manifest
- ✅ Playwright E2E setup
- ✅ ESLint configurado

---

## Próximas Features / Backlog

> Adicionar aqui as próximas features conforme forem definidas.

- ⬜ _A definir_

---

## Branches Ativas

| Branch | Feature | Status |
|--------|---------|--------|
| `findash-2.0` | Base de desenvolvimento (→ main) | ✅ Mergeada |

---

## Histórico de PRs

| PR | Branch | Descrição | Status |
|----|--------|-----------|--------|
| #1 | `findash-2.0` → `main` | MVP completo: auth, dashboard, gastos, fundos, Stripe, landing redesign | ✅ Mergeado |
