"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { IconUserPlus, IconSettings, IconTrendingUp } from "@tabler/icons-react"

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    number: "01",
    icon: <IconUserPlus size={22} strokeWidth={1.5} />,
    title: "Cadastre-se",
    desc: "Crie sua conta em menos de 1 minuto. Sem cartão de crédito, sem burocracia.",
    color: "#1D9E75",
  },
  {
    number: "02",
    icon: <IconSettings size={22} strokeWidth={1.5} />,
    title: "Configure seu salário",
    desc: "Informe sua renda e o FinDash calcula automaticamente os limites de cada categoria.",
    color: "#378ADD",
  },
  {
    number: "03",
    icon: <IconTrendingUp size={22} strokeWidth={1.5} />,
    title: "Acompanhe seu progresso",
    desc: "Visualize seus gastos em tempo real, gerencie fundos e veja sua evolução mês a mês.",
    color: "#BA7517",
  },
]

export default function LandingHowItWorks() {
  const labelRef     = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<HTMLDivElement>(null)
  const stepsRef     = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const label     = labelRef.current
    const connector = connectorRef.current
    const steps     = stepsRef.current.filter(Boolean)
    if (!label || steps.length === 0) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        label,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: label, start: "top 88%" },
        }
      )

      if (connector) {
        gsap.fromTo(
          connector,
          { scaleX: 0 },
          {
            scaleX: 1, transformOrigin: "left center", duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: steps[0], start: "top 88%" },
          }
        )
      }

      gsap.fromTo(
        steps,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.65, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: steps[0], start: "top 88%" },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section className="max-w-5xl mx-auto px-4 py-20">
      {/* Header */}
      <div ref={labelRef} className="text-center mb-16">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
          <span className="font-mono font-bold">3</span> passos simples
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Como funciona
        </h2>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connector line — desktop only */}
        <div
          ref={connectorRef}
          className="absolute top-[2.75rem] left-[calc(16.666%+1.5rem)] right-[calc(16.666%+1.5rem)] h-px hidden sm:block pointer-events-none"
          aria-hidden
          style={{ background: "linear-gradient(to right, #1D9E7540, #378ADD40, #BA751740)" }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => { if (el) stepsRef.current[i] = el }}
              className="flex flex-col items-center text-center gap-5"
            >
              <div className="relative">
                <span
                  className="absolute -top-3 -left-4 font-mono font-black text-6xl leading-none select-none pointer-events-none"
                  aria-hidden
                  style={{ color: `${step.color}10` }}
                >
                  {step.number}
                </span>
                <div
                  className="relative z-10 size-14 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${step.color}18`,
                    boxShadow: `0 0 0 1px ${step.color}25, 0 4px 16px ${step.color}15`,
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>
                <span
                  className="absolute -top-1.5 -right-1.5 z-20 size-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-white"
                  style={{ backgroundColor: step.color }}
                >
                  {i + 1}
                </span>
              </div>

              <div className="space-y-2 max-w-[220px]">
                <h3 className="font-bold text-foreground text-lg leading-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
