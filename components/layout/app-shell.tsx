"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBell,
  IconCalculator,
  IconChartBar,
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
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 68;

const navMain = [
  { href: "/dashboard",   label: "Dashboard",  icon: IconLayoutDashboard },
  { href: "/gastos",      label: "Gastos",      icon: IconReceipt },
  { href: "/fundos",      label: "Fundos",      icon: IconPigMoney },
  { href: "/calculadora", label: "Calculadora", icon: IconCalculator },
  { href: "/historico",   label: "Histórico",   icon: IconChartBar },
  { href: "/familia",     label: "Família",     icon: IconUsers },
];

const navBottom = [
  { href: "/configuracoes", label: "Configurações", icon: IconSettings },
];

// ── Hamburger ↔ X ────────────────────────────────────────────────────────────
function MenuIcon({ open }: { open: boolean }) {
  return (
    <div className="relative h-5 w-5">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="x"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <IconX className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="bars"
            className="absolute inset-0 flex flex-col justify-center gap-[5px]"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block h-[2px] rounded-full bg-current"
                style={{ width: i === 1 ? "75%" : "100%" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150",
          active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
        )}
        style={active ? {
          background: "rgba(16,185,129,0.15)",
          boxShadow: "0 0 0 1px rgba(16,185,129,0.2)",
        } : {}}
      >
        <motion.span
          className="shrink-0 flex items-center justify-center"
          whileHover={{ scale: 1.22 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </motion.span>

        {/* max-width via CSS — nunca anima width, zero reflow */}
        <span
          className="whitespace-nowrap overflow-hidden"
          style={{
            maxWidth: collapsed ? 0 : 200,
            opacity: collapsed ? 0 : 1,
            transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          }}
        >
          {label}
        </span>
      </Link>
    </motion.div>
  );
}

// ── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({ children, pageBg }: { children: React.ReactNode; pageBg?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userInitials, setUserInitials] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name: string =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "?";
      const parts = name.trim().split(/\s+/);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
      setUserInitials(initials);
    });
  }, []);

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    /*
      Layout raiz usa CSS grid com coluna da sidebar animada.
      Isso garante que o conteúdo se mova junto sem reflow nem fundo vazando.
    */
    <div
      className="min-h-screen"
      style={{
        display: "grid",
        gridTemplateColumns: `${sidebarW}px 1fr`,
        gridTemplateRows: "1fr",
        transition: "grid-template-columns 0.28s cubic-bezier(0.4,0,0.2,1)",
        background: pageBg ?? "#F8FAFC",
      }}
    >
      {/* ── Sidebar (desktop) ── */}
      <aside
        className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen z-30 overflow-hidden"
        style={{
          width: sidebarW,
          minWidth: SIDEBAR_COLLAPSED,
          background: "linear-gradient(180deg, #0F172A 0%, #111827 100%)",
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          willChange: "width",
        }}
      >
        {/* Logo */}
        <div className="flex h-[70px] shrink-0 items-center gap-3 px-[14px] border-b border-white/[0.06] overflow-hidden">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#059669" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L7 9L10 12L14 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6H14V8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span
            className="whitespace-nowrap overflow-hidden text-[17px] font-bold tracking-tight text-white"
            style={{
              maxWidth: collapsed ? 0 : 200,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease",
            }}
          >
            FINDASH
          </span>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 py-5 space-y-0.5 overflow-y-auto overflow-x-hidden px-[10px]">
          <span
            className="block px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: collapsed ? 0 : 200,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease",
            }}
          >
            Menu Principal
          </span>

          {navMain.map(({ href, label, icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                collapsed={collapsed}
                active={isActive}
              />
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="py-4 border-t border-white/[0.06] space-y-0.5 overflow-x-hidden px-[10px]">
          <span
            className="block px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-white/30 whitespace-nowrap overflow-hidden"
            style={{
              maxWidth: collapsed ? 0 : 200,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease",
            }}
          >
            Outros
          </span>

          {navBottom.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              collapsed={collapsed}
              active={pathname.startsWith(href)}
            />
          ))}

          {/* Sair */}
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <button
              title={collapsed ? "Sair" : undefined}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13.5px] font-medium text-white/50 transition-colors hover:text-white/80 hover:bg-white/[0.05]"
            >
              <motion.span
                className="shrink-0 flex items-center justify-center"
                whileHover={{ scale: 1.22 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <IconLogout className="h-[18px] w-[18px]" />
              </motion.span>
              <span
                className="whitespace-nowrap overflow-hidden"
                style={{
                  maxWidth: collapsed ? 0 : 200,
                  opacity: collapsed ? 0 : 1,
                  transition: "max-width 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
                }}
              >
                Sair
              </span>
            </button>
          </motion.div>
        </div>
      </aside>

      {/* ── Área principal — coluna 2 do grid ── */}
      <div
        className="flex flex-col min-w-0 md:col-start-2"
        style={{ background: pageBg ?? "#F8FAFC" }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-20 flex h-[70px] items-center justify-between px-8"
          style={{
            background: "linear-gradient(90deg, #1a2235 0%, #1e293b 60%, #1a2235 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
          }}
        >
          <motion.button
            className="relative text-white/70 hover:text-white transition-colors"
            onClick={() => setCollapsed((v) => !v)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <motion.span
              className="absolute inset-0 rounded-lg pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
              }}
            />
            <span className="relative z-10 flex items-center justify-center h-9 w-9">
              <MenuIcon open={!collapsed} />
            </span>
          </motion.button>

          <div className="flex items-center gap-4">
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

            <motion.button
              onClick={() => router.push("/configuracoes")}
              className="h-9 w-9 rounded-full ring-2 ring-white/20 flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Perfil"
            >
              {userInitials}
            </motion.button>
          </div>
        </header>

        <main className="flex-1 px-8 py-8 overflow-auto" style={{ background: pageBg ?? "#F8FAFC" }}>
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
