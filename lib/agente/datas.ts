const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

function paraUtc(data: string): Date {
  const [, a, m, d] = FORMATO.exec(data)!;
  return new Date(Date.UTC(Number(a), Number(m) - 1, Number(d)));
}

function paraTexto(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function hojeSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function somarDias(data: string, dias: number): string {
  const d = paraUtc(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return paraTexto(d);
}

export function somarMeses(data: string, meses: number): string {
  const d = paraUtc(data);
  const alvo = d.getUTCMonth() + meses;
  const ano = d.getUTCFullYear() + Math.floor(alvo / 12);
  const mes = ((alvo % 12) + 12) % 12;
  const dia = Math.min(d.getUTCDate(), diasNoMes(ano, mes + 1));
  return paraTexto(new Date(Date.UTC(ano, mes, dia)));
}

export function dataValida(s: string): boolean {
  if (!FORMATO.test(s)) return false;
  return paraTexto(paraUtc(s)) === s;
}
