// Verifica a migration 011 num Postgres em memoria (PGlite), sem tocar no Supabase.
// Simula auth.uid() e roda como role nao-superusuario, entao o RLS vale de verdade.
// Uso: npm i --no-save @electric-sql/pglite && node docs/agente/verificar-migration-011.mjs
// Nao substitui testar no Supabase real, mas pega erro de SQL, RLS e regra das RPCs.
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const MIGRATION = path.join(import.meta.dirname, "../../supabase/migrations/011_agente_financeiro.sql");
const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";

const db = new PGlite();
let falhas = 0;
const ok = (nome, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${nome}${cond ? "" : "  -> " + extra}`);
  if (!cond) falhas++;
};

await db.exec(`
  create role authenticated nologin; create role anon nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  insert into auth.users values ('${U1}'), ('${U2}');
`);

const sql = fs.readFileSync(MIGRATION, "utf8");
await db.exec(sql);
await db.exec(sql);
ok("migration roda duas vezes sem erro (idempotente)", true);

await db.exec(`
  grant usage on schema public to authenticated;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;
`);

async function como(user) {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`);
}
async function q(texto, params) {
  try {
    const r = await db.query(texto, params);
    return { rows: r.rows };
  } catch (e) {
    return { erro: e.message, code: e.code };
  }
}

// ---- criar_caixinha
await como(U1);
let r = await q(`select criar_caixinha('Reserva','protecao',7800,1,null,3000) as j`);
const reserva = r.rows[0].j;
ok("criar_caixinha devolve saldo 3000", Number(reserva.saldo) === 3000, JSON.stringify(reserva));
r = await q(`select count(*)::int as n from movimentacoes where caixinha_id = $1`, [reserva.id]);
ok("criar_caixinha com saldo inicial gera 1 aporte", r.rows[0].n === 1);
r = await q(`select count(*)::int as n from caixinhas`);
ok("u1 ve 1 caixinha", r.rows[0].n === 1);
r = await q(`select criar_caixinha('Pessoal','pessoal',null,3,300,0) as j`);
const pessoal = r.rows[0].j;
ok("caixinha sem saldo inicial nao gera aporte", (await q(`select count(*)::int n from movimentacoes where caixinha_id=$1`, [pessoal.id])).rows[0].n === 0);

// ---- RLS
await como(U2);
ok("u2 nao ve caixinhas do u1", (await q(`select count(*)::int n from caixinhas`)).rows[0].n === 0);
ok("u2 nao ve movimentacoes do u1", (await q(`select count(*)::int n from movimentacoes`)).rows[0].n === 0);
r = await q(`select movimentar_caixinha($1, 'aporte', 10)`, [reserva.id]);
ok("u2 nao movimenta caixinha do u1", r.erro === "Caixinha não encontrada.", JSON.stringify(r));
await q(`insert into agente_mensagens (papel, conteudo, inicio_rodada) values ('user','[]'::jsonb,true)`);
await como(U1);
ok("u1 nao ve mensagens do u2", (await q(`select count(*)::int n from agente_mensagens`)).rows[0].n === 0);
r = await q(`insert into agente_mensagens (user_id, papel, conteudo) values ('${U2}','user','[]'::jsonb)`);
ok("u1 nao grava mensagem em nome do u2", !!r.erro, "gravou");

// ---- movimentar_caixinha
r = await q(`select movimentar_caixinha($1,'retirada',500) as j`, [reserva.id]);
ok("retirada de protecao sem devolver_ate falha", r.erro === "Retirada de caixinha de proteção ou meta exige devolver_ate.", JSON.stringify(r));
r = await q(`select movimentar_caixinha($1,'retirada',9999,'x','2026-12-31') as j`, [reserva.id]);
ok("retirada acima do saldo falha", /^Saldo insuficiente: a caixinha "Reserva" tem só R\$ 3000/.test(r.erro ?? ""), JSON.stringify(r));
r = await q(`select movimentar_caixinha($1,'retirada',-5,'x','2026-12-31') as j`, [reserva.id]);
ok("valor nao positivo falha", r.erro === "O valor precisa ser maior que zero.", JSON.stringify(r));
r = await q(`select movimentar_caixinha($1,'retirada',500,'conserto','2026-12-31') as j`, [reserva.id]);
const mov = r.rows?.[0]?.j;
ok("retirada de protecao vira emprestimo e devolve saldo 2500", mov && Number(mov.saldo_caixinha) === 2500 && mov.emprestimo && Number(mov.emprestimo.valor) === 500, JSON.stringify(r));
await q(`select criar_caixinha('Dinheiro pessoal','pessoal',null,3,300,200)`); // so para ter saldo
const pessoal2 = (await q(`select id from caixinhas where nome='Dinheiro pessoal'`)).rows[0].id;
r = await q(`select movimentar_caixinha($1,'retirada',50,'cafe') as j`, [pessoal2]);
ok("retirada da pessoal nao cria emprestimo", r.rows?.[0]?.j && r.rows[0].j.emprestimo === null, JSON.stringify(r));
r = await q(`select movimentar_caixinha($1,'aporte',100,'sobrou') as j`, [reserva.id]);
ok("aporte soma no saldo (2600)", Number(r.rows?.[0]?.j?.saldo_caixinha) === 2600, JSON.stringify(r));

// ---- registrar_devolucao
const empId = mov.emprestimo.id;
r = await q(`select registrar_devolucao($1, 600) as j`, [empId]);
ok("devolucao acima do pendente falha", r.erro === "Devolução maior que o pendente (R$ 500.00).", JSON.stringify(r));
r = await q(`select registrar_devolucao($1, 200) as j`, [empId]);
ok("devolucao parcial deixa 300 restante e nao quita", r.rows?.[0]?.j && Number(r.rows[0].j.restante) === 300 && r.rows[0].j.emprestimo.quitado === false, JSON.stringify(r));
r = await q(`select registrar_devolucao($1, 300) as j`, [empId]);
ok("devolucao final quita o emprestimo", r.rows?.[0]?.j?.emprestimo?.quitado === true, JSON.stringify(r));
r = await q(`select registrar_devolucao($1, 1) as j`, [empId]);
ok("devolucao em emprestimo quitado falha", /^Devolução maior que o pendente/.test(r.erro ?? ""), JSON.stringify(r));
r = await q(`select registrar_devolucao('00000000-0000-4000-8000-000000000000', 1) as j`);
ok("emprestimo inexistente falha", r.erro === "Empréstimo não encontrado.", JSON.stringify(r));
r = await q(`select saldo from caixinhas where id=$1`, [reserva.id]);
ok("saldo da reserva volta a 3100 (3000-500+100+500)", Number(r.rows[0].saldo) === 3100, JSON.stringify(r.rows));

// ---- registrar_compromisso
const parcelas = JSON.stringify([
  { numero: 1, valor: 1500, vencimento: "2026-12-15", parte_usuario: 750, parte_terceiros: 750, status_ajuda: "confirmada" },
  { numero: 2, valor: 1500, vencimento: "2027-01-15", parte_usuario: 750 },
]);
r = await q(`select registrar_compromisso('Notebook','parcela','Loja',$1::jsonb) as j`, [parcelas]);
const comp = r.rows?.[0]?.j;
ok("compromisso grava 2 parcelas ordenadas", comp && comp.parcelas.length === 2 && comp.parcelas[0].numero === 1 && comp.parcelas[1].status_ajuda === "nenhuma", JSON.stringify(r));
r = await q(`select registrar_compromisso('Vazio','parcela',null,'[]'::jsonb) as j`);
ok("compromisso sem parcelas falha", r.erro === "Informe ao menos uma parcela.", JSON.stringify(r));
const antes = (await q(`select count(*)::int n from compromissos`)).rows[0].n;
r = await q(`select registrar_compromisso('Quebrado','parcela',null,$1::jsonb) as j`, [JSON.stringify([{ numero: 1, valor: 0, vencimento: "2026-12-15", parte_usuario: 0 }])]);
const depois = (await q(`select count(*)::int n from compromissos`)).rows[0].n;
ok("parcela invalida falha por check (23514)", r.code === "23514", JSON.stringify(r));
ok("falha na parcela nao deixa compromisso orfao", antes === depois, `${antes} -> ${depois}`);

// ---- painel_saude
await q(`insert into perfil_financeiro (estabilidade_renda, meta_reserva_meses) values ('contratos', 6)`);
await q(`insert into gastos_fixos (nome, valor, dia_vencimento, categoria) values ('Aluguel', 1300, 31, 'necessidade')`);
r = await q(`select retiradas_no_mes::int as n, emprestimos_abertos::int as e, reserva::numeric as res, custo_fixo_mensal::numeric as cf from painel_saude`);
ok("painel conta so retirada de protecao/meta (1, nao 2)", r.rows?.[0]?.n === 1, JSON.stringify(r));
ok("painel: 0 emprestimos abertos, reserva 3100, custo fixo 1300", r.rows?.[0]?.e === 0 && Number(r.rows[0].res) === 3100 && Number(r.rows[0].cf) === 1300, JSON.stringify(r));
await como(U2);
ok("painel_saude respeita RLS (u2 nao ve nada)", (await q(`select count(*)::int n from painel_saude`)).rows[0].n === 0);
await como(U1);

// ---- dinheiro_livre_real
const hojeSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dia = (s) => new Date(s + "T00:00:00Z");
const fimData = new Date(dia(hojeSP).getTime() + 400 * 86400000).toISOString().slice(0, 10);
let hits = 0;
for (let d = dia(hojeSP); d <= dia(fimData); d = new Date(d.getTime() + 86400000)) {
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  if (d.getUTCDate() === Math.min(31, ultimo)) hits++;
}
await q(`update parcelas set pago = true`);
await q(`update parcelas set pago = false where numero = 1`);
r = await q(`select * from dinheiro_livre_real(1000, $1::date)`, [fimData]);
const linha = r.rows?.[0];
ok(`conta do dia 31 cai todo mes, inclusive meses curtos (${hits} vencimentos em 400 dias)`, linha && Number(linha.contas_a_vencer) === hits * 1300, JSON.stringify(r));
ok("parcela pesa o valor integral (1500), nao parte_usuario (750)", Number(linha.parcelas_a_vencer) === 1500 || fimData < "2026-12-15", JSON.stringify(linha));
ok("dinheiro livre = saldo - contas - parcelas - devolucoes", Number(linha.dinheiro_livre) === 1000 - Number(linha.contas_a_vencer) - Number(linha.parcelas_a_vencer) - Number(linha.emprestimos_a_devolver), JSON.stringify(linha));

// ---- grants
await como(U1);
await db.exec(`reset role; set role anon;`);
r = await q(`select criar_caixinha('x','meta')`);
ok("anon nao executa RPC", !!r.erro, "executou");

console.log(falhas === 0 ? "\nTODAS AS VERIFICACOES PASSARAM" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
