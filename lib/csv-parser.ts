import type { CategoriaGasto } from "./types";

export interface CsvGastoRow {
  nome: string;
  valor: number;
  categoria: CategoriaGasto;
  subcategoria: string | null;
  recorrente: boolean;
  dia_recorrencia: number | null;
  raw: Record<string, string>;
}

const CATEGORIA_KEYWORDS: Record<CategoriaGasto, string[]> = {
  necessidade: [
    "necessidade",
    "necessidades",
    "moradia",
    "aluguel",
    "mercado",
    "alimentacao",
    "alimentação",
    "transporte",
    "conta",
    "saude",
    "saúde",
    "fixo",
  ],
  objetivo: [
    "objetivo",
    "objetivos",
    "reserva",
    "investimento",
    "poupanca",
    "poupança",
    "meta",
    "educacao",
    "educação",
  ],
  qualidade: [
    "qualidade",
    "lazer",
    "streaming",
    "restaurante",
    "entretenimento",
    "viagem",
    "academia",
    "hobby",
  ],
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(firstLine: string): string {
  const semicolon = (firstLine.match(/;/g) ?? []).length;
  const comma = (firstLine.match(/,/g) ?? []).length;
  return semicolon > comma ? ";" : ",";
}

function parseValor(raw: string): number {
  const cleaned = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export function mapearCategoria(raw: string): CategoriaGasto {
  const normalized = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "necessidade" || normalized === "necessidades") return "necessidade";
  if (normalized === "objetivo" || normalized === "objetivos") return "objetivo";
  if (normalized === "qualidade" || normalized.includes("qualidade")) return "qualidade";

  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS) as [CategoriaGasto, string[]][]) {
    if (keywords.some((k) => normalized.includes(k))) return cat;
  }

  return "necessidade";
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.indexOf(c);
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < normalized.length; i++) {
    if (candidates.some((c) => normalized[i].includes(c))) return i;
  }
  return -1;
}

export function parseGastosCsv(content: string): { rows: CsvGastoRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ["CSV vazio ou sem dados (precisa de cabeçalho + linhas)."] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);

  const colNome = findColumn(headers, ["nome", "descricao", "descrição", "titulo", "título"]);
  const colValor = findColumn(headers, ["valor", "amount", "preco", "preço"]);
  const colCategoria = findColumn(headers, ["categoria", "category", "tipo"]);
  const colSub = findColumn(headers, ["subcategoria", "sub", "tag"]);
  const colRecorrente = findColumn(headers, ["recorrente", "recurring"]);
  const colDia = findColumn(headers, ["dia", "dia_recorrencia", "diarecorrencia"]);

  if (colNome < 0 || colValor < 0) {
    return {
      rows: [],
      errors: ["Colunas obrigatórias não encontradas: nome e valor."],
    };
  }

  const rows: CsvGastoRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = cells[idx] ?? "";
    });

    const nome = cells[colNome]?.trim();
    const valor = parseValor(cells[colValor] ?? "0");

    if (!nome) {
      errors.push(`Linha ${i + 1}: nome vazio, ignorada.`);
      continue;
    }
    if (valor <= 0) {
      errors.push(`Linha ${i + 1}: valor inválido (${cells[colValor]}).`);
      continue;
    }

    const catRaw = colCategoria >= 0 ? cells[colCategoria] : "";
    const recRaw = colRecorrente >= 0 ? cells[colRecorrente]?.toLowerCase() : "";
    const recorrente = ["sim", "true", "1", "s", "yes"].includes(recRaw);

    rows.push({
      nome,
      valor,
      categoria: catRaw ? mapearCategoria(catRaw) : mapearCategoria(nome),
      subcategoria: colSub >= 0 ? cells[colSub]?.trim() || null : null,
      recorrente,
      dia_recorrencia: colDia >= 0 ? parseInt(cells[colDia]) || null : null,
      raw,
    });
  }

  return { rows, errors };
}
