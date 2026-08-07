# FinDash 2.0 — Plano e Checklist do Projeto

> Atualizado em: 2026-06-30

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
- ✅ Redesign `/gastos` (PR #12): modal centralizado com overlay blur, 3 cards de resumo por categoria, DonutChart SVG, coluna direita com maiores gastos e card de média diária

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

### 🔄 Integração Open Finance (via Pluggy)

Sincronizar automaticamente os saldos e as transações das contas bancárias do
usuário, substituindo a entrada manual.

**Decisão de arquitetura:** agregador **Pluggy** (`pluggy-sdk`).
Acesso direto ao Open Finance Brasil exigiria ser instituição registrada no
Banco Central (certificados ICP-Brasil, diretório de participantes, homologação),
inviável para o FinDash. A Pluggy já é participante autorizada e expõe o widget
de consentimento pronto.

**Base já entregue** (migration `008_bancos.sql`):

- Tabela `bancos` (`nome`, `saldo`, `cor`, `ordem`, `saldo_atualizado_em`)
- `gastos.banco_id` → FK para `bancos`, `on delete set null`
- CRUD de bancos em `app/(app)/bancos/actions.ts`, entidade `bancos` no `lib/revalidate.ts`
- Colunas **Banco** e **Saldo do banco** na tabela de /gastos + card "Meus bancos"

---

#### Contrato da Pluggy (confirmado na doc, ago/2026)

| Item | Detalhe |
|---|---|
| SDK | `pluggy-sdk` (npm), `new PluggyClient({ clientId, clientSecret })` |
| Auth | `POST /auth` com clientId+secret → API Key válida por **2h**. **Server-side apenas.** |
| Connect Token | `POST /connect_token` → token de **30 min** para o widget no client |
| Widget | Pluggy Connect — usuário escolhe o banco e autoriza; retorna `itemId` |
| Item | 1 conexão com 1 instituição; pode conter N accounts |
| Account | `type: BANK \| CREDIT`, `subtype`, `balance`, `name`, `number`, `currencyCode` |
| Transaction | `id`, `description`, `descriptionRaw`, `amount`, `date`, `type: CREDIT \| DEBIT`, `category`, `status: POSTED \| PENDING` |
| Paginação | `fetchTransactionsCursor` / `fetchAllTransactions` (o `fetchTransactions` legado está deprecado) |
| Webhooks | `item/created`, `item/updated`, `item/error`, `transactions/created`, `transactions/updated`, `transactions/deleted` |
| Webhook infra | Só HTTPS; IP de origem `52.67.145.81`; responder **2XX em < 5s** e processar async; até 9 retries |

Semântica que guia a importação:
- `type: DEBIT` = saída de dinheiro → vira **gasto**. `CREDIT` = entrada → **não** vira gasto.
- `balance` em conta `BANK` = disponível para gastar; em `CREDIT` = fatura aberta do mês.
- `status: PENDING` não é definitivo — importar apenas `POSTED` para não gerar gasto que some depois.

---

#### ✅ Etapa 1 — Fundação e schema (branch `feat/open-finance-pluggy`)

- [x] `npm install pluggy-sdk react-pluggy-connect` (`pluggy-sdk@0.90.0`, `react-pluggy-connect@2.12.0`)
- [x] Env vars: `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`, `PLUGGY_WEBHOOK_URL`
      (a API Key **não** é env var — expira em 2h e o SDK a renova em runtime)
- [x] Migration `009_open_finance.sql`:
  - `bancos`: `origem`, `provider`, `provider_item_id`, `provider_account_id`,
    `sincronizado_em`, `sync_status`, `consentimento_expira_em`
  - índice único parcial em `(user_id, provider_account_id)` — reconectar faz upsert, não duplica
  - `gastos`: `origem`, `provider_transaction_id`, `categoria_confirmada`
  - índice único parcial em `gastos (user_id, provider_transaction_id)` → **idempotência no schema**
  - tabela `open_finance_eventos` (dedup de webhook por `eventId`), RLS sem policy = só service role
- [x] `lib/open-finance.ts`: client singleton, connect token, mapeamento Account→Banco e Transaction→Gasto
- [x] Tipos em `lib/types.ts`: `OrigemRegistro`, `SyncStatus`, campos novos em `Banco` e `Gasto`
- [x] `BANCO_MANUAL` / `GASTO_MANUAL` em `lib/demo-data.ts` (demo nunca fala com a Pluggy)

#### ✅ Etapa 2 — Conexão e consentimento (branch `feat/open-finance-pluggy`)

- [x] `POST /api/open-finance/connect-token` — autenticado; valida posse do item na reconexão
- [x] `components/bancos/conectar-banco.tsx` com o widget Pluggy Connect (`dynamic`, sem SSR)
- [x] Botão "Conectar banco" (primário) no card **Meus bancos**; cadastro manual vira ação secundária
- [x] `vincularItemConectado` — busca contas com API Key no servidor e faz upsert em `bancos`
- [x] `desconectarBanco` — `deleteItem` na Pluggy + volta para `origem='manual'`, preservando os gastos
- [x] Banco sincronizado: saldo read-only, selo "auto"/"erro", saldo negativo em vermelho (fatura)
- [x] Gate Premium na conexão (Free cai no `UpgradeModal`)

**Validado:** `tsc --noEmit` limpo, ESLint sem erros nos arquivos novos, `npm run build` OK
(`/gastos` seguiu em 33.6 kB — o widget é carregado sob demanda).

**Pendente de teste real:** o fluxo ponta a ponta depende de aplicar a migration 009 no
Supabase e de rodar com credenciais válidas. Nada foi testado contra a API da Pluggy ainda.

#### ✅ Etapa 3 — Sincronização (branch `feat/open-finance-pluggy`)

- [x] `POST /api/open-finance/webhook` — responde 2XX na hora e processa em `after()`
      (o sync leva mais que os 5s do limite da Pluggy)
- [x] Dedup por `eventId`: o insert em `open_finance_eventos` falha na PK quando a
      entrega se repete, e é isso que corta o reprocessamento
- [x] Handlers: `item/created|updated` e `transactions/created|updated` → sincroniza;
      `item/error` → `sync_status='erro'` (selo vermelho na UI)
- [x] `GET /api/cron/open-finance-sync` diário às 9h (`vercel.json`) — rede de segurança
      para webhook perdido + marca consentimento a ≤15 dias de vencer
- [x] Sync manual: botão "Atualizar" no card Meus bancos → `sincronizarAgora()`

#### ✅ Etapa 4 — Conciliação (branch `feat/open-finance-pluggy`)

- [x] Importa apenas `DEBIT` + não-`PENDING` (`deveVirarGasto`)
- [x] Casamento com gasto manual: mesmo `banco_id`, valor ±R$0,01, data ±3 dias →
      grava o `provider_transaction_id` no gasto existente em vez de duplicar
- [x] **Recorrentes e parcelados nunca são conciliados** — são modelos de lançamento
      repetido; casar um deles travaria a importação dos meses seguintes
- [x] Cada gasto casa com no máximo uma transação (`usados`), e vice-versa
- [x] Importados entram com `categoria_confirmada=false`; card "Revisar importados"
      em `/gastos` confirma um a um ou aceita todas as sugestões
- [x] `category` da Pluggy → bucket 50/30/20 via `mapearCategoria` do `lib/csv-parser.ts`
- [x] Gastos `origem='open_finance'` não contam no limite Free de 10

#### 🔄 Etapa 5 — Consentimento e plano

- [x] Gate: conectar banco é **Premium** (Free cai no `UpgradeModal`)
- [x] Revogação: `desconectarBanco` chama `deleteItem` e volta para `origem='manual'`,
      preservando os gastos já importados
- [x] Aviso de consentimento a vencer (`sync_status='consentimento_expirado'` pelo cron)
- [x] Reconexão: o widget aceita `updateItem` e a rota valida que o item é do usuário
- ⬜ **`consentimento_expira_em` nunca é preenchido** — a coluna existe e o cron já a lê,
      mas o vínculo não grava a data. Falta extrair a validade do item da Pluggy.
- ⬜ Excluir conta do usuário → `deleteItem` na Pluggy (hoje o `on delete cascade` apaga
      a linha em `bancos` e deixa o consentimento órfão no provider)
- ⬜ UI dedicada para reconectar quando o consentimento expira (a action existe, falta o botão)

**Validado:** `tsc --noEmit` limpo, ESLint sem erros nos arquivos novos, `npm run build` OK
(rotas `/api/open-finance/webhook` e `/api/cron/open-finance-sync` registradas; `/gastos` em 34.3 kB).

**Ainda não testado contra a API real da Pluggy** — todo o fluxo foi escrito contra a
documentação e as assinaturas do SDK, sem uma conexão sandbox de ponta a ponta.

**Riscos a vigiar:**
- Chaves da Pluggy nunca podem chegar ao client — só connect token
- Importação precisa ser idempotente no schema; webhook reentrega até 9 vezes
- Categorização automática é sugestão, nunca decisão silenciosa — o 50/30/20 é o núcleo do produto

---

## Branches Ativas

| Branch | Feature | Status |
|--------|---------|--------|
| `feat/bancos-saldo-gastos` | Cadastro de bancos, coluna Banco/Saldo em /gastos | 🚧 Em desenvolvimento |

---

## Histórico de PRs

| PR | Branch | Descrição | Status |
|----|--------|-----------|--------|
| #1 | `findash-2.0` → `main` | MVP completo: auth, dashboard, gastos, fundos, Stripe, landing redesign | ✅ Mergeado |
| #5 | `feature/fix-nav-header-animation` | Sidebar colapsável fluida, avatar dinâmico, ajustes em /configuracoes | ✅ Mergeado |
| #6 | `feature/landing-light-mode` | Landing page light mode, hero cinemático GSAP, mockup iPhone | ✅ Mergeado |
| #7 | `feature/faq-accordion-redesign` | FAQ com Radix Accordion animado | ✅ Mergeado |
| #8 | `feature/gastos-table-redesign` | GastosTable interativa shadcn/ui com colunas toggleáveis | ✅ Mergeado |
| #9 | `fix/auth-inputs-hydration` | Correção de inputs de auth e hydration mismatch | ✅ Mergeado |
| #11 | `feat/dashboard-502030-redesign` | Dashboard v3 50/30/20-first, anéis SVG, dados reais, seletor de mês | ✅ Mergeado |
| #12 | `feature/gastos-redesign-modal` | Redesign /gastos: modal centralizado, DonutChart, coluna de insights | ✅ Mergeado |
