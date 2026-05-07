import { createAdminClient } from "./server"

const DEFAULT_GASTOS = [
  { nome: "Faculdade",    valor: 529.00, categoria: "necessidade" as const },
  { nome: "Gasolina",     valor: 100.00, categoria: "necessidade" as const },
  { nome: "Academia",     valor: 109.90, categoria: "necessidade" as const },
  { nome: "Cabelo",       valor:  35.00, categoria: "necessidade" as const },
  { nome: "Recorrente 1", valor:  39.70, categoria: "necessidade" as const },
  { nome: "Recorrente 2", valor:  47.94, categoria: "necessidade" as const },
  { nome: "Reserva de emergência", valor: 300.00, categoria: "objetivo" as const },
  { nome: "Alianças",     valor: 200.00, categoria: "objetivo" as const },
]

const DEFAULT_FUNDOS = [
  {
    nome: "Reserva de emergência",
    saldo_atual: 298.11,
    meta: 3600,
    aporte_mensal: 300,
    cor: "#E24B4A",
    ordem: 0,
  },
  {
    nome: "Alianças",
    saldo_atual: 493.43,
    meta: 2000,
    aporte_mensal: 200,
    cor: "#378ADD",
    ordem: 1,
  },
  {
    nome: "Fundo PC",
    saldo_atual: 50.00,
    meta: 2000,
    aporte_mensal: 200,
    cor: "#1D9E75",
    ordem: 2,
  },
]

export async function seedDefaultData(userId: string) {
  const supabase = await createAdminClient()

  const gastosData = DEFAULT_GASTOS.map((g) => ({ ...g, user_id: userId }))
  const fundosData = DEFAULT_FUNDOS.map((f) => ({ ...f, user_id: userId }))

  await Promise.all([
    supabase.from("gastos").insert(gastosData),
    supabase.from("fundos").insert(fundosData),
    supabase
      .from("configuracoes")
      .update({ salario: 1700, custo_vida: 1200, fase: "construindo" })
      .eq("user_id", userId),
  ])
}
