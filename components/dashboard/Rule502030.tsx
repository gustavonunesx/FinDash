"use client"

interface RuleBarProps {
  label: string
  atual: number
  meta: number
  salario: number
  index: number
}

function RuleBar({ label, atual, meta, salario, index }: RuleBarProps) {
  const pct = salario > 0 ? Math.min((atual / salario) * 100, 100) : 0
  const status = pct <= meta * 0.85 ? "ok" : pct <= meta ? "warning" : "danger"

  const barColor =
    status === "ok"      ? "var(--fd-green)"
    : status === "warning" ? "var(--fd-amber)"
    : "var(--fd-red)"

  const labelColor =
    status === "ok"        ? "text-[var(--fd-green)]"
    : status === "warning" ? "text-[var(--fd-amber)]"
    : "text-[var(--fd-red)]"

  const pctDisplay = Math.round(pct)
  const metaDisplay = Math.round(meta)

  return (
    <div
      className="space-y-2 animate-fade-up"
      style={{ animationDelay: `${200 + index * 100}ms` }}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono font-semibold ${labelColor}`}>{pctDisplay}%</span>
          <span className="text-muted-foreground">/ meta {metaDisplay}%</span>
          {status === "danger" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--fd-red)_15%,transparent)] text-[var(--fd-red)]">
              EXCEDIDO
            </span>
          )}
          {status === "warning" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--fd-amber)_15%,transparent)] text-[var(--fd-amber)]">
              ATENÇÃO
            </span>
          )}
        </div>
      </div>

      {/* track */}
      <div className="relative h-2.5 rounded-full bg-border overflow-hidden">
        {/* meta marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-muted-foreground/40 z-10"
          style={{ left: `${meta}%` }}
        />
        {/* bar */}
        <div
          className="h-full rounded-full animate-progress transition-colors duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            animationDelay: `${400 + index * 100}ms`,
            boxShadow: status !== "ok" ? `0 0 8px color-mix(in srgb, ${barColor} 50%, transparent)` : undefined,
          }}
        />
      </div>
    </div>
  )
}

interface Rule502030Props {
  necessidades: number
  objetivos: number
  qualidade: number
  salario: number
}

export function Rule502030({ necessidades, objetivos, qualidade, salario }: Rule502030Props) {
  const bars = [
    { label: "Necessidades",       valor: necessidades, meta: 50 },
    { label: "Objetivos",          valor: objetivos,    meta: 30 },
    { label: "Qualidade de vida",  valor: qualidade,    meta: 20 },
  ]

  const totalPct = salario > 0 ? Math.round(((necessidades + objetivos + qualidade) / salario) * 100) : 0

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-5 animate-fade-up"
      style={{ animationDelay: "120ms" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Regra 50/30/20</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Distribuição da renda mensal</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-lg font-bold text-foreground">{totalPct}%</span>
          <p className="text-[10px] text-muted-foreground">comprometido</p>
        </div>
      </div>

      <div className="space-y-4">
        {bars.map((b, i) => (
          <RuleBar
            key={b.label}
            label={b.label}
            atual={b.valor}
            meta={b.meta}
            salario={salario}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
