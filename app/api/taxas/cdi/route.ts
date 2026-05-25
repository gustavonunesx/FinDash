import { NextResponse } from "next/server"
import { getCdiData } from "@/lib/taxas"

export async function GET() {
  const data = await getCdiData()
  return NextResponse.json(data)
}
