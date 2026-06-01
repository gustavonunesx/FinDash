"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/marketing/faq-section";
import FloatingLines from "@/components/ui/floating-lines";
import { formatCurrency } from "@/lib/utils";
import {
  IconCheck,
  IconSparkles,
  IconArrowRight,
  IconTrendingUp,
} from "@tabler/icons-react";
import { ArrowRight, Zap } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ── paleta do site para o FloatingLines
const PALETTE = ["#1d9e75", "#378add", "#1d9e75", "#7c5cbf", "#378add"];

const freeFeatures = [
  "Até 10 gastos por mês",
  "Até 3 fundos financeiros",
  "Calculadoras 50/30/20",
  "Renda extra e projeções",
];
const premiumFeatures = [
  "Gastos ilimitados",
  "Fundos ilimitados",
  "Histórico mensal com gráficos",
  "Exportação de relatório PDF",
];
const features = [
  { title: "Clareza imediata",        desc: "Dashboard visual com score e métricas em 10 segundos." },
  { title: "Método 50/30/20",         desc: "Calculadora automática que guia cada decisão financeira." },
  { title: "Construção de patrimônio",desc: "Fundos com rendimento CDI em tempo real via BCB." },
];
const mockBars = [
  { label: "Necessidades", pct: 42, color: "bg-fd-amber",  hex: "#e8923a" },
  { label: "Objetivos",    pct: 28, color: "bg-fd-green",  hex: "#1d9e75" },
  { label: "Qualidade",    pct: 15, color: "bg-fd-blue",   hex: "#378add" },
];
const areaData = [
  { mes: "Jan", saldo: 800  },
  { mes: "Fev", saldo: 1100 },
  { mes: "Mar", saldo: 950  },
  { mes: "Abr", saldo: 1400 },
  { mes: "Mai", saldo: 1250 },
  { mes: "Jun", saldo: 1847 },
];
const barData = [
  { cat: "Neces.", val: 2100, fill: "#e8923a" },
  { cat: "Obj.",   val: 1400, fill: "#1d9e75" },
  { cat: "Qual.",  val:  750, fill: "#378add" },
];
const radialData = [{ name: "Score", value: 82, fill: "#1d9e75" }];

// ── Dashboard mock full-width ──────────────────────────────────────────────
function MockDashboard() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    // opacity-only fade — no y translation avoids promoting extra layers
    <div
      ref={ref}
      className="relative w-full rounded-2xl md:rounded-none glass border border-border/30 md:border-x-0 md:border-t md:border-b shadow-premium overflow-hidden text-left transition-opacity duration-700"
      style={{ opacity: inView ? 1 : 0 }}
    >
      {/* ── top bar ── */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gradient">FinDash</span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconTrendingUp size={12} className="text-fd-green" />
          Junho 2025
        </div>
      </div>

      {/* ── metric row — CSS animation, no JS per frame ── */}
      <div className="grid grid-cols-3 divide-x divide-border/30 border-b border-border/30">
        {[
          { label: "Saldo livre",  value: formatCurrency(1847), color: "text-fd-green", delay: "0ms"   },
          { label: "Gasto no mês", value: formatCurrency(4250), color: "text-fd-amber", delay: "100ms" },
          { label: "Score",        value: "82 / 100",           color: "text-fd-blue",  delay: "200ms" },
        ].map((m) => (
          <div
            key={m.label}
            className="px-3 sm:px-6 py-4 animate-fade-up"
            style={{ animationDelay: m.delay, animationFillMode: "both", opacity: inView ? undefined : 0 }}
          >
            <p className="mb-1 text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground truncate">{m.label}</p>
            <p className={`font-mono text-base sm:text-xl lg:text-2xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border/30">

        {/* area — evolução saldo */}
        <div className="p-4 sm:p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Evolução do saldo
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1d9e75" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1d9e75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#8888a0" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [formatCurrency(v), "Saldo"]}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="#1d9e75"
                strokeWidth={2.5}
                fill="url(#gradSaldo)"
                isAnimationActive={inView}
                animationDuration={900}
                animationEasing="ease-out"
                dot={{ r: 3, fill: "#1d9e75", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#1d9e75" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* bar — categorias */}
        <div className="p-4 sm:p-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Categorias
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barSize={18}>
              <XAxis dataKey="cat" tick={{ fontSize: 10, fill: "#8888a0" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [formatCurrency(v)]}
              />
              <Bar dataKey="val" radius={[5, 5, 0, 0]} isAnimationActive={inView} animationDuration={800} animationEasing="ease-out">
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* radial gauge + 50/30/20 bars */}
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Score 50/30/20
            </p>
            <div className="flex items-center gap-4">
              {/* fixed size — no ResizeObserver overhead from ResponsiveContainer */}
              <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
                <RadialBarChart
                  width={80}
                  height={80}
                  innerRadius={26}
                  outerRadius={38}
                  startAngle={210}
                  endAngle={-30}
                  data={radialData}
                  barSize={9}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={6}
                    background={{ fill: "#2a2a38" }}
                    isAnimationActive={inView}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </RadialBarChart>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-black text-gradient">
                  82
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ótima distribuição financeira este mês.
              </p>
            </div>
          </div>

          {/* 50/30/20 bars — scaleX instead of width to avoid layout reflow */}
          <div className="space-y-3">
            {mockBars.map((bar, i) => (
              <div key={bar.label}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="font-mono text-muted-foreground">{bar.pct}%</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${bar.color}`}
                    style={{
                      width: `${bar.pct * (100 / 50)}%`,
                      transform: inView ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "left",
                      transition: inView
                        ? `transform 1s cubic-bezier(0.34,1.56,0.64,1) ${0.4 + i * 0.12}s`
                        : "none",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Landing ────────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── NAV ── */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 glass">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold text-gradient">FinDash</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-x-hidden pt-14">

        {/* FloatingLines — full bleed background */}
        <div className="absolute inset-0 z-0">
          <FloatingLines
            linesGradient={PALETTE}
            enabledWaves={["top", "middle", "bottom"]}
            lineCount={[4, 6, 6]}
            lineDistance={[8, 6, 4]}
            bendRadius={4.5}
            bendStrength={-0.6}
            animationSpeed={0.7}
            interactive={true}
            parallax={true}
            parallaxStrength={0.15}
            mixBlendMode="screen"
          />
        </div>

        {/* subtle dark overlay so text stays readable */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-background/55" />
        {/* bottom fade into page */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-48 bg-gradient-to-t from-background to-transparent" />

        {/* hero content */}
        <div className="relative z-10 mx-auto flex flex-col items-center justify-center px-6 pb-8 pt-24 text-center">

          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className="relative inline-flex items-center gap-3 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 px-6 py-3 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
              <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
              <span className="relative z-10 text-sm font-bold uppercase tracking-wider text-primary">
                Método 50/30/20 embutido
              </span>
              <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
            </span>
          </motion.div>

          {/* title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="space-y-3"
          >
            <p className="text-4xl font-light text-foreground/60 md:text-5xl lg:text-6xl">
              Transforme números em
            </p>
            <h1 className="relative inline-block text-5xl font-black tracking-tighter leading-tight sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="text-gradient">decisões claras</span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                className="absolute -bottom-3 left-0 h-1.5 rounded-full bg-gradient-to-r from-fd-green via-fd-green/80 to-transparent shadow-lg shadow-fd-green/40"
              />
            </h1>
          </motion.div>

          {/* subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto mt-10 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
          >
            FinDash combina dashboard de inteligência financeira com um método guiado.{" "}
            <span className="rounded-md bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-0.5 font-semibold text-foreground">
              Saiba em 10 segundos
            </span>{" "}
            para onde vai seu dinheiro.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/cadastro"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-primary/90 px-8 py-4 text-lg font-semibold text-primary-foreground shadow-xl transition-all duration-500 hover:shadow-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <span className="relative z-10 tracking-wide">Começar grátis</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/precos"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl border-2 border-border/40 bg-background/60 px-8 py-4 text-lg font-semibold shadow-lg backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-background/90"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <Zap className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <span className="relative z-10 tracking-wide">Ver planos</span>
              </Link>
            </motion.div>
          </motion.div>

        </div>

        {/* full-width dashboard — fora do container centralizado para o breakout funcionar corretamente */}
        <div className="relative z-10 w-full px-4 pt-10 pb-16 sm:px-6 sm:pt-14 md:px-0 md:pt-16">
          <MockDashboard />
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="border-t border-border/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center text-3xl font-bold"
          >
            Como funciona
          </motion.h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className="glass-subtle rounded-xl p-6"
              >
                <span className="font-mono text-3xl font-bold text-fd-green/50">0{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <IconSparkles size={12} />
              Planos simples
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Comece grátis.{" "}
              <span className="text-gradient">Evolua quando quiser.</span>
            </h2>
            <p className="text-muted-foreground">Sem surpresas, sem letras miúdas.</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-border/60 glass-subtle p-7 space-y-6 transition-colors duration-300 hover:border-foreground/15"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">Gratuito</p>
              <p className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">R$0</p>
              <p className="text-xs text-muted-foreground mt-1.5">para sempre</p>
            </div>
            <ul className="space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <IconCheck size={11} className="text-primary" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/cadastro"
              className="block text-center text-sm border border-border/70 rounded-xl px-4 py-3 hover:bg-card hover:border-foreground/20 transition-all font-semibold"
            >
              Criar conta grátis
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mt-4 sm:mt-0"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <span className="relative overflow-hidden bg-primary text-white text-xs font-semibold px-5 py-1.5 rounded-full shadow-lg shadow-primary/40 inline-block whitespace-nowrap">
                Recomendado
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer-slide_2s_ease-in-out_infinite]" />
              </span>
            </div>
            <motion.div
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border-2 border-primary/70 bg-card pt-9 px-7 pb-7 space-y-6 animate-glow-pulse-green"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/6 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">Premium</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                  R$19<span className="text-base font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">ou R$149/ano — 2 meses grátis</p>
              </div>
              <ul className="relative space-y-3">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <IconCheck size={11} className="text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/precos"
                className="relative block text-center text-sm bg-primary text-white rounded-xl px-4 py-3 hover:bg-primary/90 transition-all font-semibold hover:shadow-xl hover:shadow-primary/30"
              >
                Testar 14 dias grátis
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FaqSection />

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(29,158,117,0.10),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_20%_100%,rgba(55,138,221,0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative space-y-6 max-w-lg mx-auto px-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
            <IconSparkles size={12} />
            Grátis para começar
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
            Pronto para organizar<br />
            <span className="text-gradient">suas finanças?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Crie sua conta em menos de 1 minuto. Sem cartão de crédito.
          </p>
          <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-2 bg-primary text-white rounded-xl px-10 py-4 font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30"
            >
              Criar conta grátis — é rápido
              <IconArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative overflow-hidden bg-background">
        <div className="pointer-events-none select-none absolute inset-0 flex items-end overflow-hidden" aria-hidden>
          <span className="absolute bottom-[-0.15em] left-[-0.05em] font-mono font-black text-[20vw] leading-none text-foreground/[0.025] tracking-tighter whitespace-nowrap">
            50/30/20
          </span>
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-10 sm:gap-16 mb-14">
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-black tracking-tight">
                  <span className="font-mono text-primary">Fin</span>
                  <span className="text-foreground">Dash</span>
                </span>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                  Organize seu dinheiro com inteligência. Regra 50/30/20 aplicada à vida real.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 border border-border/50 rounded-lg px-3 py-2 bg-card/40">
                <span className="size-1.5 rounded-full bg-primary animate-pulse-soft" />
                <span className="font-mono text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">1.200+</span> usuários organizando finanças
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Produto</p>
              <ul className="space-y-3">
                {[
                  { label: "Dashboard",    href: "/dashboard" },
                  { label: "Preços",       href: "/precos" },
                  { label: "Calculadoras", href: "/dashboard" },
                  { label: "Histórico",    href: "/dashboard" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:translate-x-0.5 inline-block">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Conta</p>
              <ul className="space-y-3">
                {[
                  { label: "Entrar",        href: "/login" },
                  { label: "Criar conta",   href: "/cadastro" },
                  { label: "Configurações", href: "/configuracoes" },
                  { label: "Plano Premium", href: "/precos" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:translate-x-0.5 inline-block">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/50">
            <p>© {new Date().getFullYear()} FinDash. Todos os direitos reservados.</p>
            <p className="font-mono tracking-tight">
              built for <span className="text-primary/70">financial clarity</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
