"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { rarityColor } from "@/lib/rarity"

export function ExpeditionsTab() {
  const expeditions = useEsroStore((s) => s.expeditions)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const startExpedition = useEsroStore((s) => s.startExpedition)
  const cancelExpedition = useEsroStore((s) => s.cancelExpedition)
  const skills = useEsroStore((s) => s.skills)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-[color:var(--color-success)]"
      case "Medium": return "text-[color:var(--color-amber)]"
      case "High": return "text-[color:var(--color-danger)]"
      default: return "text-[color:var(--color-muted)]"
    }
  }

  return (
    <div className="space-y-4">
      {/* Active Expedition */}
      {activeExpedition && (
        <div className="rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-accent)]">
              Active Expedition
            </span>
            {activeExpedition.currentStage && activeExpedition.totalStages && (
              <span className="text-[10px] text-[color:var(--color-muted)]">
                Stage {activeExpedition.currentStage}/{activeExpedition.totalStages}
              </span>
            )}
          </div>
          
          <div className="mb-2 text-[13px] font-medium text-[color:var(--color-text)]">
            {activeExpedition.label}
          </div>

          {/* Progress bar */}
          <div className="mb-1 h-2 overflow-hidden rounded-full bg-[color:var(--color-panel)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-all"
              style={{ width: `${activeExpedition.progress * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[color:var(--color-muted)]">
            <span>{Math.round(activeExpedition.progress * 100)}% complete</span>
            <span>ETA {Math.ceil(activeExpedition.etaSeconds / 60)}m</span>
          </div>

          {/* Party members */}
          {activeExpedition.partyMembers && activeExpedition.partyMembers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {activeExpedition.partyMembers.map((handle) => (
                <span
                  key={handle}
                  className="rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[9px] text-[color:var(--color-muted)]"
                >
                  {handle}
                </span>
              ))}
            </div>
          )}

          {/* Live log */}
          {activeExpedition.log && activeExpedition.log.length > 0 && (
            <div className="mt-3 rounded border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/50 p-2">
              <div className="mb-1 text-[8px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Activity Log
              </div>
              <div className="max-h-20 space-y-0.5 overflow-y-auto text-[10px]">
                {activeExpedition.log.slice(-5).map((entry, i) => (
                  <div key={i} className="text-[color:var(--color-foreground)]/80">{entry}</div>
                ))}
              </div>
            </div>
          )}

          {/* Skill gains preview */}
          {activeExpedition.skillGains && activeExpedition.skillGains.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeExpedition.skillGains.map((gain, i) => (
                <span key={i} className="text-[9px] text-[color:var(--color-cyan)]">
                  +{gain.xp} {gain.skill} XP
                </span>
              ))}
            </div>
          )}

          {/* Cancel button */}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={cancelExpedition}
              className="rounded border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-danger)] transition-colors hover:border-[color:var(--color-danger)]/60 hover:bg-[color:var(--color-danger)]/20"
            >
              Cancel Expedition
            </button>
          </div>
        </div>
      )}

      {/* Available Expeditions */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Available ({expeditions.length})
        </div>

        <div className="space-y-2">
          {expeditions.map((exp) => {
            const requiredSkill = skills.find(s => s.id === exp.requiredSkill)
            const meetsRequirement = requiredSkill && !requiredSkill.locked

            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => startExpedition(exp.id)}
                disabled={!!activeExpedition || !meetsRequirement}
                className={cn(
                  "w-full rounded-lg border bg-[color:var(--color-panel)] p-3 text-left transition-colors",
                  activeExpedition || !meetsRequirement
                    ? "border-[color:var(--color-border-soft)] opacity-60"
                    : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-[color:var(--color-text)]">
                        {exp.label}
                      </span>
                      {exp.minLevel && (
                        <span className="text-[9px] text-[color:var(--color-muted)]">
                          Lv.{exp.minLevel}+
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
                        {exp.description}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px]">
                      <span className="text-[color:var(--color-muted)]">
                        {Math.round(exp.duration / 60)}m
                      </span>
                      <span className={getRiskColor(exp.risk)}>
                        {exp.risk} risk
                      </span>
                      <span className="text-[color:var(--color-cyan)]">
                        {exp.rewards.xp} XP
                      </span>
                      {exp.rewards.tokens > 0 && (
                        <span className="text-[color:var(--color-amber)]">
                          {exp.rewards.tokens} tokens
                        </span>
                      )}
                    </div>

                    {/* Skill XP gains */}
                    {exp.rewards.skillXp && exp.rewards.skillXp.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {exp.rewards.skillXp.map((gain, i) => (
                          <span key={i} className="text-[9px] text-[color:var(--color-violet-bright)]">
                            +{gain.amount} {gain.skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Possible drops */}
                    {exp.rewards.possibleDrops && exp.rewards.possibleDrops.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {exp.rewards.possibleDrops.slice(0, 3).map((drop, i) => (
                          <span
                            key={i}
                            className={cn("rounded px-1 py-0.5 text-[8px]", rarityColor[drop.rarity])}
                          >
                            {drop.label}
                          </span>
                        ))}
                        {exp.rewards.possibleDrops.length > 3 && (
                          <span className="text-[8px] text-[color:var(--color-muted)]">
                            +{exp.rewards.possibleDrops.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {exp.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded bg-[color:var(--color-panel-soft)] px-1.5 py-0.5 text-[8px] uppercase text-[color:var(--color-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {exp.suggestedParty > 1 && (
                      <span className="text-[8px] text-[color:var(--color-green)]">
                        {exp.suggestedParty} party
                      </span>
                    )}
                  </div>
                </div>

                {!meetsRequirement && requiredSkill && (
                  <div className="mt-2 rounded border border-[color:var(--color-danger-muted)]/30 bg-[color:var(--color-danger)]/5 px-2 py-1 text-[9px] text-[color:var(--color-danger-muted)]">
                    Requires: {requiredSkill.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
