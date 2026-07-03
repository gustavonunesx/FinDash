"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CardNav } from "@/components/marketing/CardNav";
import { CinematicHero } from "@/components/marketing/CinematicHero";
import { faqItems } from "@/lib/site-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  IconCheck,
  IconSparkles,
  IconArrowRight,
  IconChartBar,
  IconAdjustments,
  IconShieldCheck,
  IconDeviceDesktopAnalytics,
  IconLayersLinked,
  IconRefresh,
} from "@tabler/icons-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── paleta / dados ─────────────────────────────────────────────────────────────
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
const howSteps = [
  {
    num: "01",
    title: "Clareza imediata",
    desc: "Dashboard visual com score e métricas em 10 segundos.",
    color: "#0E8F6A",
  },
  {
    num: "02",
    title: "Método 50/30/20",
    desc: "Calculadora automática que guia cada decisão financeira.",
    color: "#2563EB",
  },
  {
    num: "03",
    title: "Construção de patrimônio",
    desc: "Fundos com rendimento CDI em tempo real via BCB.",
    color: "#7C3AED",
  },
];
const pricingBenefits = [
  { icon: IconChartBar,            color: "#0E8F6A", label: "Visão em tempo real",   desc: "Métricas e score atualizados a cada lançamento."            },
  { icon: IconAdjustments,         color: "#2563EB", label: "Controle total",         desc: "Personalize categorias, metas e limites por objetivo."       },
  { icon: IconShieldCheck,         color: "#7C3AED", label: "Sem surpresas",          desc: "Sem letras miúdas. Cancele quando quiser."                   },
  { icon: IconDeviceDesktopAnalytics, color: "#0E8F6A", label: "Relatórios claros",  desc: "Gráficos mensais que mostram evolução real do patrimônio."   },
  { icon: IconLayersLinked,        color: "#2563EB", label: "Multi-objetivos",        desc: "Crie fundos separados para cada meta financeira."             },
  { icon: IconRefresh,             color: "#7C3AED", label: "CDI automático",         desc: "Rendimento dos fundos calculado via API do BCB."             },
];

// ── estilos injetados compartilhados ──────────────────────────────────────────
const PAGE_STYLES = `
  .lp-section { background: #F7F8F7; }

  .lp-film-grain {
    position: fixed; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999; opacity: 0.018; mix-blend-mode: multiply;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
  }

  .lp-reveal        { opacity: 0; transform: translateY(40px); }
  .lp-reveal-left   { opacity: 0; transform: translateX(-40px); }
  .lp-reveal-right  { opacity: 0; transform: translateX(40px); }
  .lp-reveal-scale  { opacity: 0; transform: scale(0.88); }

  .lp-card {
    background: #FFFFFF;
    border: 1px solid #DDE8E4;
    box-shadow:
      0 1px 3px rgba(14,143,106,0.06),
      0 20px 60px rgba(0,0,0,0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .lp-card:hover {
    transform: translateY(-4px);
    border-color: #b8d4cc;
    box-shadow: 0 1px 3px rgba(14,143,106,0.08), 0 30px 80px rgba(0,0,0,0.09);
  }

  .lp-card-premium {
    background: linear-gradient(145deg, #f0faf6 0%, #FFFFFF 100%);
    border: 1px solid rgba(14,143,106,0.28);
    box-shadow:
      0 0 0 1px rgba(14,143,106,0.06),
      0 0 40px rgba(14,143,106,0.05),
      0 20px 60px rgba(0,0,0,0.07);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .lp-card-premium:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 0 1px rgba(14,143,106,0.15), 0 0 60px rgba(14,143,106,0.08), 0 30px 80px rgba(0,0,0,0.09);
  }

  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: linear-gradient(180deg, #12a87d 0%, #0E8F6A 100%);
    color: #fff; font-weight: 700; border-radius: 14px; padding: 14px 32px;
    box-shadow: 0 0 0 1px rgba(14,143,106,0.2), 0 4px 12px rgba(14,143,106,0.2), 0 16px 32px -4px rgba(14,143,106,0.15), inset 0 1px 1px rgba(255,255,255,0.25);
    transition: all 0.35s cubic-bezier(0.25,1,0.5,1);
    position: relative; overflow: hidden;
  }
  .lp-btn-primary:hover  { transform: translateY(-3px); box-shadow: 0 0 0 1px rgba(14,143,106,0.3), 0 8px 20px rgba(14,143,106,0.25), 0 24px 48px -4px rgba(14,143,106,0.2), inset 0 1px 1px rgba(255,255,255,0.3); }
  .lp-btn-primary:active { transform: translateY(1px); }

  .lp-btn-secondary {
    display: inline-flex; align-items: center; gap: 10px;
    background: #FFFFFF; color: #0F1F19;
    font-weight: 600; border-radius: 14px; padding: 14px 32px;
    border: 1px solid #DDE8E4;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    transition: all 0.35s cubic-bezier(0.25,1,0.5,1);
  }
  .lp-btn-secondary:hover  { transform: translateY(-3px); background: #F7F8F7; border-color: #b8d4cc; color: #0F1F19; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .lp-btn-secondary:active { transform: translateY(1px); }

  .lp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #DDE8E4 40%, #DDE8E4 60%, transparent);
  }

  .lp-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 999px; padding: 5px 14px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    border: 1px solid rgba(14,143,106,0.2);
    background: rgba(14,143,106,0.07);
    color: #0E8F6A;
  }

  .lp-text-gradient {
    background: linear-gradient(180deg, #0F1F19 0%, rgba(15,31,25,0.55) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; transform: translateZ(0);
  }
  .lp-text-green {
    background: linear-gradient(135deg, #0E8F6A 0%, #2563EB 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; transform: translateZ(0);
  }

  .lp-number-step {
    font-family: monospace; font-weight: 900; font-size: clamp(48px, 6vw, 80px);
    line-height: 1;
    -webkit-text-fill-color: transparent; background-clip: text; -webkit-background-clip: text;
  }

.lp-shimmer {
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: lp-shimmer-run 2.5s ease-in-out infinite;
  }
  @keyframes lp-shimmer-run {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }

  .lp-pulse-dot {
    animation: lp-pulse 2s ease-in-out infinite;
  }
  @keyframes lp-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
`;

// ── hook: registra ScrollTrigger reveal em um container ───────────────────────
function useGsapReveal(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".lp-reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".lp-reveal-left").forEach((el) => {
        gsap.to(el, {
          opacity: 1, x: 0, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".lp-reveal-right").forEach((el) => {
        gsap.to(el, {
          opacity: 1, x: 0, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".lp-reveal-scale").forEach((el) => {
        gsap.to(el, {
          opacity: 1, scale: 1, duration: 0.9, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>(".lp-stagger-group").forEach((group) => {
        const children = group.querySelectorAll<HTMLElement>(".lp-stagger-child");
        gsap.to(children, {
          opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.1,
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [containerRef]);
}

// ── seção Como Funciona ───────────────────────────────────────────────────────
function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref);

  return (
    <section ref={ref} className="lp-section relative py-20 overflow-hidden">
      <div className="lp-divider absolute inset-x-0 top-0" />

      {/* glow único, assinatura da seção */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 45% at 15% 30%, rgba(14,143,106,0.055), transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">

        {/* header assimétrico: alinhado à esquerda, não centralizado */}
        <div className="mb-14 max-w-xl lp-reveal">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight lp-text-gradient" style={{ lineHeight: 1.15 }}>
            Três passos para clareza financeira.
          </h2>
        </div>

        {/* steps: coluna 1 destacada (2fr), 2-3 menores — quebra grid 3-iguais */}
        <div className="lp-stagger-group grid gap-5 md:grid-cols-[1.3fr_1fr_1fr]">
          {howSteps.map((s, i) => (
            <div
              key={s.num}
              className="lp-stagger-child lp-card rounded-2xl flex flex-col gap-5"
              style={{
                opacity: 0,
                transform: "translateY(40px)",
                padding: i === 0 ? "2.5rem 2rem" : "2rem",
                marginTop: i === 1 ? "1.5rem" : i === 2 ? "3rem" : 0,
              }}
            >
              <span
                className="lp-number-step"
                style={{
                  fontSize: i === 0 ? "clamp(56px, 7vw, 96px)" : "clamp(40px, 5vw, 64px)",
                  background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}40 100%)`,
                }}
              >
                {s.num}
              </span>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${s.color}40, transparent)` }} />
              </div>

              <div>
                <h3 className={i === 0 ? "text-xl font-bold mb-2" : "text-lg font-bold mb-2"} style={{ color: "#0F1F19" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B8078" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── seção Pricing ─────────────────────────────────────────────────────────────
function PricingSection() {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref);

  return (
    <section ref={ref} className="lp-section relative py-36 overflow-hidden">
      <div className="lp-divider absolute inset-x-0 top-0" />

      {/* glow único */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(14,143,106,0.05), transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-6">

        {/* header */}
        <div className="mb-16 text-center lp-reveal">
          <div className="lp-badge mb-6">
            <IconSparkles size={11} />
            Planos simples
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 lp-text-gradient" style={{ lineHeight: 1.15 }}>
            Comece grátis.{" "}
            <span className="lp-text-green">Evolua quando quiser.</span>
          </h2>
          <p className="text-sm" style={{ color: "#6B8078" }}>Sem surpresas, sem letras miúdas.</p>
        </div>

        {/* benefits grid */}
        <div className="lp-stagger-group mb-16 grid grid-cols-2 md:grid-cols-3 gap-3">
          {pricingBenefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="lp-stagger-child lp-card rounded-xl p-4 sm:p-5 group relative overflow-hidden"
                style={{ opacity: 0, transform: "translateY(40px)" }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(160px circle at 30% 40%, ${b.color}12, transparent)` }}
                />
                <div
                  className="mb-3 inline-flex size-9 items-center justify-center rounded-lg"
                  style={{ background: `${b.color}14`, border: `1px solid ${b.color}20` }}
                >
                  <Icon size={16} style={{ color: b.color }} />
                </div>
                <p className="text-sm font-semibold leading-tight mb-1" style={{ color: "#0F1F19" }}>{b.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6B8078" }}>{b.desc}</p>
              </div>
            );
          })}
        </div>

        {/* divisor */}
        <div className="mb-14 flex items-center gap-4 lp-reveal">
          <div className="h-px flex-1" style={{ background: "#DDE8E4" }} />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#6B8078" }}>
            escolha seu plano
          </span>
          <div className="h-px flex-1" style={{ background: "#DDE8E4" }} />
        </div>

        {/* plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

          {/* Free */}
          <div className="lp-card rounded-2xl p-7 flex flex-col gap-6 lp-reveal-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#6B8078" }}>
                Gratuito
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="font-mono text-4xl font-bold tracking-tighter leading-none" style={{ color: "#4A5E58" }}>R$0</span>
              </div>
              <p className="text-xs" style={{ color: "#6B8078" }}>para sempre, sem cartão</p>
            </div>

            <div className="lp-divider" />

            <ul className="flex-1 space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#4A5E58" }}>
                  <div className="mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(14,143,106,0.1)" }}>
                    <IconCheck size={9} color="#0E8F6A" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro"
              className="lp-btn-secondary text-sm justify-center"
            >
              Criar conta grátis
            </Link>
          </div>

          {/* Premium */}
          <div className="relative mt-6 sm:mt-0 lp-reveal-right">
            {/* badge recomendado */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <span className="relative overflow-hidden inline-flex items-center gap-1.5 text-white text-[11px] font-bold px-5 py-1.5 rounded-full whitespace-nowrap tracking-wide" style={{ background: "linear-gradient(135deg, #0E8F6A, #2563EB)", boxShadow: "0 4px 16px rgba(14,143,106,0.3)" }}>
                <IconSparkles size={10} />
                Recomendado
                <span className="lp-shimmer" />
              </span>
            </div>

            <div className="lp-card-premium rounded-2xl pt-10 px-7 pb-7 flex flex-col gap-6 h-full relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(14,143,106,0.06), transparent)" }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#0E8F6A" }}>Premium</p>
                  <span className="text-[10px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: "rgba(14,143,106,0.08)", border: "1px solid rgba(14,143,106,0.2)", color: "#0E8F6A" }}>
                    14 dias grátis
                  </span>
                </div>
                <div className="flex items-end gap-1.5 mb-1">
                  <span
                    className="font-mono text-6xl font-black tracking-tighter leading-none lp-text-green"
                  >
                    R$19
                  </span>
                  <span className="mb-1.5 text-sm font-normal" style={{ color: "#6B8078" }}>/mês</span>
                </div>
                <p className="text-xs" style={{ color: "#6B8078" }}>ou R$149/ano, 2 meses grátis</p>
              </div>

              <div className="relative h-px">
                <div className="absolute inset-0" style={{ background: "#DDE8E4" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(14,143,106,0.35), transparent)" }} />
              </div>

              <ul className="flex-1 space-y-3">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#0F1F19" }}>
                    <div className="mt-0.5 size-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(14,143,106,0.15)" }}>
                      <IconCheck size={9} color="#0E8F6A" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/precos" className="lp-btn-primary justify-center relative overflow-hidden text-sm">
                <span className="lp-shimmer" />
                <span className="relative z-10">Testar 14 dias grátis</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── seção FAQ ─────────────────────────────────────────────────────────────────
function FaqSectionCinematic() {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref);

  return (
    <section ref={ref} className="lp-section relative py-24 overflow-hidden">
      <div className="lp-divider absolute inset-x-0 top-0" />

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr]">

          {/* coluna esquerda: título + copy, sticky */}
          <div className="lp-reveal-left md:sticky md:top-28 md:self-start">
            <h2 className="text-4xl font-bold tracking-tight lp-text-gradient mb-4" style={{ lineHeight: 1.15 }}>
              Perguntas frequentes.
            </h2>
            <p className="text-base" style={{ color: "#6B8078" }}>
              Não encontrou sua dúvida? Entre em contato com nosso suporte.
            </p>
          </div>

          {/* coluna direita: accordion */}
          <Accordion
            type="single"
            collapsible
            defaultValue="faq-0"
            className="lp-stagger-group w-full"
          >
            {faqItems.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="lp-stagger-child mb-3 rounded-2xl overflow-hidden bg-white border border-[#DDE8E4] data-[state=open]:border-[rgba(14,143,106,0.3)] data-[state=open]:shadow-[0_0_0_3px_rgba(14,143,106,0.06)] hover:border-[#b8d4cc] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow] duration-300"
                style={{ opacity: 0, transform: "translateY(40px)" }}
              >
                <AccordionTrigger
                  className="px-5 py-4 text-left hover:no-underline hover:opacity-80 transition-opacity duration-200 data-[state=open]:border-b data-[state=open]:border-[#DDE8E4]"
                  style={{ color: "#0F1F19" }}
                >
                  <span className="font-semibold text-sm sm:text-base pr-4">{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <p className="text-sm leading-relaxed pt-1" style={{ color: "#4A5E58" }}>
                    {item.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ── seção Final CTA ───────────────────────────────────────────────────────────
function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref);

  return (
    <section ref={ref} className="lp-section relative py-28 overflow-hidden text-center">
      <div className="lp-divider absolute inset-x-0 top-0" />

      {/* glow único, mais concentrado (seção de maior intenção) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 40%, rgba(14,143,106,0.08), transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-lg px-6">
        <div className="lp-reveal">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 lp-text-gradient" style={{ lineHeight: 1.1 }}>
            Pronto para organizar<br />
            <span className="lp-text-green">suas finanças?</span>
          </h2>
          <p className="text-lg mb-8" style={{ color: "#6B8078" }}>
            Crie sua conta em menos de 1 minuto. Sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/cadastro" className="lp-btn-primary text-base">
              Criar conta grátis
              <IconArrowRight size={18} />
            </Link>
            <Link href="/precos" className="lp-btn-secondary text-base">
              Ver planos
            </Link>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ border: "1px solid #DDE8E4", background: "#FFFFFF" }}>
            <span className="size-1.5 rounded-full lp-pulse-dot" style={{ background: "#0E8F6A" }} />
            <span className="font-mono text-xs" style={{ color: "#6B8078" }}>
              <span className="font-semibold" style={{ color: "#0F1F19" }}>1.200+</span> usuários organizando finanças
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const ref = useRef<HTMLElement>(null);
  useGsapReveal(ref);

  return (
    <footer ref={ref} className="lp-section relative overflow-hidden">
      <div className="lp-divider absolute inset-x-0 top-0" />

      {/* watermark */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-end overflow-hidden" aria-hidden>
        <span className="absolute bottom-[-0.1em] left-[-0.05em] font-mono font-black leading-none tracking-tighter whitespace-nowrap" style={{ fontSize: "20vw", color: "rgba(14,143,106,0.05)" }}>
          50/30/20
        </span>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-10">
        <div className="lp-reveal grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-10 sm:gap-16 mb-14">

          <div className="space-y-4">
            <div>
              <span className="text-2xl font-black tracking-tight">
                <span className="font-mono lp-text-green">Fin</span>
                <span style={{ color: "#0F1F19" }}>Dash</span>
              </span>
              <p className="mt-2 text-sm leading-relaxed max-w-[220px]" style={{ color: "#6B8078" }}>
                Organize seu dinheiro com inteligência. Regra 50/30/20 aplicada à vida real.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: "1px solid #DDE8E4", background: "#FFFFFF" }}>
              <span className="size-1.5 rounded-full lp-pulse-dot" style={{ background: "#0E8F6A" }} />
              <span className="font-mono text-xs" style={{ color: "#6B8078" }}>
                <span className="font-semibold" style={{ color: "#0F1F19" }}>1.200+</span> usuários organizando finanças
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#6B8078" }}>Produto</p>
            <ul className="space-y-3">
              {[
                { label: "Dashboard",    href: "/dashboard" },
                { label: "Preços",       href: "/precos" },
                { label: "Calculadoras", href: "/calculadora" },
                { label: "Histórico",    href: "/historico" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm transition-colors duration-200 inline-block" style={{ color: "#6B8078" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#6B8078" }}>Conta</p>
            <ul className="space-y-3">
              {[
                { label: "Entrar",        href: "/login" },
                { label: "Criar conta",   href: "/cadastro" },
                { label: "Configurações", href: "/configuracoes" },
                { label: "Plano Premium", href: "/precos" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm transition-colors duration-200 inline-block" style={{ color: "#6B8078" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="lp-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: "#6B8078" }}>
          <p>© {new Date().getFullYear()} FinDash. Todos os direitos reservados.</p>
          <p className="font-mono tracking-tight">
            built for <span style={{ color: "#0E8F6A" }}>financial clarity</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── LandingPage ───────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div style={{ background: "#F7F8F7" }}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      {/* grain global — fixo em toda a página */}
      <div className="lp-film-grain" aria-hidden="true" />

      {/* Nav fixo */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <CardNav
          items={[
            {
              label: "Produto",
              bgColor: "#ffffff",
              textColor: "#0F1F19",
              links: [
                { label: "Dashboard",   href: "/dashboard",   ariaLabel: "Ver Dashboard" },
                { label: "Gastos",      href: "/gastos",      ariaLabel: "Gerenciar gastos" },
                { label: "Fundos",      href: "/fundos",      ariaLabel: "Gerenciar fundos" },
                { label: "Calculadora", href: "/calculadora", ariaLabel: "Calculadora 50/30/20" },
              ],
            },
            {
              label: "Planos",
              bgColor: "#f0faf6",
              textColor: "#0F1F19",
              links: [
                { label: "Gratuito", href: "/precos",  ariaLabel: "Plano gratuito" },
                { label: "Premium",  href: "/precos",  ariaLabel: "Plano premium" },
                { label: "Família",  href: "/familia", ariaLabel: "Plano família" },
              ],
            },
            {
              label: "Conta",
              bgColor: "#ffffff",
              textColor: "#0F1F19",
              links: [
                { label: "Entrar",        href: "/login",          ariaLabel: "Fazer login" },
                { label: "Criar conta",   href: "/cadastro",       ariaLabel: "Criar conta grátis" },
                { label: "Configurações", href: "/configuracoes",  ariaLabel: "Configurações" },
              ],
            },
          ]}
          buttonLabel="Começar grátis"
          buttonHref="/cadastro"
          buttonBgColor="#0E8F6A"
          buttonTextColor="#ffffff"
          menuColor="#0F1F19"
        />
      </div>

      {/* Hero cinemático */}
      <CinematicHero />

      {/* Resto da página — mesmo universo visual escuro */}
      <HowItWorks />
      <PricingSection />
      <FaqSectionCinematic />
      <FinalCta />
      <Footer />
    </div>
  );
}
