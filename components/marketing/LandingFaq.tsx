"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { IconChevronDown } from "@tabler/icons-react"

gsap.registerPlugin(ScrollTrigger)

const FAQS = [
  {
    q: "O plano gratuito tem alguma limitação de tempo?",
    a: "Não. O plano gratuito é para sempre, sem trial, sem surpresas. Você pode usar o FinDash com até 10 gastos e 3 fundos sem pagar nada.",
  },
  {
    q: "Posso cancelar o Premium a qualquer momento?",
    a: "Sim. O cancelamento é imediato pelo portal de assinatura, sem multas. Você mantém acesso Premium até o fim do período já pago.",
  },
  {
    q: "Meus dados financeiros estão seguros?",
    a: "Seus dados ficam armazenados no Supabase com Row Level Security: só você tem acesso. Nenhuma informação bancária é solicitada.",
  },
  {
    q: "O que acontece com meus dados se eu cancelar?",
    a: "Seus gastos e fundos continuam salvos. Você perde acesso ao histórico mensal e exportação PDF, mas pode reativar a qualquer momento.",
  },
  {
    q: "Existe aplicativo móvel?",
    a: "O FinDash é uma web app responsiva que funciona muito bem no celular. Um app nativo está no roadmap.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (open) {
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" })
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in" })
    }
  }, [open])

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {q}
        </span>
        <IconChevronDown
          size={16}
          className="text-muted-foreground shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div ref={bodyRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <p className="text-sm text-muted-foreground leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  )
}

export default function LandingFaq() {
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const header = headerRef.current
    const list   = listRef.current
    if (!header || !list) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header,
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: header, start: "top 88%" },
        }
      )

      gsap.fromTo(
        list,
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, ease: "power2.out",
          scrollTrigger: { trigger: list, start: "top 88%" },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section className="max-w-2xl mx-auto px-4 py-20">
      <div ref={headerRef} className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
          Perguntas frequentes
        </h2>
        <p className="text-muted-foreground">Tudo que você precisa saber antes de começar.</p>
      </div>

      <div ref={listRef} className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm px-7">
        {FAQS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  )
}
