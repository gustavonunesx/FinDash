export type Bloco =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface MensagemAgente {
  papel: "user" | "assistant";
  conteudo: Bloco[];
}

export interface LinhaMensagem extends MensagemAgente {
  id: string;
  ordem: number;
  inicio_rodada: boolean;
  criado_em: string;
}

export interface MensagemExibicao {
  id: string;
  papel: "user" | "assistant";
  texto: string;
}

export type StatusLoop = "ok" | "limite" | "interrompida" | "erro";
