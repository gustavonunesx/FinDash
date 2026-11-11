import { dataValida } from "./datas";
import type { EsquemaObjeto, Ferramenta, Propriedade } from "./ferramentas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERRO_GENERICO = "Não consegui gravar agora. Tente de novo em instantes.";

const ehData = (nome: string) =>
  ["ate", "ativo_ate", "vencimento", "devolver_ate"].includes(nome) || nome.startsWith("data_");
const ehId = (nome: string) => nome === "id" || nome.endsWith("_id");

function validarPropriedade(
  nome: string,
  campo: string,
  prop: Propriedade,
  valor: unknown
): string | null {
  switch (prop.type) {
    case "number":
      return typeof valor === "number" && Number.isFinite(valor)
        ? null
        : `Campo "${campo}" deve ser um número.`;
    case "integer":
      return typeof valor === "number" && Number.isInteger(valor)
        ? null
        : `Campo "${campo}" deve ser um número inteiro.`;
    case "boolean":
      return typeof valor === "boolean" ? null : `Campo "${campo}" deve ser verdadeiro ou falso.`;
    case "string":
      if (typeof valor !== "string") return `Campo "${campo}" deve ser um texto.`;
      if (prop.enum && !prop.enum.includes(valor)) {
        return `Campo "${campo}" deve ser um de: ${prop.enum.join(", ")}.`;
      }
      if (ehData(nome) && !dataValida(valor)) {
        return `Campo "${campo}" deve ser uma data AAAA-MM-DD válida.`;
      }
      if (ehId(nome) && !UUID.test(valor)) return `Campo "${campo}" deve ser um id válido.`;
      return null;
    case "array": {
      if (!Array.isArray(valor)) return `Campo "${campo}" deve ser uma lista.`;
      if (!prop.items) return null;
      for (let i = 0; i < valor.length; i++) {
        const r = validarObjeto(prop.items, valor[i], `${campo}[${i}]`);
        if (!r.ok) return r.erro;
      }
      return null;
    }
    default:
      return null;
  }
}

function validarObjeto(
  esquema: EsquemaObjeto,
  entrada: unknown,
  prefixo: string
): { ok: true; dados: Record<string, unknown> } | { ok: false; erro: string } {
  if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
    return {
      ok: false,
      erro: prefixo
        ? `Campo "${prefixo}" deve ser um objeto.`
        : "Os dados da ferramenta precisam ser um objeto.",
    };
  }
  const origem = entrada as Record<string, unknown>;
  const caminho = (nome: string) => (prefixo ? `${prefixo}.${nome}` : nome);

  for (const obrigatorio of esquema.required) {
    if (origem[obrigatorio] === undefined || origem[obrigatorio] === null) {
      return { ok: false, erro: `Campo obrigatório ausente: "${caminho(obrigatorio)}".` };
    }
  }

  const dados: Record<string, unknown> = {};
  for (const [nome, prop] of Object.entries(esquema.properties)) {
    const valor = origem[nome];
    if (valor === undefined || valor === null) continue;
    const erro = validarPropriedade(nome, caminho(nome), prop, valor);
    if (erro) return { ok: false, erro };
    dados[nome] = valor;
  }
  return { ok: true, dados };
}

export function validarInput(
  def: Ferramenta,
  input: unknown
): { ok: true; dados: Record<string, unknown> } | { ok: false; erro: string } {
  return validarObjeto(def.input_schema, input, "");
}

export function mensagemDeErro(e: unknown): string {
  const erro = e as { code?: string; message?: string } | null;
  if (erro?.code === "P0001" && erro.message) return erro.message;
  if (erro?.code === "23514") return "Algum valor está fora do permitido (ex.: zero ou negativo).";
  if (erro?.code === "PGRST116") return "Registro não encontrado.";
  return ERRO_GENERICO;
}
