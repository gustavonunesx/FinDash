import type { Gasto } from "./types";

export interface ParcelaInfo {
  parcelado: boolean;
  total: number;
  /** Parcela sendo cobrada no mês de referência (1-based). 0 se ainda não começou. */
  atual: number;
  /** Parcelas que ainda virão depois da atual. */
  restantes: number;
  /** Compromisso futuro: valor da parcela × restantes. */
  valorRestante: number;
  valorParcela: number;
  valorTotal: number;
  quitado: boolean;
  /** Primeira parcela ainda está no futuro. */
  futuro: boolean;
  inicio: Date | null;
  fim: Date | null;
}

const VAZIO: ParcelaInfo = {
  parcelado: false,
  total: 0,
  atual: 0,
  restantes: 0,
  valorRestante: 0,
  valorParcela: 0,
  valorTotal: 0,
  quitado: false,
  futuro: false,
  inicio: null,
  fim: null,
};

/** Converte "YYYY-MM" ou "YYYY-MM-DD" no primeiro dia do mês em horário local (evita shift de UTC). */
export function parseMesInicio(valor: string): Date {
  const [ano, mes] = valor.split("-").map(Number);
  return new Date(ano, (mes ?? 1) - 1, 1);
}

export function mesInputValue(valor: string | null | undefined): string {
  if (!valor) return "";
  return valor.slice(0, 7);
}

/** Normaliza o valor de um <input type="month"> para o formato date do Postgres. */
export function mesParaDate(valor: string): string {
  return `${valor}-01`;
}

export function mesAtualInput(ref: Date = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

function mesesEntre(de: Date, ate: Date): number {
  return (ate.getFullYear() - de.getFullYear()) * 12 + (ate.getMonth() - de.getMonth());
}

export function parcelaInfo(gasto: Gasto, ref: Date = new Date()): ParcelaInfo {
  const total = gasto.parcelas_total ?? 0;
  if (total <= 1) return VAZIO;

  const inicio = parseMesInicio(gasto.parcela_inicio ?? gasto.created_at);
  const decorridos = mesesEntre(inicio, ref);

  const futuro = decorridos < 0;
  const quitado = decorridos >= total;
  const atual = futuro ? 0 : Math.min(decorridos + 1, total);
  const restantes = quitado ? 0 : total - atual;

  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + total - 1, 1);

  return {
    parcelado: true,
    total,
    atual,
    restantes,
    valorRestante: gasto.valor * restantes,
    valorParcela: gasto.valor,
    valorTotal: gasto.valor * total,
    quitado,
    futuro,
    inicio,
    fim,
  };
}

/** Um gasto parcelado só entra nos totais do mês enquanto há parcela em aberto. */
export function gastoAtivo(gasto: Gasto, ref: Date = new Date()): boolean {
  const info = parcelaInfo(gasto, ref);
  if (!info.parcelado) return true;
  return !info.quitado && !info.futuro;
}

export function gastosAtivos(gastos: Gasto[], ref: Date = new Date()): Gasto[] {
  return gastos.filter((g) => gastoAtivo(g, ref));
}

export function formatMesCurto(data: Date): string {
  return data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}
