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

// ── dados ────────────────────────────────────────────────────────────────────
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

// ── tela do notebook ─────────────────────────────────────────────────────────
// fontSize base no container → tudo em em → escala automaticamente com o laptop
function LaptopScreen({ inView }: { inView: boolean }) {
  return (
    <div style={{
      background: "#0f0f13", width: "100%", height: "100%",
      display: "flex", flexDirection: "column", fontFamily: "inherit", overflow: "hidden",
      fontSize: "clamp(7px, 1.4vw, 11px)",  // base de escala
    }}>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.7em 1.2em", borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "#1a1a24", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5em" }}>
          <span style={{
            fontFamily: "monospace", fontSize: "1em", fontWeight: 700,
            background: "linear-gradient(135deg,#1d9e75,#378add)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>FinDash</span>
          <span style={{
            fontSize: "0.75em", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.08em", background: "rgba(29,158,117,0.15)",
            color: "#1d9e75", borderRadius: "0.35em", padding: "0.2em 0.45em",
          }}>Premium</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4em", color: "#8888a0", fontSize: "0.82em" }}>
          <IconTrendingUp size="1em" color="#1d9e75" />
          Junho 2026
        </div>
      </div>

      {/* metric row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        {[
          { label: "Saldo livre",  value: formatCurrency(1847), color: "#1d9e75", delay: 0,   icon: <IconWallet size="1em" /> },
          { label: "Gasto no mês", value: formatCurrency(4250), color: "#e8923a", delay: 120, icon: <IconTrendingDown size="1em" /> },
          { label: "Score",        value: "82 / 100",           color: "#378add", delay: 240, icon: <IconTrendingUp size="1em" /> },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: "0.7em 0.9em",
            borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(8px)",
            transition: inView ? `opacity 0.45s ease ${m.delay}ms, transform 0.45s ease ${m.delay}ms` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3em", color: "#8888a0", marginBottom: "0.3em" }}>
              <span style={{ color: m.color }}>{m.icon}</span>
              <span style={{ fontSize: "0.64em", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.label}</span>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: "1.18em", fontWeight: 700, color: m.color }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* charts */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{
          flex: "0 0 58%", padding: "0.7em 0.9em",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column",
        }}>
          <span style={{ fontSize: "0.64em", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8888a0", marginBottom: "0.5em" }}>
            Evolução do saldo
          </span>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="laptopGradSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1d9e75" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1d9e75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" tick={{ fontSize: 7, fill: "#8888a0" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 6, fontSize: 9 }} formatter={(v: number) => [formatCurrency(v), "Saldo"]} />
                <Area type="monotone" dataKey="saldo" stroke="#1d9e75" strokeWidth={2} fill="url(#laptopGradSaldo)" isAnimationActive={inView} animationDuration={900} animationEasing="ease-out" dot={{ r: 2, fill: "#1d9e75", strokeWidth: 0 }} activeDot={{ r: 4, fill: "#1d9e75" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0.7em 0.9em", display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.64em", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8888a0", marginBottom: "0.5em" }}>
            Categorias
          </span>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 2, right: 4, bottom: 0, left: -24 }} barSize={12}>
                <XAxis dataKey="cat" tick={{ fontSize: 7, fill: "#8888a0" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a38", borderRadius: 6, fontSize: 9 }} formatter={(v: number) => [formatCurrency(v)]} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} isAnimationActive={inView} animationDuration={800} animationEasing="ease-out">
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* bottom nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.45em 1em", borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(26,26,36,0.6)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "1em" }}>
          {["Dashboard", "Gastos", "Fundos", "Histórico"].map((l, i) => (
            <span key={l} style={{
              fontSize: "0.64em", color: i === 0 ? "#1d9e75" : "#8888a0",
              borderBottom: i === 0 ? "1px solid #1d9e75" : "none", paddingBottom: 1,
            }}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize: "0.64em", color: "#8888a0", fontFamily: "monospace" }}>50/30/20</span>
      </div>
    </div>
  );
}

// ── tela do celular ───────────────────────────────────────────────────────────
// fontSize base no container → tudo em em → escala automaticamente com o celular
function PhoneScreen({ inView }: { inView: boolean }) {
  return (
    <div style={{
      background: "#0f0f13", width: "100%", height: "100%",
      display: "flex", flexDirection: "column", fontFamily: "inherit", overflow: "hidden",
      fontSize: "clamp(7px, 2.2vw, 10px)",  // base de escala do celular
    }}>
      {/* status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.6em 1.2em 0.4em", flexShrink: 0,
      }}>
        <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: "0.9em", color: "#f0f0f5" }}>9:41</span>
        <div style={{ display: "flex", gap: "0.4em", alignItems: "flex-end" }}>
          {[3,3,4,4].map((h, i) => (
            <div key={i} style={{ width: "0.3em", height: h, background: "#f0f0f5", borderRadius: 1, opacity: i < 3 ? 1 : 0.3 }} />
          ))}
          <div style={{ width: "1.4em", height: "0.6em", border: "1px solid #8888a0", borderRadius: 2, display: "flex", alignItems: "center", padding: "0 1px" }}>
            <div style={{ width: "60%", height: "0.3em", background: "#1d9e75", borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* header */}
      <div style={{
        padding: "0.3em 1.2em 0.7em",
        borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "monospace", fontSize: "1.3em", fontWeight: 800,
            background: "linear-gradient(135deg,#1d9e75,#378add)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>FinDash</span>
          <div style={{
            width: "2.2em", height: "2.2em", borderRadius: "50%",
            background: "linear-gradient(135deg,#1d9e75,#378add)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.8em", fontWeight: 700, color: "#fff",
          }}>G</div>
        </div>
      </div>

      {/* score radial */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0.8em 1em 0.5em", flexShrink: 0,
      }}>
        <div style={{ position: "relative", width: "7em", height: "7em" }}>
          <RadialBarChart width={72} height={72} innerRadius={22} outerRadius={33} startAngle={210} endAngle={-30} data={radialData} barSize={8} style={{ width: "100%", height: "100%" }}>
            <RadialBar dataKey="value" cornerRadius={5} background={{ fill: "#2a2a38" }} isAnimationActive={inView} animationDuration={1000} animationEasing="ease-out" />
          </RadialBarChart>
          <span style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: "1.4em", fontWeight: 900,
            background: "linear-gradient(135deg,#1d9e75,#378add)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>82</span>
        </div>
        <span style={{ fontSize: "0.78em", color: "#8888a0", marginTop: "0.4em" }}>Score 50/30/20</span>
      </div>

      {/* 2 metric cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.5em", padding: "0 0.9em 0.7em", flexShrink: 0,
      }}>
        {[
          { label: "Saldo livre", value: formatCurrency(1847), color: "#1d9e75", delay: 0 },
          { label: "Gasto",       value: formatCurrency(4250), color: "#e8923a", delay: 80 },
        ].map((m) => (
          <div key={m.label} style={{
            background: "#1a1a24", borderRadius: "0.7em", padding: "0.65em 0.8em",
            border: "1px solid rgba(255,255,255,0.06)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(8px)",
            transition: inView ? `opacity 0.45s ease ${m.delay}ms, transform 0.45s ease ${m.delay}ms` : "none",
          }}>
            <div style={{ fontSize: "0.7em", color: "#8888a0", marginBottom: "0.3em" }}>{m.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: "1em", fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 50/30/20 bars */}
      <div style={{ padding: "0 1em", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.6em" }}>
        {mobileBars.map((bar, i) => (
          <div key={bar.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3em" }}>
              <span style={{ fontSize: "0.72em", color: "#8888a0" }}>{bar.label}</span>
              <span style={{ fontSize: "0.72em", fontFamily: "monospace", color: "#8888a0" }}>{bar.pct}%</span>
            </div>
            <div style={{ height: "0.4em", borderRadius: 99, background: "#2a2a38", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, background: bar.color,
                width: `${bar.pct * (100 / 50)}%`,
                transform: inView ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
                transition: inView ? `transform 1s cubic-bezier(0.34,1.56,0.64,1) ${0.5 + i * 0.12}s` : "none",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* bottom nav */}
      <div style={{
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "0.7em 0 0.9em",
        borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        {["◈", "◉", "◇", "◎"].map((icon, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2em" }}>
            <span style={{ fontSize: "1.1em", color: i === 0 ? "#1d9e75" : "#8888a0", lineHeight: 1 }}>{icon}</span>
            {i === 0 && <div style={{ width: "0.4em", height: "0.2em", borderRadius: 99, background: "#1d9e75" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────
export function DeviceShowcase() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  // tamanhos responsivos via clamp — funcionam de 320px a 1200px sem breakpoints JS
  const laptopW  = "clamp(280px, 70vw, 660px)";
  const phoneW   = "clamp(100px, 24vw, 148px)";
  // sobreposição do celular: negativo proporcional ao tamanho do celular
  const phoneML  = "clamp(-36px, -5.5vw, -48px)";
  // celular sobe um pouco acima da base do laptop
  const phoneMB  = "clamp(14px, 2.5vw, 24px)";

  return (
    <div ref={ref} className="relative w-full select-none">

      {/* ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 70% 60% at 40% 50%, rgba(29,158,117,0.07), transparent 70%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 40% 50% at 80% 50%, rgba(55,138,221,0.05), transparent 70%)",
      }} />

      {/* ── LAYOUT: laptop + phone side by side ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 16px",
      }}>

        {/* ── LAPTOP ── */}
        <motion.div
          initial={{ opacity: 0, y: 48, rotateX: 8 }}
          animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 48, rotateX: 8 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{ perspective: 900, flexShrink: 0, width: laptopW }}
        >
          {/* lid (screen) */}
          <div style={{
            position: "relative",
            background: "linear-gradient(160deg, #2a2a38 0%, #1a1a24 40%, #111118 100%)",
            borderRadius: "12px 12px 0 0",
            padding: "clamp(6px,1vw,10px) clamp(6px,1vw,10px) 0",
            boxShadow: "0 -2px 0 rgba(255,255,255,0.06) inset, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
          }}>
            {/* camera */}
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#1a1a24", border: "1px solid rgba(255,255,255,0.08)",
              margin: "0 auto 6px",
            }} />
            {/* screen bezel */}
            <div style={{
              borderRadius: "6px 6px 0 0", overflow: "hidden",
              aspectRatio: "16/10", position: "relative",
              background: "#0f0f13",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset",
            }}>
              <LaptopScreen inView={inView} />
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
                borderRadius: "6px 6px 0 0",
              }} />
            </div>
          </div>

          {/* base */}
          <div style={{
            height: "clamp(8px, 1.2vw, 14px)",
            background: "linear-gradient(180deg, #2a2a38 0%, #1e1e28 100%)",
            borderRadius: "0 0 4px 4px",
            boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "clamp(28px, 5vw, 48px)", height: 5,
              background: "rgba(255,255,255,0.05)", borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.04)",
            }} />
          </div>

          {/* table shadow */}
          <div style={{
            height: 6, marginTop: -1,
            background: "linear-gradient(180deg, #141420 0%, transparent 100%)",
            borderRadius: "0 0 50% 50%",
            filter: "blur(4px)", opacity: 0.8,
          }} />
        </motion.div>

        {/* ── PHONE ── */}
        <motion.div
          initial={{ opacity: 0, y: 60, x: -20 }}
          animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 60, x: -20 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
          style={{
            flexShrink: 0,
            width: phoneW,
            marginLeft: phoneML,
            marginBottom: phoneMB,
            zIndex: 2,
          }}
        >
          {/* phone body */}
          <div style={{
            background: "linear-gradient(160deg, #2a2a38, #1a1a24)",
            borderRadius: "clamp(14px, 3vw, 22px)",
            padding: "clamp(3px,0.5vw,5px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px -16px rgba(0,0,0,0.9), 4px 4px 24px rgba(0,0,0,0.5), -2px 0 12px rgba(29,158,117,0.08)",
            position: "relative",
          }}>
            {/* side buttons */}
            <div style={{ position: "absolute", left: -3, top: 40, width: 3, height: 20, background: "#2a2a38", borderRadius: "3px 0 0 3px", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", left: -3, top: 68, width: 3, height: 14, background: "#2a2a38", borderRadius: "3px 0 0 3px" }} />
            <div style={{ position: "absolute", right: -3, top: 52, width: 3, height: 22, background: "#2a2a38", borderRadius: "0 3px 3px 0" }} />

            {/* notch */}
            <div style={{
              width: "clamp(28px, 5vw, 48px)", height: 5,
              background: "#0f0f13", borderRadius: "0 0 10px 10px",
              margin: "0 auto 2px", position: "relative", zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a24", border: "1px solid rgba(255,255,255,0.06)" }} />
            </div>

            {/* screen */}
            <div style={{
              borderRadius: "clamp(10px, 2vw, 16px)", overflow: "hidden",
              aspectRatio: "9/19.5", background: "#0f0f13", position: "relative",
            }}>
              <PhoneScreen inView={inView} />
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 45%)",
                borderRadius: "clamp(10px, 2vw, 16px)",
              }} />
            </div>

            {/* home indicator */}
            <div style={{ padding: "4px 0 2px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "clamp(24px,4vw,36px)", height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 99 }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── caption ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        style={{
          textAlign: "center",
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 11, color: "#8888a0", letterSpacing: "0.08em",
          textTransform: "uppercase", fontWeight: 500,
        }}>
          <span style={{ width: 20, height: 1, background: "rgba(136,136,160,0.4)", display: "block" }} />
          Disponível no browser e mobile
          <span style={{ width: 20, height: 1, background: "rgba(136,136,160,0.4)", display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {["Web App", "Mobile", "PWA"].map((label) => (
            <span key={label} style={{
              fontSize: 10, color: "#8888a0",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1d9e75", display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
