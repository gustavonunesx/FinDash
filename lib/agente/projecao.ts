import { diasNoMes, somarDias, somarMeses } from "./datas";

export interface FonteProj {
  id: string;
  nome: string;
  valor: number;
  dia_pagamento: number | null;
  tipo: "fixa" | "contrato" | "variavel" | "incerta";
  ativo_ate: string | null;
  ativo: boolean;
}
export interface GastoFixoProj {
  nome: string;
  valor: number;
  dia_vencimento: number;
  ativo: boolean;
}
export interface ParcelaProj {
  id: string;
  compromisso_nome: string;
  numero: number;
  valor: number;
  vencimento: string;
  parte_terceiros: number;
  status_ajuda: "nenhuma" | "confirmada" | "recebida";
  pago: boolean;
}
export interface EmprestimoProj {
  id: string;
  valor: number;
  valor_devolvido: number;
  devolver_ate: string;
  quitado: boolean;
}
export interface EntradaProj {
  id: string;
  descricao: string;
  valor: number;
  status: "recebido" | "confirmado" | "incerto";
  data_prevista: string | null;
  fonte_id: string | null;
}
export interface FichaProjecao {
  fontes: FonteProj[];
  gastosFixos: GastoFixoProj[];
  parcelas: ParcelaProj[];
  emprestimos: EmprestimoProj[];
  entradas: EntradaProj[];
}
export interface MesProjetado {
  mes: string;
  entradas: number;
  saidas: number;
  saldo_final: number;
}
export interface Cenario {
  nome: "pessimista" | "base" | "otimista";
  meses: MesProjetado[];
  menor_saldo: number;
  mes_mais_apertado: string;
}
export interface EventoCalendario {
  data: string;
  tipo: "conta" | "parcela" | "devolucao" | "entrada";
  descricao: string;
  valor: number;
}
export interface ProvisaoParcela {
  parcela_id: string;
  descricao: string;
  vencimento: string;
  valor: number;
  entradas_ate_vencimento: number;
  fatia_por_entrada: number;
}
export interface Projecao {
  fonte_mais_fragil: { nome: string; motivo: string } | null;
  cenarios: Cenario[];
  calendario_60d: EventoCalendario[];
  provisoes: ProvisaoParcela[];
  sobra_estrutural: {
    renda_garantida: number;
    custo_fixo: number;
    provisoes_mensais: number;
    sobra: number;
    sobra_sem_fonte_fragil: number;
  };
}

type NomeCenario = Cenario["nome"];

const round2 = (n: number) => Math.round(n * 100) / 100 + 0;
const mesDe = (data: string) => data.slice(0, 7);
const maior = (a: string, b: string) => (a > b ? a : b);

function ultimoDiaDoMes(data: string): string {
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7));
  return `${mesDe(data)}-${String(diasNoMes(ano, mes)).padStart(2, "0")}`;
}

function listarMeses(de: string, ate: string): string[] {
  const meses: string[] = [];
  let ano = Number(de.slice(0, 4));
  let mes = Number(de.slice(5, 7));
  const fim = mesDe(ate);
  for (;;) {
    const chave = `${ano}-${String(mes).padStart(2, "0")}`;
    if (chave > fim) break;
    meses.push(chave);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return meses;
}

function ocorrencias(de: string, ate: string, dia: number | null): string[] {
  return listarMeses(de, ate).flatMap((chave) => {
    const ano = Number(chave.slice(0, 4));
    const mes = Number(chave.slice(5, 7));
    const ultimo = diasNoMes(ano, mes);
    const d = dia === null ? ultimo : Math.min(dia, ultimo);
    return [`${chave}-${String(d).padStart(2, "0")}`];
  });
}

function fonteMaisFragil(
  ficha: FichaProjecao,
  hoje: string,
  fim: string
): { fonte: FonteProj; motivo: string } | null {
  const candidatas = ficha.fontes.filter(
    (f) =>
      f.ativo &&
      (f.tipo === "fixa" || f.tipo === "contrato") &&
      (f.ativo_ate === null || f.ativo_ate >= hoje)
  );
  const comFim = candidatas
    .filter((f) => f.ativo_ate !== null && f.ativo_ate <= fim)
    .sort((a, b) => (a.ativo_ate! < b.ativo_ate! ? -1 : a.ativo_ate! > b.ativo_ate! ? 1 : b.valor - a.valor));
  if (comFim.length > 0) {
    return { fonte: comFim[0], motivo: `ativo_ate ${comFim[0].ativo_ate}` };
  }
  const contratos = candidatas.filter((f) => f.tipo === "contrato").sort((a, b) => b.valor - a.valor);
  if (contratos.length > 0) return { fonte: contratos[0], motivo: "contrato de maior valor" };
  return null;
}

function eventosDoCenario(
  ficha: FichaProjecao,
  hoje: string,
  ate: string,
  cenario: NomeCenario,
  fragil: FonteProj | null
): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];
  const otimista = cenario === "otimista";

  const entradasContadas = ficha.entradas.filter(
    (e) => e.status === "confirmado" || (e.status === "incerto" && otimista)
  );
  const substituidas = new Set<string>();
  for (const e of entradasContadas) {
    const data = e.data_prevista ?? ultimoDiaDoMes(hoje);
    if (e.fonte_id) substituidas.add(`${e.fonte_id}|${mesDe(data)}`);
    if (data > hoje && data <= ate) {
      eventos.push({ data, tipo: "entrada", descricao: e.descricao, valor: e.valor });
    }
  }

  for (const f of ficha.fontes) {
    if (!f.ativo) continue;
    if (!otimista && f.tipo !== "fixa" && f.tipo !== "contrato") continue;
    if (cenario === "pessimista" && fragil && f.id === fragil.id) continue;
    for (const data of ocorrencias(hoje, ate, f.dia_pagamento)) {
      if (data <= hoje || data > ate) continue;
      if (f.ativo_ate !== null && data > f.ativo_ate) continue;
      if (substituidas.has(`${f.id}|${mesDe(data)}`)) continue;
      eventos.push({ data, tipo: "entrada", descricao: f.nome, valor: f.valor });
    }
  }

  for (const g of ficha.gastosFixos) {
    if (!g.ativo) continue;
    for (const data of ocorrencias(hoje, ate, g.dia_vencimento)) {
      if (data < hoje || data > ate) continue;
      eventos.push({ data, tipo: "conta", descricao: g.nome, valor: -g.valor });
    }
  }

  for (const p of ficha.parcelas) {
    if (p.pago) continue;
    const descricao = `${p.compromisso_nome} (parcela ${p.numero})`;
    const data = p.vencimento < hoje ? hoje : p.vencimento;
    if (data <= ate) eventos.push({ data, tipo: "parcela", descricao, valor: -p.valor });
    if (otimista && p.status_ajuda === "confirmada" && p.parte_terceiros > 0) {
      if (p.vencimento > hoje && p.vencimento <= ate) {
        eventos.push({
          data: p.vencimento,
          tipo: "entrada",
          descricao: `Ajuda: ${descricao}`,
          valor: p.parte_terceiros,
        });
      }
    }
  }

  for (const e of ficha.emprestimos) {
    if (e.quitado) continue;
    const pendente = e.valor - e.valor_devolvido;
    if (pendente <= 0) continue;
    const data = e.devolver_ate < hoje ? hoje : e.devolver_ate;
    if (data <= ate) {
      eventos.push({
        data,
        tipo: "devolucao",
        descricao: "Devolução de empréstimo da caixinha",
        valor: -pendente,
      });
    }
  }

  return eventos.sort((a, b) => {
    if (a.data !== b.data) return a.data < b.data ? -1 : 1;
    return Number(b.valor > 0) - Number(a.valor > 0);
  });
}

function simular(
  eventos: EventoCalendario[],
  saldoInicial: number,
  hoje: string,
  fim: string,
  nome: NomeCenario
): Cenario {
  let saldo = saldoInicial;
  let menor = saldoInicial;
  let mesMenor = mesDe(hoje);
  const meses: MesProjetado[] = listarMeses(hoje, fim).map((mes) => {
    let entradas = 0;
    let saidas = 0;
    for (const ev of eventos) {
      if (mesDe(ev.data) !== mes) continue;
      saldo += ev.valor;
      if (ev.valor > 0) entradas += ev.valor;
      else saidas += -ev.valor;
      if (saldo < menor) {
        menor = saldo;
        mesMenor = mes;
      }
    }
    return { mes, entradas: round2(entradas), saidas: round2(saidas), saldo_final: round2(saldo) };
  });
  return { nome, meses, menor_saldo: round2(menor), mes_mais_apertado: mesMenor };
}

export function projetarCaixa(
  ficha: FichaProjecao,
  saldoConta: number,
  hoje: string,
  horizonteMeses: number = 3
): Projecao {
  const fim = somarMeses(hoje, horizonteMeses);
  const fimCalendario = somarDias(hoje, 60);
  const ultimoVencimento = ficha.parcelas
    .filter((p) => !p.pago)
    .reduce((acc, p) => maior(acc, p.vencimento), hoje);
  const fimLongo = maior(maior(fim, fimCalendario), ultimoVencimento);

  const fragilInfo = fonteMaisFragil(ficha, hoje, fim);
  const fragil = fragilInfo?.fonte ?? null;

  const eventosBase = eventosDoCenario(ficha, hoje, fimLongo, "base", null);
  const noHorizonte = (evs: EventoCalendario[]) => evs.filter((e) => e.data <= fim);

  const cenarios: Cenario[] = [
    simular(noHorizonte(eventosDoCenario(ficha, hoje, fim, "pessimista", fragil)), saldoConta, hoje, fim, "pessimista"),
    simular(noHorizonte(eventosBase), saldoConta, hoje, fim, "base"),
    simular(noHorizonte(eventosDoCenario(ficha, hoje, fim, "otimista", null)), saldoConta, hoje, fim, "otimista"),
  ];

  const calendario_60d = eventosBase
    .filter((e) => e.data <= fimCalendario)
    .map((e) => ({ ...e, valor: round2(e.valor) }));

  const provisoes: ProvisaoParcela[] = ficha.parcelas
    .filter((p) => !p.pago && p.vencimento >= hoje)
    .map((p) => {
      const n = eventosBase.filter(
        (e) => e.valor > 0 && e.data > hoje && e.data <= p.vencimento
      ).length;
      return {
        parcela_id: p.id,
        descricao: `${p.compromisso_nome} (parcela ${p.numero})`,
        vencimento: p.vencimento,
        valor: p.valor,
        entradas_ate_vencimento: n,
        fatia_por_entrada: round2(p.valor / Math.max(1, n)),
      };
    });

  const rendaGarantida = ficha.fontes
    .filter(
      (f) =>
        f.ativo &&
        (f.tipo === "fixa" || f.tipo === "contrato") &&
        (f.ativo_ate === null || f.ativo_ate >= hoje)
    )
    .reduce((acc, f) => acc + f.valor, 0);
  const custoFixo = ficha.gastosFixos.filter((g) => g.ativo).reduce((acc, g) => acc + g.valor, 0);
  const provisoesMensais =
    ficha.parcelas
      .filter((p) => !p.pago && p.vencimento >= hoje && p.vencimento <= fim)
      .reduce((acc, p) => acc + p.valor, 0) / horizonteMeses;
  const sobra = rendaGarantida - custoFixo - provisoesMensais;

  return {
    fonte_mais_fragil: fragilInfo ? { nome: fragilInfo.fonte.nome, motivo: fragilInfo.motivo } : null,
    cenarios,
    calendario_60d,
    provisoes,
    sobra_estrutural: {
      renda_garantida: round2(rendaGarantida),
      custo_fixo: round2(custoFixo),
      provisoes_mensais: round2(provisoesMensais),
      sobra: round2(sobra),
      sobra_sem_fonte_fragil: round2(sobra - (fragil?.valor ?? 0)),
    },
  };
}
