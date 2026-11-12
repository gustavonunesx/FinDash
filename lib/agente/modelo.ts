import Anthropic from "@anthropic-ai/sdk";
import { FERRAMENTAS } from "./ferramentas";
import type { ChamarModelo } from "./loop";
import { PROMPT_SISTEMA } from "./prompt";
import type { Bloco } from "./tipos";

export interface ConfigModelo {
  apiKey: string;
  modelo: string;
  hoje: string;
}

const MAX_TOKENS = 16000;

export function criarChamarModelo(cfg: ConfigModelo): ChamarModelo {
  const client = new Anthropic({ apiKey: cfg.apiKey });

  // O breakpoint de cache no prompt cobre as ferramentas (que vêm antes) e o prompt;
  // a data muda todo dia e por isso fica num bloco sem cache.
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: PROMPT_SISTEMA, cache_control: { type: "ephemeral" } },
    { type: "text", text: `Data de hoje: ${cfg.hoje} (fuso America/Sao_Paulo).` },
  ];
  const tools: Anthropic.Tool[] = FERRAMENTAS.map((f) => ({
    name: f.name,
    description: f.description,
    input_schema: f.input_schema as Anthropic.Tool["input_schema"],
  }));

  return async ({ mensagens, onTexto, signal }) => {
    const stream = client.messages.stream(
      {
        model: cfg.modelo,
        max_tokens: MAX_TOKENS,
        system,
        tools,
        output_config: { effort: "medium" },
        messages: mensagens.map((m) => ({ role: m.papel, content: m.conteudo })),
      },
      { signal }
    );
    stream.on("text", (delta) => onTexto(delta));

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal" || final.stop_reason === "max_tokens") {
      throw new Error(`Resposta interrompida pelo modelo: ${final.stop_reason}`);
    }

    const conteudo: Bloco[] = [];
    for (const b of final.content) {
      if (b.type === "text") {
        if (b.text.trim()) conteudo.push({ type: "text", text: b.text });
      } else if (b.type === "tool_use") {
        conteudo.push({
          type: "tool_use",
          id: b.id,
          name: b.name,
          input: (b.input ?? {}) as Record<string, unknown>,
        });
      } else if (b.type === "thinking") {
        conteudo.push({ type: "thinking", thinking: b.thinking, signature: b.signature });
      } else if (b.type === "redacted_thinking") {
        conteudo.push({ type: "redacted_thinking", data: b.data });
      }
    }
    return { conteudo };
  };
}
