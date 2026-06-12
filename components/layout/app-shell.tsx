"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconCalculator,
  IconChartBar,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconPigMoney,
  IconReceipt,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",   icon: IconLayoutDashboard },
  { href: "/gastos",      label: "Receitas",     icon: IconReceipt },
  { href: "/gastos",      label: "Despesas do Mês", icon: IconChartBar, exact: true },
  { href: "/fundos",      label: "Fluxo de Caixa",  icon: IconPigMoney },
  { href: "/historico",   label: "Transações Recentes", icon: IconChartBar },
  { href: "/calculadora", label: "Orçamento",    icon: IconCalculator },
  { href: "/historico",   label: "Relatórios",   icon: IconChartBar },
];

const navMain = [
  { href: "/dashboard",   label: "Dashboard",        icon: IconLayoutDashboard },
  { href: "/gastos",      label: "Receitas",          icon: IconReceipt },
  { href: "/fundos",      label: "Despesas do Mês",   icon: IconChartBar },
  { href: "/historico",   label: "Fluxo de Caixa",    icon: IconPigMoney },
  { href: "/familia",     label: "Transações Recentes", icon: IconUsers },
  { href: "/calculadora", label: "Orçamento",         icon: IconCalculator },
  { href: "/historico",   label: "Relatórios",        icon: IconChartBar },
];

const navBottom = [
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>

      {/* ── Sidebar escura ── */}
      <aside
        className="hidden md:flex md:flex-col md:w-[280px] md:shrink-0 fixed left-0 top-0 h-screen z-30"
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #111827 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex h-[70px] items-center gap-3 px-6 border-b border-white/[0.06]">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "#059669" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L7 9L10 12L14 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6H14V8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white">FINDASH</span>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Menu Principal
          </p>
          {navMain.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href) && href === "/dashboard" && pathname === "/dashboard");
            const isDashActive = href === "/dashboard" && pathname === "/dashboard";
            const isActive = isDashActive || (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                )}
                style={isActive ? {
                  background: "rgba(16,185,129,0.15)",
                  boxShadow: "0 0 0 1px rgba(16,185,129,0.2)",
                } : {}}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-0.5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Outros
          </p>
          {navBottom.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium text-white/50 transition-all hover:text-white/80 hover:bg-white/[0.05]"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium text-white/50 transition-all hover:text-white/80 hover:bg-white/[0.05]">
            <IconLogout className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Área principal (offset pela sidebar) ── */}
      <div className="flex flex-1 flex-col min-w-0 md:ml-[280px]">

        {/* Header escuro */}
        <header
          className="sticky top-0 z-20 flex h-[70px] items-center justify-between px-8"
          style={{ background: "#374151" }}
        >
          <button className="text-white/70 hover:text-white transition-colors">
            <IconMenu2 className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Notificação */}
            <button className="relative text-white/70 hover:text-white transition-colors">
              <IconBell className="h-5 w-5" />
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "#059669" }}
              >
                2
              </span>
            </button>

            {/* Avatar */}
            <div
              className="h-9 w-9 rounded-full ring-2 ring-white/20 overflow-hidden flex items-center justify-center text-white font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
            >
              C
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 overflow-auto" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>

      {/* ── Nav mobile bottom ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
        style={{ background: "#111827", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex justify-around py-2">
          {navMain.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={`mob-${href}-${label}`}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors"
                style={{ color: isActive ? "#10B981" : "rgba(255,255,255,0.4)" }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
