const CDI_FALLBACK_ANUAL = 10.5

export interface CdiData {
  cdiDiario: number
  cdiAnual: number
  dataReferencia: string | null
}

export async function getCdiData(): Promise<CdiData> {
  try {
    const res = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json",
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) throw new Error("BCB API error")
    const data = await res.json()
    const cdiDiario = parseFloat(data[0]?.valor ?? "0") / 100
    const cdiAnual = (Math.pow(1 + cdiDiario, 252) - 1) * 100
    return {
      cdiDiario,
      cdiAnual: Math.round(cdiAnual * 100) / 100,
      dataReferencia: data[0]?.data ?? null,
    }
  } catch {
    const cdiDiario = Math.pow(1 + CDI_FALLBACK_ANUAL / 100, 1 / 252) - 1
    return { cdiDiario, cdiAnual: CDI_FALLBACK_ANUAL, dataReferencia: null }
  }
}
