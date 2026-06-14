"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { IconTrendingUp } from "@tabler/icons-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .ch-gsap-reveal { visibility: hidden; }

  .ch-film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.015; mix-blend-mode: multiply;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .ch-bg-grid {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(14,143,106,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(14,143,106,0.06) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .ch-text-3d {
    color: #0F1F19;
    text-shadow:
      0 10px 30px rgba(14,143,106,0.1),
      0 2px 4px rgba(0,0,0,0.06);
  }

  .ch-text-gradient-reveal {
    background: linear-gradient(180deg, #0F1F19 0%, rgba(15,31,25,0.55) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0px 4px 12px rgba(14,143,106,0.12));
  }

  .ch-text-green-reveal {
    background: linear-gradient(180deg, #0E8F6A 0%, #2563EB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0px 0px 20px rgba(14,143,106,0.2));
  }

  /* Card — fundo branco light */
  .ch-premium-card {
    background: linear-gradient(145deg, #f0faf6 0%, #FFFFFF 100%);
    box-shadow:
      0 40px 100px -20px rgba(0,0,0,0.12),
      0 20px 40px -20px rgba(0,0,0,0.08),
      inset 0 1px 2px rgba(14,143,106,0.08),
      inset 0 -1px 2px rgba(0,0,0,0.03);
    border: 1px solid rgba(14,143,106,0.14);
    position: relative;
  }

  .ch-card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--ch-mouse-x, 50%) var(--ch-mouse-y, 50%), rgba(14,143,106,0.04) 0%, transparent 40%);
    mix-blend-mode: multiply; transition: opacity 0.3s ease;
  }

  /* iPhone bezel — cinza claro elegante */
  .ch-iphone-bezel {
    background: linear-gradient(165deg, #d4d4d8 0%, #a1a1aa 50%, #71717a 100%);
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.08),
      0 0 0 2px rgba(255,255,255,0.6),
      0 40px 80px -16px rgba(0,0,0,0.25),
      8px 8px 32px rgba(0,0,0,0.12),
      -4px 0 20px rgba(14,143,106,0.06);
    transform-style: preserve-3d;
  }

  .ch-hardware-btn {
    background: linear-gradient(90deg, #a1a1aa 0%, #71717a 100%);
    box-shadow:
      -1px 0 3px rgba(0,0,0,0.2),
      inset -1px 0 1px rgba(255,255,255,0.3),
      inset 1px 0 1px rgba(0,0,0,0.1);
  }

  .ch-screen-glare {
    background: linear-gradient(110deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 45%);
  }

  .ch-widget-depth {
    background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(247,248,247,0.8) 100%);
    box-shadow:
      0 2px 8px rgba(0,0,0,0.06),
      inset 0 1px 1px rgba(255,255,255,0.9);
    border: 1px solid rgba(221,232,228,0.8);
  }

  .ch-floating-badge {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(14,143,106,0.12),
      0 8px 32px rgba(0,0,0,0.1),
      inset 0 1px 1px rgba(255,255,255,0.9);
  }

  .ch-btn-primary {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    background: linear-gradient(180deg, #12a87d 0%, #0E8F6A 100%);
    color: #fff;
    box-shadow: 0 0 0 1px rgba(14,143,106,0.2), 0 2px 4px rgba(14,143,106,0.15), 0 12px 24px -4px rgba(14,143,106,0.2), inset 0 1px 1px rgba(255,255,255,0.3);
  }
  .ch-btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px rgba(14,143,106,0.3), 0 6px 12px -2px rgba(14,143,106,0.2), 0 20px 32px -6px rgba(14,143,106,0.25), inset 0 1px 1px rgba(255,255,255,0.35);
  }
  .ch-btn-primary:active { transform: translateY(1px); }

  .ch-btn-secondary {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    background: #FFFFFF;
    color: #0F1F19;
    box-shadow: 0 0 0 1px #DDE8E4, 0 2px 4px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.04);
  }
  .ch-btn-secondary:hover {
    transform: translateY(-3px);
    background: #F7F8F7;
    box-shadow: 0 0 0 1px #b8d4cc, 0 6px 16px rgba(0,0,0,0.08);
  }
  .ch-btn-secondary:active { transform: translateY(1px); }

  .ch-progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

const areaData = [
  { mes: "Jan", saldo: 800 },
  { mes: "Fev", saldo: 1100 },
  { mes: "Mar", saldo: 950 },
  { mes: "Abr", saldo: 1400 },
  { mes: "Mai", saldo: 1250 },
  { mes: "Jun", saldo: 1847 },
];

export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Mouse parallax + card sheen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty("--ch-mouse-x", `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty("--ch-mouse-y", `${e.clientY - rect.top}px`);
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Cinematic scroll timeline
  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".ch-text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".ch-text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".ch-main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".ch-card-left-text", ".ch-card-right-text", ".ch-mockup-wrapper", ".ch-floating-badge", ".ch-phone-widget"], { autoAlpha: 0 });
      gsap.set(".ch-cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".ch-text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".ch-text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=7000",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".ch-hero-text-wrapper", ".ch-bg-grid"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".ch-main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".ch-main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".ch-mockup-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".ch-phone-widget", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .to(".ch-progress-ring", { strokeDashoffset: 60, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".ch-counter-val", { innerHTML: 82, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".ch-floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".ch-card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".ch-card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2.5 })
        .set(".ch-hero-text-wrapper", { autoAlpha: 0 })
        .set(".ch-cta-wrapper", { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to([".ch-mockup-wrapper", ".ch-floating-badge", ".ch-card-left-text", ".ch-card-right-text"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".ch-main-card", {
          width: isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut",
          duration: 1.8,
        }, "pullback")
        .to(".ch-cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".ch-main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "#F7F8F7", perspective: "1500px" }}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="ch-film-grain" aria-hidden="true" />
      <div className="ch-bg-grid absolute inset-0 z-0 pointer-events-none opacity-40" aria-hidden="true" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 30% 50%, rgba(14,143,106,0.06), transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 40% at 70% 50%, rgba(37,99,235,0.04), transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 40% 60% at 50% 80%, rgba(124,58,237,0.03), transparent 70%)" }} />
      </div>

      {/* HERO TEXT — fundo, desaparece ao rolar */}
      <div className="ch-hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <h1 className="ch-text-track ch-gsap-reveal ch-text-3d text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          Transforme números em
        </h1>
        <h1 className="ch-text-days ch-gsap-reveal ch-text-green-reveal text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          decisões claras.
        </h1>
      </div>

      {/* CTA FINAL — aparece após a animação de saída do card */}
      <div className="ch-cta-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 ch-gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight ch-text-gradient-reveal">
          Pronto para começar?
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed" style={{ color: "#6B8078" }}>
          Crie sua conta grátis. Sem cartão de crédito. Veja em 10 segundos para onde vai seu dinheiro.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/cadastro"
            className="ch-btn-primary flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Começar grátis
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/precos"
            className="ch-btn-secondary flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            Ver planos
          </Link>
        </div>
      </div>

      {/* CARD PRINCIPAL — sobe de baixo ao rolar */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="ch-main-card ch-premium-card relative overflow-hidden ch-gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="ch-card-sheen" aria-hidden="true" />

          {/* Grid responsivo: mobile flex-col, desktop 3 colunas */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">

            {/* 1. TOP mobile / RIGHT desktop — tagline */}
            <div className="ch-card-right-text ch-gsap-reveal order-1 lg:order-3 flex flex-col justify-center lg:justify-end items-center lg:items-end z-20 w-full text-center lg:text-right">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#0E8F6A" }}>
                Inteligência financeira
              </span>
              <h2 className="text-5xl md:text-[5rem] lg:text-[7rem] font-black uppercase tracking-tighter leading-none" style={{
                background: "linear-gradient(180deg, #0F1F19 0%, rgba(15,31,25,0.45) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0px 4px 12px rgba(14,143,106,0.12))",
              }}>
                FinDash
              </h2>
              <p className="text-sm mt-3 max-w-[200px] leading-relaxed hidden lg:block" style={{ color: "#6B8078" }}>
                Método 50/30/20 aplicado à vida real com dados em tempo real.
              </p>
            </div>

            {/* 2. MIDDLE mobile / CENTER desktop — iPhone mockup */}
            <div className="ch-mockup-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>

              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.7] md:scale-[0.85] lg:scale-100">

                {/* iPhone Bezel */}
                <div
                  ref={mockupRef}
                  className="relative ch-iphone-bezel flex flex-col will-change-transform"
                  style={{ width: 280, height: 580, borderRadius: "3rem" }}
                >
                  {/* Hardware buttons */}
                  <div className="ch-hardware-btn absolute top-[120px] rounded-l-md" style={{ left: -3, width: 3, height: 25 }} aria-hidden="true" />
                  <div className="ch-hardware-btn absolute top-[160px] rounded-l-md" style={{ left: -3, width: 3, height: 45 }} aria-hidden="true" />
                  <div className="ch-hardware-btn absolute top-[220px] rounded-l-md" style={{ left: -3, width: 3, height: 45 }} aria-hidden="true" />
                  <div className="ch-hardware-btn absolute top-[170px] rounded-r-md" style={{ right: -3, width: 3, height: 70 }} aria-hidden="true" />

                  {/* Screen */}
                  <div className="absolute overflow-hidden z-10" style={{
                    inset: 7,
                    background: "#F8FAFC",
                    borderRadius: "2.5rem",
                    boxShadow: "inset 0 0 8px rgba(0,0,0,0.06)",
                  }}>
                    <div className="ch-screen-glare absolute inset-0 z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island */}
                    <div className="absolute left-1/2 -translate-x-1/2 rounded-full z-50 flex items-center justify-end px-3" style={{
                      top: 5, width: 100, height: 28,
                      background: "#1c1c1e",
                      boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
                    }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#0E8F6A", boxShadow: "0 0 8px rgba(14,143,106,0.8)" }} />
                    </div>

                    {/* App content */}
                    <div className="relative w-full h-full flex flex-col" style={{ paddingTop: 48, paddingLeft: 20, paddingRight: 20, paddingBottom: 32 }}>

                      {/* Header */}
                      <div className="ch-phone-widget flex justify-between items-center mb-5">
                        <div className="flex flex-col">
                          <span className="uppercase tracking-widest font-bold mb-1" style={{ fontSize: 10, color: "#6B8078" }}>Dashboard</span>
                          <span className="font-bold tracking-tight" style={{ fontSize: 18, color: "#0F1F19" }}>
                            <span style={{ background: "linear-gradient(135deg,#0E8F6A,#2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FinDash</span>
                          </span>
                        </div>
                        <div className="rounded-full flex items-center justify-center font-bold text-white text-sm" style={{
                          width: 36, height: 36,
                          background: "linear-gradient(135deg,#0E8F6A,#2563EB)",
                          boxShadow: "0 2px 8px rgba(14,143,106,0.25)",
                        }}>G</div>
                      </div>

                      {/* Score radial */}
                      <div className="ch-phone-widget relative flex items-center justify-center mb-5" style={{ width: 176, height: 176, margin: "0 auto 20px" }}>
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(14,143,106,0.1)" strokeWidth="12" />
                          <circle className="ch-progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#0E8F6A" strokeWidth="12" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="ch-counter-val text-4xl font-extrabold tracking-tighter" style={{ color: "#0F1F19" }}>0</span>
                          <span className="uppercase tracking-[0.1em] font-bold mt-0.5" style={{ fontSize: 8, color: "rgba(14,143,106,0.6)" }}>Score 50/30/20</span>
                        </div>
                      </div>

                      {/* Metric cards */}
                      <div className="ch-phone-widget grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: "Saldo livre", value: formatCurrency(1847), color: "#0E8F6A" },
                          { label: "Gasto no mês", value: formatCurrency(4250), color: "#C4820A" },
                        ].map((m) => (
                          <div key={m.label} className="ch-widget-depth rounded-xl p-3">
                            <div style={{ fontSize: 10, color: "#6B8078", marginBottom: 4 }}>{m.label}</div>
                            <div className="font-bold" style={{ fontFamily: "monospace", fontSize: 13, color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Area chart mini */}
                      <div className="ch-phone-widget ch-widget-depth rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: 10, color: "#6B8078", textTransform: "uppercase", letterSpacing: "0.08em" }}>Evolução</span>
                          <div className="flex items-center gap-1">
                            <IconTrendingUp size={10} color="#0E8F6A" />
                            <span style={{ fontSize: 10, color: "#0E8F6A" }}>+12%</span>
                          </div>
                        </div>
                        <div style={{ height: 48 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 2, right: 2, bottom: 0, left: -30 }}>
                              <defs>
                                <linearGradient id="chGradPhone" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0E8F6A" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#0E8F6A" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="mes" tick={{ fontSize: 6, fill: "#6B8078" }} axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <Area type="monotone" dataKey="saldo" stroke="#0E8F6A" strokeWidth={1.5} fill="url(#chGradPhone)" dot={false} isAnimationActive={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Home indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full" style={{ width: 120, height: 4, background: "rgba(15,31,25,0.12)" }} />
                    </div>
                  </div>
                </div>

                {/* Floating badge — streak */}
                <div className="ch-floating-badge absolute flex items-center gap-3 rounded-2xl p-4 z-30" style={{ top: 24, left: -60 }}>
                  <div className="rounded-full flex items-center justify-center" style={{
                    width: 40, height: 40,
                    background: "linear-gradient(135deg, rgba(14,143,106,0.15), rgba(14,143,106,0.05))",
                    border: "1px solid rgba(14,143,106,0.2)",
                  }}>
                    <span style={{ fontSize: 18 }} aria-hidden="true">📈</span>
                  </div>
                  <div>
                    <p className="font-bold tracking-tight" style={{ fontSize: 13, color: "#0F1F19" }}>Score 82/100</p>
                    <p style={{ fontSize: 11, color: "#0E8F6A" }}>Ótima distribuição</p>
                  </div>
                </div>

                {/* Floating badge — saldo */}
                <div className="ch-floating-badge absolute flex items-center gap-3 rounded-2xl p-4 z-30" style={{ bottom: 60, right: -60 }}>
                  <div className="rounded-full flex items-center justify-center" style={{
                    width: 40, height: 40,
                    background: "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))",
                    border: "1px solid rgba(37,99,235,0.18)",
                  }}>
                    <span style={{ fontSize: 18 }} aria-hidden="true">💰</span>
                  </div>
                  <div>
                    <p className="font-bold tracking-tight" style={{ fontSize: 13, color: "#0F1F19" }}>Saldo livre</p>
                    <p style={{ fontSize: 11, color: "#2563EB" }}>{formatCurrency(1847)}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. BOTTOM mobile / LEFT desktop — descrição */}
            <div className="ch-card-left-text ch-gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full px-4 lg:px-0">
              <div className="inline-flex items-center gap-2 mb-4 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#0E8F6A" }} />
                <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "#0E8F6A" }}>Método 50/30/20</span>
              </div>
              <h3 className="font-bold mb-3 tracking-tight" style={{ fontSize: "clamp(22px,2.5vw,36px)", color: "#0F1F19" }}>
                Controle total das suas finanças.
              </h3>
              <p className="hidden md:block font-normal leading-relaxed" style={{ fontSize: "clamp(13px,1.2vw,17px)", color: "#6B8078", maxWidth: 340 }}>
                <span className="font-semibold" style={{ color: "#0F1F19" }}>FinDash</span> transforma lançamentos em clareza financeira com score em tempo real, regra 50/30/20 automática e fundos com CDI atualizado.
              </p>
              {/* mini badges */}
              <div className="hidden md:flex flex-wrap gap-2 mt-5">
                {["Score 50/30/20", "CDI automático", "Histórico mensal", "Exportação PDF"].map((tag) => (
                  <span key={tag} className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{
                    background: "rgba(14,143,106,0.07)",
                    border: "1px solid rgba(14,143,106,0.18)",
                    color: "#0E8F6A",
                  }}>{tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
