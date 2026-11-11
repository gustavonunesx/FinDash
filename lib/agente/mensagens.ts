import type {
  Bloco,
  LinhaMensagem,
  MensagemAgente,
  MensagemExibicao,
  StatusLoop,
} from "./tipos";

export const MAX_MENSAGENS_JANELA = 30;
export const LIMITE_RODADAS_POR_HORA = 40;
export const MAX_CARACTERES_MENSAGEM = 2000;

const TEXTO_LIMITE = "Parei aqui para não me estender. Me diga se quer que eu continue.";
const TEXTO_INTERROMPIDA =
  "(Resposta interrompida. Confira acima o que foi salvo e me avise se faltou algo.)";

export function validarMensagemUsuario(
  texto: unknown
): { ok: true; texto: string } | { ok: false; erro: string } {
  const limpo = typeof texto === "string" ? texto.trim() : "";
  if (!limpo) return { ok: false, erro: "Escreva uma mensagem." };
  if (limpo.length > MAX_CARACTERES_MENSAGEM) {
    return { ok: false, erro: "Mensagem longa demais (máximo 2.000 caracteres)." };
  }
  return { ok: true, texto: limpo };
}

export function sanitizarPares(msgs: MensagemAgente[]): MensagemAgente[] {
  const saida: MensagemAgente[] = [];
  msgs.forEach((m, i) => {
    let conteudo: Bloco[];
    if (m.papel === "assistant") {
      const proxima = msgs[i + 1];
      const comResultado = new Set(
        proxima?.papel === "user"
          ? proxima.conteudo.flatMap((b) => (b.type === "tool_result" ? [b.tool_use_id] : []))
          : []
      );
      conteudo = m.conteudo.filter((b) => b.type !== "tool_use" || comResultado.has(b.id));
    } else {
      const anterior = msgs[i - 1];
      const comUso = new Set(
        anterior?.papel === "assistant"
          ? anterior.conteudo.flatMap((b) => (b.type === "tool_use" ? [b.id] : []))
          : []
      );
      conteudo = m.conteudo.filter((b) => b.type !== "tool_result" || comUso.has(b.tool_use_id));
    }
    if (conteudo.length > 0) saida.push({ papel: m.papel, conteudo });
  });
  return saida;
}

export function janelaDeMensagens(
  linhas: LinhaMensagem[],
  max: number = MAX_MENSAGENS_JANELA
): MensagemAgente[] {
  const ultimas = linhas.slice(-max);
  const inicio = ultimas.findIndex((l) => l.inicio_rodada);
  if (inicio < 0) return [];
  return sanitizarPares(
    ultimas.slice(inicio).map(({ papel, conteudo }) => ({ papel, conteudo }))
  );
}

export function mensagemDeFechamento(
  novas: MensagemAgente[],
  status: StatusLoop
): MensagemAgente | null {
  const ultima = novas[novas.length - 1];
  if (!ultima || ultima.papel !== "user") return null;
  const text = status === "limite" ? TEXTO_LIMITE : TEXTO_INTERROMPIDA;
  return { papel: "assistant", conteudo: [{ type: "text", text }] };
}

export function paraExibicao(linhas: LinhaMensagem[]): MensagemExibicao[] {
  return linhas.flatMap((l) => {
    if (l.papel === "user" && !l.inicio_rodada) return [];
    const texto = l.conteudo.map((b) => (b.type === "text" ? b.text : "")).join("");
    if (!texto.trim()) return [];
    return [{ id: l.id, papel: l.papel, texto }];
  });
}
