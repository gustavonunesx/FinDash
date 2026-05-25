"use client"

import { useState, useTransition, useMemo, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calcularRendaExtra } from "@/lib/finance"
import { salvarRendaExtra, salvarFase, confirmarAporteRendaExtra } from "@/app/(app)/calculadora/actions"
import { IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { Fase, Fundo } from "@/types"

const CARD_COLOR: Record<string, string> = {
  "Reserva de Emergência": "var(--fd-red)",
  "Reserva extra": "var(--fd-red)",
  "Objetivos": "var(--fd-green)",
  "Qualidade de Vida": "var(--fd-blue)",
  "Investimentos": "var(--fd-amber)",
}

interface Props {
  rendaExtraInicial: number
  faseInicial: Fase
  fundos: Fundo[]
}

export function CalculadoraRendaExtra({ rendaExtraInicial, faseInicial, fundos }: Props) {
  const [extra, setExtra] = useState(String(rendaExtraInicial || ""))
  const [fase, setFase] = useState<Fase>(faseInicial)
  const [activeIndex, setActiveIndex] = useState(0)
  const [fundoReservaId, setFundoReservaId] = useState<string | null>(null)
  const [pesos, setPesos] = useState<Record<string, number>>({})
  const [confirmando, setConfirmando] = useState<Set<string>>(new Set())
  const [confirmados, setConfirmados] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const extraNum = parseFloat(extra.replace(",", ".")) || 0
  const resultado = useMemo(() => calcularRendaExtra(extraNum, fase, fundos), [extraNum, fase, fundos])

  useEffect(() => {
    try {
      const r = localStorage.getItem("findash_fundo_reserva_id")
      if (r) setFundoReservaId(r)
      const p = localStorage.getItem("findash_pesos_renda_extra")
      if (p) setPesos(JSON.parse(p))
    } catch {}
  }, [])

  useEffect(() => {
    setConfirmados(new Set())
  }, [extra, fase])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setActiveIndex(Math.round(el.scrollLeft / el.offsetWidth))
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  function scrollToCard(index: number) {
    scrollRef.current?.scrollTo({ left: index * (scrollRef.current?.offsetWidth ?? 0), behavior: "smooth" })
  }

  function handleExtraBlur() {
    if (extraNum === rendaExtraInicial) return
    startTransition(async () => {
      const res = await salvarRendaExtra(extraNum)
      if (res.error) toast.error("Erro ao salvar renda extra")
    })
  }

  function handleFaseChange(checked: boolean) {
    const novaFase: Fase = checked ? "investindo" : "construindo"
    setFase(novaFase)
    startTransition(async () => {
      const res = await salvarFase(novaFase)
      if (res.error) toast.error("Erro ao salvar fase")
    })
  }

  function handleFundoReservaChange(id: string) {
    setFundoReservaId(id)
    try { localStorage.setItem("findash_fundo_reserva_id", id) } catch {}
  }

  function handlePesoChange(fundoId: string, valor: number) {
    const updated = { ...pesos, [fundoId]: Math.max(0, Math.min(100, valor)) }
    setPesos(updated)
    try { localStorage.setItem("findash_pesos_renda_extra", JSON.stringify(updated)) } catch {}
  }

  async function handleConfirmarAporte(fundoId: string, valor: number) {
    if (confirmando.has(fundoId) || confirmados.has(fundoId)) return
    setConfirmando(prev => new Set([...prev, fundoId]))
    try {
      const res = await confirmarAporteRendaExtra(fundoId, valor)
      if (res.error) {
        toast.error("Erro ao confirmar aporte")
      } else {
        setConfirmados(prev => new Set([...prev, fundoId]))
        toast.success("Aporte confirmado!")
      }
    } catch {
      toast.error("Erro ao confirmar aporte")
    } finally {
      setConfirmando(prev => { const n = new Set(prev); n.delete(fundoId); return n })
    }
  }

  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const fundoReserva = fundos.find(f => f.id === fundoReservaId) ?? null
  const fundosObjetivos = fundos.filter(f => f.id !== fundoReservaId)
  const n = fundosObjetivos.length

  function getPeso(fundoId: string): number {
    return pesos[fundoId] ?? (n > 0 ? Math.round(100 / n) : 0)
  }

  function getValorFundo(fundoId: string, total: number): number {
    const soma = fundosObjetivos.reduce((s, f) => s + getPeso(f.id), 0)
    if (soma === 0) return 0
    return (getPeso(fundoId) / soma) * total
  }

  const totalCards = resultado.blocos.length

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-foreground/10">

      {/* Header + inputs */}
      <div className="p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-foreground text-lg">Calculadora de Renda Extra</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Como distribuir renda adicional conforme sua fase financeira
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-end">
          <div className="space-y-2 max-w-xs w-full sm:w-auto">
            <Label htmlFor="extra" className="text-sm font-medium">Renda extra mensal (R$)</Label>
            <Input
              id="extra"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              min="0"
              step="0.01"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              onBlur={handleExtraBlur}
              className="font-mono text-base"
            />
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/30">
            <span className={`text-sm transition-colors duration-150 ${fase === "construindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Construindo reserva
            </span>
            <Switch checked={fase === "investindo"} onCheckedChange={handleFaseChange} />
            <span className={`text-sm transition-colors duration-150 ${fase === "investindo" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Investindo
            </span>
          </div>
        </div>
      </div>

      {extraNum > 0 ? (
        <>
          {/* Carousel */}
          <div className="relative border-t border-border/50">

            {/* Prev arrow */}
            <button
              onClick={() => scrollToCard(Math.max(activeIndex - 1, 0))}
              disabled={activeIndex === 0}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 size-8 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-20 disabled:cursor-default shadow-sm"
              aria-label="Card anterior"
            >
              <IconChevronLeft size={15} />
            </button>

            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {resultado.blocos.map((bloco) => {
                const color = CARD_COLOR[bloco.label] ?? "var(--fd-green)"
                const isReserva = bloco.label === "Reserva de Emergência" || bloco.label === "Reserva extra"
                const isObjetivos = bloco.label === "Objetivos"
                const isInvestimentos = bloco.label === "Investimentos"
                const hasFundoList = isObjetivos || (isInvestimentos && fase === "investindo")

                return (
                  <div key={bloco.label} className="flex-none w-full snap-start px-5 sm:px-14 py-6">
                    <div className="min-h-64 space-y-5">

                      {/* Card header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-2.5 rounded-full flex-none"
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}70` }}
                          />
                          <span className="text-sm font-medium text-foreground">{bloco.label}</span>
                        </div>
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {bloco.percentual}%
                        </span>
                      </div>

                      {/* Main value */}
                      <div>
                        <p className="font-mono text-3xl font-bold text-foreground tracking-tight leading-none">
                          {fmt(bloco.valor)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-sm">
                          {bloco.descricao}
                        </p>
                      </div>

                      {/* Reserva: fundo selector + saldo comparison */}
                      {isReserva && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              Fundo de destino
                            </p>
                            <Select value={fundoReservaId ?? ""} onValueChange={handleFundoReservaChange}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder={fundos.length === 0 ? "Nenhum fundo criado" : "Selecione o fundo…"} />
                              </SelectTrigger>
                              <SelectContent>
                                {fundos.map(f => (
                                  <SelectItem key={f.id} value={f.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="size-2 rounded-full flex-none" style={{ backgroundColor: f.cor }} />
                                      {f.nome}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {fundoReserva && (
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                              <div className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
                                <span className="text-muted-foreground">Saldo atual</span>
                                <span className="font-mono text-right font-medium text-foreground">
                                  {fmt(fundoReserva.saldo_atual)}
                                </span>
                                <span className="text-muted-foreground">Aporte</span>
                                <span className="font-mono text-right font-medium" style={{ color }}>
                                  + {fmt(bloco.valor)}
                                </span>
                                <span className="text-muted-foreground pt-2 border-t border-border/40">
                                  Novo saldo
                                </span>
                                <span className="font-mono text-right font-bold text-foreground pt-2 border-t border-border/40">
                                  {fmt(fundoReserva.saldo_atual + bloco.valor)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                  <span>
                                    {Math.min(
                                      Math.round(((fundoReserva.saldo_atual + bloco.valor) / fundoReserva.meta) * 100),
                                      100
                                    )}% da meta
                                  </span>
                                  <span>meta: {fmt(fundoReserva.meta)}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(((fundoReserva.saldo_atual + bloco.valor) / fundoReserva.meta) * 100, 100)}%`,
                                      backgroundColor: color,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {!fundoReserva && fundos.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              Crie fundos em{" "}
                              <a href="/fundos" className="text-foreground underline underline-offset-2">Fundos</a>{" "}
                              para visualizar o destino.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Objetivos / Investimentos: peso por fundo + botão confirmar */}
                      {hasFundoList && (
                        <div className="space-y-2.5">
                          {fundosObjetivos.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {fundoReservaId
                                ? "Todos os seus fundos estão como reserva. Crie mais fundos ou mude a seleção acima."
                                : "Nenhum fundo disponível. Crie fundos em Fundos."}
                            </p>
                          ) : (
                            <>
                              {fundosObjetivos.map((fundo) => {
                                const valorFundo = getValorFundo(fundo.id, bloco.valor)
                                const novoSaldo = fundo.saldo_atual + valorFundo
                                const confirmado = confirmados.has(fundo.id)
                                const isConfirmando = confirmando.has(fundo.id)

                                return (
                                  <div
                                    key={fundo.id}
                                    className="rounded-lg border border-border/60 bg-muted/20 p-3.5 space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className="size-2.5 rounded-full flex-none"
                                          style={{ backgroundColor: fundo.cor }}
                                        />
                                        <span className="text-sm font-medium text-foreground truncate">
                                          {fundo.nome}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 flex-none">
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={getPeso(fundo.id)}
                                          onChange={(e) => handlePesoChange(fundo.id, Number(e.target.value))}
                                          className="w-16 h-7 text-xs font-mono text-right px-2 py-0"
                                        />
                                        <span className="text-xs text-muted-foreground">%</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-mono text-muted-foreground">
                                        {fmt(fundo.saldo_atual)}
                                        <span className="mx-1.5 text-border">→</span>
                                        <span className="text-foreground font-medium">{fmt(novoSaldo)}</span>
                                      </span>
                                      <span className="font-mono font-semibold" style={{ color: fundo.cor }}>
                                        + {fmt(valorFundo)}
                                      </span>
                                    </div>

                                    <button
                                      onClick={() => handleConfirmarAporte(fundo.id, valorFundo)}
                                      disabled={confirmado || isConfirmando}
                                      className="w-full h-8 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 border"
                                      style={
                                        confirmado
                                          ? { backgroundColor: `${fundo.cor}22`, color: fundo.cor, borderColor: `${fundo.cor}50` }
                                          : isConfirmando
                                          ? { backgroundColor: `${fundo.cor}10`, color: fundo.cor, borderColor: `${fundo.cor}30`, opacity: 0.7 }
                                          : { backgroundColor: `${fundo.cor}10`, color: fundo.cor, borderColor: `${fundo.cor}25` }
                                      }
                                    >
                                      {confirmado ? (
                                        <><IconCheck size={12} /> Aporte confirmado</>
                                      ) : isConfirmando ? (
                                        "Confirmando…"
                                      ) : (
                                        `Confirmar ${fmt(valorFundo)}`
                                      )}
                                    </button>
                                  </div>
                                )
                              })}

                              {(() => {
                                const soma = fundosObjetivos.reduce((s, f) => s + getPeso(f.id), 0)
                                return (
                                  <p className="text-[11px] text-muted-foreground">
                                    Pesos:{" "}
                                    <span className={soma === 100 ? "text-fd-green" : "text-fd-amber"}>
                                      {soma}%
                                    </span>
                                    {soma !== 100 && " — distribuição proporcional"}
                                  </p>
                                )
                              })()}
                            </>
                          )}
                        </div>
                      )}

                      {/* Qualidade de Vida */}
                      {bloco.label === "Qualidade de Vida" && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Esse valor é para você. Viagens, restaurantes, hobbies — sem culpa.
                          </p>
                        </div>
                      )}

                      {/* Investimentos fase construindo */}
                      {isInvestimentos && fase === "construindo" && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Considere Tesouro Selic, CDB ou fundos de renda fixa como primeiros passos.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Next arrow */}
            <button
              onClick={() => scrollToCard(Math.min(activeIndex + 1, totalCards - 1))}
              disabled={activeIndex === totalCards - 1}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 size-8 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all disabled:opacity-20 disabled:cursor-default shadow-sm"
              aria-label="Próximo card"
            >
              <IconChevronRight size={15} />
            </button>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 py-3.5 border-t border-border/50">
              {resultado.blocos.map((bloco, i) => {
                const color = CARD_COLOR[bloco.label] ?? "var(--fd-green)"
                return (
                  <button
                    key={bloco.label}
                    onClick={() => scrollToCard(i)}
                    aria-label={`Ir para ${bloco.label}`}
                    className="flex items-center justify-center"
                  >
                    <span
                      className="block rounded-full transition-all duration-300"
                      style={{
                        width: activeIndex === i ? 22 : 6,
                        height: 6,
                        backgroundColor: activeIndex === i ? color : "var(--border)",
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Projection table */}
          {resultado.projecoes.length > 0 && (
            <div className="px-5 pb-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Projeção com renda extra</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Fundo</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Meta</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Saldo</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Sem extra</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Com extra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.projecoes.map((proj) => {
                      const concluido = proj.mesesComExtra === 0
                      return (
                        <tr
                          key={proj.fundo.id}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card"
                                style={{ backgroundColor: proj.fundo.cor, boxShadow: `0 0 6px ${proj.fundo.cor}40` }}
                              />
                              <span className="text-foreground font-medium">{proj.fundo.nome}</span>
                              {concluido && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-fd-green/15 text-fd-green border border-fd-green/20 font-medium">
                                  <IconCheck size={10} />
                                  Concluído
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.meta)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {fmt(proj.fundo.saldo_atual)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-muted-foreground">
                            {concluido ? "—" : proj.mesesSemExtra != null ? `${proj.mesesSemExtra} meses` : "∞"}
                          </td>
                          <td
                            className="px-4 py-3.5 text-right font-mono font-semibold"
                            style={{ color: concluido ? "var(--fd-green)" : "var(--foreground)" }}
                          >
                            {concluido ? "—" : proj.mesesComExtra != null ? `${proj.mesesComExtra} meses` : "∞"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Distribuição de {fmt(resultado.blocos.find(b => b.label === "Objetivos")?.valor ?? 0)} (30%) dividida entre os fundos.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="border-t border-border/50 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Informe sua renda extra para ver como distribuí-la.
          </p>
        </div>
      )}
    </div>
  )
}
