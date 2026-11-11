# Agente Financeiro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um agente conselheiro financeiro em `/agente` (só Premium) que conversa em português, lê e grava a ficha financeira por 13 ferramentas e responde no formato fixo do prompt.

**Architecture:** Route Handler `POST /api/agente` roda o laço modelo↔ferramentas no servidor com `@anthropic-ai/sdk`, executando cada ferramenta no Supabase com a sessão do usuário (RLS). Cálculos de projeção ficam numa função pura (`projecao.ts`); gravações compostas viram RPCs transacionais. A conversa é persistida em `agente_mensagens` e o texto chega ao navegador por SSE.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (`@supabase/ssr`), `@anthropic-ai/sdk`, `react-markdown` + `remark-gfm`, Tailwind v4, `vitest` (novo).

**Spec:** `docs/superpowers/specs/2026-11-11-agente-financeiro-design.md` (ler antes de qualquer task). Originais do usuário em `docs/agente/origem/`; onde divergirem, **prevalece a spec**.

## Global Constraints

- Branch `feat/agente-financeiro`. **Nenhum `git commit`/`push`/PR até o usuário dizer "pode commitar"** (CLAUDE.md). Por isso as tasks não têm passo de commit; a Task 10 só prepara.
- Módulo paralelo: nenhuma tabela, rota ou tela existente é alterada (exceção: 1 item no menu de `components/layout/app-shell.tsx` e 2 variáveis em `.env.example`).
- Acesso: `profiles.plano === "premium"` (`Plano` = `"free" | "premium"`). Demo (`isDemoMode()`) não chama a API.
- Modelo: `process.env.AGENTE_MODELO ?? "claude-sonnet-5-5"`; chave `ANTHROPIC_API_KEY` só no servidor.
- Limites: mensagem ≤ 2.000 caracteres; 40 rodadas de usuário por hora; janela de 30 mensagens cortada em fronteira de rodada; laço com no máximo 8 iterações; `maxDuration = 60`.
- Nunca usar service role; toda ferramenta usa o cliente Supabase da sessão (`lib/supabase/server.ts`).
- Datas como string `AAAA-MM-DD`, fuso `America/Sao_Paulo` (servidor roda em UTC).
- Saída de parcela = `valor` integral em todos os cálculos; ajuda de terceiros só entra como dinheiro quando `recebida` (já no saldo) ou, só no cenário otimista, `confirmada`.
- UI: tokens `--fd-green/amber/blue/purple`, **nunca laranja**; fundo `#0f0f13`, card `rounded-2xl border border-white/[0.06] bg-[#1a1a24]`; JetBrains Mono em valores; animação só com o elemento visível.
- Código sem comentários desnecessários; sem features além da spec; editar arquivo existente a criar novo quando couber.
- Textos de UI, erros de ferramenta e mensagens em português.

## Review Focus

- Ficha totalmente vazia (usuário com perfil, sem fontes/gastos/parcelas): `projetarCaixa` não quebra e devolve o saldo constante (teste na Task 3).
- O modelo manda número como texto (`"1.458"`), data em linguagem natural (`"amanhã"`) ou `id` que não é uuid: erro curto, nada gravado (Task 4).
- Mensagem vazia, só espaços ou com mais de 2.000 caracteres: rejeitada com 400 antes de qualquer custo de API (Task 2).
- Histórico com `tool_use` sem `tool_result` (queda de conexão no meio): a janela nunca envia par quebrado à API (Task 2).
- O modelo chama ferramenta que não existe ou a ferramenta lança exceção: o laço devolve erro ao modelo e continua (Task 7).

---

### Task 1: Ferramental de teste, dependências e datas

**Files:**
- Modify: `package.json` (deps + script `"test": "vitest run"`), `.env.example`
- Create: `vitest.config.ts`, `lib/agente/datas.ts`
- Test: `lib/agente/datas.test.ts`

**Interfaces:**
- Produces (`lib/agente/datas.ts`):
  - `hojeSaoPaulo(agora?: Date): string`
  - `somarDias(data: string, dias: number): string`
  - `somarMeses(data: string, meses: number): string` (limita o dia ao último dia do mês de destino)
  - `diasNoMes(ano: number, mes: number): number` (`mes` 1–12)
  - `dataValida(s: string): boolean` (formato `AAAA-MM-DD` e data real)

- [ ] **Step 1: Instalar** `npm i @anthropic-ai/sdk react-markdown remark-gfm` e `npm i -D vitest`. Criar `vitest.config.ts` (ambiente `node`, `include: ["lib/**/*.test.ts"]`, alias `"@"` → raiz do projeto). Acrescentar a `.env.example`: `ANTHROPIC_API_KEY=` e `AGENTE_MODELO=` (com um comentário de uma linha dizendo que o padrão é `claude-sonnet-5-5`).
- [ ] **Step 2: Escrever `datas.test.ts` (deve falhar)** com estas asserções:
  - `hojeSaoPaulo(new Date("2026-11-11T02:00:00Z")) === "2026-11-10"`; `hojeSaoPaulo(new Date("2026-11-11T12:00:00Z")) === "2026-11-11"`
  - `somarDias("2026-11-10", 60) === "2027-01-09"`; `somarDias("2026-03-01", -1) === "2026-02-28"`
  - `somarMeses("2026-11-10", 3) === "2027-02-10"`; `somarMeses("2026-01-31", 1) === "2026-02-28"`
  - `diasNoMes(2026, 4) === 30`; `diasNoMes(2028, 2) === 29`
  - `dataValida("2026-02-30") === false`; `dataValida("amanhã") === false`; `dataValida("2026-12-31") === true`
- [ ] **Step 3: Rodar** `npm run test` → FAIL (módulo inexistente).
- [ ] **Step 4: Implementar `datas.ts`** com aritmética em UTC (`Date.UTC`) para não depender do fuso da máquina; `hojeSaoPaulo` usa `Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" })`.
- [ ] **Step 5: Rodar** `npm run test` → PASS.

---

### Task 2: Tipos e utilitários de mensagens

**Files:**
- Create: `lib/agente/tipos.ts`, `lib/agente/mensagens.ts`
- Test: `lib/agente/mensagens.test.ts`

**Interfaces:**
- Produces (`tipos.ts`):
  - `type Bloco = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }`
  - `interface MensagemAgente { papel: "user" | "assistant"; conteudo: Bloco[] }`
  - `interface LinhaMensagem extends MensagemAgente { id: string; ordem: number; inicio_rodada: boolean; criado_em: string }`
  - `interface MensagemExibicao { id: string; papel: "user" | "assistant"; texto: string }`
  - `type StatusLoop = "ok" | "limite" | "interrompida" | "erro"`
- Produces (`mensagens.ts`):
  - constantes `MAX_MENSAGENS_JANELA = 30`, `LIMITE_RODADAS_POR_HORA = 40`, `MAX_CARACTERES_MENSAGEM = 2000`
  - `validarMensagemUsuario(texto: unknown): { ok: true; texto: string } | { ok: false; erro: string }` — faz `trim`; não-string ou vazio → `"Escreva uma mensagem."`; acima do limite → `"Mensagem longa demais (máximo 2.000 caracteres)."`
  - `sanitizarPares(msgs: MensagemAgente[]): MensagemAgente[]` — remove `tool_use` do assistente sem `tool_result` correspondente na mensagem seguinte, remove `tool_result` sem `tool_use` na anterior, descarta mensagens que ficarem sem conteúdo
  - `janelaDeMensagens(linhas: LinhaMensagem[], max?: number): MensagemAgente[]` — recebe linhas em ordem crescente de `ordem`; pega as últimas `max`, descarta o início até a primeira linha com `inicio_rodada`; sem nenhuma → `[]`; aplica `sanitizarPares`
  - `mensagemDeFechamento(novas: MensagemAgente[], status: StatusLoop): MensagemAgente | null` — se a última de `novas` é do usuário (tool_result), devolve mensagem do assistente: para `"limite"` → `"Parei aqui para não me estender. Me diga se quer que eu continue."`; para `"interrompida"`/`"erro"`/`"ok"` → `"(Resposta interrompida. Confira acima o que foi salvo e me avise se faltou algo.)"`; caso contrário `null`
  - `paraExibicao(linhas: LinhaMensagem[]): MensagemExibicao[]` — usuário só com `inicio_rodada`, assistente só com texto não vazio (blocos `text` concatenados), linhas só de `tool_result` somem

- [ ] **Step 1: Escrever `mensagens.test.ts` (deve falhar).** Casos:
  - `validarMensagemUsuario("  oi  ")` → `{ ok: true, texto: "oi" }`; `""`, `"   "`, `42` → `ok: false` com `"Escreva uma mensagem."`; 2.001 caracteres → erro de limite; 2.000 → ok
  - `sanitizarPares`: `[user text, assistant tool_use(id "a"), user tool_result("a"), assistant text]` permanece igual; sem o `tool_result` o `tool_use` some (e a mensagem do assistente que ficou vazia também); `tool_result` órfão no início some
  - `janelaDeMensagens` com `max = 4` sobre 6 linhas onde só a 1ª e a 5ª têm `inicio_rodada`: resultado começa na 5ª; com 2 linhas e nenhum `inicio_rodada` → `[]`; nunca começa por `tool_result`
  - `mensagemDeFechamento`: `novas` terminando em `tool_result` → mensagem do assistente com o texto do status; terminando em texto do assistente → `null`; `novas = []` → `null`
  - `paraExibicao`: de 4 linhas (user início, assistant só tool_use, user tool_result, assistant texto) sobram 2 itens (o user e o texto final)
- [ ] **Step 2: Rodar** `npm run test -- mensagens` → FAIL.
- [ ] **Step 3: Implementar** `tipos.ts` e `mensagens.ts` conforme as assinaturas acima.
- [ ] **Step 4: Rodar** `npm run test -- mensagens` → PASS.

---

### Task 3: Projeção de caixa (função pura)

**Files:**
- Create: `lib/agente/projecao.ts`
- Test: `lib/agente/projecao.test.ts`

**Interfaces:**
- Consumes: `somarDias`, `somarMeses`, `diasNoMes` de `lib/agente/datas.ts`.
- Produces:
```ts
export interface FonteProj { id: string; nome: string; valor: number; dia_pagamento: number | null; tipo: "fixa" | "contrato" | "variavel" | "incerta"; ativo_ate: string | null; ativo: boolean }
export interface GastoFixoProj { nome: string; valor: number; dia_vencimento: number; ativo: boolean }
export interface ParcelaProj { id: string; compromisso_nome: string; numero: number; valor: number; vencimento: string; parte_terceiros: number; status_ajuda: "nenhuma" | "confirmada" | "recebida"; pago: boolean }
export interface EmprestimoProj { id: string; valor: number; valor_devolvido: number; devolver_ate: string; quitado: boolean }
export interface EntradaProj { id: string; descricao: string; valor: number; status: "recebido" | "confirmado" | "incerto"; data_prevista: string | null; fonte_id: string | null }
export interface FichaProjecao { fontes: FonteProj[]; gastosFixos: GastoFixoProj[]; parcelas: ParcelaProj[]; emprestimos: EmprestimoProj[]; entradas: EntradaProj[] }
export interface MesProjetado { mes: string; entradas: number; saidas: number; saldo_final: number }
export interface Cenario { nome: "pessimista" | "base" | "otimista"; meses: MesProjetado[]; menor_saldo: number; mes_mais_apertado: string }
export interface EventoCalendario { data: string; tipo: "conta" | "parcela" | "devolucao" | "entrada"; descricao: string; valor: number }
export interface ProvisaoParcela { parcela_id: string; descricao: string; vencimento: string; valor: number; entradas_ate_vencimento: number; fatia_por_entrada: number }
export interface Projecao {
  fonte_mais_fragil: { nome: string; motivo: string } | null;
  cenarios: Cenario[]; // ordem: pessimista, base, otimista
  calendario_60d: EventoCalendario[];
  provisoes: ProvisaoParcela[];
  sobra_estrutural: { renda_garantida: number; custo_fixo: number; provisoes_mensais: number; sobra: number; sobra_sem_fonte_fragil: number };
}
export function projetarCaixa(ficha: FichaProjecao, saldoConta: number, hoje: string, horizonteMeses?: number): Projecao // padrão 3
```

**Regras da simulação (todas pinadas pela spec §6):**
- Intervalo `[hoje, fim]`, `fim = somarMeses(hoje, horizonteMeses)`, inclusive. `meses` tem um item por mês-calendário tocado (o primeiro e o último parciais); `saldo_final` é o saldo ao fim do mês dentro do intervalo; `entradas`/`saidas` somam só os eventos do mês (`saidas` positivo).
- Eventos de **entrada** só em data `> hoje`; de **saída** em data `>= hoje`. No mesmo dia, entradas antes de saídas. `menor_saldo` = mínimo do saldo corrente (inclui o saldo inicial) e `mes_mais_apertado` = mês (`AAAA-MM`) onde ocorre (primeira ocorrência).
- Dia de vencimento/pagamento acima do tamanho do mês é limitado ao último dia; `dia_pagamento` nulo = último dia do mês.
- Fontes ativas geram um evento por mês enquanto a data `<= ativo_ate` (se houver). Base = tipos `fixa`/`contrato`; otimista = todas as ativas; pessimista = base sem a **fonte mais frágil** (menor `ativo_ate` `<= fim`; empate → maior valor; sem nenhuma com `ativo_ate` → a `contrato` de maior valor; nenhuma → `null` e pessimista = base). `motivo` cita a regra aplicada (`"ativo_ate AAAA-MM-DD"` ou `"contrato de maior valor"`).
- Entradas: `recebido` é ignorada (já está no saldo); `confirmado` entra em todos os cenários na `data_prevista` (sem data → último dia do mês de `hoje`); `incerto` só no otimista. Uma entrada com `fonte_id` cuja data cai no mesmo mês-calendário de uma ocorrência dessa fonte **substitui** a ocorrência.
- Saídas em todos os cenários: gastos fixos ativos; parcelas não pagas na `vencimento` (vencida e não paga → em `hoje`) pelo `valor` integral; empréstimos não quitados em `devolver_ate` (vencido → `hoje`) por `valor - valor_devolvido`.
- Ajuda: parcela `confirmada` com `parte_terceiros > 0` gera entrada de `parte_terceiros` no `vencimento`, **só no otimista**; `recebida` e `nenhuma` não geram nada.
- `calendario_60d` = eventos do cenário **base** em `[hoje, somarDias(hoje, 60)]`, ordenados por data (entradas antes de saídas no mesmo dia); `valor` negativo para saída; descrição de parcela = `` `${compromisso_nome} (parcela ${numero})` ``.
- `provisoes`: para cada parcela não paga com `vencimento >= hoje`, `entradas_ate_vencimento` = nº de eventos de entrada do base em `(hoje, vencimento]`; `fatia_por_entrada = round2(valor / max(1, n))`.
- `sobra_estrutural`: `renda_garantida` = soma das fontes `fixa`/`contrato` ativas (e com `ativo_ate` nulo ou `>= hoje`); `custo_fixo` = soma dos gastos fixos ativos; `provisoes_mensais` = soma do `valor` das parcelas não pagas com vencimento em `[hoje, fim]` ÷ `horizonteMeses`; `sobra = renda_garantida - custo_fixo - provisoes_mensais`; `sobra_sem_fonte_fragil` idem sem o valor da fonte mais frágil.

- [ ] **Step 1: Escrever `projecao.test.ts` (deve falhar).** Fixture "exemplo do prompt": `hoje = "2026-11-10"`, `saldoConta = 1000`, fontes `Emprego` (`id "f-emp"`, 2000, `fixa`, dia 5, `ativo_ate "2026-12-31"`), `Cliente A` (1200, `contrato`, dia 10, sem `ativo_ate`), `Cliente B` (900, `incerta`, dia 10); gasto fixo `Contas fixas` 1300 dia 1; parcelas `Notebook` nº 1 (1500, `2026-12-15`) e nº 2 (1500, `2027-01-15`), ambas `parte_terceiros 750`, `status_ajuda "confirmada"`, não pagas; sem empréstimos e sem entradas. Asserções:
  - meses de todos os cenários: `["2026-11","2026-12","2027-01","2027-02"]`
  - **base**: `saldo_final` `[1000, 1400, -200, -300]`; `entradas` `[0, 3200, 1200, 1200]`; `saidas` `[0, 2800, 2800, 1300]`; `menor_saldo -1500`, `mes_mais_apertado "2027-02"`
  - **pessimista**: `saldo_final` `[1000, -600, -2200, -2300]`; `menor_saldo -3500`, `mes_mais_apertado "2027-02"`; `fonte_mais_fragil.nome === "Emprego"` e `motivo` contém `"2026-12-31"`
  - **otimista**: `saldo_final` `[1000, 3050, 3100, 3900]`; `menor_saldo -300`, `mes_mais_apertado "2026-12"`
  - `calendario_60d` tem 5 eventos, nesta ordem: `2026-12-01 conta -1300`, `2026-12-05 entrada 2000`, `2026-12-10 entrada 1200`, `2026-12-15 parcela -1500`, `2027-01-01 conta -1300`
  - `provisoes`: nº 1 → `entradas_ate_vencimento 2`, `fatia_por_entrada 750`; nº 2 → `3` e `500`
  - `sobra_estrutural`: `renda_garantida 3200`, `custo_fixo 1300`, `provisoes_mensais 1000`, `sobra 900`, `sobra_sem_fonte_fragil -1100`
- [ ] **Step 2: Escrever os testes de borda (mesmo arquivo):**
  - **dia 31**: `hoje "2026-04-10"`, horizonte 1, gasto 100 dia 31, saldo 1000 → calendário tem `2026-04-30` com `-100` e nada em maio
  - **fonte sem `dia_pagamento`** (500, `fixa`), `hoje "2026-11-10"`, horizonte 1 → entrada `2026-11-30`
  - **parcela vencida e não paga** (300, `2026-11-01`), `hoje "2026-11-10"` → saída `-300` em `2026-11-10`
  - **entrada substitui ocorrência**: fonte `f1` (1200, `contrato`, dia 10) + entrada `confirmado` `fonte_id "f1"` 1100 em `2026-12-10`, `hoje "2026-11-10"`, horizonte 1 → exatamente uma entrada em `2026-12-10`, valor 1100
  - **entrada `recebido` ignorada** e **`incerto` só no otimista**
  - **ajuda `recebida` ignorada** no otimista
  - **fonte frágil sem `ativo_ate`**: contratos de 800 e 1200 → frágil é o de 1200; pessimista o remove
  - **ficha vazia** (Review Focus): saldo 500 → todos os cenários com `saldo_final` 500 em todos os meses, `menor_saldo 500`, `fonte_mais_fragil null`, `provisoes []`, `calendario_60d []`, `sobra 0`
- [ ] **Step 3: Rodar** `npm run test -- projecao` → FAIL.
- [ ] **Step 4: Implementar `projetarCaixa`.** Abordagem: uma função interna `eventosDoCenario(ficha, hoje, fim, cenario)` devolve a lista de `{data, tipo, descricao, valor}`; ordenar e acumular dá meses, mínimo e calendário; arredondar valores monetários a 2 casas só na saída.
- [ ] **Step 5: Rodar** `npm run test -- projecao` → PASS.

---

### Task 4: Definições das ferramentas e validação de entrada

**Files:**
- Create: `lib/agente/ferramentas.ts`, `lib/agente/validacao.ts`
- Test: `lib/agente/validacao.test.ts`

**Interfaces:**
- Produces (`ferramentas.ts`):
  - `interface Propriedade { type: "string" | "number" | "integer" | "boolean" | "array" | "object"; enum?: string[]; description?: string; items?: EsquemaObjeto }`
  - `interface EsquemaObjeto { type: "object"; properties: Record<string, Propriedade>; required: string[] }`
  - `interface Ferramenta { name: string; description: string; input_schema: EsquemaObjeto }`
  - `FERRAMENTAS: Ferramenta[]` (13), `ROTULOS_FERRAMENTA: Record<string, string>` (nome → texto de status, ex.: `ler_ficha_financeira: "Lendo sua ficha…"`), `buscarFerramenta(nome: string): Ferramenta | undefined`
- Produces (`validacao.ts`):
  - `validarInput(def: Ferramenta, input: unknown): { ok: true; dados: Record<string, unknown> } | { ok: false; erro: string }`
  - `mensagemDeErro(e: unknown): string`

- [ ] **Step 1: Escrever `ferramentas.ts`.** Copiar as 12 definições de `docs/agente/origem/ferramentas-agente.json` e acrescentar `projetar_caixa`: `description` "Projeta o caixa dos próximos meses em 3 cenários (pessimista, base, otimista), o calendário dos próximos 60 dias, a provisão das parcelas e a sobra estrutural. Chame em todo 'recebi X' e sempre que a renda for mudar. Pergunte o saldo atual da conta antes."; propriedades `saldo_conta` (number, obrigatória) e `horizonte_meses` (integer, opcional, de 1 a 6). Nenhuma outra descrição muda.
- [ ] **Step 2: Escrever `validacao.test.ts` (deve falhar).** Casos (usando `buscarFerramenta`):
  - campo extra (`user_id`) é descartado de `dados`; `salvar_gasto_fixo` sem `nome` → `{ ok: false, erro: 'Campo obrigatório ausente: "nome".' }`
  - `valor: "1.458"` → erro `'Campo "valor" deve ser um número.'`; `NaN`/`Infinity` → mesmo erro; `dia_vencimento: 5.5` → `'Campo "dia_vencimento" deve ser um número inteiro.'`
  - `categoria: "luxo"` → `'Campo "categoria" deve ser um de: necessidade, qualidade_vida.'`
  - `devolver_ate: "amanhã"` e `"2026-02-30"` → `'Campo "devolver_ate" deve ser uma data AAAA-MM-DD válida.'` (vale para toda propriedade cujo nome é `ate`, `ativo_ate`, `vencimento`, `devolver_ate` ou começa com `data_`)
  - `caixinha_id: "abc"` → `'Campo "caixinha_id" deve ser um id válido.'` (vale para `id` e nomes terminados em `_id`, formato uuid)
  - `registrar_compromisso` com uma parcela sem `parte_usuario` → erro que cita `parcelas[0]` e `"parte_usuario"`
  - input que não é objeto (`null`, `"texto"`) → `'Os dados da ferramenta precisam ser um objeto.'`
  - `mensagemDeErro({ code: "P0001", message: "Caixinha não encontrada." })` → `"Caixinha não encontrada."`; `{ code: "23514" }` → `"Algum valor está fora do permitido (ex.: zero ou negativo)."`; `{ code: "PGRST116" }` → `"Registro não encontrado."`; `{ code: "42P01", message: 'relation "x" does not exist' }` → `"Não consegui gravar agora. Tente de novo em instantes."` (nunca repassa o texto bruto)
- [ ] **Step 3: Rodar** `npm run test -- validacao` → FAIL.
- [ ] **Step 4: Implementar `validarInput` e `mensagemDeErro`.** `validarInput` percorre `input_schema.properties` (só essas chaves sobrevivem), valida obrigatórios, tipo, enum e, recursivamente, `items` de arrays.
- [ ] **Step 5: Rodar** `npm run test -- validacao` → PASS.

---

### Task 5: Migration 011

**Files:**
- Create: `supabase/migrations/011_agente_financeiro.sql`

**Interfaces:**
- Produces (nomes que o executor da Task 6 chama): tabelas `perfil_financeiro`, `fontes_renda`, `entradas`, `gastos_fixos`, `caixinhas`, `movimentacoes`, `emprestimos_caixinha`, `compromissos`, `parcelas`, `agente_mensagens`; view `painel_saude`; funções `dinheiro_livre_real(p_saldo_conta numeric, p_ate date)` e as RPCs abaixo.

- [ ] **Step 1: Montar a migration** a partir de `docs/agente/origem/schema-agente-financeiro.sql` (tabelas, trigger, RLS `dono` e view idênticos), com estas mudanças:
  1. `painel_saude.retiradas_no_mes` conta só retiradas cujo `caixinha_id` pertence a caixinha `tipo in ('protecao','meta')`.
  2. `dinheiro_livre_real`: a parcela soma `valor` (não `parte_usuario`); o vencimento do gasto fixo usa `least(gf.dia_vencimento, extract(day from (date_trunc('month', d) + interval '1 month - 1 day')))`; `current_date` e `now()` viram `(now() at time zone 'America/Sao_Paulo')::date` / `(now() at time zone 'America/Sao_Paulo')` também em `painel_saude`.
  3. Remover do cabeçalho o comentário "substitui fundos/gastos" (aqui as tabelas são paralelas).
- [ ] **Step 2: Tabela `agente_mensagens`:** `id uuid pk default gen_random_uuid()`, `ordem bigint generated always as identity`, `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`, `papel text not null check (papel in ('user','assistant'))`, `conteudo jsonb not null`, `inicio_rodada boolean not null default false`, `criado_em timestamptz not null default now()`; índice `(user_id, ordem)`; RLS `dono` (mesmo laço dos demais).
- [ ] **Step 3: RPCs** (`language plpgsql security invoker`, retornam `jsonb`; erros com `raise exception` nas mensagens exatas abaixo; ao final de cada uma `revoke all on function … from public; grant execute on function … to authenticated;`):
  - `criar_caixinha(p_nome text, p_tipo text, p_meta numeric default null, p_prioridade int default 99, p_teto_mensal numeric default null, p_saldo_inicial numeric default 0)` — insere a caixinha; se `p_saldo_inicial > 0` insere aporte com motivo `'Saldo inicial'`; devolve a linha de `caixinhas` já com o saldo atualizado.
  - `movimentar_caixinha(p_caixinha_id uuid, p_tipo text, p_valor numeric, p_motivo text default null, p_devolver_ate date default null, p_entrada_id uuid default null)` — `select … for update` na caixinha (não achou → `'Caixinha não encontrada.'`); retirada acima do saldo → `'Saldo insuficiente: a caixinha "<nome>" tem só R$ <saldo>.'`; retirada de `protecao`/`meta` sem `p_devolver_ate` → `'Retirada de caixinha de proteção ou meta exige devolver_ate.'`; grava a movimentação e, nesse caso, o empréstimo; devolve `{ movimentacao, emprestimo (ou null), saldo_caixinha }`.
  - `registrar_devolucao(p_emprestimo_id uuid, p_valor numeric)` — trava o empréstimo (não achou → `'Empréstimo não encontrado.'`); `p_valor` maior que `valor - valor_devolvido` → `'Devolução maior que o pendente (R$ <pendente>).'`; grava o aporte `'Devolução de empréstimo da caixinha'` e soma em `valor_devolvido`; devolve `{ emprestimo, restante }`.
  - `registrar_compromisso(p_nome text, p_tipo text, p_credor text, p_parcelas jsonb)` — `p_parcelas` vazio/ausente → `'Informe ao menos uma parcela.'`; insere o compromisso e uma linha de `parcelas` por elemento (`numero`, `valor`, `vencimento`, `parte_usuario`, `parte_terceiros` default 0, `status_ajuda` default `'nenhuma'`); devolve `{ compromisso, parcelas }`.
- [ ] **Step 4: Verificar sintaxe** colando a migration no SQL Editor de um projeto Supabase de teste (ou `psql` local, se houver). Resultado esperado: executa sem erro e é idempotente (rodar 2× não falha). **Se não houver banco de teste acessível, registrar isso e deixar o checklist da Task 10 para o usuário.**

---

### Task 6: Executor das ferramentas

**Files:**
- Create: `lib/agente/executar-ferramenta.ts`
- Test: `lib/agente/executar-ferramenta.test.ts`

**Interfaces:**
- Consumes: `buscarFerramenta`, `validarInput`, `mensagemDeErro`, `projetarCaixa`, `FichaProjecao`, `hojeSaoPaulo`, `somarDias`.
- Produces: `executarFerramenta(nome: string, input: unknown, supabase: SupabaseClient, hoje?: string): Promise<unknown>` — nunca lança; erro vira `{ erro: string }`.

**Mapeamento (após `validarInput`; falha → `{ erro }` sem tocar o `supabase`):**
- `ler_ficha_financeira`: `perfil_financeiro`, `fontes_renda`, `gastos_fixos`, `caixinhas`, `compromissos`, `painel_saude` inteiras; `parcelas` com `pago = false` ou `vencimento >= hoje − 60 dias`; `emprestimos_caixinha` com `quitado = false` ou `data_retirada >= hoje − 60 dias`; `movimentacoes` com `data >= hoje − 60 dias`; `entradas` as 20 mais recentes por `criado_em`. Devolve um objeto com uma chave por tabela (`entradas_recentes` para entradas).
- `salvar_perfil`: `upsert` em `perfil_financeiro` com `atualizado_em`; `salvar_fonte_renda`, `salvar_gasto_fixo`, `registrar_entrada`, `atualizar_entrada`, `atualizar_parcela`: insert sem `id`, update com `id` (helper local `salvar`).
- `salvar_caixinha`: sem `id` → RPC `criar_caixinha` (`p_nome`, `p_tipo`, `p_meta`, `p_prioridade`, `p_teto_mensal`, `p_saldo_inicial`); com `id` → update ignorando `saldo_inicial`.
- `movimentar_caixinha` → RPC `movimentar_caixinha` (`p_caixinha_id`, `p_tipo`, `p_valor`, `p_motivo`, `p_devolver_ate`, `p_entrada_id`; ausentes viram `null`); `registrar_devolucao` → RPC com `p_emprestimo_id`, `p_valor`; `registrar_compromisso` → RPC com `p_nome`, `p_tipo`, `p_credor`, `p_parcelas`.
- `calcular_dinheiro_livre` → RPC `dinheiro_livre_real` (`p_saldo_conta`, `p_ate`) com `.single()`.
- `projetar_caixa`: lê `fontes_renda`, `gastos_fixos`, `parcelas` (com `compromissos(nome)`), `emprestimos_caixinha` e `entradas`, monta `FichaProjecao` e devolve `projetarCaixa(ficha, saldo_conta, hoje, horizonte_meses ?? 3)`.
- Nome desconhecido → `{ erro: "Ferramenta desconhecida: <nome>" }`. Qualquer erro do Supabase → `{ erro: mensagemDeErro(error) }`.

- [ ] **Step 1: Escrever `executar-ferramenta.test.ts` (deve falhar)** com um `supabase` falso mínimo (objeto com `rpc: vi.fn()` e `from: vi.fn()`):
  - `movimentar_caixinha` válido → `rpc` chamado uma vez com `("movimentar_caixinha", { p_caixinha_id, p_tipo: "retirada", p_valor: 300, p_motivo: null, p_devolver_ate: "2026-12-05", p_entrada_id: null })`
  - `registrar_devolucao`, `registrar_compromisso` e `salvar_caixinha` sem `id` chamam a RPC certa com os nomes `p_*` acima
  - input inválido (`valor: "1.458"`) → resultado `{ erro: 'Campo "valor" deve ser um número.' }` e `supabase.rpc`/`supabase.from` **não** chamados
  - RPC devolvendo `error: { code: "P0001", message: "Saldo insuficiente: a caixinha \"Reserva\" tem só R$ 100." }` → `{ erro: "Saldo insuficiente: a caixinha \"Reserva\" tem só R$ 100." }`; `error: { code: "XX000", message: "boom interno" }` → erro genérico, sem a palavra `boom`
  - `executarFerramenta("nao_existe", {}, supabase)` → `{ erro: "Ferramenta desconhecida: nao_existe" }`
  - `supabase.rpc` que lança exceção → `{ erro }` (não lança)
- [ ] **Step 2: Rodar** `npm run test -- executar-ferramenta` → FAIL.
- [ ] **Step 3: Implementar `executar-ferramenta.ts`** conforme o mapeamento (switch por `nome`, tudo dentro de `try/catch`).
- [ ] **Step 4: Rodar** `npm run test -- executar-ferramenta` → PASS.

---

### Task 7: Prompt de sistema, adaptador do modelo e laço

**Files:**
- Create: `lib/agente/prompt.ts`, `lib/agente/modelo.ts`, `lib/agente/loop.ts`
- Test: `lib/agente/loop.test.ts`, `lib/agente/prompt.test.ts`

**Interfaces:**
- Consumes: `Bloco`, `MensagemAgente`, `StatusLoop` (Task 2); `FERRAMENTAS` (Task 4).
- Produces:
  - `prompt.ts`: `PROMPT_SISTEMA: string`
  - `loop.ts`: `type ChamarModelo = (p: { mensagens: MensagemAgente[]; onTexto: (t: string) => void; signal?: AbortSignal }) => Promise<{ conteudo: Bloco[] }>` e `executarLoop(historico: MensagemAgente[], deps: { chamarModelo: ChamarModelo; executar: (nome: string, input: Record<string, unknown>) => Promise<unknown>; aoTexto?: (t: string) => void; aoFerramenta?: (nome: string) => void; aoNovas?: (msgs: MensagemAgente[]) => Promise<void>; signal?: AbortSignal; maxIteracoes?: number }): Promise<{ novas: MensagemAgente[]; status: StatusLoop }>` (`maxIteracoes` padrão 8)
  - `modelo.ts`: `criarChamarModelo(cfg: { apiKey: string; modelo: string; hoje: string }): ChamarModelo`

- [ ] **Step 1: Gerar `prompt.ts`** com um script Node descartável (não versionado) que lê `docs/agente/origem/prompt-agente-financeiro.md`, escapa crases e `${`, aplica as 4 edições abaixo e grava `export const PROMPT_SISTEMA = \`…\`;`:
  1. §3, tabela "Quando usar cada ferramenta": nova linha `| "Recebi", "e se eu perder o cliente?", "como fica nos próximos meses?" | \`projetar_caixa\` (peça antes o saldo atual da conta) |`.
  2. Ao fim da §5, novo parágrafo: `**Quem calcula:** o calendário dos próximos 60 dias, os 3 cenários, o mês mais apertado, a provisão de parcela e a sobra estrutural vêm prontos de \`projetar_caixa\`; o Dinheiro Livre Real vem de \`calcular_dinheiro_livre\`. Narre esses números, não refaça as contas. Mostre ao usuário qual fonte foi tratada como a mais frágil no cenário pessimista.`
  3. §7, "Ajuda de família": acrescentar `Registre a ajuda em \`parte_terceiros\` e \`status_ajuda\` da parcela; a saída da parcela continua sendo o valor integral. A ajuda só vira dinheiro quando chega: registre-a como entrada \`recebido\`.`
  4. Substituir a frase `O painel de saúde (…) vem pronto dentro de \`ler_ficha_financeira\`.` por `O painel de saúde (…) vem pronto dentro de \`ler_ficha_financeira\`, junto com as parcelas, empréstimos e movimentações dos últimos 60 dias.`
- [ ] **Step 2: Escrever `prompt.test.ts`:** todo `name` de `FERRAMENTAS` aparece em `PROMPT_SISTEMA` (protege contra deriva) e o texto contém `"Quem calcula"`.
- [ ] **Step 3: Escrever `loop.test.ts` (deve falhar)** com `chamarModelo` e `executar` falsos (`vi.fn`):
  - sem ferramenta: modelo devolve só texto → `status "ok"`, `novas` = `[assistant(texto)]`, `aoNovas` chamado 1 vez, `aoTexto` recebe os pedaços emitidos por `onTexto`
  - uma ferramenta: 1ª resposta `tool_use{id "t1", name "ler_ficha_financeira", input {}}`, 2ª texto → `executar` chamado com `("ler_ficha_financeira", {})`; `novas` = `[assistant(tool_use), user(tool_result{tool_use_id "t1", content JSON do resultado}), assistant(texto)]`; `aoNovas` chamado 2 vezes (par tool_use+tool_result; depois o texto); `aoFerramenta("ler_ficha_financeira")` chamado
  - várias `tool_use` na mesma resposta → uma só mensagem `user` com os `tool_result` na mesma ordem
  - resultado `{ erro: "x" }` → `tool_result` com `is_error: true`; ferramenta inexistente (Review Focus): `executar` devolve `{ erro: "Ferramenta desconhecida: z" }` e o laço continua até o texto final; `executar` que lança → `tool_result` com `is_error: true` e texto genérico, laço continua
  - limite: `chamarModelo` sempre pede ferramenta → 8 chamadas, `executar` 8 vezes, `status "limite"`, `novas` termina em `tool_result` (o par da 8ª rodada completa)
  - `signal` já abortado antes da 2ª chamada → `status "interrompida"` e `novas` só com pares completos
  - `chamarModelo` lança → `status "erro"`, `novas` mantém o que já tinha concluído (sem lançar)
- [ ] **Step 4: Rodar** `npm run test -- loop prompt` → FAIL.
- [ ] **Step 5: Implementar `loop.ts`.** Cada iteração: checa `signal`, chama `chamarModelo` com `[...historico, ...novas]`, empilha a resposta; se houver `tool_use`, executa em ordem, empilha a mensagem `user` com os `tool_result` e chama `aoNovas([assistant, user])`; sem `tool_use`, chama `aoNovas([assistant])` e encerra com `"ok"`.
- [ ] **Step 6: Implementar `modelo.ts`** com `@anthropic-ai/sdk` (consultar a skill `claude-api` para a forma atual da chamada): `client.messages.stream` com `model: cfg.modelo`, `max_tokens: 4096`, `tools: FERRAMENTAS`, `system` = dois blocos de texto — `PROMPT_SISTEMA` com `cache_control: { type: "ephemeral" }` e `` `Data de hoje: ${cfg.hoje} (fuso America/Sao_Paulo).` `` sem cache —, `messages` mapeadas de `MensagemAgente`; repassar `signal`; `onTexto` a cada delta de texto; devolver só blocos `text` e `tool_use` do `finalMessage()`. Este arquivo não tem teste automatizado (depende da API); é coberto na verificação manual da Task 10.
- [ ] **Step 7: Rodar** `npm run test -- loop prompt` → PASS.

---

### Task 8: SSE e rota `POST /api/agente`

**Files:**
- Create: `lib/agente/sse.ts`, `app/api/agente/route.ts`
- Test: `lib/agente/sse.test.ts`

**Interfaces:**
- Consumes: tudo das Tasks 2, 4, 6 e 7.
- Produces (`sse.ts`):
  - `formatarEventoSse(evento: "texto" | "ferramenta" | "fim" | "erro", dados: unknown): string` → `` `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n` ``
  - `separarEventosSse(buffer: string): { eventos: { evento: string; dados: unknown }[]; resto: string }`
  - Cargas: `texto` `{ t: string }`, `ferramenta` `{ nome: string; rotulo: string }`, `fim` `{}`, `erro` `{ mensagem: string }`.
- Produces (`route.ts`): `export const maxDuration = 60`, `export const runtime = "nodejs"`, `export async function POST(req: Request): Promise<Response>`.

- [ ] **Step 1: Escrever `sse.test.ts` (deve falhar):** `separarEventosSse` com dois eventos completos + um pedaço (`"event: texto\ndata: {\"t\":\"o"`) devolve 2 eventos e `resto` igual ao pedaço; concatenar o resto com o fim do pedaço e separar de novo devolve o terceiro evento; ida e volta com `formatarEventoSse` preserva acentos e quebras de linha dentro do JSON.
- [ ] **Step 2: Rodar** `npm run test -- sse` → FAIL; **implementar `sse.ts`**; rodar de novo → PASS.
- [ ] **Step 3: Implementar `route.ts`.** Ordem e códigos de status (JSON `{ error: string }` em português): `isDemoMode()` → 503; `supabase.auth.getUser()` sem usuário → 401 (a rota está fora do `proxy.ts` — `/api` é ignorado por ele); `profiles.plano !== "premium"` → 403; falta de `ANTHROPIC_API_KEY` → 503; corpo inválido ou `validarMensagemUsuario` falhando → 400; `LIMITE_RODADAS_POR_HORA` atingido (contar em `agente_mensagens` as linhas com `inicio_rodada = true` e `criado_em >= now() − 1h`) → 429.
- [ ] **Step 4: Fluxo de streaming na rota.** Carregar as últimas 60 linhas (`order("ordem", { ascending: false }).limit(60)`, invertidas), `historico = [...janelaDeMensagens(linhas), msgUsuario]`; `ReadableStream` com cabeçalhos `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-store, no-transform`; `executarLoop` com `criarChamarModelo({ apiKey, modelo, hoje: hojeSaoPaulo() })`, `executar` = `executarFerramenta(nome, input, supabase)`, `signal: req.signal`; `aoTexto` → evento `texto`; `aoFerramenta` → evento `ferramenta` com o rótulo de `ROTULOS_FERRAMENTA`; `aoNovas` insere em `agente_mensagens` (na primeira chamada, antes, a mensagem do usuário com `inicio_rodada: true`), guardando o que foi persistido. Ao terminar: se `mensagemDeFechamento(persistidas, status)` devolver mensagem, persisti-la; enviar `fim` (status `ok`/`limite`) ou `erro` (status `erro`, mensagem curta fixa). Falha de persistência → `console.error` e evento `erro`. Toda escrita no controller fica protegida contra stream já fechado. Se nada foi persistido (falha antes da 1ª rodada), nada é gravado (nem a mensagem do usuário).
- [ ] **Step 5: Verificar** `npm run build` e `npm run lint` sem erros. Com `npm run dev` e sem `ANTHROPIC_API_KEY`: `curl -X POST localhost:3000/api/agente` sem sessão → 401.

---

### Task 9: Página `/agente`, chat e menu

**Files:**
- Create: `app/(app)/agente/page.tsx`, `components/agente/agente-chat.tsx`, `components/agente/markdown-resposta.tsx`
- Modify: `components/layout/app-shell.tsx` (item no `navMain`, após Calculadora: `{ href: "/agente", label: "Agente", icon: IconSparkles }`, importando `IconSparkles` de `@tabler/icons-react`)

**Interfaces:**
- Consumes: `paraExibicao`, `MensagemExibicao` (Task 2); `separarEventosSse` (Task 8).
- Produces: `AgenteChat({ mensagensIniciais }: { mensagensIniciais: MensagemExibicao[] })`; `MarkdownResposta({ texto }: { texto: string })`.

- [ ] **Step 1: `page.tsx` (server component)**, no padrão de `app/(app)/historico/page.tsx` com `AppShell`: `isDemoMode()` → cartão explicando que o agente exige conta real; `profile?.plano !== "premium"` → convite de upgrade com link para `/precos` (mesmo layout do bloco `!isPremium` de `historico`); Premium → título "Agente Financeiro" (ícone `IconSparkles` em `rounded-xl bg-fd-green/15`) + `AgenteChat`, com as últimas 100 linhas de `agente_mensagens` (ordem crescente) convertidas por `paraExibicao`.
- [ ] **Step 2: `markdown-resposta.tsx`.** `react-markdown` + `remark-gfm`; sem plugin de tipografia (não está instalado), então mapear `components` para `p`, `ul`/`ol`/`li`, `strong`, `h1–h3` e principalmente `table`/`th`/`td` (borda `border-white/[0.06]`, rolagem horizontal em telas estreitas, valores em fonte mono). Sem HTML bruto.
- [ ] **Step 3: `agente-chat.tsx` (client).** Estado: mensagens, texto digitado, `enviando`, `statusFerramenta`, `erro`. Enter envia, Shift+Enter quebra linha; campo e botão desabilitados enquanto `enviando` (evita envio duplo); `fetch("/api/agente", { method: "POST" })` e leitura do corpo com `separarEventosSse`, acrescentando `texto` à última mensagem do assistente e mostrando o rótulo de `ferramenta` até a próxima mensagem; `erro` ou resposta não-2xx → aviso curto com botão "Tentar de novo" que reenvia a última mensagem; rolar para o fim a cada atualização. Estado vazio: 3 atalhos clicáveis que preenchem e enviam — "Recebi um dinheiro", "Como estou?", "Quero tirar da reserva". Abrir a página não chama a API. Sem animação de entrada nas bolhas; o indicador de "digitando" só anima enquanto visível.
- [ ] **Step 4: Verificar** `npm run lint` e `npm run build` sem erros, e `npm run test` verde. Abrir `npm run dev`: item "Agente" no menu; Free vê o convite; demo vê a explicação (conferir olhando as duas telas no navegador).

---

### Task 10: Documentação, verificação final e fechamento

**Files:**
- Modify: `CLAUDE.md`, `plan.md`, `docs/agente/README.md`, `docs/superpowers/specs/2026-11-11-agente-financeiro-design.md`
- Create: arquivo de memória do projeto (ver Step 4)

- [ ] **Step 1: `CLAUDE.md`:** nova seção "Agente Financeiro (invariantes)" com — módulo paralelo (tabelas `caixinhas`, `gastos_fixos`… não substituem `fundos`/`gastos`); só Premium; nunca service role; só dinheiro `recebido` é distribuído; saída de parcela = valor integral e ajuda de terceiros é entrada; gravações compostas só por RPC; `lib/agente/prompt.ts` é a fonte única do prompt (`docs/agente/origem/` é histórico); persistência por rodada concluída. Acrescentar `ANTHROPIC_API_KEY` e `AGENTE_MODELO` em "Variáveis de Ambiente", a rota `agente/` em "Estrutura Rápida", `api/agente`, `lib/agente/` e a migration 011.
- [ ] **Step 2: `plan.md`:** trocar o bloco "Em andamento" por uma fase "Agente Financeiro" com checklist `[x]` das Tasks 1–9 e as pendências abertas (política de privacidade citando a API da Anthropic; aplicar migration 011 em produção; medir custo real).
- [ ] **Step 3: `docs/agente/README.md`:** trocar o status por "implementado" e acrescentar o mapa final dos arquivos de `lib/agente/*`, da rota e dos componentes, com uma linha de responsabilidade cada.
- [ ] **Step 4: Memória do projeto** em `C:\Users\52801605808\.claude\projects\c--Users-52801605808-Desktop-FinDash\memory\`: um arquivo `project_agente-financeiro.md` (frontmatter `name`, `description`, `metadata.type: project`) com o que não está no código — decisões 1–7 da spec e **por quê**, e que o prompt-base do usuário está em `docs/agente/origem/` — e a linha de ponteiro em `MEMORY.md`.
- [ ] **Step 5: Spec:** conferir que `docs/superpowers/specs/…-design.md` reflete o que foi construído (colunas `ordem` e `inicio_rodada`, fuso `America/Sao_Paulo`, `aoNovas`, `mensagemDeFechamento`); corrigir divergências.
- [ ] **Step 6: Verificação final:** `npm run test`, `npm run lint`, `npm run build` — todos verdes; colar o resultado na resposta ao usuário.
- [ ] **Step 7: Checklist manual do usuário** (depende do Supabase e da chave dele; entregar como lista, **não** marcar como feito sem ele rodar):
  - [ ] Migration 011 aplicada; com 2 usuários, nenhum enxerga linhas do outro em nenhuma tabela nova nem em `agente_mensagens`
  - [ ] RPCs: retirada de `protecao` sem `devolver_ate` falha; devolução acima do pendente falha; `criar_caixinha` com saldo inicial gera 1 caixinha e 1 aporte
  - [ ] Free recebe 403 na rota e vê o convite; demo não chama a API
  - [ ] Conversa real "Recebi R$ 1.000 de um cliente": chama `ler_ficha_financeira`, `registrar_entrada`, `calcular_dinheiro_livre`, `projetar_caixa` e responde no formato fixo
  - [ ] Usuário novo: cadastro em 3 perguntas, uma por mensagem, gravando a cada resposta
  - [ ] Fechar a aba no meio de uma resposta e reabrir: nada duplicado, histórico coerente
- [ ] **Step 8: Parar.** Não commitar, não dar push, não abrir PR. Avisar o usuário que a implementação está pronta para revisão e que, ao dizer **"pode commitar"**, será feito commit (Conventional Commits `feat(agente): …` com a linha de co-autoria), `git push -u origin feat/agente-financeiro` e `gh pr create` para `main`, sem merge automático.
