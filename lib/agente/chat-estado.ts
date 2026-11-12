const ERRO_PADRAO = "Não consegui responder agora. Tente de novo.";
const ERRO_INTERROMPIDA =
  "A resposta foi interrompida antes de terminar. Confira acima o que foi salvo e me avise se faltou algo.";

export interface ErroChat {
  mensagem: string;
  podeTentarDeNovo: boolean;
}

export interface EstadoResposta {
  texto: string;
  separarProximo: boolean;
  status: string | null;
  terminou: boolean;
  erro: ErroChat | null;
}

export const estadoInicial: EstadoResposta = {
  texto: "",
  separarProximo: false,
  status: null,
  terminou: false,
  erro: null,
};

export function aplicarEvento(e: EstadoResposta, evento: string, dados: unknown): EstadoResposta {
  const d = (dados ?? {}) as { t?: string; rotulo?: string; mensagem?: string; gravou?: boolean };
  switch (evento) {
    case "texto": {
      if (!d.t) return e;
      const separador = e.separarProximo && e.texto ? "\n\n" : "";
      return { ...e, texto: e.texto + separador + d.t, separarProximo: false, status: null };
    }
    case "ferramenta":
      return { ...e, separarProximo: true, status: d.rotulo ?? null };
    case "fim":
      return { ...e, terminou: true, status: null };
    case "erro":
      return {
        ...e,
        terminou: true,
        status: null,
        erro: { mensagem: d.mensagem ?? ERRO_PADRAO, podeTentarDeNovo: d.gravou !== true },
      };
    default:
      return e;
  }
}

export function aoFecharStream(e: EstadoResposta): EstadoResposta {
  if (e.terminou) return e;
  return {
    ...e,
    terminou: true,
    status: null,
    erro: { mensagem: ERRO_INTERROMPIDA, podeTentarDeNovo: false },
  };
}
