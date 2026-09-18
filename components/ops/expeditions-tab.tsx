"use client"

import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { rarityColor } from "@/lib/rarity"
import { STAT_COLORS, SKILL_DEFINITIONS } from "@/lib/game-data"
import { UNLOCK_LABELS } from "@/lib/skill-effects"
import { getNodeForExpedition, nodeRequiredLevel, isContestedNode } from "@/lib/world-map"
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
  // Rituals are the Ritualism payoff. Read through the store so the UI and the
  // toggleRitual guard can never disagree about who may prep.
  const hasRitualism = useEsroStore((s) => s.hasRitualism())
  const hasSkillUnlock = useEsroStore((s) => s.hasSkillUnlock)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)
  const getStatBonus = useEsroStore((s) => s.getStatBonus)
  const cooldownUntil = useEsroStore((s) => s.expeditionCooldownUntil)
  // Location-access inputs: an expedition tied to a map location is only
  // available once the player can actually reach that location — the same
  // rules the map panel and startExpedition enforce.
  const profile = useEsroStore((s) => s.profile)
  const getPlayerFactionId = useEsroStore((s) => s.getPlayerFactionId)
  const factionUnlocked = useEsroStore((s) => s.factionUnlocked)
  const playerLevel = profile?.level ?? 1
  const playerFactionId = getPlayerFactionId()

  // Site chosen but not yet launched: the ritual prep step sits in between.
  const [pendingExpedition, setPendingExpedition] = useState<{ id: string; name: string } | null>(
    null,
  )

  // Tick every second while a failure cooldown is running so the countdown and
  // the disabled launch buttons update live without a store write each frame.
  const [cooldownLeft, setCooldownLeft] = useState(0)
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownLeft(0)
      return
    }
    const tick = () => setCooldownLeft(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)))
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [cooldownUntil])
  const onCooldown = cooldownLeft > 0

  const playerStats = getPlayerStats()

  // Faction expeditions (the contested-frontier runs that grant faction standing)
  // sort to the bottom so the general-purpose runs lead the list. A stable sort
  // keeps the relative order within each group untouched.
  const sortedExpeditions = [...expeditions].sort(
    (a, b) => Number(!!a.factionAttunement) - Number(!!b.factionAttunement),
  )
  
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
      {/* Recovery cooldown after a failed run */}
      {onCooldown && !activeExpedition && (
        <div className="rounded-lg border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] uppercase tracking-wider text-[color:var(--color-danger)]">
              Squad recovering
            </span>
            <span className="font-mono text-[14px] tabular-nums text-[color:var(--color-danger)]">
              {Math.floor(cooldownLeft / 60)}:{String(cooldownLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
            The last expedition ended in disaster. New launches are locked until the squad regroups.
          </p>
        </div>
      )}

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
          {sortedExpeditions.map((exp) => {
            const requiredSkill = skills.find(s => s.id === exp.requiredSkill)
            // Locked either by the run's base skill or by an unearned tier breakpoint.
            const tierLocked = !!exp.requiresUnlock && !hasSkillUnlock(exp.requiresUnlock)
            // An expedition with no requiredSkill is intentionally open to every
            // build, so treat a missing requirement as satisfied. Previously the
            // truthiness check meant "no requirement" read as "unmet", which is
            // what left ungated runs unselectable.
            const skillSatisfied = exp.requiredSkill ? !!requiredSkill && !requiredSkill.locked : true
            // Location unlock gate: expeditions that deploy from a non-home map
            // location are only available once that location is actually
            // reachable. Home (Waystation Prime) and unlinked expeditions stay
            // open. Mirrors the map panel + startExpedition rules.
            const originNode = getNodeForExpedition(exp.id)
            const isNonHomeLocation = !!originNode && originNode.id !== "waystation_prime"
            const locReqLevel = isNonHomeLocation ? nodeRequiredLevel(originNode) : 1
            const locationLevelLocked = isNonHomeLocation && playerLevel < locReqLevel
            const contestedLocked =
              isNonHomeLocation &&
              isContestedNode(originNode) &&
              (!playerFactionId || !factionUnlocked)
            const locationLocked = locationLevelLocked || contestedLocked
            const meetsRequirement = skillSatisfied && !tierLocked && !locationLocked
            const { totalBonus, relevantStats } = getExpeditionBonus(exp)

            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  // Ritual prep is the Ritualism payoff. Without that skill there
                  // is nothing to choose, so launch straight away rather than
                  // opening a modal of things the player can never prepare.
                  if (!hasRitualism) {
                    startExpedition(exp.id, [])
                    return
                  }
                  setPendingExpedition({ id: exp.id, name: exp.label })
                }}
                disabled={!!activeExpedition || !meetsRequirement || onCooldown}
                className={cn(
                  "w-full rounded-lg border bg-[color:var(--color-panel)] p-3 text-left transition-colors",
                  activeExpedition || !meetsRequirement || onCooldown
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
                      {tierLocked && exp.requiresUnlock && (
                        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-amber)]">
                          Needs {UNLOCK_LABELS[exp.requiresUnlock]}
                        </span>
                      )}
                      {locationLevelLocked && (
                        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-amber)]">
                          Locked · Lv.{locReqLevel}
                        </span>
                      )}
                      {contestedLocked && !locationLevelLocked && (
                        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-amber)]">
                          Faction warfare
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

                {!skillSatisfied && requiredSkill && (
                  <div className="mt-2 rounded border border-[color:var(--color-danger-muted)]/30 bg-[color:var(--color-danger)]/5 px-2 py-1 text-[13px] text-[color:var(--color-danger-muted)]">
                    Requires: {requiredSkill.label}
                  </div>
                )}

                {locationLocked && originNode && (
                  <div className="mt-2 rounded border border-[color:var(--color-amber)]/30 bg-[color:var(--color-amber)]/5 px-2 py-1 text-[13px] text-[color:var(--color-amber)]">
                    {contestedLocked && !locationLevelLocked
                      ? `Unlock faction warfare to reach ${originNode.label}`
                      : `Reach Lv.${locReqLevel} to unlock ${originNode.label}`}
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
