"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconCalculator,
  IconChartBar,
  IconChartPie,
  IconLayoutDashboard,
  IconLogout,
  IconPigMoney,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const navMain = [
  { href: "/dashboard",   label: "Dashboard",     icon: IconLayoutDashboard },
  { href: "/gastos",      label: "Gastos",         icon: IconReceipt },
  { href: "/fundos",      label: "Fundos",         icon: IconPigMoney },
  { href: "/calculadora", label: "Calculadora",    icon: IconCalculator },
  { href: "/historico",   label: "Histórico",      icon: IconChartBar },
  { href: "/familia",     label: "Família",        icon: IconUsers },
];

const navBottom = [
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
];

// Animated hamburger / X icon
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="relative h-5 w-5 flex flex-col justify-center gap-[5px]">
      <AnimatePresence initial={false}>
        {open ? (
          // X
          <motion.div
            key="x"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <IconX className="h-5 w-5" />
          </motion.div>
        ) : (
          // Three lines that slide in from left
          <motion.div
            key="bars"
            className="absolute inset-0 flex flex-col justify-center gap-[5px]"
            initial={{ x: -14, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 14, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-[2px] rounded-full bg-current"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                style={{ width: i === 1 ? "75%" : "100%" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "#F8FAFC" }}>

      {/* ── Sidebar escura (desktop) ── */}
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
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
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
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                pathname.startsWith(href)
                  ? "text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              )}
              style={pathname.startsWith(href) ? {
                background: "rgba(16,185,129,0.15)",
                boxShadow: "0 0 0 1px rgba(16,185,129,0.2)",
              } : {}}
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

      {/* ── Área principal ── */}
      <div className="flex flex-1 flex-col min-w-0 md:ml-[280px]">

        {/* Header escuro aprimorado */}
        <header
          className="sticky top-0 z-20 flex h-[70px] items-center justify-between px-8"
          style={{
            background: "linear-gradient(90deg, #1a2235 0%, #1e293b 60%, #1a2235 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
          }}
        >
          {/* Botão menu com animação */}
          <motion.button
            className="relative text-white/70 hover:text-white transition-colors overflow-hidden"
            onClick={() => setMobileNavOpen((v) => !v)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Abrir menu"
          >
            {/* Glow ring on hover */}
            <motion.span
              className="absolute inset-0 rounded-lg"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
              }}
            />
            <span className="relative z-10 flex items-center justify-center h-9 w-9">
              <MenuIcon open={mobileNavOpen} />
            </span>
          </motion.button>

          <div className="flex items-center gap-4">
            {/* Notificação */}
            <motion.button
              className="relative text-white/70 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconBell className="h-5 w-5" />
              <motion.span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "#059669" }}
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                2
              </motion.span>
            </motion.button>

            {/* Avatar */}
            <motion.div
              className="h-9 w-9 rounded-full ring-2 ring-white/20 overflow-hidden flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
            >
              C
            </motion.div>
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
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={`mob-${href}`}
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
