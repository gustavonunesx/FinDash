# FinDash 2.0 — Plan

## Status Geral
Todos os milestones principais estão concluídos (M1–M7).
Próxima fase: **ajustes finos de UI/UX** nas páginas existentes.

---

## Concluído

### M7 — Dashboard Visual Upgrade ✅
- Fontes: Plus Jakarta Sans (body) + JetBrains Mono (números)
- `MetricCard` — fadeUp escalonado, counter rAF, barra elástica, badge contextual, hover glow
- `Rule502030` — 3 barras animadas com status semântico, badges de alerta
- `StreakBar` — 7 pílulas dos últimos dias, pulse no dia atual
- `RecentTransactions` — emoji por categoria, data relativa, hover row
- globals.css: `.animate-fade-up`, `.animate-progress`, `.animate-pulse-soft`, `.glass`, `.hover-lift`

---

## Próxima Fase — Ajustes Finos (M8)

### Auth
- [ ] Página `/recuperar-senha` — UI + integração com `resetPassword` action
- [ ] Página `/atualizar-senha` — recebe token do email e atualiza senha via Supabase
- [ ] Feedback visual no login quando erro (já retorna `{ error }`, mas checar se aparece na tela)

### Dashboard
- [ ] Corrigir streak: hoje deve ser marcado como checked só se houver gasto no dia (remover `|| i === 6`)
- [ ] MetricCard: ajustar counter para valores < 1 (ex: "0 fundos") não animar desnecessariamente
- [ ] Empty state do dashboard quando `salario === 0` mas há gastos (estado incompleto)

### Gastos
- [ ] Revisar UI da tabela/lista de gastos com o novo visual (tokens, hover, tipografia)
- [ ] GastoModal: checar animação de abertura e fechamento

### Fundos
- [ ] FundoCard: aplicar hover-lift e accent color consistente com MetricCard
- [ ] Verificar phase auto-detection funcionando com dados reais

### Calculadora
- [ ] Revisar layout com novas fontes (JetBrains Mono nos valores calculados)

### Navegação
- [ ] NavLink ativo: aplicar `.nav-active` (underline verde) na rota atual — desktop
- [ ] MobileNavLink ativo: aplicar `.nav-mobile-active` (barra verde no topo) — mobile
- [ ] `components/layout/NavLink.tsx` e `MobileNavLink.tsx` já existem, integrar no layout

### Configuracoes
- [ ] Revisar ConfiguracoesClient com novo visual

---

## Decisões de Design Fixadas
- Estética: dark premium, fintech moderno, sem gradientes pesados
- Animações: CSS puro via keyframes no globals.css — sem Framer Motion
- Cores semânticas: verde = ok, âmbar = atenção, vermelho = excedido/danger
- Badges: sempre `text-[10px] font-semibold px-2 py-0.5 rounded-full`
- Cards: `rounded-xl border border-border bg-card` com accent line no topo

---

## Notas Técnicas
- `stripe listen` necessário em dev para testar webhooks localmente
- Supabase: "Confirm email" deve estar desativado em dev
- Conflito de merge resolvido em `dashboard/page.tsx` (commit d5376b1)
- `components/layout/NavLink.tsx` e `MobileNavLink.tsx` vieram do remote — ainda não integrados no layout
