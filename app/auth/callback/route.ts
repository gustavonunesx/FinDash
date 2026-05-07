import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { seedDefaultData } from "@/lib/supabase/seed-defaults"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a new user (profile just created by trigger)
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", data.user.id)
        .single()

      if (profile) {
        const createdAt = new Date(profile.created_at)
        const isNewUser = Date.now() - createdAt.getTime() < 30_000

        if (isNewUser) {
          const { data: existingGastos } = await supabase
            .from("gastos")
            .select("id")
            .eq("user_id", data.user.id)
            .limit(1)

          if (!existingGastos?.length) {
            await seedDefaultData(data.user.id)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
