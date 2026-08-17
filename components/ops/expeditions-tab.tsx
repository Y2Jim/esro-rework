"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { rarityColor } from "@/lib/rarity"
import { STAT_COLORS, SKILL_DEFINITIONS } from "@/lib/game-data"
import type { BaseStats } from "@/lib/types"
import { RitualPrep } from "@/components/ops/ritual-prep"

/** Map expedition tags to relevant stats for bonus calculation */
const TAG_STAT_MAP: Record<string, keyof BaseStats> = {
  "combat": "atk",
  "security": "def",
  "patrol": "def",
  "exploration": "focus",
  "archive": "focus",
  "research": "focus",
  "supply": "luck",
  "recovery": "luck",
  "scavenging": "luck",
  "salvage": "luck",
  "networking": "focus",
  "support": "hp",
  "cartography": "focus",
}

export function ExpeditionsTab() {
  const expeditions = useEsroStore((s) => s.expeditions)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const startExpedition = useEsroStore((s) => s.startExpedition)
  const cancelExpedition = useEsroStore((s) => s.cancelExpedition)
  const skills = useEsroStore((s) => s.skills)
  const hasSkillUnlock = useEsroStore((s) => s.hasSkillUnlock)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)
  const getStatBonus = useEsroStore((s) => s.getStatBonus)

  // Site chosen but not yet launched: the ritual prep step sits in between.
  const [pendingExpedition, setPendingExpedition] = useState<{ id: string; name: string } | null>(
    null,
  )

  const playerStats = getPlayerStats()
  
  /** Calculate bonus percentage for an expedition based on relevant stats */
  const getExpeditionBonus = (exp: typeof expeditions[0]) => {
    let totalBonus = 0
    let relevantStats: { stat: keyof BaseStats; bonus: number }[] = []
    
    // Check expedition tags for relevant stats
    exp.tags.forEach(tag => {
      const stat = TAG_STAT_MAP[tag.toLowerCase()]
      if (stat) {
        const bonus = getStatBonus(stat)
        if (bonus > 0 && !relevantStats.find(r => r.stat === stat)) {
          relevantStats.push({ stat, bonus })
          totalBonus += bonus
        }
      }
    })
    
    // Check required skill's linked stat
    const skill = skills.find(s => s.id === exp.requiredSkill)
    if (skill && !skill.locked) {
      const linkedStat = skill.linkedStat
      if (linkedStat) {
        const bonus = getStatBonus(linkedStat)
        if (bonus > 0 && !relevantStats.find(r => r.stat === linkedStat)) {
          relevantStats.push({ stat: linkedStat, bonus })
          totalBonus += Math.floor(bonus / 2) // Skill stat bonus is half
        }
      }
    }
    
    return { totalBonus: Math.min(totalBonus, 50), relevantStats } // Cap at 50%
  }

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
            <span className="text-[14px] uppercase tracking-wider text-[color:var(--color-accent)]">
              Active Expedition
            </span>
            {activeExpedition.currentStage && activeExpedition.totalStages && (
              <span className="text-[14px] text-[color:var(--color-muted)]">
                Stage {activeExpedition.currentStage}/{activeExpedition.totalStages}
              </span>
            )}
          </div>
          
          <div className="mb-2 text-[15px] font-medium text-[color:var(--color-text)]">
            {activeExpedition.label}
          </div>

          {/* Progress bar */}
          <div className="mb-1 h-2 overflow-hidden rounded-full bg-[color:var(--color-panel)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-all"
              style={{ width: `${activeExpedition.progress * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-[14px] text-[color:var(--color-muted)]">
            <span>{Math.round(activeExpedition.progress * 100)}% complete</span>
            <span>ETA {Math.ceil(activeExpedition.etaSeconds / 60)}m</span>
          </div>

          {/* Party members */}
          {activeExpedition.partyMembers && activeExpedition.partyMembers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {activeExpedition.partyMembers.map((handle) => (
                <span
                  key={handle}
                  className="rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[13px] text-[color:var(--color-muted)]"
                >
                  {handle}
                </span>
              ))}
            </div>
          )}

          {/* Live log */}
          {activeExpedition.log && activeExpedition.log.length > 0 && (
            <div className="mt-3 rounded border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/50 p-2">
              <div className="mb-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Activity Log
              </div>
              <div className="max-h-20 space-y-0.5 overflow-y-auto text-[14px]">
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
                <span key={i} className="text-[13px] text-[color:var(--color-cyan)]">
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
              className="rounded border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-[14px] uppercase tracking-wider text-[color:var(--color-danger)] transition-colors hover:border-[color:var(--color-danger)]/60 hover:bg-[color:var(--color-danger)]/20"
            >
              Cancel Expedition
            </button>
          </div>
        </div>
      )}

      {/* Available Expeditions */}
      <div>
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Available ({expeditions.length})
        </div>

        <div className="space-y-2">
          {expeditions.map((exp) => {
            const requiredSkill = skills.find(s => s.id === exp.requiredSkill)
            // Locked either by the run's base skill or by an unearned tier breakpoint.
            const tierLocked = !!exp.requiresUnlock && !hasSkillUnlock(exp.requiresUnlock)
            const meetsRequirement = requiredSkill && !requiredSkill.locked && !tierLocked
            const { totalBonus, relevantStats } = getExpeditionBonus(exp)

            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => setPendingExpedition({ id: exp.id, name: exp.label })}
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
                      <span className="text-[14px] font-medium text-[color:var(--color-text)]">
                        {exp.label}
                      </span>
                      {exp.minLevel && (
                        <span className="text-[13px] text-[color:var(--color-muted)]">
                          Lv.{exp.minLevel}+
                        </span>
                      )}
                      {tierLocked && (
                        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-amber)]">
                          {exp.requiresUnlock === "deep_ruins" ? "Needs Deep Ruins" : "Needs Hidden Routes"}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <div className="mt-0.5 text-[14px] text-[color:var(--color-muted)]">
                        {exp.description}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
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
                          <span key={i} className="text-[13px] text-[color:var(--color-violet-bright)]">
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
                            className={cn("rounded px-1 py-0.5 text-[12px]", rarityColor[drop.rarity])}
                          >
                            {drop.label}
                          </span>
                        ))}
                        {exp.rewards.possibleDrops.length > 3 && (
                          <span className="text-[12px] text-[color:var(--color-muted)]">
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
                        className="rounded bg-[color:var(--color-panel-soft)] px-1.5 py-0.5 text-[12px] uppercase text-[color:var(--color-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                    {exp.suggestedParty > 1 && (
                      <span className="text-[12px] text-[color:var(--color-green)]">
                        {exp.suggestedParty} party
                      </span>
                    )}
                  </div>
                </div>

                {/* Stat bonuses */}
                {meetsRequirement && totalBonus > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded border border-[color:var(--color-success)]/20 bg-[color:var(--color-success)]/5 px-2 py-1">
                    <span className="text-[13px] text-[color:var(--color-success)]">
                      +{totalBonus}% bonus
                    </span>
                    <div className="flex gap-1">
                      {relevantStats.slice(0, 3).map(({ stat, bonus }) => (
                        <span 
                          key={stat}
                          className="rounded px-1 py-0.5 text-[12px] font-medium"
                          style={{ 
                            backgroundColor: `${STAT_COLORS[stat]}15`,
                            color: STAT_COLORS[stat],
                          }}
                        >
                          {stat.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!meetsRequirement && requiredSkill && (
                  <div className="mt-2 rounded border border-[color:var(--color-danger-muted)]/30 bg-[color:var(--color-danger)]/5 px-2 py-1 text-[13px] text-[color:var(--color-danger-muted)]">
                    Requires: {requiredSkill.label}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {pendingExpedition && (
        <RitualPrep
          expeditionName={pendingExpedition.name}
          onClose={() => setPendingExpedition(null)}
          onLaunch={(ritualIds) => {
            startExpedition(pendingExpedition.id, ritualIds)
            setPendingExpedition(null)
          }}
        />
      )}
    </div>
  )
}
