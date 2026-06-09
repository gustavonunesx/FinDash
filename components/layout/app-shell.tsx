"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalculator,
  IconChartBar,
  IconLayoutDashboard,
  IconPigMoney,
  IconReceipt,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: IconReceipt },
  { href: "/fundos", label: "Fundos", icon: IconPigMoney },
  { href: "/familia", label: "Família", icon: IconUsers },
  { href: "/calculadora", label: "Calculadora", icon: IconCalculator },
  { href: "/historico", label: "Histórico", icon: IconChartBar },
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link href="/dashboard" className="text-lg font-bold text-primary">
            FinDash
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname.startsWith(href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass md:hidden">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]",
                pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
