import { mapearCategoria } from "./csv-parser";
import type { CategoriaGasto } from "./types";

/**
 * Parser de OFX (Open Financial Exchange), o formato de extrato que praticamente
 * todo banco brasileiro exporta. É SGML: as tags podem vir sem fechamento, então
 * não dá para usar um parser de XML — daí a varredura manual abaixo.
 *
 * O ganho sobre o CSV é o `FITID`, identificador único da transação atribuído
 * pelo banco. Ele entra em `provider_transaction_id` e faz a reimportação do
 * mesmo extrato não duplicar nada, reusando o índice único da migration 009.
 */

export interface OfxTransacao {
  fitid: string;
  nome: string;
  /** Sempre positivo: o sinal do OFX vira o campo `tipo`. */
  valor: number;
  categoria: CategoriaGasto;
  /** ISO. Vira o `created_at` do gasto para a conciliação casar por data. */
  data: string;
  tipo: "debito" | "credito";
}

export interface OfxResultado {
  transacoes: OfxTransacao[];
  /** Saldo final informado no extrato, quando presente. */
  saldo: number | null;
  /** Identificação da conta no arquivo, para exibir no preview. */
  conta: string | null;
  errors: string[];
}

/** Lê o conteúdo de uma tag SGML sem depender de fechamento explícito. */
function tag(bloco: string, nome: string): string | null {
  const re = new RegExp(`<${nome}>([^<\\r\\n]*)`, "i");
  const m = bloco.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Datas OFX são `YYYYMMDDHHMMSS` com sufixo de fuso opcional (`[-3:BRT]`).
 * `new Date()` não entende esse formato, então os campos são extraídos na mão.
 */
function parseData(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;

  const [, ano, mes, dia] = m;
  const hora = raw.match(/^\d{8}(\d{2})(\d{2})(\d{2})/);

  const d = new Date(
    Date.UTC(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      hora ? Number(hora[1]) : 12,
      hora ? Number(hora[2]) : 0,
      hora ? Number(hora[3]) : 0
    )
  );

  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** OFX usa ponto decimal, mas há exportadores brasileiros que emitem vírgula. */
function parseValor(raw: string | null): number | null {
  if (!raw) return null;
  const limpo = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : null;
}

/**
 * O charset varia por banco: alguns declaram `CHARSET:1252` (Latin-1) no
 * header, outros exportam UTF-8 sem declarar nada. Decodificar como Latin-1
 * um arquivo que já é UTF-8 (ou vice-versa) produz mojibake nos acentos, então
 * o charset é decidido a partir dos bytes reais, não de um fixo.
 */
export function decodificarOfx(bytes: ArrayBuffer): string {
  // O header OFX é sempre ASCII puro, então é seguro ler os primeiros bytes
  // como Latin-1 só para localizar as tags CHARSET/ENCODING.
  const head = new TextDecoder("ISO-8859-1").decode(bytes.slice(0, 512));
  const charset = head.match(/CHARSET:(\S+)/i)?.[1]?.toUpperCase();

  if (charset === "UTF-8" || charset === "UTF8") {
    return new TextDecoder("utf-8").decode(bytes);
  }
  if (charset === "1252" || charset === "8859-1" || charset === "ISO-8859-1") {
    return new TextDecoder("ISO-8859-1").decode(bytes);
  }

  // Sem declaração confiável: tenta UTF-8 estrito (rejeita bytes inválidos) e
  // só cai para Latin-1 se o arquivo não for UTF-8 válido.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("ISO-8859-1").decode(bytes);
  }
}

export function parseOfx(content: string): OfxResultado {
  const errors: string[] = [];

  if (!/<OFX>/i.test(content) && !/<STMTTRN>/i.test(content)) {
    return {
      transacoes: [],
      saldo: null,
      conta: null,
      errors: ["Arquivo não parece ser um OFX válido."],
    };
  }

  const blocos = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  if (blocos.length === 0) {
    return {
      transacoes: [],
      saldo: null,
      conta: null,
      errors: ["Nenhuma transação encontrada no extrato."],
    };
  }

  const transacoes: OfxTransacao[] = [];
  const vistos = new Set<string>();

  for (const [i, bloco] of blocos.entries()) {
    const fitid = tag(bloco, "FITID");
    const valor = parseValor(tag(bloco, "TRNAMT"));
    const data = parseData(tag(bloco, "DTPOSTED"));

    // MEMO costuma ser a descrição legível; NAME é o fallback de bancos que só
    // preenchem o campo curto.
    const nome = tag(bloco, "MEMO") || tag(bloco, "NAME") || "Transação";

    if (!fitid) {
      errors.push(`Transação ${i + 1}: sem FITID, ignorada.`);
      continue;
    }
    if (valor === null || valor === 0) {
      errors.push(`Transação ${i + 1} (${nome}): valor inválido, ignorada.`);
      continue;
    }
    if (!data) {
      errors.push(`Transação ${i + 1} (${nome}): data inválida, ignorada.`);
      continue;
    }

    // Alguns bancos repetem o FITID dentro do próprio arquivo; o índice único do
    // banco rejeitaria a segunda, então cortar aqui evita erro no meio da
    // importação.
    if (vistos.has(fitid)) {
      errors.push(`Transação ${i + 1} (${nome}): FITID repetido no arquivo, ignorada.`);
      continue;
    }
    vistos.add(fitid);

    const trnType = tag(bloco, "TRNTYPE")?.toUpperCase();
    // O sinal de TRNAMT é a fonte da verdade; TRNTYPE só desempata quando o
    // banco exporta tudo positivo.
    const tipo: "debito" | "credito" =
      valor < 0 || trnType === "DEBIT" ? "debito" : "credito";

    transacoes.push({
      fitid,
      nome,
      valor: Math.abs(valor),
      // Só uma sugestão: descrição de extrato é críptica ("PAG*IFOOD", "TED 341")
      // e o `mapearCategoria` cai em `necessidade` quando não reconhece nada.
      // Quem confirma o bucket é o usuário, na tela de preview.
      categoria: mapearCategoria(nome),
      data,
      tipo,
    });
  }

  const blocoConta = content.match(/<BANKACCTFROM>[\s\S]*?<\/BANKACCTFROM>/i)?.[0] ?? content;
  const conta = tag(blocoConta, "ACCTID");

  const blocoSaldo = content.match(/<LEDGERBAL>[\s\S]*?<\/LEDGERBAL>/i)?.[0];
  const saldo = blocoSaldo ? parseValor(tag(blocoSaldo, "BALAMT")) : null;

  return { transacoes, saldo, conta, errors };
}

/** Só saída de dinheiro vira gasto — crédito é entrada e não pesa no 50/30/20. */
export function apenasDebitos(transacoes: OfxTransacao[]): OfxTransacao[] {
  return transacoes.filter((t) => t.tipo === "debito");
}
