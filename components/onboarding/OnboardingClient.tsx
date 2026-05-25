"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { gsap } from "gsap"
import { IconArrowRight, IconCheck, IconChartPie, IconPigMoney, IconWallet } from "@tabler/icons-react"
import { saveOnboardingSalario, saveOnboardingFundo, completeOnboarding } from "@/app/(app)/onboarding/actions"

const FUNDO_CORES = [
  { cor: "#1D9E75", label: "Verde" },
  { cor: "#378ADD", label: "Azul" },
  { cor: "#BA7517", label: "Âmbar" },
  { cor: "#E24B4A", label: "Vermelho" },
  { cor: "#9B6DFF", label: "Roxo" },
]

const STEPS = [
  { icon: <IconWallet size={20} />,    title: "Qual é sua renda mensal?" },
  { icon: <IconPigMoney size={20} />,  title: "Crie seu primeiro fundo" },
  { icon: <IconChartPie size={20} />,  title: "Tudo pronto!" },
]

interface Props {
  primeiroNome: string
}

export function OnboardingClient({ primeiroNome }: Props) {
  const [step, setStep]           = useState(0)
  const [salario, setSalario]     = useState("")
  const [rendaExtra, setRendaExtra] = useState("")
  const [fundoNome, setFundoNome] = useState("")
  const [fundoMeta, setFundoMeta] = useState("")
  const [fundoCor, setFundoCor]   = useState(FUNDO_CORES[0].cor)
  const [skipFundo, setSkipFundo] = useState(false)
  const [isPending, startTransition] = useTransition()

  const cardRef  = useRef<HTMLDivElement>(null)
  const hasAnimRef = useRef(false)

  // Entrada inicial
  useEffect(() => {
    if (!cardRef.current || hasAnimRef.current) return
    hasAnimRef.current = true
    gsap.fromTo(cardRef.current, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" })
  }, [])

  function animateStep(next: number) {
    if (!cardRef.current) { setStep(next); return }
    gsap.to(cardRef.current, {
      y: -16, opacity: 0, duration: 0.22, ease: "power2.in",
      onComplete: () => {
        setStep(next)
        gsap.fromTo(cardRef.current!, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" })
      },
    })
  }

  async function handleStep0() {
    const sal = parseFloat(salario.replace(",", ".")) || 0
    const extra = parseFloat(rendaExtra.replace(",", ".")) || 0
    startTransition(async () => {
      await saveOnboardingSalario(sal, extra)
      animateStep(1)
    })
  }

  async function handleStep1() {
    if (!skipFundo && fundoNome && fundoMeta) {
      const meta = parseFloat(fundoMeta.replace(",", ".")) || 0
      startTransition(async () => {
        await saveOnboardingFundo(fundoNome, meta, fundoCor)
        animateStep(2)
      })
    } else {
      animateStep(2)
    }
  }

  function handleComplete() {
    startTransition(async () => {
      await completeOnboarding()
    })
  }

  const salarioNum   = parseFloat(salario.replace(",", ".")) || 0
  const nec50        = salarioNum * 0.5
  const obj30        = salarioNum * 0.3
  const qual20       = salarioNum * 0.2
  const fmt          = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
      {/* Ambient */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(29,158,117,0.10),transparent)]" />
      </div>

      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="text-2xl font-black tracking-tight">
          <span className="font-mono text-primary">Fin</span>
          <span className="text-foreground">Dash</span>
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center size-8 rounded-full text-xs font-bold transition-all duration-300"
              style={{
                backgroundColor: i < step ? "var(--fd-green)" : i === step ? "var(--primary)" : "var(--card)",
                border: `1px solid ${i <= step ? "transparent" : "var(--border)"}`,
                color: i <= step ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {i < step ? <IconCheck size={14} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-10 h-px transition-colors duration-500"
                style={{ backgroundColor: i < step ? "var(--fd-green)" : "var(--border)" }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 space-y-7"
        style={{ opacity: 0 }}
      >
        {/* Step header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
            {STEPS[step].icon}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Passo {step + 1} de {STEPS.length}
            </p>
            <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
          </div>
        </div>

        {/* Step 0 — Salário */}
        {step === 0 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Olá, <span className="text-foreground font-semibold">{primeiroNome}</span>. Informe sua renda para que o FinDash calcule os limites da regra 50/30/20.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Salário principal (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ex: 3500"
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Renda extra (opcional, R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ex: 500"
                  value={rendaExtra}
                  onChange={(e) => setRendaExtra(e.target.value)}
                  className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono"
                />
              </div>
            </div>

            {/* Preview 50/30/20 */}
            {salarioNum > 0 && (
              <div className="rounded-xl border border-border/50 bg-background/30 p-4 space-y-2.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                  Sua distribuição 50/30/20
                </p>
                {[
                  { label: "Necessidades (50%)", val: nec50, color: "var(--fd-green)" },
                  { label: "Objetivos (30%)",    val: obj30, color: "var(--fd-blue)" },
                  { label: "Qualidade (20%)",    val: qual20, color: "var(--fd-amber)" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-semibold" style={{ color: row.color }}>{fmt(row.val)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStep0}
              disabled={!salario || isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Continuar"}
              {!isPending && <IconArrowRight size={15} />}
            </button>
          </div>
        )}

        {/* Step 1 — Fundo */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Fundos são metas financeiras com progresso visual. Crie o seu primeiro agora ou pule para depois.
            </p>

            {!skipFundo && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Nome do fundo
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Reserva de emergência"
                    value={fundoNome}
                    onChange={(e) => setFundoNome(e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Meta (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="ex: 5000"
                    value={fundoMeta}
                    onChange={(e) => setFundoMeta(e.target.value)}
                    className="w-full rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Cor
                  </label>
                  <div className="flex gap-2">
                    {FUNDO_CORES.map((c) => (
                      <button
                        key={c.cor}
                        onClick={() => setFundoCor(c.cor)}
                        title={c.label}
                        className="size-8 rounded-full transition-all duration-150 hover:scale-110"
                        style={{
                          backgroundColor: c.cor,
                          boxShadow: fundoCor === c.cor ? `0 0 0 2px var(--background), 0 0 0 4px ${c.cor}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleStep1}
                disabled={(!skipFundo && (!fundoNome || !fundoMeta)) || isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
              >
                {isPending ? "Salvando..." : skipFundo ? "Continuar" : "Criar fundo"}
                {!isPending && <IconArrowRight size={15} />}
              </button>
              <button
                onClick={() => setSkipFundo((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
              >
                {skipFundo ? "Voltar e criar um fundo" : "Pular por agora"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Conclusão */}
        {step === 2 && (
          <div className="space-y-6 text-center">
            <div className="size-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
              <IconCheck size={32} className="text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Configuração completa!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seu FinDash está pronto. Você já pode adicionar gastos, acompanhar seus fundos e manter a regra 50/30/20 em dia.
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/30 p-4 text-left space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Próximos passos</p>
              {[
                "Adicione seus gastos do mês em Gastos",
                "Acompanhe seus fundos em Fundos",
                "Use a Calculadora para planejar sua renda extra",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="size-4 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-px">
                    {i + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
            >
              {isPending ? "Entrando..." : "Ir para o dashboard"}
              {!isPending && <IconArrowRight size={15} />}
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground/50">
        Você pode ajustar tudo isso depois em Configurações.
      </p>
    </div>
  )
}
