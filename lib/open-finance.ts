import "server-only";

import { PluggyClient } from "pluggy-sdk";
import type { Account, Transaction } from "pluggy-sdk";

import { mapearCategoria } from "./csv-parser";
import { BANCO_CORES, type CategoriaGasto } from "./types";

/**
 * Camada de acesso à Pluggy. Tudo aqui é server-only: o clientSecret dá acesso
 * total à conta Pluggy, então nunca pode cruzar para o bundle do client — só o
 * connect token (30 min, escopo reduzido) chega ao browser.
 */

export const PROVIDER = "pluggy";

let client: PluggyClient | null = null;

export function getPluggyClient(): PluggyClient {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais da Pluggy ausentes: defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET."
    );
  }

  // O SDK já renova internamente a API Key (válida por 2h), então o cliente é
  // reaproveitado entre requisições do mesmo processo.
  client ??= new PluggyClient({ clientId, clientSecret });
  return client;
}

export function isOpenFinanceConfigurado(): boolean {
  return Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
}

/**
 * URL que a Pluggy chama nos webhooks. Precisa ser HTTPS pública — localhost não
 * recebe entrega, por isso o fallback para NEXT_PUBLIC_APP_URL só vale em deploy.
 *
 * Em dev o fallback é ignorado de propósito: `NEXT_PUBLIC_APP_URL` aponta para o
 * domínio de produção, e um item criado na máquina local mandaria seus eventos
 * para o servidor publicado, que não conhece aquele banco. Para receber webhook
 * em dev, aponte `PLUGGY_WEBHOOK_URL` para um túnel (ngrok) explicitamente.
 */
export function getWebhookUrl(): string | undefined {
  const base =
    process.env.PLUGGY_WEBHOOK_URL ||
    (process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_APP_URL : undefined);

  if (!base || base.startsWith("http://")) return undefined;
  return `${base.replace(/\/$/, "")}/api/open-finance/webhook`;
}

export async function criarConnectToken(userId: string, itemId?: string) {
  const pluggy = getPluggyClient();
  const webhookUrl = getWebhookUrl();

  const { accessToken } = await pluggy.createConnectToken(itemId, {
    clientUserId: userId,
    ...(webhookUrl ? { webhookUrl } : {}),
    // Impede que o usuário conecte duas vezes a mesma instituição.
    avoidDuplicates: true,
  });

  return accessToken;
}

/** Contas que interessam ao FinDash. `CREDIT` é fatura de cartão, `BANK` é conta corrente/poupança. */
export type ContaSincronizada = {
  provider_account_id: string;
  provider_item_id: string;
  nome: string;
  saldo: number;
  tipo: Account["type"];
};

/**
 * O `balance` da Pluggy tem significados opostos por tipo: em `BANK` é o
 * disponível para gastar; em `CREDIT` é a fatura aberta, ou seja, uma dívida.
 * Guardamos a fatura como saldo negativo para que somar os bancos dê o
 * patrimônio real, e não um cartão estourado parecendo dinheiro em caixa.
 */
export function normalizarSaldo(account: Account): number {
  const saldo = account.balance;
  return account.type === "CREDIT" ? -Math.abs(saldo) : saldo;
}

export function mapearConta(account: Account): ContaSincronizada {
  return {
    provider_account_id: account.id,
    provider_item_id: account.itemId,
    nome: account.marketingName?.trim() || account.name?.trim() || "Conta",
    saldo: normalizarSaldo(account),
    tipo: account.type,
  };
}

export async function buscarContas(itemId: string): Promise<ContaSincronizada[]> {
  const pluggy = getPluggyClient();
  const { results } = await pluggy.fetchAccounts(itemId);
  return results.map(mapearConta);
}

export async function buscarItem(itemId: string) {
  return getPluggyClient().fetchItem(itemId);
}

/**
 * Transações de uma conta a partir de `desde`. Usa a varredura por cursor — o
 * `fetchTransactions` paginado está deprecado no SDK.
 */
export async function buscarTransacoes(
  accountId: string,
  desde: Date
): Promise<Transaction[]> {
  return getPluggyClient().fetchAllTransactions(accountId, {
    dateFrom: desde.toISOString().slice(0, 10),
  });
}

export async function desconectarItem(itemId: string): Promise<void> {
  await getPluggyClient().deleteItem(itemId);
}

export function corPorOrdem(ordem: number): string {
  return BANCO_CORES[ordem % BANCO_CORES.length];
}

/** Transação que vira gasto: só saída de dinheiro e já liquidada. */
export function deveVirarGasto(t: Transaction): boolean {
  // PENDING ainda pode ser cancelada pela instituição; importar geraria um gasto
  // que some depois e bagunça o 50/30/20 do mês.
  return t.type === "DEBIT" && t.status !== "PENDING";
}

export type GastoImportado = {
  nome: string;
  valor: number;
  categoria: CategoriaGasto;
  provider_transaction_id: string;
  data: string;
};

/**
 * A categoria da Pluggy vira apenas *sugestão* de bucket 50/30/20 — o gasto
 * entra com `categoria_confirmada: false` para o usuário revisar. Categorizar em
 * silêncio corromperia o score, que é o núcleo do produto.
 */
export function mapearTransacao(t: Transaction): GastoImportado {
  const nome = t.description.trim() || t.descriptionRaw?.trim() || "Transação";
  const base = t.category?.trim() || nome;

  return {
    nome,
    valor: Math.abs(t.amount),
    categoria: mapearCategoria(base),
    provider_transaction_id: t.id,
    data: new Date(t.date).toISOString(),
  };
}
