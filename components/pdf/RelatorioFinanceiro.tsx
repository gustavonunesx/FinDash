import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#0F0F13", color: "#F0F0F5" },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1D9E75", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#8888A0" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#F0F0F5", marginBottom: 10, borderBottom: "1 solid #2A2A38", paddingBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 10, color: "#8888A0" },
  value: { fontSize: 10, color: "#F0F0F5" },
  valueGreen: { fontSize: 10, color: "#1D9E75" },
  valueRed: { fontSize: 10, color: "#E24B4A" },
  valueAmber: { fontSize: 10, color: "#BA7517" },
  card: { backgroundColor: "#1A1A24", borderRadius: 6, padding: 12, marginBottom: 8 },
  cardTitle: { fontSize: 10, color: "#8888A0", marginBottom: 2 },
  cardValue: { fontSize: 16, color: "#F0F0F5" },
  cardRow: { flexDirection: "row", gap: 8 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 9, color: "#8888A0" },
})

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

interface GastoItem { nome: string; valor: number; categoria: string }
interface FundoItem { nome: string; saldo_atual: number; meta: number; aporte_mensal: number }

interface Props {
  nomeUsuario: string
  dataAtual: string
  salario: number
  totalGastos: number
  saldoLivre: number
  necessidades: number
  objetivos: number
  qualidade: number
  gastos: GastoItem[]
  fundos: FundoItem[]
}

export function RelatorioFinanceiro({
  nomeUsuario, dataAtual, salario, totalGastos, saldoLivre,
  necessidades, objetivos, qualidade, gastos, fundos,
}: Props) {
  const pctNec = salario > 0 ? Math.round(necessidades / salario * 100) : 0
  const pctObj = salario > 0 ? Math.round(objetivos / salario * 100) : 0
  const pctQual = salario > 0 ? Math.round(qualidade / salario * 100) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>FinDash</Text>
          <Text style={styles.subtitle}>Relatório financeiro de {dataAtual} • {nomeUsuario}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          <View style={styles.cardRow}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Renda total</Text>
              <Text style={styles.cardValue}>{fmt(salario)}</Text>
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Total de gastos</Text>
              <Text style={styles.cardValue}>{fmt(totalGastos)}</Text>
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.cardTitle}>Saldo livre</Text>
              <Text style={[styles.cardValue, { color: saldoLivre >= 0 ? "#1D9E75" : "#E24B4A" }]}>{fmt(saldoLivre)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
          <View style={styles.row}><Text style={styles.label}>Necessidades (limite 50%)</Text><Text style={styles.valueAmber}>{fmt(necessidades)} ({pctNec}%)</Text></View>
          <View style={styles.row}><Text style={styles.label}>Objetivos (limite 30%)</Text><Text style={styles.valueGreen}>{fmt(objetivos)} ({pctObj}%)</Text></View>
          <View style={styles.row}><Text style={styles.label}>Qualidade de vida (limite 20%)</Text><Text style={styles.value}>{fmt(qualidade)} ({pctQual}%)</Text></View>
        </View>

        {gastos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhamento de Gastos</Text>
            {gastos.map((g, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.label}>{g.nome} ({g.categoria})</Text>
                <Text style={styles.value}>{fmt(g.valor)}</Text>
              </View>
            ))}
          </View>
        )}

        {fundos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fundos Financeiros</Text>
            {fundos.map((f, i) => {
              const pct = f.meta > 0 ? Math.round((f.saldo_atual / f.meta) * 100) : 0
              return (
                <View key={i} style={styles.row}>
                  <Text style={styles.label}>{f.nome}</Text>
                  <Text style={styles.value}>{fmt(f.saldo_atual)} / {fmt(f.meta)} ({pct}%)</Text>
                </View>
              )
            })}
          </View>
        )}

        <Text style={styles.footer}>Gerado pelo FinDash em {new Date().toLocaleDateString("pt-BR")}</Text>
      </Page>
    </Document>
  )
}
