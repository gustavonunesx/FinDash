"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const TESTIMONIALS = [
  {
    name: "Ana Beatriz",
    role: "Designer freelancer",
    initials: "AB",
    color: "#1D9E75",
    text: "Finalmente entendi para onde ia meu dinheiro. A regra 50/30/20 mudou minha relação com finanças.",
  },
  {
    name: "Rafael Souza",
    role: "Desenvolvedor back-end",
    initials: "RS",
    color: "#378ADD",
    text: "Em 3 meses de uso já tinha minha reserva de emergência completa. O acompanhamento dos fundos é essencial.",
  },
  {
    name: "Camila Torres",
    role: "Professora",
    initials: "CT",
    color: "#BA7517",
    text: "Uso desde o lançamento. O histórico mensal com gráficos é o que mais me ajuda a manter o foco.",
  },
]

export default function LandingTestimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)
  const cardsRef   = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const header = headerRef.current
    const cards  = cardsRef.current.filter(Boolean)
    if (!header || cards.length === 0) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: header, start: "top 88%" },
        }
      )

      gsap.fromTo(
        cards,
        { y: 44, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: cards[0], start: "top 88%" },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="max-w-5xl mx-auto px-4 py-20">
      {/* Header */}
      <div ref={headerRef} className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
          Quem já usa o FinDash
        </h2>
        <p className="text-muted-foreground">
          Pessoas reais, resultados reais.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={t.name}
            ref={(el) => { if (el) cardsRef.current[i] = el }}
            className="group relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-7 space-y-5 transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-xl hover:shadow-black/20"
          >
            {/* Quote mark decorativo */}
            <span
              className="absolute top-5 right-6 font-serif text-5xl leading-none select-none pointer-events-none"
              aria-hidden
              style={{ color: `${t.color}15` }}
            >
              &ldquo;
            </span>

            {/* Texto */}
            <p className="relative text-sm text-muted-foreground leading-relaxed">
              {t.text}
            </p>

            {/* Autor */}
            <div className="flex items-center gap-3 pt-1">
              <div
                className="size-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                style={{ backgroundColor: t.color }}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>

            {/* Bottom accent */}
            <div
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
              style={{ backgroundColor: t.color }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
