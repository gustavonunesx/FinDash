import type { Bloco, MensagemAgente, StatusLoop } from "./tipos";

export type ChamarModelo = (p: {
  mensagens: MensagemAgente[];
  onTexto: (t: string) => void;
  signal?: AbortSignal;
}) => Promise<{ conteudo: Bloco[] }>;

export interface DepsLoop {
  chamarModelo: ChamarModelo;
  executar: (nome: string, input: Record<string, unknown>) => Promise<unknown>;
  aoTexto?: (t: string) => void;
  aoFerramenta?: (nome: string) => void;
  aoNovas?: (msgs: MensagemAgente[]) => Promise<void>;
  signal?: AbortSignal;
  maxIteracoes?: number;
}

const ERRO_FERRAMENTA = "Não consegui executar a ferramenta agora.";

function temErro(resultado: unknown): boolean {
  return (
    typeof resultado === "object" &&
    resultado !== null &&
    typeof (resultado as { erro?: unknown }).erro === "string"
  );
}

export async function executarLoop(
  historico: MensagemAgente[],
  deps: DepsLoop
): Promise<{ novas: MensagemAgente[]; status: StatusLoop }> {
  const max = deps.maxIteracoes ?? 8;
  const novas: MensagemAgente[] = [];

  for (let i = 0; i < max; i++) {
    if (deps.signal?.aborted) return { novas, status: "interrompida" };

    let conteudo: Bloco[];
    try {
      ({ conteudo } = await deps.chamarModelo({
        mensagens: [...historico, ...novas],
        onTexto: (t) => deps.aoTexto?.(t),
        signal: deps.signal,
      }));
    } catch {
      return { novas, status: deps.signal?.aborted ? "interrompida" : "erro" };
    }
    if (!conteudo.some((b) => b.type === "text" || b.type === "tool_use")) {
      return { novas, status: "erro" };
    }

    const assistente: MensagemAgente = { papel: "assistant", conteudo };
    const usos = conteudo.filter((b): b is Extract<Bloco, { type: "tool_use" }> => b.type === "tool_use");

    if (usos.length === 0) {
      novas.push(assistente);
      await deps.aoNovas?.([assistente]);
      return { novas, status: "ok" };
    }

    const resultados: Bloco[] = [];
    for (const uso of usos) {
      deps.aoFerramenta?.(uso.name);
      let resultado: unknown;
      try {
        resultado = await deps.executar(uso.name, uso.input);
      } catch {
        resultado = { erro: ERRO_FERRAMENTA };
      }
      resultados.push({
        type: "tool_result",
        tool_use_id: uso.id,
        content: JSON.stringify(resultado),
        ...(temErro(resultado) ? { is_error: true } : {}),
      });
    }

    const par: MensagemAgente[] = [assistente, { papel: "user", conteudo: resultados }];
    novas.push(...par);
    await deps.aoNovas?.(par);
  }

  return { novas, status: "limite" };
}
