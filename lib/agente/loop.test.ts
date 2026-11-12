import { describe, expect, it, vi } from "vitest";
import { executarLoop, type ChamarModelo } from "./loop";
import type { Bloco, MensagemAgente } from "./tipos";

const historico: MensagemAgente[] = [{ papel: "user", conteudo: [{ type: "text", text: "Recebi 1000" }] }];

const texto = (text: string): Bloco => ({ type: "text", text });
const uso = (id: string, name = "ler_ficha_financeira", input: Record<string, unknown> = {}): Bloco => ({
  type: "tool_use",
  id,
  name,
  input,
});

function modelo(respostas: Bloco[][], emitir: string[] = []) {
  const fn = vi.fn<ChamarModelo>();
  respostas.forEach((conteudo, i) => {
    fn.mockImplementationOnce(async ({ onTexto }) => {
      if (i === 0) emitir.forEach(onTexto);
      return { conteudo };
    });
  });
  return fn;
}

describe("executarLoop", () => {
  it("encerra em uma chamada quando o modelo so responde texto", async () => {
    const chamar = modelo([[texto("Oi!")]], ["O", "i!"]);
    const aoTexto = vi.fn();
    const aoNovas = vi.fn<(msgs: MensagemAgente[]) => Promise<void>>(async () => {});
    const r = await executarLoop(historico, { chamarModelo: chamar, executar: vi.fn(), aoTexto, aoNovas });
    expect(r.status).toBe("ok");
    expect(r.novas).toEqual([{ papel: "assistant", conteudo: [texto("Oi!")] }]);
    expect(aoNovas).toHaveBeenCalledTimes(1);
    expect(aoTexto.mock.calls.map((c) => c[0])).toEqual(["O", "i!"]);
  });

  it("executa a ferramenta, devolve o resultado e continua ate o texto final", async () => {
    const chamar = modelo([[uso("t1")], [texto("Pronto")]]);
    const executar = vi.fn(async () => ({ perfil_financeiro: [] }));
    const aoNovas = vi.fn<(msgs: MensagemAgente[]) => Promise<void>>(async () => {});
    const aoFerramenta = vi.fn();
    const r = await executarLoop(historico, { chamarModelo: chamar, executar, aoNovas, aoFerramenta });
    expect(r.status).toBe("ok");
    expect(executar).toHaveBeenCalledWith("ler_ficha_financeira", {});
    expect(aoFerramenta).toHaveBeenCalledWith("ler_ficha_financeira");
    expect(r.novas).toEqual([
      { papel: "assistant", conteudo: [uso("t1")] },
      { papel: "user", conteudo: [{ type: "tool_result", tool_use_id: "t1", content: JSON.stringify({ perfil_financeiro: [] }) }] },
      { papel: "assistant", conteudo: [texto("Pronto")] },
    ]);
    expect(aoNovas).toHaveBeenCalledTimes(2);
    expect(aoNovas.mock.calls[0][0]).toHaveLength(2);
    expect(aoNovas.mock.calls[1][0]).toHaveLength(1);
  });

  it("a segunda chamada ao modelo recebe o historico mais o par tool_use/tool_result", async () => {
    const chamar = modelo([[uso("t1")], [texto("Pronto")]]);
    await executarLoop(historico, { chamarModelo: chamar, executar: vi.fn(async () => ({})) });
    const segunda = chamar.mock.calls[1][0].mensagens;
    expect(segunda).toHaveLength(3);
    expect(segunda[1].conteudo).toEqual([uso("t1")]);
  });

  it("varias tool_use na mesma resposta viram uma so mensagem de resultados, na mesma ordem", async () => {
    const chamar = modelo([[uso("a"), uso("b", "salvar_perfil", { estabilidade_renda: "fixa" })], [texto("ok")]]);
    const executar = vi.fn(async (nome: string) => ({ nome }));
    const r = await executarLoop(historico, { chamarModelo: chamar, executar });
    const resultados = r.novas[1].conteudo;
    expect(r.novas[1].papel).toBe("user");
    expect(resultados.map((b) => (b.type === "tool_result" ? b.tool_use_id : ""))).toEqual(["a", "b"]);
  });

  it("marca como erro o resultado com campo erro e continua", async () => {
    const chamar = modelo([[uso("z", "nao_existe")], [texto("Nao consegui")]]);
    const executar = vi.fn(async () => ({ erro: "Ferramenta desconhecida: nao_existe" }));
    const r = await executarLoop(historico, { chamarModelo: chamar, executar });
    expect(r.status).toBe("ok");
    expect(r.novas[1].conteudo[0]).toMatchObject({ type: "tool_result", tool_use_id: "z", is_error: true });
  });

  it("excecao da ferramenta vira tool_result de erro generico e o laco continua", async () => {
    const chamar = modelo([[uso("t1")], [texto("Falhou")]]);
    const executar = vi.fn(async () => {
      throw new Error("detalhe interno");
    });
    const r = await executarLoop(historico, { chamarModelo: chamar, executar });
    expect(r.status).toBe("ok");
    const resultado = r.novas[1].conteudo[0];
    expect(resultado).toMatchObject({ type: "tool_result", is_error: true });
    expect(JSON.stringify(resultado)).not.toContain("detalhe interno");
  });

  it("para no limite de iteracoes com o ultimo par completo", async () => {
    const chamar = vi.fn<ChamarModelo>(async () => ({ conteudo: [uso("loop")] }));
    const executar = vi.fn(async () => ({}));
    const r = await executarLoop(historico, { chamarModelo: chamar, executar });
    expect(r.status).toBe("limite");
    expect(chamar).toHaveBeenCalledTimes(8);
    expect(executar).toHaveBeenCalledTimes(8);
    expect(r.novas.at(-1)?.papel).toBe("user");
  });

  it("interrompe quando o sinal foi abortado e mantem so pares completos", async () => {
    const controle = new AbortController();
    const chamar = modelo([[uso("t1")], [texto("nao deveria chegar")]]);
    const executar = vi.fn(async () => {
      controle.abort();
      return {};
    });
    const r = await executarLoop(historico, { chamarModelo: chamar, executar, signal: controle.signal });
    expect(r.status).toBe("interrompida");
    expect(chamar).toHaveBeenCalledTimes(1);
    expect(r.novas).toHaveLength(2);
  });

  it("falha do modelo devolve status erro e preserva o que ja foi concluido", async () => {
    const chamar = vi.fn<ChamarModelo>();
    chamar.mockResolvedValueOnce({ conteudo: [uso("t1")] });
    chamar.mockRejectedValueOnce(new Error("api caiu"));
    const r = await executarLoop(historico, { chamarModelo: chamar, executar: vi.fn(async () => ({})) });
    expect(r.status).toBe("erro");
    expect(r.novas).toHaveLength(2);
  });

  it("resposta vazia do modelo vira erro sem gravar mensagem vazia", async () => {
    const aoNovas = vi.fn<(msgs: MensagemAgente[]) => Promise<void>>(async () => {});
    const r = await executarLoop(historico, { chamarModelo: modelo([[]]), executar: vi.fn(), aoNovas });
    expect(r.status).toBe("erro");
    expect(r.novas).toEqual([]);
    expect(aoNovas).not.toHaveBeenCalled();
  });

  it("resposta so com pensamento vira erro sem gravar mensagem", async () => {
    const aoNovas = vi.fn<(msgs: MensagemAgente[]) => Promise<void>>(async () => {});
    const pensamento: Bloco = { type: "thinking", thinking: "", signature: "sig" };
    const r = await executarLoop(historico, { chamarModelo: modelo([[pensamento]]), executar: vi.fn(), aoNovas });
    expect(r.status).toBe("erro");
    expect(aoNovas).not.toHaveBeenCalled();
  });

  it("mantem blocos de pensamento no historico em memoria para o proximo passo", async () => {
    const pensamento: Bloco = { type: "thinking", thinking: "", signature: "sig" };
    const chamar = modelo([[pensamento, uso("t1")], [texto("ok")]]);
    await executarLoop(historico, { chamarModelo: chamar, executar: vi.fn(async () => ({})) });
    expect(chamar.mock.calls[1][0].mensagens[1].conteudo[0]).toEqual(pensamento);
  });
});
