# Agente Financeiro — Design

> Data: 2026-11-11 · Branch: `feat/agente-financeiro` · Status: **implementado** (plano em `docs/superpowers/plans/2026-11-11-agente-financeiro.md`; ver §14 para o que mudou na execução). Falta o checklist manual em `docs/agente/README.md`
> Fonte do comportamento do agente: `docs/agente/origem/prompt-agente-financeiro.md` (o usuário pediu para tomá-lo como base).

---

## 1. Objetivo e entendimento

Implementar dentro do FinDash um **agente conselheiro financeiro pessoal**: o usuário conversa em português, o agente lê e grava a "ficha financeira" por ferramentas e responde no formato fixo do prompt (semáforo, tabela de distribuição, calendário de 60 dias, painel de saúde, risco principal, uma pergunta pendente).

O problema que ele resolve: pessoas de renda baixa/média e renda variável quebram por 8 erros recorrentes (contar com dinheiro que não entrou, ilusão de sobra, caixinha virando conta corrente, parcelar sem provisão, ignorar queda de renda, gasto pessoal sem teto, misturar pessoal com negócio, ajuda de família tratada como renda). O agente detecta e corrige isso a cada conversa.

**Dito pelo usuário:** implementar o problema do prompt; módulo paralelo; só Premium; página `/agente`; histórico da conversa guardado; cálculos determinísticos; ajuda de terceiros entra como entrada; documentar tudo para o agente não se perder.
**Assumido por mim (e confirmado no fluxo):** API da Anthropic no servidor, Supabase com a sessão do usuário (RLS), dados do agente isolados por usuário.

## 2. Decisões

| # | Pergunta | Decisão | Motivo |
|---|---|---|---|
| 1 | Relação com fundos/gastos/configuracoes | **Módulo paralelo**: tabelas novas, página própria, nada existente é alterado | Dashboard 50/30/20, Open Finance/OFX, PDF, histórico e gates dependem de `fundos`/`gastos`; unificar é uma reescrita bem maior que o agente |
| 2 | Quem usa | **`profiles.plano === "premium"`** (Família é recurso em cima do Premium; `Plano` = `free \| premium`) | Custo de API só com quem paga; mesmo gate de `historico` e `exportar-pdf` |
| 3 | Interface | Página `/agente` em tela cheia | As respostas têm tabelas e várias seções |
| 4 | Histórico | Conversa persistida em `agente_mensagens` | Continuidade e trilha de auditoria das gravações |
| 5 | Laço do agente | `@anthropic-ai/sdk` direto numa Route Handler | Uma dependência, controle total do laço, ferramentas do usuário rodam no Supabase dele com RLS |
| 6 | Aritmética | Ferramenta determinística `projetar_caixa` (13ª) | Números errados custam a confiança; função pura é testável |
| 7 | Parcela com ajuda de terceiros | Saída = **valor integral**; a ajuda vira entrada quando chega | Prompt: "ela paga sozinha, a ajuda é bônus" |

## 3. Fora de escopo (YAGNI)

Unificar `fundos`↔`caixinhas` ou `gastos`↔`gastos_fixos`; card do agente no dashboard; integrar Open Finance ao agente; várias conversas/threads por usuário (há uma conversa contínua); view agregada da Família para o agente (cada membro tem a própria ficha); plano Free com cota; notificações push; voz; exportar a conversa.

## 4. Arquitetura

### Fluxo de uma mensagem
1. `POST /api/agente` com o texto do usuário (máx. 2.000 caracteres).
2. A rota autentica com o Supabase da sessão (`lib/supabase/server.ts`), exige `plano === "premium"` (senão 403) e aplica o limite de 40 mensagens de usuário por hora (contadas em `agente_mensagens`).
3. Carrega as últimas 30 mensagens, **cortando sempre em fronteira de rodada** (todo `tool_use` precisa do seu `tool_result`), e acrescenta a nova.
4. `lib/agente/loop.ts`: chama o modelo, executa cada `tool_use` com `executarFerramenta` (cliente da sessão, nunca service role), devolve o `tool_result` e repete até o modelo não pedir mais ferramenta. **Máx. 8 iterações**; `maxDuration = 60`; respeita `req.signal`.
5. Texto sai por **SSE**: eventos `texto`, `ferramenta` (status humano: "lendo sua ficha…"), `fim`, `erro`.
6. Grava na `agente_mensagens` a mensagem do usuário e cada rodada **concluída** (`tool_use` + `tool_result` pareados + texto final). `tool_use` sem resultado é descartado. Se a conexão cair no meio, as gravações já feitas ficam registradas e o próximo turno não duplica. Os blocos de `thinking` **não** são persistidos (ver §14).

### Arquivos

| Arquivo | Papel |
|---|---|
| `supabase/migrations/011_agente_financeiro.sql` | tabelas, view, função de Dinheiro Livre, RPCs, `agente_mensagens` |
| `lib/agente/prompt.ts` | prompt de sistema (**fonte única**; o `.md` em `origem/` é só histórico) |
| `lib/agente/ferramentas.ts` | definições das 13 ferramentas (JSON Schema da API) |
| `lib/agente/executar-ferramenta.ts` | executor com filtro de campos e mapeamento de erros |
| `lib/agente/projecao.ts` | `projetarCaixa(ficha, saldoConta, hoje)` — função pura |
| `lib/agente/tipos.ts` | tipos das mensagens e dos blocos |
| `lib/agente/datas.ts` | datas puras (`hojeSaoPaulo`, `somarDias`, `somarMeses`, `diasNoMes`, `dataValida`) |
| `lib/agente/validacao.ts` | filtro e validação de entrada das ferramentas, `mensagemDeErro` |
| `lib/agente/mensagens.ts` | janela de mensagens por fronteira de rodada, validação da mensagem, fechamento de rodada, exibição |
| `lib/agente/loop.ts` | laço modelo↔ferramentas, sem HTTP (cliente injetável para teste) |
| `lib/agente/modelo.ts` | adaptador do `@anthropic-ai/sdk` (prompt caching, streaming) |
| `lib/agente/sse.ts` | formato dos eventos SSE (servidor e cliente) |
| `app/api/agente/route.ts` | auth, gate, limite, SSE, persistência |
| `app/(app)/agente/page.tsx` | gate de demo/Free/Premium e carga do histórico |
| `components/agente/*` | `AgenteChat`, bolhas com Markdown, atalhos, status das ferramentas |

## 5. Dados — migration `011_agente_financeiro.sql`

**Tabelas** (idênticas ao `schema-agente-financeiro.sql` original, sem colisão com 001–010): `perfil_financeiro`, `fontes_renda`, `entradas`, `gastos_fixos`, `caixinhas`, `movimentacoes`, `emprestimos_caixinha`, `compromissos`, `parcelas`. RLS `dono` em todas (`user_id = auth.uid()`), `user_id` default `auth.uid()`, trigger `atualizar_saldo_caixinha` mantido.

**Tabela nova `agente_mensagens`:** `id uuid`, `ordem bigint generated always as identity` (chave de ordenação: as linhas de um mesmo `insert` compartilham o `now()` de `criado_em`, então não servem para ordenar), `user_id uuid default auth.uid()`, `papel text check in ('user','assistant')`, `conteudo jsonb` (blocos de texto/`tool_use`/`tool_result`), `inicio_rodada boolean default false` (`true` na mensagem de texto do usuário que abre uma rodada; serve à janela de mensagens e ao limite por hora), `criado_em timestamptz default now()`; RLS `dono`; índice `(user_id, ordem)`.

**Mudanças em relação ao schema original**
1. `painel_saude.retiradas_no_mes` conta só retiradas de caixinhas `protecao` e `meta` (retirar da `pessoal` é uso normal e geraria falso 🔴 de "2+ retiradas").
2. `dinheiro_livre_real`: parcela pesa **`valor`** (não `parte_usuario`) e vencimento do dia 31 é limitado ao último dia do mês (`least(dia, último dia)`), corrigindo contas que sumiam em meses curtos.
3. `dinheiro_livre_real` e `painel_saude` usam o fuso `America/Sao_Paulo` no lugar de `current_date`/`now()` (o Supabase roda em UTC e, depois das 21h em Brasília, "hoje" viraria o dia seguinte). No servidor Next, `hojeSaoPaulo()` faz o mesmo, e o modelo recebe `Data de hoje: AAAA-MM-DD` no prompt de sistema (bloco sem cache).

**RPCs transacionais** (`security invoker`, o RLS continua valendo; falhas via `raise exception` com mensagem clara em português)
- `registrar_compromisso(p_nome, p_tipo, p_credor, p_parcelas jsonb) → jsonb` — compromisso + parcelas.
- `movimentar_caixinha(p_caixinha_id, p_tipo, p_valor, p_motivo, p_devolver_ate, p_entrada_id) → jsonb` — `select … for update` na caixinha; valida saldo; retirada de `protecao`/`meta` sem `p_devolver_ate` falha; grava movimentação e, se for retirada de `protecao`/`meta`, o empréstimo.
- `registrar_devolucao(p_emprestimo_id, p_valor) → jsonb` — valida `valor ≤ valor − valor_devolvido`; grava aporte e abate o empréstimo.
- `criar_caixinha(p_nome, p_tipo, p_meta, p_prioridade, p_teto_mensal, p_saldo_inicial) → jsonb` — caixinha + aporte "Saldo inicial" juntos (evita duplicar caixinha quando o modelo repete a chamada).

## 6. Ferramentas

As 12 do `ferramentas-agente.json` original + `projetar_caixa`. Regras do executor:
- Cada ferramenta só aceita os campos do seu `input_schema` (derivados de `properties`); o resto é descartado. Campos obrigatórios, enums e números finitos são validados antes do banco (as constraints do banco são a segunda barreira).
- `salvar_caixinha` (criação) → RPC `criar_caixinha`; `movimentar_caixinha`, `registrar_devolucao`, `registrar_compromisso` → RPCs. As demais usam o helper `salvar` (insert sem `id`, update com `id`).
- Erros voltam ao modelo como `{ erro: "<mensagem curta>" }`, sem texto bruto do Postgres.
- **`ler_ficha_financeira`** lê as tabelas do original e, para não crescer sem limite: `parcelas` não pagas + pagas nos últimos 60 dias; `emprestimos_caixinha` não quitados + quitados nos últimos 60 dias; **`movimentacoes` dos últimos 60 dias (novo)**, necessárias para a revisão mensal do prompt (§9); `entradas` as 20 mais recentes.

### `projetar_caixa` (13ª)
Entrada: `saldo_conta` (obrigatório, não é salvo), `horizonte_meses` (padrão 3). O executor lê a ficha e chama `projetarCaixa` (pura, sem I/O).

Saída: 3 cenários × cada mês (entradas, saídas, saldo final) + **mês mais apertado** por cenário; calendário de 60 dias (data, tipo, descrição, valor); provisão por parcela (`parcela ÷ nº de entradas esperadas até o vencimento`); sobra estrutural (renda garantida − custo fixo − provisões), também sem a fonte mais incerta.

| Cenário | Renda considerada |
|---|---|
| Pessimista | fontes `fixa`/`contrato` + entradas `recebido`/`confirmado`, **sem a fonte mais frágil** |
| Base | fontes `fixa`/`contrato` + entradas `recebido`/`confirmado` |
| Otimista | tudo: `variavel`, `incerta`, entradas `incerto`, ajuda `confirmada` como entrada |

- **Fonte mais frágil** = a de menor `ativo_ate` dentro do horizonte; sem `ativo_ate`, a `contrato` de maior valor. O agente mostra essa regra ao usuário.
- Saída de parcela = `valor` integral em todos os cenários. Ajuda só entra como dinheiro quando `recebida` (entrada) ou, no otimista, `confirmada`.
- Vencimento limitado ao último dia do mês.

## 7. Mudanças no prompt base (`prompt.ts` ≠ `.md` original)

1. §3, tabela "Quando usar cada ferramenta": nova linha para `projetar_caixa` ("cenários", "como fica nos próximos meses", todo "recebi X").
2. §5/§6/§8: calendário de 60 dias, 3 cenários e provisão vêm **da ferramenta**; o modelo narra os números e não recalcula.
3. §7 (ajuda de família): registrar em `parte_terceiros`/`status_ajuda`; a saída da parcela continua sendo o valor integral.
4. §3: o painel de saúde vem em `ler_ficha_financeira` junto com parcelas, empréstimos e movimentações dos últimos 60 dias. O restante do original (formato fixo, "nunca recomendar ativo específico") fica como está.

## 8. Interface

- `page.tsx` (server): `isDemoMode()` → explicação de que o agente exige conta real (a rota não chama a API em demo); Free → convite de upgrade; Premium → chat com o histórico.
- Abrir a página **não chama o modelo**. Atalhos: "Recebi um dinheiro", "Como estou?", "Quero tirar da reserva". Usuário novo: o agente conduz o cadastro das 3 perguntas (prompt §11).
- Chat client com `react-markdown` + `remark-gfm` (tabelas). Visual do app: `#0f0f13`, cards `rounded-2xl border border-white/[0.06] bg-[#1a1a24]`, tokens `--fd-*`, JetBrains Mono em valores, **sem laranja**. Sem animação de entrada nas bolhas; indicador de "digitando" só quando visível (regra de animação do projeto).
- Erro: mensagem curta + botão de tentar de novo. Item no menu do app.

## 9. Segurança e privacidade

- Sem service role: o RLS é a única barreira entre usuários. `ANTHROPIC_API_KEY` só no servidor.
- Entrada limitada (2.000 caracteres, 40 mensagens/hora). Texto do usuário reaparece em resultados de ferramentas; risco de injeção é baixo porque o executor só expõe as 13 ferramentas e o RLS limita o alcance.
- **Os dados financeiros do usuário são enviados à API da Anthropic.** A política de privacidade do FinDash precisa mencionar isso antes de ligar o recurso em produção (pendência de produto, fora do código).

## 10. Dependências e ambiente

- Novas: `@anthropic-ai/sdk`, `react-markdown`, `remark-gfm`; dev: `vitest`.
- Novas variáveis: `ANTHROPIC_API_KEY` (obrigatória), `AGENTE_MODELO` (opcional; padrão `claude-sonnet-5-5`).
- Prompt caching no prompt de sistema e nas ferramentas (idênticos a cada turno); a janela de mensagens fica fora do trecho em cache.

## 11. Testes e verificação

**Automatizados (`vitest`, novo script `npm run test`)**
- `projecao.ts`: 3 cenários, fonte mais frágil, dia 31, provisão, parcela integral, ajuda só como entrada.
- `mensagens.ts`: janela nunca separa `tool_use` de `tool_result`; limite por hora.
- `executar-ferramenta.ts`: descarta campos extras, valida enums/obrigatórios, mapeia erro sem texto bruto.
- `loop.ts` com cliente falso: para em 8 iterações; erro de ferramenta volta ao modelo; `tool_use` pendente descartado.

**Manual (depende do Supabase e da chave do usuário) — checklist**
- [ ] Migration 011 aplicada; com 2 usuários, um não enxerga as linhas do outro em nenhuma tabela nova.
- [ ] RPCs: retirada sem `devolver_ate` falha; devolução acima do pendente falha; criar caixinha com saldo inicial gera 1 caixinha e 1 aporte.
- [ ] Usuário Free recebe 403 na rota e vê o convite; demo não chama a API.
- [ ] Conversa real do exemplo do prompt ("Recebi R$ 1.000 de um cliente"): chama `ler_ficha_financeira`, `registrar_entrada`, `calcular_dinheiro_livre`, `projetar_caixa`, responde no formato fixo.
- [ ] Usuário novo: cadastro em 3 perguntas, uma por mensagem, gravando a cada resposta.
- [ ] `npm run build`, `npm run lint`, `npm run test` verdes.

## 12. Documentação a entregar (parte do trabalho, não extra)

1. Esta spec.
2. `docs/agente/README.md`: mapa dos arquivos, como prompt/ferramentas/schema se ligam, como mudar o prompt com segurança, invariantes.
3. `docs/agente/origem/`: os 4 documentos originais do usuário, preservados como foram recebidos (histórico; o código em `lib/agente/` e a migration 011 prevalecem).
4. `CLAUDE.md`: seção "Agente Financeiro (invariantes)", variáveis novas, migration 011, estrutura de pastas.
5. `plan.md`: nova fase com checklist e "Onde paramos".
6. Fluxo do `CLAUDE.md`: commit/push/PR **só** quando o usuário disser "pode commitar"; sem merge automático.

## 13. Riscos e pontos em aberto

- **Custo:** cada turno reenvia a ficha e a janela de mensagens; o cache cobre o prompt e as ferramentas, não a conversa. O limite de 40 mensagens/hora é a proteção. Medir o custo real nos primeiros usuários.
- **Regra da "fonte mais frágil"** é uma suposição minha (ver §6); o usuário pode ajustá-la.
- **Privacidade:** ver §9.
- **Migrations 006–010** ainda precisam ser aplicadas em produção (pendência do `plan.md`); a 011 não depende delas.
- **Saldo da conta não é salvo** (decisão do prompt): o agente pergunta a cada cálculo.

## 14. Como ficou a implementação (divergências da spec e do plano)

Registro das decisões tomadas durante a execução (o ledger completo ficou em `.superpowers/sdd/`, fora do git).

- **Thinking blocks (Sonnet 5.5 roda com thinking adaptativo).** Dentro de um turno os blocos voltam ao modelo, porque a API exige no laço de ferramentas. A conversa persistida **não** os guarda (`removerPensamento`), então nenhuma rodada futura reenvia thinking nem depende dele. Risco: se a API recusar histórico sem esses blocos, o segundo turno falha — só se confirma com chave real (README, "Decisões abertas").
- **Sem `fallbacks` do servidor.** Exigiria o endpoint beta e devolver blocos `fallback` ao histórico. `modelo.ts` lança em `stop_reason` `refusal` ou `max_tokens` e o usuário vê um erro genérico. `effort: "medium"`, `max_tokens: 16000` (o thinking conta no limite), `eager_input_streaming` desligado.
- **`aoNovas` / `mensagemDeFechamento`.** O laço chama `aoNovas` a cada rodada concluída (par `tool_use`+`tool_result`, depois o texto final); a rota grava ali. No limite de iterações, erro ou aborto, `mensagemDeFechamento` acrescenta uma mensagem do assistente para o histórico não terminar em `tool_result`. Resposta só com blocos de pensamento conta como erro.
- **Calendário sempre de 60 dias**, mesmo com `horizonte_meses` curto; provisões também olham além do horizonte quando a parcela vence depois. (O plano dizia o contrário em um teste.)
- **Verificação da migration em Postgres em memória** (`docs/agente/verificar-migration-011.mjs`, PGlite, RLS real): cobre quase todo o checklist de banco da §11. O restante depende do Supabase do usuário.
- **Guardas extras nas RPCs:** `'O valor precisa ser maior que zero.'` e `'Tipo de movimentação inválido.'`; `devolver_ate` é checado antes do saldo (como no executor original).
- **UI com tokens de tema** (`bg-card`, `border-border`…), como `historico/page.tsx`, e não o `#1a1a24` fixo do `CLAUDE.md` (nenhum componente do repo usa essa cor e o app tem tema claro/escuro).
- **Testes:** além de `lib/agente/*.test.ts`, a rota tem `app/api/agente/route.test.ts` (Supabase e modelo simulados: 401/403/400/429/503, SSE, persistência por rodada, thinking fora do banco). O `vitest.config.mts` inclui `lib/**` e `app/**`.
- **Build:** `npm run build` sem `.env` falha em `/calculadora` também na `main` (anterior a esta feature); com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` quaisquer o build passa.
