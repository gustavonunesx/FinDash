import { gastoAtivo } from "./parcelamento";
import type { CategoriaGasto, Configuracao, Gasto } from "./types";
import { REGRA_502030 } from "./types";

export interface Score502030Result {
  score: number;
  status: "saudavel" | "atencao" | "critico";
  mensagem: string;
  categorias: {
    categoria: CategoriaGasto;
    limite: number;
    gasto: number;
    percentual: number;
    meta: number;
    status: "ok" | "atencao" | "excedido";
  }[];
  saldoLivre: number;
  rendaTotal: number;
}

export function calcularRendaTotal(config: Configuracao | null): number {
  if (!config) return 0;
  return config.salario + config.renda_extra;
}

export function totalPorCategoria(gastos: Gasto[]): Record<CategoriaGasto, number> {
  return gastos.reduce(
    (acc, g) => {
      // Parcelamento quitado (ou que ainda não começou) não pesa no mês corrente.
      if (gastoAtivo(g)) acc[g.categoria] += g.valor;
      return acc;
    },
    { necessidade: 0, objetivo: 0, qualidade: 0 } as Record<CategoriaGasto, number>
  );
}

export function calcularScore502030(
  config: Configuracao | null,
  gastos: Gasto[]
): Score502030Result {
  const rendaTotal = calcularRendaTotal(config);
  const totais = totalPorCategoria(gastos);
  const totalGastos = totais.necessidade + totais.objetivo + totais.qualidade;
  const saldoLivre = rendaTotal - totalGastos;

  if (rendaTotal <= 0) {
    return {
      score: 0,
      status: "critico",
      mensagem: "Configure sua renda para ver seu score financeiro.",
      categorias: [],
      saldoLivre: 0,
      rendaTotal: 0,
    };
  }

  const metas: Record<CategoriaGasto, number> = {
    necessidade: REGRA_502030.necessidade,
    objetivo: REGRA_502030.objetivo,
    qualidade: REGRA_502030.qualidade,
  };

  const categorias = (Object.keys(metas) as CategoriaGasto[]).map((categoria) => {
    const gasto = totais[categoria];
    const percentual = gasto / rendaTotal;
    const meta = metas[categoria];

    let status: "ok" | "atencao" | "excedido" = "ok";
    if (categoria === "objetivo") {
      if (percentual < meta * 0.7) status = "atencao";
    } else if (percentual > meta) {
      status = "excedido";
    } else if (percentual > meta * 0.85) {
      status = "atencao";
    }

    return {
      categoria,
      limite: rendaTotal * meta,
      gasto,
      percentual,
      meta,
      status,
    };
  });

  const desvioNecessidades = Math.abs(
    totais.necessidade / rendaTotal - REGRA_502030.necessidade
  );
  const desvioObjetivos = Math.abs(
    totais.objetivo / rendaTotal - REGRA_502030.objetivo
  );
  const score = Math.max(
    0,
    Math.round(100 - desvioNecessidades * 100 - desvioObjetivos * 100)
  );

  let status: Score502030Result["status"] = "saudavel";
  let mensagem = "Suas finanças estão equilibradas. Continue assim!";

  if (score < 50) {
    status = "critico";
    mensagem = "Atenção: seus gastos estão fora do ideal. Revise necessidades e objetivos.";
  } else if (score < 75) {
    status = "atencao";
    mensagem = "Quase lá — pequenos ajustes nas categorias podem melhorar seu score.";
  }

  return { score, status, mensagem, categorias, saldoLivre, rendaTotal };
}

export function scoreGradient(status: Score502030Result["status"]): string {
  switch (status) {
    case "saudavel":
      return "from-fd-green/8 via-transparent to-transparent";
    case "atencao":
      return "from-fd-amber/8 via-transparent to-transparent";
    case "critico":
      return "from-fd-red/8 via-transparent to-transparent";
  }
}

export function scoreColor(status: Score502030Result["status"]): string {
  switch (status) {
    case "saudavel":
      return "text-fd-green";
    case "atencao":
      return "text-fd-amber";
    case "critico":
      return "text-fd-red";
  }
}
