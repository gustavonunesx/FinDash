import type { Custodia } from "./types";

const CDI_CACHE_TTL = 86400 * 1000;

interface CdiCache {
  rate: number;
  fetchedAt: number;
}

let memoryCache: CdiCache | null = null;

export async function fetchCdiRate(): Promise<number> {
  if (memoryCache && Date.now() - memoryCache.fetchedAt < CDI_CACHE_TTL) {
    return memoryCache.rate;
  }

  try {
    const res = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json",
      { next: { revalidate: 86400 } }
    );
    const data = (await res.json()) as { valor: string }[];
    const rate = parseFloat(data[0]?.valor ?? "10.65") / 100;
    memoryCache = { rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    return memoryCache?.rate ?? 0.1065;
  }
}

export function calcularRendimento(
  saldo: number,
  custodia: Custodia | null,
  cdiAnual: number
): { total: number; mensal: number; percentual: number; dias: number } {
  if (!custodia || saldo <= 0) {
    return { total: 0, mensal: 0, percentual: 0, dias: 0 };
  }

  const inicio = new Date(custodia.data_inicio);
  const dias = Math.max(
    1,
    Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  );

  let taxaAnual: number;
  switch (custodia.tipo) {
    case "cdi":
      taxaAnual = cdiAnual * (custodia.taxa / 100);
      break;
    case "prefixado":
      taxaAnual = custodia.taxa / 100;
      break;
    case "ipca":
      taxaAnual = 0.045 + custodia.taxa / 100;
      break;
    case "poupanca":
      taxaAnual = 0.068;
      break;
    default:
      taxaAnual = cdiAnual;
  }

  const taxaDiaria = Math.pow(1 + taxaAnual, 1 / 365) - 1;
  const total = saldo * (Math.pow(1 + taxaDiaria, dias) - 1);
  const mensal = saldo * (Math.pow(1 + taxaDiaria, 30) - 1);
  const percentual = (total / saldo) * 100;

  return { total, mensal, percentual, dias };
}

export function detectarFase(
  saldoReserva: number,
  custoVida: number
): "construindo" | "investindo" {
  if (custoVida <= 0) return "construindo";
  return saldoReserva >= custoVida * 3 ? "investindo" : "construindo";
}
