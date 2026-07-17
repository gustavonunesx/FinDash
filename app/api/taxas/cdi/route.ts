import { NextResponse } from "next/server";
import { fetchCdiRate } from "@/lib/rendimento";

export async function GET() {
  const rate = await fetchCdiRate();
  return NextResponse.json(
    { cdi_anual: rate, cdi_percentual: (rate * 100).toFixed(2) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      },
    }
  );
}
