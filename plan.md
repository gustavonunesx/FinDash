# FinDash — Plano de Próximos Passos

> Documento vivo. Marcar `[x]` após concluir cada item. Atualizado em: 2026-05-25.

---

## Ordem de execução sugerida

1. ~~**P1** — Auth animation~~ ✓ concluído
2. ~~**P2** — Revisão de cores~~ ✓ concluído
3. ~~**P5** — Calculadora de Renda Extra: redesign dos blocos~~ ✓ concluído
4. ~~**P3a → P3c** — Fundos: schema + cálculo + API CDI~~ ✓ concluído
5. ~~**P3d → P3f** — Fundos: UI de custódia completa~~ ✓ concluído
6. **P4** — Features de retenção por prioridade

---

## P1 — Auth: Transição animada login ↔ cadastro

**Objetivo:** Ao clicar em "Criar conta" ou "Já tem conta? Entrar", o formulário transiciona in-place com fade + slide, sem navegar para outra página.

**Abordagem:**
- Criar `components/auth/AuthCard.tsx` — componente unificado com `mode: "login" | "register"`
- `app/(auth)/login/page.tsx` → renderiza `<AuthCard initialMode="login" />`
- `app/(auth)/cadastro/page.tsx` → renderiza `<AuthCard initialMode="register" />`
- Links "Criar conta" e "Entrar" viram `<button onClick={() => setMode(...)}>`
- Animação: `gsap.fromTo(formRef, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" })`
- URL muda via `router.replace` após a animação (mantém deep link funcionando)

**Arquivos:**
- `components/auth/AuthCard.tsx` — novo
- `app/(auth)/login/page.tsx` — simplificar para wrapper
- `app/(auth)/cadastro/page.tsx` — simplificar para wrapper

---

## P2 — Design: Revisão do sistema de cores

**Problema:** `--fd-amber` (#BA7517) e `--fd-red` (#E24B4A) estão saturados demais no fundo `#0F0F13`. O verde e azul funcionam bem.

**Mudanças nos tokens (`app/globals.css`):**

| Token | Atual | Proposto | Motivo |
|---|---|---|---|
| `--fd-green` | `#1D9E75` | manter | funciona bem |
| `--fd-blue` | `#378ADD` | manter | funciona bem |
| `--fd-amber` | `#BA7517` | `#C98A2E` | mais suave, menos alaranjado |
| `--fd-red` | `#E24B4A` | `#C94040` | menos saturado no fundo escuro |
| `--fd-purple` (novo) | — | `#7C5CBF` | highlight alternativo, fundos premium |

**Componentes a revisar após a troca:**
- `components/dashboard/Rule502030.tsx` — barras atenção/excedido
- `components/dashboard/MetricCard.tsx` — badges danger/warning
- `components/dashboard/RecentTransactions.tsx` — valor negativo (hoje `--fd-red`)
- `components/fundos/FundoCard.tsx` — cores das barras de progresso
- `app/(app)/dashboard/page.tsx` — badges e ícones do score

---

## P5 — Calculadora de Renda Extra: Redesign dos blocos

**Objetivo:** Tornar os blocos de distribuição mais ricos e acionáveis — cada bloco ocupa a section inteira com carousel horizontal, mostrando exatamente quanto vai para onde e o estado atual do destino.

### UX — Carousel de cards

- Section de largura 100%, cada card ocupa `w-full` com `snap-start`
- Desktop: botões `←` `→` nas laterais para navegar entre cards
- Mobile: swipe horizontal nativo com `overflow-x-auto scroll-smooth snap-x snap-mandatory`
- Dots/indicador de posição abaixo do carousel

### Conteúdo de cada card

**Card 1 — Reserva de Emergência** (40% em "construindo" / 10% em "investindo")
- Valor a separar: `R$ X,XX`
- Select "Fundo de destino": usuário escolhe qual fundo é a reserva de emergência
  - Persistir como `fundo_reserva_id` em `profiles` (nova coluna — migration necessária)
- Saldo atual do fundo selecionado + saldo após aporte
- Barra de progresso em relação à meta

**Card 2 — Objetivos / Fundos** (30% em ambas as fases)
- Lista todos os fundos exceto o de reserva (card 1)
- **Pesos definidos pelo usuário**: input de % por fundo (soma = 100%)
  - Persistir como coluna `peso_renda_extra numeric` na tabela `fundos`
- Para cada fundo: valor calculado pelo peso, saldo atual, saldo após
- **Botão "Confirmar que investi"** por fundo — só atualiza `saldo_atual` quando clicado
  - Server Action: `confirmarAporteRendaExtra(fundoId, valor)` → `UPDATE fundos SET saldo_atual = saldo_atual + valor` + `revalidatePath`
  - **Não contabiliza automaticamente** ao preencher o campo de renda extra

**Card 3 — Qualidade de Vida** (20%)
- Valor separado para gastos de qualidade
- Texto descritivo (`bloco.descricao`), sem fundo de destino

**Card 4 — Investimentos** (10% em "construindo" / 40% em "investindo")
- Valor a investir
- Mesmo padrão do Card 2 (pesos + botão de confirmação por fundo)

### Arquivos

- `components/calculadoras/CalculadoraRendaExtra.tsx` — redesign completo
- `app/(app)/calculadora/actions.ts` — adicionar `confirmarAporteRendaExtra`
- `supabase/migrations/add_fundo_reserva_peso.sql` — coluna `fundo_reserva_id` em `profiles` + `peso_renda_extra` em `fundos`

---

## P3 — Fundos: Custódia + Rendimento por instituição

### Contexto
Usuário informa onde o dinheiro está guardado (ex: Caixinha Nubank, Tesouro Selic) e o sistema calcula o rendimento acumulado ao longo do tempo, como nos apps dos bancos digitais.

### 3a — Migration do banco

```sql
-- Rodar no Supabase SQL Editor
ALTER TABLE public.fundos
  ADD COLUMN IF NOT EXISTS custodia jsonb;

-- Estrutura do jsonb:
-- {
--   "instituicao": "Nubank",
--   "tipo": "percentual_cdi",   -- "percentual_cdi" | "prefixado" | "ipca_mais" | "poupanca"
--   "taxa": 100,                -- 100 = 100% CDI; 12.5 = 12,5% a.a.
--   "data_inicio": "2024-01-15",
--   "aporte_inicial": 500.00
-- }
```

**Arquivo:** `supabase/migrations/add_custodia_fundos.sql`

### 3b — Lib de cálculo (`lib/rendimento.ts`)

Sem API externa por enquanto — usa taxa CDI de referência configurável:

```ts
// Tipos de rendimento suportados:
// - percentual_cdi: saldo * ((1 + CDI_DIARIO) ^ dias_uteis - 1) * (taxa/100)
// - prefixado: saldo * ((1 + taxa/100) ^ (dias/365) - 1)
// - poupanca: saldo * 0.005 * meses (aprox)
// - ipca_mais: IPCA_MENSAL_EST + spread (simplificado)

export function calcularRendimento(custodia: Custodia, saldoAtual: number): {
  rendimentoTotal: number   // R$ ganhos desde data_inicio
  rendimentoMensal: number  // R$ ganhos no último mês
  percentualGanho: number   // % total desde início
  diasInvestido: number
}
```

CDI de referência: constante em `lib/taxas.ts`, atualizável manualmente ou via API (veja 3c).

### 3c — API CDI via Banco Central (`app/api/taxas/cdi/route.ts`)

O Banco Central disponibiliza o CDI diário **gratuitamente, sem autenticação**:

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json
Retorna: [{ "data": "25/05/2026", "valor": "0.043108" }]  (% ao dia)
```

- Criar `app/api/taxas/cdi/route.ts` que faz proxy desta URL
- Cache de 24h via `next: { revalidate: 86400 }` no fetch
- Retorna `{ cdiDiario: number, cdiAnual: number, dataReferencia: string }`
- Sem CORS issues (chamada server-side)
- Usar em `lib/rendimento.ts` para cálculo preciso

### 3d — FundoModal: campos de custódia

Adicionar seção "Onde está guardado?" no modal de criação/edição:
- Select: instituição (Nubank, Inter, Itaú, XP, BTG, Sicoob, Outro)
- Select: tipo de rendimento (% do CDI, Prefixado, IPCA+, Poupança, Não definido)
- Input: taxa (ex: 100 para 100% CDI)
- DatePicker: data de início
- Input: aporte inicial (valor que entrou inicialmente)

**Arquivo:** `components/fundos/FundoModal.tsx`

### 3e — FundoCard: exibição do rendimento

Adicionar ao card do fundo:
- Badge da instituição com cor característica (Nubank = roxo, Inter = laranja, etc.)
- Linha: "Rendendo X% do CDI" ou "12,5% a.a."
- Seção expandível com: rendimento total R$, rendimento no mês R$, % ganho, dias investido
- Counter animado no rendimento (mesmo padrão do MetricCard)

**Arquivo:** `components/fundos/FundoCard.tsx`

### 3f — Dashboard: rendimento total agregado

Adicionar no mini-card de fundos do dashboard:
- Soma do rendimento de todos os fundos com custódia definida
- "Rendendo R$ X,XX este mês" em verde abaixo dos mini-cards

**Arquivo:** `app/(app)/dashboard/page.tsx`

---

## P4 — Features de retenção recomendadas para SaaS financeiro

### Alta prioridade (impacto direto na retenção)

- [ ] **Notificações de orçamento** — email quando usuário ultrapassa 80% do limite de uma categoria. Stack: Supabase Edge Functions + Resend (gratuito até 3k emails/mês). Trigger: webhook no insert de `gastos`.
- [x] **Meta mensal de economia** — usuário define quanto quer guardar por mês; barra de progresso no dashboard mostra quanto falta. Simples: coluna `meta_economia_mensal` em `configuracoes`. ✓ concluído 2026-05-25
- [x] **Gastos recorrentes** — marcar gasto como recorrente (flag + dia do mês); cron no Supabase sugere adicionar automaticamente. Reduz atrito de uso diário. ✓ concluído 2026-05-25
- [x] **Importação de extrato CSV** — upload de CSV do banco; parser no servidor mapeia automaticamente para gastos por categoria. Maior diferencial de produto para usuários novos. ✓ concluído 2026-05-25

### Média prioridade

- [ ] **Relatório mensal por email** — PDF automático todo dia 1 com resumo do mês anterior (feature Premium). Stack: Supabase Edge Function (cron) + react-pdf + Resend.
- [ ] **Comparativo mês a mês** — gráfico de barras lado a lado dos últimos 6 meses por categoria. Dados já existem em `historico_mensal`.
- [ ] **Categorias customizadas** — usuário cria categorias além de necessidade/objetivo/qualidade.
- [ ] **Metas de fundo com data** — "Quero R$ 5.000 até dezembro/2026" → progresso com countdown.

### Growth / monetização

- [ ] **Referral program** — indique um amigo, ambos ganham 1 mês premium grátis. Stripe tem suporte a créditos de assinatura.
- [ ] **Plano família** — 1 conta premium compartilhada com até 3 perfis (ticket médio maior).
- [ ] **Página pública de status** — uptime.findash.app via Better Uptime ou similar (confiança na plataforma).

---

## Notas técnicas

- CDI API (BCB): sem autenticação, cache 24h, chamada server-side elimina CORS
- Supabase `jsonb` para custódia: flexível, indexável, sem migration adicional por campo novo
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` necessário em dev
- Migration `add_onboarding_completed.sql` ainda pendente de execução no Supabase em produção
