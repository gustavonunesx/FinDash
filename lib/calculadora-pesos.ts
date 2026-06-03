export type PesosRendaExtra = {
  reserva: number;
  objetivos: number;
  qualidade: number;
  investimentos: number;
};

const STORAGE_KEY = "findash-pesos-renda-extra";

export const PESOS_DEFAULT = {
  construindo: { reserva: 0.4, objetivos: 0.3, qualidade: 0.2, investimentos: 0.1 },
  investindo: { reserva: 0.1, objetivos: 0.3, qualidade: 0.2, investimentos: 0.4 },
} as const;

export function loadPesosCustom(fase: keyof typeof PESOS_DEFAULT): PesosRendaExtra {
  if (typeof window === "undefined") return { ...PESOS_DEFAULT[fase] };

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${fase}`);
    if (!raw) return { ...PESOS_DEFAULT[fase] };
    return JSON.parse(raw) as PesosRendaExtra;
  } catch {
    return { ...PESOS_DEFAULT[fase] };
  }
}

export function savePesosCustom(fase: keyof typeof PESOS_DEFAULT, pesos: PesosRendaExtra) {
  localStorage.setItem(`${STORAGE_KEY}-${fase}`, JSON.stringify(pesos));
}

export function normalizePesos(pesos: PesosRendaExtra): PesosRendaExtra {
  const total = pesos.reserva + pesos.objetivos + pesos.qualidade + pesos.investimentos;
  if (total <= 0) return pesos;
  return {
    reserva: pesos.reserva / total,
    objetivos: pesos.objetivos / total,
    qualidade: pesos.qualidade / total,
    investimentos: pesos.investimentos / total,
  };
}
