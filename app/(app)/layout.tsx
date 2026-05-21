"use server"

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/app/(auth)/actions"
import {
  IconLayoutDashboard,
  IconReceipt2,
  IconCalculator,
  IconPigMoney,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react"
import { NavLink } from "@/components/layout/NavLink"
import { MobileNavLink } from "@/components/layout/MobileNavLink"

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: IconReceipt2 },
  { href: "/calculadora", label: "Calculadora", icon: IconCalculator },
  { href: "/fundos", label: "Fundos", icon: IconPigMoney },
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, plano")
    .eq("id", user.id)
    .single()

  const initials = (profile?.nome ?? user.email ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop header */}
      <header className="hidden md:flex sticky top-0 z-40 h-14 items-center border-b border-border/50 glass px-6">
        <Link 
          href="/dashboard" 
          className="mr-10 text-lg font-bold shrink-0 transition-opacity hover:opacity-80"
        >
          <span className="font-mono text-primary">Fin</span>
          <span className="text-foreground">Dash</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {profile?.plano === "premium" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20 transition-colors hover:bg-primary/20">
              Premium
            </span>
          )}
          <div className="size-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary transition-transform hover:scale-105">
            {initials}
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-105 p-1 rounded-md hover:bg-muted"
              title="Sair"
            >
              <IconLogout size={18} />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 h-12 flex items-center justify-between border-b border-border/50 glass px-4">
        <Link href="/dashboard" className="text-base font-bold transition-opacity hover:opacity-80">
          <span className="font-mono text-primary">Fin</span>
          <span className="text-foreground">Dash</span>
        </Link>
        <div className="flex items-center gap-3">
          {profile?.plano === "premium" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
              PRO
            </span>
          )}
          <div className="size-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <form action={signOut}>
            <button type="submit" className="text-muted-foreground p-1 hover:text-foreground transition-colors">
              <IconLogout size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/50 glass safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <MobileNavLink key={href} href={href} label={label}>
              <Icon size={20} strokeWidth={1.5} />
            </MobileNavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
