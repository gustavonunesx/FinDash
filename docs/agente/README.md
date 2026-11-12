# Agente Financeiro — leia isto primeiro

**Status (2026-11-11):** implementado na branch `feat/agente-financeiro` (commits e push a cada task; **PR ainda não aberto**). Falta o usuário aplicar a migration 011, configurar `ANTHROPIC_API_KEY` e rodar o checklist manual abaixo.

## Ordem de leitura
1. `docs/superpowers/specs/2026-11-11-agente-financeiro-design.md` — **a verdade**: decisões e motivos, arquitetura, dados, ferramentas.
2. `docs/superpowers/plans/2026-11-11-agente-financeiro.md` — as 10 tasks executadas, com interfaces e valores de teste.
3. `docs/agente/origem/` — os 4 documentos originais do usuário, como recebidos (histórico; onde divergirem, **prevalecem o código e a spec**): `prompt-agente-financeiro.md`, `schema-agente-financeiro.sql`, `ferramentas-agente.json`, `executar-ferramenta.ts`.

## Mapa dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/011_agente_financeiro.sql` | 9 tabelas do agente, `agente_mensagens`, view `painel_saude`, `dinheiro_livre_real`, RPCs `criar_caixinha` / `movimentar_caixinha` / `registrar_devolucao` / `registrar_compromisso` |
| `lib/agente/prompt.ts` | prompt de sistema (**fonte única**; gerado do original com 4 edições — ver spec §7) |
| `lib/agente/ferramentas.ts` | as 13 ferramentas (JSON Schema), rótulos de status, `buscarFerramenta` |
| `lib/agente/validacao.ts` | filtra campos, valida tipo/enum/data/uuid; `mensagemDeErro` nunca repassa texto bruto do banco |
| `lib/agente/executar-ferramenta.ts` | `executarFerramenta(nome, input, supabase, hoje?)` — nunca lança, devolve `{ erro }` |
| `lib/agente/projecao.ts` | `projetarCaixa(...)` — função pura: 3 cenários, calendário de 60 dias, provisões, sobra estrutural |
| `lib/agente/loop.ts` | laço modelo↔ferramentas (máx. 8 iterações), sem HTTP; `aoNovas` é chamado a cada rodada concluída |
| `lib/agente/modelo.ts` | adaptador do `@anthropic-ai/sdk` (prompt caching, streaming, `effort: "medium"`); sem teste automatizado |
| `lib/agente/mensagens.ts` | janela em fronteira de rodada, validação da mensagem, fechamento de rodada, `removerPensamento`, exibição |
| `lib/agente/sse.ts` | formato dos eventos SSE (`texto`, `ferramenta`, `fim`, `erro`) — servidor e cliente |
| `lib/agente/chat-estado.ts` | estado puro de uma resposta em streaming (texto, rótulo da ferramenta, erro, "terminou"); usado por `agente-chat.tsx` |
| `lib/agente/datas.ts` | datas puras em `America/Sao_Paulo` |
| `lib/agente/tipos.ts` | tipos de mensagens e blocos |
| `app/api/agente/route.ts` | auth → plano → chave → corpo → limite/hora → laço em SSE → persistência |
| `app/(app)/agente/page.tsx` | gate (demo / Free / Premium) e carga do histórico |
| `components/agente/agente-chat.tsx`, `markdown-resposta.tsx` | chat em streaming; Markdown com tabelas |
| `docs/agente/verificar-migration-011.mjs` | verifica a migration num Postgres em memória (2 usuários, RLS real) |

Testes (`npm run test`, Vitest): `lib/agente/*.test.ts` e `app/api/agente/route.test.ts`. A rota é testada com Supabase e modelo simulados.

## Verificação da migration 011 sem Supabase
`npm i --no-save @electric-sql/pglite && node docs/agente/verificar-migration-011.mjs` roda a migration num Postgres em memória e confere RPCs, atomicidade, dia 31 e isolamento entre usuários. Não substitui testar no Supabase de verdade.

## Checklist manual (precisa do seu Supabase e da sua chave — **ainda não feito**)
- [ ] Aplicar `011_agente_financeiro.sql` no Supabase; definir `ANTHROPIC_API_KEY` (e `AGENTE_MODELO`, opcional) em `.env.local` e no Vercel
- [ ] Com 2 usuários reais: nenhum enxerga as linhas do outro nas tabelas novas nem em `agente_mensagens`
- [ ] Free vê o convite de upgrade e a rota devolve 403; demo mostra a explicação (esta já foi vista em modo demo)
- [ ] Conversa real "Recebi R$ 1.000 de um cliente": chama `ler_ficha_financeira`, `registrar_entrada`, `calcular_dinheiro_livre`, `projetar_caixa` e responde no formato fixo (semáforo, tabelas, calendário, painel, risco, uma pergunta)
- [ ] **Segundo turno da mesma conversa** funciona: o histórico é reenviado sem blocos de `thinking` (decisão da v1); se a API reclamar (400 sobre `thinking`), ver "Decisões abertas"
- [ ] Usuário novo: cadastro em 3 perguntas, uma por mensagem, gravando a cada resposta
- [ ] Fechar a aba no meio de uma resposta e reabrir: nada duplicado, histórico coerente
- [ ] Tabelas do Markdown legíveis em tema claro e escuro; botão "Tentar de novo" após forçar um erro (ex.: chave inválida)

## Decisões abertas / riscos conhecidos
- **Thinking blocks**: o Sonnet 5.5 roda com thinking adaptativo. Dentro de um turno os blocos voltam ao modelo (a API exige); entre turnos o histórico persistido não os inclui. A revisão final confirmou na documentação da Anthropic que histórico sem blocos de thinking é um estado válido (e o caminho de recuperação documentado). **Não persista thinking**: a janela deslizante e o bloco de data no prompt mudam o prefixo, e contas novas passariam a receber 400. Se um dia precisar, use `prefix_mismatch_behavior: "drop_block"` ou edição de contexto no servidor.
- **SEGURANÇA, já existia na main (migration 001)**: a policy `profiles_own` é `for all using (auth.uid() = id)`, então qualquer usuário logado consegue trocar o **próprio** `profiles.plano` para `premium` com a chave anon + o próprio JWT. Antes isso só liberava recursos; agora libera custo de API do agente (limitado a 40 rodadas/hora por conta). Correção sugerida, fora do módulo do agente e a decidir: trigger `BEFORE UPDATE` em `profiles` (ou privilégios por coluna) que só deixe `service_role` alterar `plano`, `stripe_customer_id`, `stripe_subscription_id` e `assinatura_status`; conferir antes os caminhos de escrita do Stripe webhook e de `lib/referral-rewards.ts`.
- **Limite por hora**: a rodada é gravada e contada **antes** de chamar o modelo (se falhar a contagem, a linha é desfeita com 429); falhas, abortos e timeout também contam. O laço tem prazo de 50s (`maxDuration` 60) e, ao estourar, grava e mostra uma mensagem de interrupção.
- **Sem `fallbacks` do servidor**: uma recusa do modelo (`refusal`) vira erro amigável. Habilitar exige o endpoint beta e devolver blocos `fallback` ao histórico.
- **Custo**: a ficha e as últimas 30 mensagens são reenviadas a cada turno; só prompt e ferramentas ficam em cache. O limite de 40 rodadas/hora é a proteção.
- **Privacidade**: os dados financeiros vão para a API da Anthropic; a política de privacidade do FinDash precisa dizer isso antes de produção.
- **Regra da "fonte mais frágil"** do cenário pessimista é suposição documentada na spec §6 (menor `ativo_ate` no horizonte; sem `ativo_ate`, a `contrato` de maior valor).

## Regras do projeto que valem aqui (CLAUDE.md)
- Commit/push/PR conforme pedido do usuário; sem merge automático. Branch por requisição a partir da `main`.
- Ao mudar o agente: atualizar este README, a seção "Agente Financeiro (invariantes)" do `CLAUDE.md` e `plan.md`.

## Achados menores adiados (revisão final, 2026-11-11)
Nenhum foi corrigido; todos têm baixo impacto hoje. Em ordem aproximada de valor:
- **Entrada sem `data_prevista` se repete todo mês** (cai no último dia do mês corrente) e nenhuma ferramenta cancela ou apaga uma entrada; a saída é rebaixá-la para `incerto` ou marcá-la `recebido` falsamente. Falta uma ferramenta para cancelar entrada.
- **`salvar_caixinha` com `id` pode trocar `tipo` de `protecao` para `pessoal`**, e depois disso retirar não vira empréstimo; `devolver_ate` no passado também é aceito (a validação só confere o formato).
- **`ate` sem limite em `dinheiro_livre_real`**: `"9999-12-31"` passa na validação e gera milhões de linhas em `generate_series` (só o statement timeout protege). Limitar a data a poucos anos.
- **Duas `sobra_estrutural`** chegam ao modelo: a da view `painel_saude` (sem provisões) e a de `projetar_caixa` (com). O prompt diz que a segunda vale; a primeira continua em `ler_ficha_financeira`.
- **Imagens em Markdown não estão bloqueadas** (`components/agente/markdown-resposta.tsx`): `![](url)` carrega sozinha. Hoje o alcance é só o texto do próprio usuário; vira canal de exfiltração se descrições do Open Finance passarem a alimentar o agente. Basta `img: () => null` em `components`.
- **a11y do chat**: a lista de mensagens não tem `role="log"`/`aria-live` e o textarea só tem placeholder (sem `label`); ele também perde o foco enquanto envia.
- **`emprestimos_caixinha.data_retirada`** usa `current_date` em UTC (depois das 21h de Brasília grava o dia seguinte); o resto do módulo usa `America/Sao_Paulo`.
- **FKs sem checagem de dono** (`entradas.fonte_id`, `movimentacoes.entrada_id`) e escritas diretas via PostgREST pulam as guardas das RPCs (só afetam linhas do próprio usuário).
- **`atualizar_parcela` só com `id`** manda um update vazio e devolve "Registro não encontrado".
- **Custo**: só prompt e ferramentas ficam em cache; cada iteração (até 8) reenvia a janela inteira, incluindo o `ler_ficha_financeira` anterior. Um breakpoint de `cache_control` na última mensagem resolveria (o histórico é append-only dentro do turno).
- **Fronteira de "hoje"** na projeção: fonte que paga hoje é tratada como já no saldo; conta que vence hoje, como ainda não paga. Razoável, mas o modelo não é avisado.
- **Conta fixa paga antes do vencimento** continua sendo subtraída até a data passar (não há estado "pago neste mês"), então o Dinheiro Livre sai conservador (menor).

## Retomar em outra máquina
1. `git fetch && git checkout feat/agente-financeiro` e `npm install`.
2. Contexto: leia este README, `plan.md` (pendências) e a spec (§14 e "Correções da revisão final"). A memória do Claude **não** viaja entre máquinas; tudo o que importa está no repositório.
3. `npm run test` (145 testes) e, se quiser rever a migration sem Supabase, `npm i --no-save @electric-sql/pglite && node docs/agente/verificar-migration-011.mjs`.
4. Build local: `NEXT_PUBLIC_SUPABASE_URL=https://x.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=x npm run build` (sem `.env`, `/calculadora` falha, como na `main`).
5. Próximos passos, nesta ordem: aplicar a migration `011` no Supabase → definir `ANTHROPIC_API_KEY` → rodar o checklist manual acima com uma conta Premium → decidir a correção do `profiles_own` (autoconcessão de Premium) → só então abrir o PR para `main`.
