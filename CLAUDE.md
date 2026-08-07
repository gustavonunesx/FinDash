# FinDash 2.0 — CLAUDE.md

## Sobre o Projeto

FinDash é um SaaS de finanças pessoais com planos Free, Premium e Família.
Stack: Next.js 15 (App Router) + TypeScript + Supabase + Stripe + Tailwind CSS v4.

## Fluxo de Trabalho por Requisição (feature/correção avulsa)

Estas regras valem para qualquer pedido de feature, correção, ajuste etc. **fora** do fluxo de milestones formais.

1. **Branch por requisição.** Toda vez que o usuário pedir uma feature, correção ou ajuste no projeto, criar uma branch dedicada para aquela requisição seguindo o padrão de git flow antes de escrever código:
   - Feature nova: `git checkout -b feat/nome-descritivo`
   - Correção de bug: `git checkout -b fix/nome-descritivo`
   - Ajuste/refino/chore: `git checkout -b chore/nome-descritivo`
   - Sempre criar a branch a partir de `master` atualizada.

2. **Commit + PR sob comando "pode commitar".** Quando o usuário disser **"pode commitar"** ao finalizar uma feature/correção que pediu:
   - Fazer o commit das alterações na branch da requisição, incluindo as atualizações dos arquivos de memória, `CLAUDE.md` e `docs/PLAN.md` quando relevantes.
   - Mensagem no padrão Conventional Commits (`type(scope): description`) terminando com a linha de co-autoria.
   - `git push -u origin <branch>`
   - Abrir PR para `master` com `gh pr create`.
   - **Não fazer merge automático** — apenas commit, push e PR, e aguardar instrução.

3. **Gatilho "contexto".** Quando o usuário disser **"contexto"** (geralmente no início de uma nova sessão), isso significa: se contextualizar do projeto para dar seguimento de onde paramos. Ler os arquivos de memória do projeto, o `CLAUDE.md` e o `docs/PLAN.md` (principalmente estes dois), entender o estado atual e o que ficou pendente, e então aguardar o próximo pedido.

---

## Milestone Git Flow

**⚠️ Regra importante:** Nunca iniciar uma nova milestone (criar branch, instalar dependências, escrever código) sem pedido explícito do usuário. Ao concluir o merge de uma milestone, parar e aguardar instrução.

**Início de cada milestone:**
1. Criar branch: `git checkout -b feat/nome-da-milestone`

**Final de cada milestone:**
1. Marcar todas as entregas como `[x]` no `docs/PLAN.md`
2. Atualizar status da milestone na tabela de Milestones acima (neste arquivo)
3. Commit final com a mensagem exata definida no bloco `Commit final` do PLAN.md
4. Push: `git push -u origin <branch>`
5. PR: `gh pr create`
6. Merge: `gh pr merge --merge --delete-branch`
7. Deletar branch local: `git branch -d <branch>`
8. Voltar para master: `git checkout master && git pull`
9. **Parar. Não iniciar a próxima milestone.**

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
- Free: 10 gastos, 3 fundos, sem histórico, sem PDF export, sem Open Finance
- Premium: tudo ilimitado + histórico + PDF + alertas + conexão Open Finance
- Família: até 3 membros + view agregada
- Gastos com `origem='open_finance'` **não** contam no limite Free (uma conexão traz dezenas de transações de uma vez)

### Open Finance (invariantes)
- `PLUGGY_CLIENT_SECRET` nunca sai do servidor — `lib/open-finance*.ts` são `server-only`. Só o connect token vai ao browser
- O `onSuccess` do widget entrega apenas o `itemId`; saldos e transações são buscados no servidor com a API Key (payload do client é forjável)
- Importação é idempotente pelo índice único `gastos (user_id, provider_transaction_id)` — o webhook reentrega até 9 vezes
- Webhook responde 2XX imediatamente e processa em `after()`; acima de 5s a Pluggy considera falha
- Importar só `DEBIT` não-`PENDING`: transação pendente pode ser cancelada e sumir depois
- Conta `CREDIT` (fatura) é gravada como saldo **negativo** — senão um cartão estourado vira patrimônio
- Transação importada entra com `categoria_confirmada=false`; categorizar em silêncio corromperia o score 50/30/20
- Conciliação nunca casa gasto `recorrente` ou parcelado — são modelos de lançamento repetido

## Estrutura Rápida

```
app/
  (marketing)/precos/     — Página de planos
  (app)/                  — Rotas protegidas (auth + onboarding)
    dashboard/            — Dashboard 50/30/20-first (verde claro #F4F7F5): topbar c/ aderência, 3 anéis-bucket (SVG), transações + metas/investimentos; renda real, seletor de mês via histórico, modo privacidade
    gastos/               — CRUD de gastos + importação CSV; modal centralizado "Novo gasto" com tipo de cobrança (Único/Recorrente/Parcelado) e seletor de banco; tabela com colunas Banco + Saldo do banco (ações de editar/excluir no hover da linha), 3 cards de resumo, DonutChart SVG, coluna direita com card "Revisar importados" (gastos do Open Finance pendentes de bucket) + "Meus bancos" (saldo manual editável inline; sincronizado é read-only) + insights
    bancos/               — Server actions do CRUD de bancos (sem página própria; a UI vive em /gastos). `actions.ts` = saldo manual; `open-finance-actions.ts` = vincular/desconectar item da Pluggy (Premium)
    fundos/               — CRUD de fundos + CDI; lista compacta FundoRow (barra colorida, progresso, badge meta), ModalNovoFundo (responsivo, scroll interno, checkbox reserva_emergencia), ModalConfirmarAporte (atalhos rápidos, celebração), coluna direita com ResumoGeralCard + RendimentoCard (verde sólido, CDI/12) + PlanoStatusCard (âmbar, só Free no limite)
    calculadora/          — Regra 50/30/20 + realocação de limites entre categorias (persistida em `configuracoes.ajustes_limite` jsonb) + distribuição de renda extra com aporte direto em fundo de reserva
    historico/            — Analytics (Premium)
    familia/              — Plano Família
    configuracoes/        — Perfil, referral, exportar PDF
    onboarding/           — Wizard 3 etapas
  (auth)/                 — login, cadastro, recuperar-senha
  api/                    — stripe, cron (relatorio-mensal, open-finance-sync), notificacoes, exportar-pdf, taxas, open-finance (connect-token, webhook)
  page.tsx                — Landing page
components/               — 55 componentes React (incl. GastoModal, DonutChart, FundoRow, ModalNovoFundo, ModalConfirmarAporte)
lib/                      — 21 módulos utilitários (incl. open-finance.ts e open-finance-sync.ts, ambos server-only)
supabase/migrations/      — 9 migrations SQL (incl. 004: ajustes_limite em configuracoes; 005: reserva_emergencia em fundos; 006: renda_extra_historico; 007: parcelas_total/parcela_inicio em gastos; 008: tabela bancos + gastos.banco_id; 009: Open Finance — origem/provider em bancos e gastos, open_finance_eventos)
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
PLUGGY_CLIENT_ID
PLUGGY_CLIENT_SECRET
PLUGGY_WEBHOOK_URL
```

> A API Key da Pluggy **não** é variável de ambiente: expira em 2h e é gerada em
> runtime pelo SDK a partir do client id + secret. Nenhuma credencial da Pluggy
> pode receber o prefixo `NEXT_PUBLIC_` — só o connect token vai para o browser.

## Comandos Úteis

```bash
npm run dev       # Dev server (Turbopack) — localhost:3000
npm run build     # Build de produção
npm run lint      # ESLint
npm run test:e2e  # Playwright E2E tests
```
