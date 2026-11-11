# Agente Financeiro — leia isto primeiro

**Status (2026-11-11):** design e spec aprovados; **plano de implementação escrito e aguardando revisão do usuário** (e a escolha do método de execução). Nenhum código de produto foi escrito. Branch: `feat/agente-financeiro`.

## Ordem de leitura
1. `docs/superpowers/specs/2026-11-11-agente-financeiro-design.md` — **a verdade**: decisões, arquitetura, dados, ferramentas, testes, documentação a entregar.
1b. `docs/superpowers/plans/2026-11-11-agente-financeiro.md` — 10 tasks com interfaces, valores de teste e comandos de verificação.
2. `docs/agente/origem/` — os 4 documentos originais do usuário, preservados como recebidos:
   - `prompt-agente-financeiro.md` — comportamento do agente (base do `lib/agente/prompt.ts`)
   - `schema-agente-financeiro.sql` — base da migration `011`
   - `ferramentas-agente.json` — 12 ferramentas (+ `projetar_caixa` na spec)
   - `executar-ferramenta.ts` — executor de referência (a spec corrige 5 problemas dele)
   Onde o código e a spec divergirem dos arquivos de `origem/`, **prevalece a spec**.

## Próximo passo
O usuário revisa o plano e escolhe como executar (subagentes ou nativo) → implementar task a task.

## Regras do projeto que valem aqui (CLAUDE.md)
- Commit/push/PR **só** quando o usuário disser "pode commitar"; sem merge automático.
- Branch por requisição a partir da `main` (o CLAUDE.md fala `master`, o repo usa `main`).
- Ao concluir: atualizar `CLAUDE.md` (seção "Agente Financeiro (invariantes)", variáveis, migration 011, estrutura), `plan.md` e este README com o mapa final dos arquivos.

## Verificação da migration 011 sem Supabase
`npm i --no-save @electric-sql/pglite && node docs/agente/verificar-migration-011.mjs` roda a migration num Postgres em memória (2 usuários, RLS real) e confere RPCs, atomicidade, dia 31 e isolamento. Não substitui testar no Supabase de verdade.
