"use client"

import { useEsroStore } from "@/store/use-esro-store"

export function ExpeditionsTab() {
  const expeditions = useEsroStore((s) => s.expeditions)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const startExpedition = useEsroStore((s) => s.startExpedition)

  return (
    <div className="space-y-4">
      {/* Active Expedition */}
      {activeExpedition && (
        <div className="rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/5 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-accent)]">
            Active
          </div>
          <div className="mb-2 text-[13px] font-medium text-[color:var(--color-text)]">
            {activeExpedition.label}
          </div>
          
          <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-panel)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-all"
              style={{ width: `${activeExpedition.progress * 100}%` }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-[color:var(--color-muted)]">
            <span>{Math.round(activeExpedition.progress * 100)}%</span>
            <span>ETA {Math.ceil(activeExpedition.etaSeconds / 60)}m</span>
          </div>
        </div>
      )}

      {/* Available List */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Available
        </div>
        
        <div className="space-y-2">
          {expeditions.map((exp) => (
            <button
              key={exp.id}
              type="button"
              onClick={() => startExpedition(exp.id)}
              disabled={!!activeExpedition}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-3 text-left transition-colors hover:border-[color:var(--color-accent)]/50 disabled:opacity-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[color:var(--color-text)]">
                    {exp.label}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                    {Math.round(exp.duration / 60)}m · {exp.risk} risk · {exp.rewards.xp} XP
                  </div>
                </div>
                <span className="shrink-0 rounded bg-[color:var(--color-panel-soft)] px-1.5 py-0.5 text-[9px] uppercase text-[color:var(--color-muted)]">
                  {exp.tags[0]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
