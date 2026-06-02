"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  RadialBarChart, RadialBar,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { IconTrendingUp, IconTrendingDown, IconWallet } from "@tabler/icons-react";

// ── dados mock ────────────────────────────────────────────────────────────────
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
const mobileBars = [
  { label: "Necessidades", pct: 42, color: "#e8923a" },
  { label: "Objetivos",    pct: 28, color: "#1d9e75" },
  { label: "Qualidade",    pct: 15, color: "#378add" },
];

// ── tela do MacBook ───────────────────────────────────────────────────────────
function MacScreen({ inView }: { inView: boolean }) {
  return (
    <div style={{
      background: "#0c0c10",
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      fontFamily: "inherit", overflow: "hidden",
      fontSize: "clamp(6px, 1.1vw, 10px)",
    }}>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.65em 1em",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#15151e",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45em" }}>
          <span style={{
            fontFamily: "monospace", fontSize: "0.95em", fontWeight: 700,
            color: "#1d9e75", letterSpacing: "0.02em",
          }}>FinDash</span>
          <span style={{
            fontSize: "0.68em", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.07em", background: "rgba(29,158,117,0.12)",
            color: "#1d9e75", borderRadius: "0.3em", padding: "0.18em 0.4em",
            border: "1px solid rgba(29,158,117,0.2)",
          }}>Premium</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35em", color: "#8888a0", fontSize: "0.75em" }}>
          <IconTrendingUp size="1em" color="#1d9e75" />
          Junho 2026
        </div>
      </div>

      {/* metrics */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {[
          { label: "Saldo livre",  value: formatCurrency(1847), color: "#1d9e75", delay: 0,   icon: <IconWallet size="1em" /> },
          { label: "Gasto no mês", value: formatCurrency(4250), color: "#e8923a", delay: 100, icon: <IconTrendingDown size="1em" /> },
          { label: "Score",        value: "82 / 100",           color: "#378add", delay: 200, icon: <IconTrendingUp size="1em" /> },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: "0.65em 0.85em",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(6px)",
            transition: inView ? `opacity 0.4s ease ${m.delay}ms, transform 0.4s ease ${m.delay}ms` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.28em", color: "#8888a0", marginBottom: "0.25em" }}>
              <span style={{ color: m.color }}>{m.icon}</span>
              <span style={{ fontSize: "0.62em", textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.label}</span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "1.1em", fontWeight: 700, color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* charts */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{
          flex: "0 0 60%", padding: "0.65em 0.85em",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
        }}>
          <span style={{ fontSize: "0.6em", textTransform: "uppercase", letterSpacing: "0.09em", color: "#8888a0", marginBottom: "0.4em" }}>
            Evolução do saldo
          </span>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 2, right: 4, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="macGradSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1d9e75" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#1d9e75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 6, fill: "#8888a0" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#15151e", border: "1px solid #2a2a38", borderRadius: 5, fontSize: 8 }} formatter={(v: number) => [formatCurrency(v), "Saldo"]} />
                <Area type="monotone" dataKey="saldo" stroke="#1d9e75" strokeWidth={1.5} fill="url(#macGradSaldo)" isAnimationActive={inView} animationDuration={900} animationEasing="ease-out" dot={{ r: 1.5, fill: "#1d9e75", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1, padding: "0.65em 0.85em", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.6em", textTransform: "uppercase", letterSpacing: "0.09em", color: "#8888a0", marginBottom: "0.4em" }}>
            Categorias
          </span>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 2, right: 4, bottom: 0, left: -26 }} barSize={10}>
                <XAxis dataKey="cat" tick={{ fontSize: 6, fill: "#8888a0" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#15151e", border: "1px solid #2a2a38", borderRadius: 5, fontSize: 8 }} formatter={(v: number) => [formatCurrency(v)]} />
                <Bar dataKey="val" radius={[3, 3, 0, 0]} isAnimationActive={inView} animationDuration={800} animationEasing="ease-out">
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.82} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* bottom nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.4em 0.9em",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(21,21,30,0.7)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "0.9em" }}>
          {["Dashboard", "Gastos", "Fundos", "Histórico"].map((l, i) => (
            <span key={l} style={{
              fontSize: "0.6em", color: i === 0 ? "#1d9e75" : "#8888a0",
              borderBottom: i === 0 ? "1px solid #1d9e75" : "none", paddingBottom: 1,
            }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: "0.6em", color: "#8888a0", fontFamily: "monospace" }}>50/30/20</span>
      </div>
    </div>
  );
}

// ── tela do iPhone ────────────────────────────────────────────────────────────
function IphoneScreen({ inView }: { inView: boolean }) {
  return (
    <div style={{
      background: "#0c0c10", width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      fontFamily: "inherit", overflow: "hidden",
      fontSize: "clamp(6px, 1.8vw, 9px)",
    }}>
      {/* status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.7em 1.1em 0.3em",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.85em", color: "#f0f0f5" }}>9:41</span>
        <div style={{ display: "flex", gap: "0.35em", alignItems: "flex-end" }}>
          {[3, 3, 4, 4].map((h, i) => (
            <div key={i} style={{ width: "0.28em", height: h, background: "#f0f0f5", borderRadius: 1, opacity: i < 3 ? 1 : 0.3 }} />
          ))}
          <div style={{ width: "1.3em", height: "0.58em", border: "1px solid #8888a0", borderRadius: 2, display: "flex", alignItems: "center", padding: "0 1px" }}>
            <div style={{ width: "60%", height: "0.28em", background: "#1d9e75", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* header */}
      <div style={{ padding: "0.2em 1.1em 0.6em", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace", fontSize: "1.2em", fontWeight: 800, color: "#1d9e75" }}>FinDash</span>
          <div style={{
            width: "2em", height: "2em", borderRadius: "50%",
            background: "linear-gradient(135deg,#1d9e75,#378add)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75em", fontWeight: 700, color: "#fff",
          }}>G</div>
        </div>
      </div>

      {/* score */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0.7em 0.9em 0.4em",
        flexShrink: 0,
      }}>
        <div style={{ position: "relative", width: "6.5em", height: "6.5em" }}>
          <RadialBarChart width={70} height={70} innerRadius={20} outerRadius={31} startAngle={210} endAngle={-30} data={radialData} barSize={7} style={{ width: "100%", height: "100%" }}>
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#2a2a38" }} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
          </RadialBarChart>
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: "1.35em", fontWeight: 900, color: "#1d9e75",
          }}>82</span>
        </div>
        <span style={{ fontSize: "0.72em", color: "#8888a0", marginTop: "0.3em" }}>Score 50/30/20</span>
      </div>

      {/* 2 metric cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.45em", padding: "0 0.8em 0.6em",
        flexShrink: 0,
      }}>
        {[
          { label: "Saldo livre", value: formatCurrency(1847), color: "#1d9e75", delay: 0 },
          { label: "Gasto",       value: formatCurrency(4250), color: "#e8923a", delay: 80 },
        ].map((m) => (
          <div key={m.label} style={{
            background: "#15151e", borderRadius: "0.6em", padding: "0.55em 0.7em",
            border: "1px solid rgba(255,255,255,0.05)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(6px)",
            transition: inView ? `opacity 0.4s ease ${m.delay}ms, transform 0.4s ease ${m.delay}ms` : "none",
          }}>
            <div style={{ fontSize: "0.65em", color: "#8888a0", marginBottom: "0.25em" }}>{m.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.95em", fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 50/30/20 bars */}
      <div style={{ padding: "0 0.9em", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.55em" }}>
        {mobileBars.map((bar, i) => (
          <div key={bar.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25em" }}>
              <span style={{ fontSize: "0.67em", color: "#8888a0" }}>{bar.label}</span>
              <span style={{ fontSize: "0.67em", fontFamily: "monospace", color: "#8888a0" }}>{bar.pct}%</span>
            </div>
            <div style={{ height: "0.35em", borderRadius: 99, background: "#2a2a38", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, background: bar.color,
                width: `${bar.pct * (100 / 50)}%`,
                transform: inView ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: inView ? `transform 0.9s cubic-bezier(0.22,1,0.36,1) ${0.45 + i * 0.1}s` : "none",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* bottom nav */}
      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "0.6em 0 0.8em",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {["◈", "◉", "◇", "◎"].map((icon, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.18em" }}>
            <span style={{ fontSize: "1em", color: i === 0 ? "#1d9e75" : "#8888a0", lineHeight: 1 }}>{icon}</span>
            {i === 0 && <div style={{ width: "0.38em", height: "0.18em", borderRadius: 99, background: "#1d9e75" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MacBook CSS ───────────────────────────────────────────────────────────────
function MacBook({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 6 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: 6 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{ perspective: 1000, width: "100%", maxWidth: 680, flexShrink: 0 }}
    >
      {/* lid */}
      <div style={{
        position: "relative",
        background: "linear-gradient(165deg, #3a3a4a 0%, #22222e 35%, #18181f 100%)",
        borderRadius: "14px 14px 0 0",
        padding: "clamp(7px,1vw,12px) clamp(7px,1vw,12px) 0",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.07)",
          "0 0 0 1.5px rgba(0,0,0,0.6)",
          "0 50px 100px -20px rgba(0,0,0,0.9)",
          "inset 0 -1px 0 rgba(255,255,255,0.04)",
        ].join(", "),
      }}>
        {/* Apple logo area (centered, subtle) */}
        <div style={{
          position: "absolute", top: "0.7em", left: "50%", transform: "translateX(-50%)",
          width: "1.8em", height: "1.8em", opacity: 0.12,
          background: "radial-gradient(circle, #f0f0f5 60%, transparent 100%)",
          borderRadius: "50%",
        }} />
        {/* camera notch */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#0c0c10",
          border: "1px solid rgba(255,255,255,0.06)",
          margin: "0 auto clamp(5px,0.6vw,8px)",
          boxShadow: "0 0 0 2px rgba(0,0,0,0.4), inset 0 0 2px rgba(29,158,117,0.3)",
        }} />
        {/* screen bezel */}
        <div style={{
          borderRadius: "8px 8px 0 0", overflow: "hidden",
          aspectRatio: "16/10", position: "relative",
          background: "#0c0c10",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 2px 4px rgba(0,0,0,0.5)",
        }}>
          <MacScreen inView={inView} />
          {/* glare */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%)",
            borderRadius: "8px 8px 0 0",
          }} />
        </div>
      </div>

      {/* hinge line */}
      <div style={{
        height: 3,
        background: "linear-gradient(180deg, #1a1a22 0%, #222230 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }} />

      {/* base / keyboard deck */}
      <div style={{
        background: "linear-gradient(180deg, #282834 0%, #20202a 60%, #1c1c26 100%)",
        borderRadius: "0 0 10px 10px",
        padding: "clamp(6px,0.8vw,10px) clamp(8px,1.2vw,16px) 0",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.055)",
          "0 0 0 1.5px rgba(0,0,0,0.5)",
        ].join(", "),
      }}>
        {/* keyboard grid (decorative) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(14, 1fr)",
          gap: "clamp(1.5px, 0.2vw, 2.5px)",
          marginBottom: "clamp(4px, 0.5vw, 6px)",
          opacity: 0.7,
        }}>
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: "1",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              border: "0.5px solid rgba(255,255,255,0.04)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }} />
          ))}
        </div>
        {/* trackpad */}
        <div style={{
          width: "clamp(60px,12vw,110px)",
          height: "clamp(32px,5vw,52px)",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 6,
          margin: "0 auto clamp(4px,0.5vw,6px)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }} />
      </div>

      {/* table lip / shadow */}
      <div style={{
        height: "clamp(5px,0.7vw,9px)",
        background: "linear-gradient(180deg, #16161e 0%, transparent 100%)",
        borderRadius: "0 0 50% 50%",
        filter: "blur(5px)",
        opacity: 0.7,
      }} />
    </motion.div>
  );
}

// ── iPhone CSS ────────────────────────────────────────────────────────────────
function Iphone({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 0 }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 50, x: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
      style={{
        width: "clamp(100px, 18vw, 180px)",
        flexShrink: 0,
        alignSelf: "flex-end",
        marginBottom: "clamp(16px, 3vw, 32px)",
      }}
    >
      <div style={{
        position: "relative",
        background: "linear-gradient(165deg, #38384a 0%, #22222e 50%, #18181f 100%)",
        borderRadius: "clamp(16px, 3.5vw, 30px)",
        padding: "clamp(3px,0.5vw,5px)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.09)",
          "0 0 0 2px rgba(0,0,0,0.5)",
          "0 40px 80px -16px rgba(0,0,0,0.95)",
          "8px 8px 32px rgba(0,0,0,0.6)",
          "-4px 0 20px rgba(29,158,117,0.06)",
        ].join(", "),
      }}>
        {/* side buttons left */}
        <div style={{ position: "absolute", left: -3, top: "22%", width: 3, height: "10%", background: "#2a2a38", borderRadius: "3px 0 0 3px", boxShadow: "0 0 0 0.5px rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", left: -3, top: "35%", width: 3, height: "8%",  background: "#2a2a38", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", left: -3, top: "45%", width: 3, height: "8%",  background: "#2a2a38", borderRadius: "3px 0 0 3px" }} />
        {/* side button right */}
        <div style={{ position: "absolute", right: -3, top: "30%", width: 3, height: "14%", background: "#2a2a38", borderRadius: "0 3px 3px 0" }} />

        {/* dynamic island */}
        <div style={{
          width: "clamp(22px,4vw,40px)", height: "clamp(6px,1vw,10px)",
          background: "#0c0c10",
          borderRadius: "0 0 clamp(8px,1.5vw,14px) clamp(8px,1.5vw,14px)",
          margin: "0 auto clamp(1px,0.2vw,2px)",
          position: "relative", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3em",
        }}>
          {/* camera dot */}
          <div style={{ width: "clamp(3px,0.5vw,5px)", height: "clamp(3px,0.5vw,5px)", borderRadius: "50%", background: "#18181f", border: "0.5px solid rgba(255,255,255,0.06)" }} />
        </div>

        {/* screen */}
        <div style={{
          borderRadius: "clamp(12px, 2.8vw, 24px)", overflow: "hidden",
          aspectRatio: "9/19.5",
          background: "#0c0c10",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
          position: "relative",
        }}>
          <IphoneScreen inView={inView} />
          {/* glare */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 42%)",
            borderRadius: "clamp(12px, 2.8vw, 24px)",
          }} />
        </div>

        {/* home bar */}
        <div style={{ padding: "clamp(3px,0.4vw,5px) 0 clamp(2px,0.3vw,3px)", display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "clamp(22px,4vw,40px)", height: "clamp(2px,0.35vw,4px)",
            background: "rgba(255,255,255,0.14)", borderRadius: 99,
          }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Section principal ─────────────────────────────────────────────────────────
export function DeviceShowcaseSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden py-24 border-t border-border/40">

      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 35% 60%, rgba(29,158,117,0.06), transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 75% 50%, rgba(55,138,221,0.05), transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-3">
            Multiplataforma
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Seu financeiro em qualquer tela
          </h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            A mesma experiência fluida, do MacBook ao iPhone.
          </p>
        </motion.div>

        {/* devices — layout responsivo */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "clamp(16px, 3vw, 40px)",
          flexWrap: "wrap",
        }}>
          {/* texto lateral esquerdo — some em mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="hidden lg:flex flex-col gap-5 max-w-[180px] mb-12"
          >
            {[
              { label: "Web App", desc: "Acesso direto pelo browser, sem instalar nada." },
              { label: "PWA", desc: "Instale como app no desktop em um clique." },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1d9e75", display: "inline-block", flexShrink: 0 }} />
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* MacBook */}
          <MacBook inView={inView} />

          {/* iPhone */}
          <Iphone inView={inView} />

          {/* texto lateral direito — some em mobile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:flex flex-col gap-5 max-w-[180px] mb-12"
          >
            {[
              { label: "Mobile", desc: "Registre um gasto em segundos pelo celular." },
              { label: "Offline", desc: "Visualize seus dados mesmo sem conexão." },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#378add", display: "inline-block", flexShrink: 0 }} />
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-4 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* caption mobile (aparece só em mobile, substitui textos laterais) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex lg:hidden flex-wrap justify-center gap-x-8 gap-y-3"
        >
          {[
            { label: "Web App", color: "#1d9e75" },
            { label: "PWA",     color: "#1d9e75" },
            { label: "Mobile",  color: "#378add" },
            { label: "Offline", color: "#378add" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: item.color, display: "inline-block" }} />
              {item.label}
            </span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
