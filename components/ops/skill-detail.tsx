"use client"

import { cn } from "@/lib/cn"
import {
  BONUS_LABEL,
  BONUS_SYSTEM,
  formatBonus,
  getSkillMechanic,
  STAT_UNLOCKS,
  type SkillBonusKey,
} from "@/lib/skill-effects"
import { useEsroStore } from "@/store/use-esro-store"
import { STAT_COLORS, STAT_LABELS } from "@/lib/game-data"
import type { Skill } from "@/lib/types"
import { X, Lock, Check } from "lucide-react"

/**
 * Levers where a reduction is the benefit, so a negative total is good news.
 */
const LOWER_IS_BETTER = new Set<SkillBonusKey>([
  "runDuration",
  "battleFrequency",
  "hazardFrequency",
  "craftCost",
])

/**
 * The "what did this level actually buy me" panel. Every row is computed from
 * the same registry the simulation reads, so the numbers here are the numbers
 * that run — no restating of static flavour text.
 */
export function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  // Live totals, needed to show progress toward any stat-threshold unlock.
  const stats = useEsroStore((s) => s.getPlayerStats())
  const mech = getSkillMechanic(skill.label)
  if (!mech) return null

  const statColor = STAT_COLORS[mech.linkedStat]

  // Stat gates belonging to this skill, e.g. Fishing shows its Luck 15 entry
  // gate alongside its level breakpoints.
  const statGates = STAT_UNLOCKS.filter((gate) => gate.skill === mech.name)

  // Each sub-stat's live contribution. Sub-stats fall back to the parent level
  // so a skill still reads correctly before its sub-stats are broken out.
  const rows = mech.hooks.map((hook) => {
    const sub = skill.stats?.find((s) => s.id === hook.id)
    const level = sub ? sub.level : skill.level
    const value = hook.perLevel * level
    return {
      id: hook.id,
      label: sub?.name ?? hook.id,
      level,
      detail: hook.detail,
      effect: hook.effect,
      value,
      // Some levers improve by going down (run duration, encounter frequency),
      // so a negative total is a gain rather than a penalty.
      good: value !== 0 && (LOWER_IS_BETTER.has(hook.effect) ? value < 0 : value > 0),
      system: BONUS_SYSTEM[hook.effect],
    }
  })

  const statGain = Math.floor(skill.level / 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xs flex-col rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-panel)] shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[color:var(--color-border)] px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-[color:var(--color-text)]">
                {skill.label}
              </span>
              <span className="text-[13px] text-[color:var(--color-muted)]">Lv {skill.level}</span>
              <span
                className="rounded px-1 py-0.5 text-[12px] font-medium"
                style={{ backgroundColor: `${statColor}15`, color: statColor }}
              >
                {STAT_LABELS[mech.linkedStat]}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{mech.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close skill details"
            className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-border)] hover:text-[color:var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Live effects */}
          <div className="mb-1.5 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Active effects
          </div>
          <div className="space-y-1.5">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-panel-2)]/50 px-2 py-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] text-[color:var(--color-text)]">{row.label}</span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[13px]",
                      row.good
                        ? "text-[color:var(--color-cyan)]"
                        : "text-[color:var(--color-muted)]"
                    )}
                  >
                    {formatBonus(row.effect, row.value)}
                    {LOWER_IS_BETTER.has(row.effect) && row.value !== 0 && (
                      <span className="ml-1 text-[11px] text-[color:var(--color-muted)]">
                        {row.effect === "runDuration" ? "faster" : "less"}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-[color:var(--color-muted)]">{row.detail}</span>
                  <span className="shrink-0 text-[12px] text-[color:var(--color-muted)]">
                    Lv {row.level}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="rounded bg-[color:var(--color-accent)]/10 px-1.5 py-0.5 text-[11px] text-[color:var(--color-accent)]">
                    {BONUS_LABEL[row.effect]}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {row.system}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Linked stat contribution */}
          <div className="mt-2 flex items-center justify-between rounded-md border border-[color:var(--color-border)] px-2 py-1.5">
            <span className="text-[13px] text-[color:var(--color-muted)]">
              {STAT_LABELS[mech.linkedStat]} from levels
            </span>
            <span className="font-mono text-[13px]" style={{ color: statColor }}>
              {statGain > 0 ? `+${statGain}` : "+0"}
            </span>
          </div>

          {/* Breakpoints */}
          {(mech.breakpoints.length > 0 || statGates.length > 0) && (
            <>
              <div className="mb-1.5 mt-3 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Unlocks
              </div>
              <div className="space-y-1.5">
                {/* Stat-threshold gates tied to this skill's linked stat, e.g.
                    fishing entry needs Luck 15 rather than a Fishing level. */}
                {statGates.map((gate) => {
                  const earned = stats[gate.stat] >= gate.value
                  return (
                    <div
                      key={gate.unlock}
                      className={cn(
                        "flex items-start gap-2 rounded-md border px-2 py-1.5",
                        earned
                          ? "border-[color:var(--color-cyan)]/40 bg-[color:var(--color-cyan)]/10"
                          : "border-[color:var(--color-border)] opacity-70"
                      )}
                    >
                      {earned ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-cyan)]" />
                      ) : (
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-muted)]" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] text-[color:var(--color-text)]">
                            {gate.label}
                          </span>
                          <span className="text-[12px] text-[color:var(--color-muted)]">
                            {gate.stat.toUpperCase()} {stats[gate.stat]}/{gate.value}
                          </span>
                        </div>
                        <p className="text-[12px] text-[color:var(--color-muted)]">{gate.detail}</p>
                      </div>
                    </div>
                  )
                })}
                {mech.breakpoints.map((bp) => {
                  const earned = skill.level >= bp.level
                  return (
                    <div
                      key={bp.unlock}
                      className={cn(
                        "flex items-start gap-2 rounded-md border px-2 py-1.5",
                        earned
                          ? "border-[color:var(--color-cyan)]/40 bg-[color:var(--color-cyan)]/10"
                          : "border-[color:var(--color-border)] opacity-70"
                      )}
                    >
                      {earned ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-cyan)]" />
                      ) : (
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-muted)]" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] text-[color:var(--color-text)]">
                            {bp.label}
                          </span>
                          <span className="text-[12px] text-[color:var(--color-muted)]">
                            Lv {bp.level}
                          </span>
                        </div>
                        <p className="text-[12px] text-[color:var(--color-muted)]">{bp.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
