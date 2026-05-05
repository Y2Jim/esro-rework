import type { ActiveExpedition } from "@/lib/types"

function etaString(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r.toString().padStart(2, "0")}s`
}

export function ActiveExpeditionPanel({ active }: { active: ActiveExpedition }) {
  const pct = Math.round(active.progress * 100)
  return (
    <section className="mx-3 mt-2 rounded-md border border-[color:var(--color-cyan-muted)]/40 bg-[color:var(--color-panel-2)]/70 p-2.5">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-cyan-muted)]">
            active run
          </div>
          <div className="text-[13px] font-medium text-[color:var(--color-cyan)] text-glow-cyan">
            {active.label}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            eta
          </div>
          <div className="text-[12px] tabular-nums text-[color:var(--color-cyan-bright)]">
            {etaString(active.etaSeconds)}
          </div>
        </div>
      </header>

      {/* progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-sm border border-[color:var(--color-cyan-muted)]/40 bg-[color:var(--color-bg)]/80">
        <div
          className="h-full bg-gradient-to-r from-[color:var(--color-cyan-muted)] to-[color:var(--color-cyan)]"
          style={{
            width: `${pct}%`,
            boxShadow: "0 0 8px rgba(93,228,199,0.5)",
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        <span className="text-[color:var(--color-cyan)]">{pct}% stable</span>
        <span>signal holding</span>
      </div>

      {/* log */}
      <ul className="mt-2 space-y-0.5 text-[10.5px] text-[color:var(--color-foreground)]/85">
        {active.log.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-[color:var(--color-cyan)]">&gt;</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
