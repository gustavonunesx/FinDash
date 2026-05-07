import { NextResponse } from "next/server"
import { createElement } from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { createClient } from "@/lib/supabase/server"
import { RelatorioFinanceiro } from "@/components/pdf/RelatorioFinanceiro"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("nome, plano").eq("id", user.id).single()
  if (profile?.plano !== "premium") return NextResponse.json({ error: "Recurso Premium" }, { status: 403 })

  const [{ data: config }, { data: gastos }, { data: fundos }] = await Promise.all([
    supabase.from("configuracoes").select("salario, renda_extra").eq("user_id", user.id).single(),
    supabase.from("gastos").select("nome, valor, categoria").eq("user_id", user.id).order("categoria"),
    supabase.from("fundos").select("nome, saldo_atual, meta, aporte_mensal").eq("user_id", user.id).order("ordem"),
  ])

  const salario = (config?.salario ?? 0) + (config?.renda_extra ?? 0)
  const gastosArr = gastos ?? []
  const fundosArr = fundos ?? []
  const totalGastos = gastosArr.reduce((s, g) => s + g.valor, 0)
  const saldoLivre = salario - totalGastos
  const necessidades = gastosArr.filter(g => g.categoria === "necessidade").reduce((s, g) => s + g.valor, 0)
  const objetivos = gastosArr.filter(g => g.categoria === "objetivo").reduce((s, g) => s + g.valor, 0)
  const qualidade = gastosArr.filter(g => g.categoria === "qualidade").reduce((s, g) => s + g.valor, 0)

  const dataAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const nomeUsuario = profile?.nome ?? user.email ?? ""

  const doc = createElement(RelatorioFinanceiro, {
    nomeUsuario,
    dataAtual,
    salario,
    totalGastos,
    saldoLivre,
    necessidades,
    objetivos,
    qualidade,
    gastos: gastosArr,
    fundos: fundosArr,
  })

  const buffer = await renderToBuffer(doc as any)
  const uint8 = new Uint8Array(buffer)

  return new Response(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="findash-${new Date().toISOString().slice(0,7)}.pdf"`,
    },
  })
}
