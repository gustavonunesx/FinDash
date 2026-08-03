import {
  DEMO_BANCOS,
  DEMO_CONFIG,
  DEMO_FUNDOS,
  DEMO_GASTOS,
  DEMO_PROFILE,
} from "./demo-data";
import type { Banco, Configuracao, Fundo, Gasto, HistoricoMensal, Profile, RendaExtraItem } from "./types";

let profile: Profile = { ...DEMO_PROFILE };
let config: Configuracao = { ...DEMO_CONFIG };
let gastos: Gasto[] = [...DEMO_GASTOS];
let fundos: Fundo[] = [...DEMO_FUNDOS];
let bancos: Banco[] = [...DEMO_BANCOS];

const historico: HistoricoMensal[] = [
  { id: "h1", user_id: "demo-user", mes: "2025-12-01", salario: 4500, total_gastos: 3800, snapshot_fundos: { f1: 7500, f2: 2800, f3: 11000 } },
  { id: "h2", user_id: "demo-user", mes: "2026-01-01", salario: 4500, total_gastos: 3650, snapshot_fundos: { f1: 8000, f2: 3000, f3: 11500 } },
  { id: "h3", user_id: "demo-user", mes: "2026-02-01", salario: 4500, total_gastos: 3720, snapshot_fundos: { f1: 8200, f2: 3100, f3: 11700 } },
  { id: "h4", user_id: "demo-user", mes: "2026-03-01", salario: 5300, total_gastos: 4100, snapshot_fundos: { f1: 8300, f2: 3150, f3: 11850 } },
  { id: "h5", user_id: "demo-user", mes: "2026-04-01", salario: 5300, total_gastos: 3950, snapshot_fundos: { f1: 8400, f2: 3180, f3: 11950 } },
  { id: "h6", user_id: "demo-user", mes: "2026-05-01", salario: 5300, total_gastos: 3104, snapshot_fundos: { f1: 8500, f2: 3200, f3: 12000 } },
];

export function getDemoProfile() {
  return profile;
}

export function getDemoConfig() {
  return config;
}

export function getDemoGastos() {
  return gastos;
}

export function getDemoFundos() {
  return fundos;
}

export function getDemoHistorico() {
  return historico;
}

export function getDemoBancos() {
  return bancos;
}

export function addDemoBanco(banco: Banco) {
  bancos = [...bancos, banco];
}

export function updateDemoBanco(id: string, data: Partial<Banco>) {
  bancos = bancos.map((b) => (b.id === id ? { ...b, ...data } : b));
}

export function deleteDemoBanco(id: string) {
  bancos = bancos.filter((b) => b.id !== id);
  gastos = gastos.map((g) => (g.banco_id === id ? { ...g, banco_id: null } : g));
}

let rendaExtraHistorico: RendaExtraItem[] = [
  { id: "re1", user_id: "demo-user", valor: 600, descricao: "Freelance", created_at: "2026-03-14T00:00:00.000Z" },
  { id: "re2", user_id: "demo-user", valor: 240, descricao: "Cashback", created_at: "2026-04-02T00:00:00.000Z" },
  { id: "re3", user_id: "demo-user", valor: 400, descricao: "Venda usados", created_at: "2026-05-20T00:00:00.000Z" },
];

export function getDemoRendaExtraHistorico() {
  return rendaExtraHistorico;
}

export function addDemoRendaExtra(item: RendaExtraItem) {
  rendaExtraHistorico = [item, ...rendaExtraHistorico];
}

export function setDemoProfile(p: Partial<Profile>) {
  profile = { ...profile, ...p };
}

export function setDemoConfig(c: Partial<Configuracao>) {
  config = { ...config, ...c };
}

export function addDemoGasto(gasto: Gasto) {
  gastos = [gasto, ...gastos];
}

export function updateDemoGasto(id: string, data: Partial<Gasto>) {
  gastos = gastos.map((g) => (g.id === id ? { ...g, ...data } : g));
}

export function deleteDemoGasto(id: string) {
  gastos = gastos.filter((g) => g.id !== id);
}

export function addDemoFundo(fundo: Fundo) {
  fundos = [...fundos, fundo];
}

export function updateDemoFundo(id: string, data: Partial<Fundo>) {
  fundos = fundos.map((f) => (f.id === id ? { ...f, ...data } : f));
}

export function deleteDemoFundo(id: string) {
  fundos = fundos.filter((f) => f.id !== id);
}

export function seedDemoData() {
  gastos = [...DEMO_GASTOS];
  fundos = [...DEMO_FUNDOS];
  bancos = [...DEMO_BANCOS];
}

export function resetDemoOnboarding() {
  profile = { ...DEMO_PROFILE, onboarding_completed: false };
  config = { ...DEMO_CONFIG, salario: 0 };
  gastos = [];
  fundos = [];
  bancos = [];
}
