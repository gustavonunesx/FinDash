"use client"

interface StreakBarProps {
  streak: number
  checkIns: boolean[]
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function StreakBar({ streak, checkIns }: StreakBarProps) {
  const today = new Date().getDay()

  const days = checkIns.map((checked, i) => {
    const dayOffset = i - (checkIns.length - 1)
    const dayIndex = ((today + dayOffset) % 7 + 7) % 7
    const isToday = i === checkIns.length - 1
    const isFuture = false
    return { label: DAYS[dayIndex], checked, isToday, isFuture }
  })

  return (
    <div
      className="rounded-xl border border-border bg-card p-5 animate-fade-up"
      style={{ animationDelay: "160ms" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sequência</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Dias registrando gastos</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🔥</span>
          <span className="font-mono text-xl font-bold text-foreground">{streak}</span>
          <span className="text-xs text-muted-foreground">dias</span>
        </div>
      </div>

      <div className="flex items-end gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 animate-fade-up"
            style={{ animationDelay: `${200 + i * 60}ms` }}
          >
            <div
              className={`
                w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${day.isToday
                  ? "animate-pulse-soft border-2"
                  : day.checked
                    ? "border"
                    : "border border-dashed"
                }
              `}
              style={
                day.isToday
                  ? {
                      backgroundColor: "color-mix(in srgb, var(--fd-green) 20%, transparent)",
                      borderColor: "var(--fd-green)",
                      color: "var(--fd-green)",
                    }
                  : day.checked
                    ? {
                        backgroundColor: "color-mix(in srgb, var(--fd-green) 12%, transparent)",
                        borderColor: "color-mix(in srgb, var(--fd-green) 30%, transparent)",
                        color: "var(--fd-green)",
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: "var(--border)",
                        color: "var(--muted-foreground)",
                      }
              }
            >
              {day.checked ? "✓" : day.isToday ? "•" : "·"}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
