export type EventoSse = "texto" | "ferramenta" | "fim" | "erro";

export function formatarEventoSse(evento: EventoSse, dados: unknown): string {
  return `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`;
}

export function separarEventosSse(buffer: string): {
  eventos: { evento: string; dados: unknown }[];
  resto: string;
} {
  const partes = buffer.split("\n\n");
  const resto = partes.pop() ?? "";
  const eventos: { evento: string; dados: unknown }[] = [];

  for (const parte of partes) {
    let evento = "message";
    let dados: string | null = null;
    for (const linha of parte.split("\n")) {
      if (linha.startsWith("event: ")) evento = linha.slice(7);
      else if (linha.startsWith("data: ")) dados = linha.slice(6);
    }
    if (dados === null) continue;
    try {
      eventos.push({ evento, dados: JSON.parse(dados) });
    } catch {
      continue;
    }
  }
  return { eventos, resto };
}
