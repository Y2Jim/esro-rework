"use client"

import { useState, useRef, useCallback } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { SKILL_DEFINITIONS, STAT_LABELS, STAT_COLORS } from "@/lib/game-data"
import type { BaseStats, Skill, SkillVariant } from "@/lib/types"
import { X, Check } from "lucide-react"

const LONG_PRESS_DURATION = 500 // ms

function VariantSelector({
  skill,
  onSelect,
  onClose,
}: {
  skill: Skill
  onSelect: (variantId: string) => void
  onClose: () => void
}) {
  const variants = skill.variants || []
  const unlockedVariants = variants.filter((v) => v.unlocked)
  const lockedVariants = variants.filter((v) => !v.unlocked)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xs rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-panel)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-3 py-2">
          <div>
            <div className="text-[11px] font-medium text-[color:var(--color-text)]">
              {skill.label} Variants
            </div>
            <div className="text-[9px] text-[color:var(--color-muted)]">
              Long-press to change variant
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[color:var(--color-muted)] hover:bg-[color:var(--color-border)] hover:text-[color:var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Variants List */}
        <div className="max-h-64 overflow-y-auto p-2">
          {unlockedVariants.length === 0 && lockedVariants.length === 0 && (
            <div className="py-4 text-center text-[10px] text-[color:var(--color-muted)]">
              No variants discovered yet
            </div>
          )}

          {/* Unlocked Variants */}
          {unlockedVariants.map((variant) => {
            const isActive = skill.activeVariant === variant.id
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onSelect(variant.id)}
                className={cn(
                  "mb-1.5 w-full rounded-md border p-2 text-left transition-all last:mb-0",
                  isActive
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/15"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-panel-2)]/50 hover:border-[color:var(--color-accent)]/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[color:var(--color-text)]">
                    {variant.label}
                  </span>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />
                  )}
                </div>
                <p className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                  {variant.description}
                </p>
                {variant.effects && variant.effects.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {variant.effects.map((effect, i) => (
                      <span
                        key={i}
                        className="rounded bg-[color:var(--color-accent)]/10 px-1.5 py-0.5 text-[8px] text-[color:var(--color-accent)]"
                      >
                        {effect.description}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}

          {/* Locked Variants */}
          {lockedVariants.length > 0 && (
            <>
              {unlockedVariants.length > 0 && (
                <div className="my-2 border-t border-[color:var(--color-border)]" />
              )}
              <div className="mb-1.5 text-[8px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Locked
              </div>
              {lockedVariants.map((variant) => (
                <div
                  key={variant.id}
                  className="mb-1.5 w-full rounded-md border border-[color:var(--color-border)]/50 bg-[color:var(--color-panel-2)]/30 p-2 opacity-50 last:mb-0"
                >
                  <span className="text-[11px] font-medium text-[color:var(--color-muted)]">
                    {variant.label}
                  </span>
                  <p className="mt-0.5 text-[9px] text-[color:var(--color-muted)]/70">
                    {variant.description}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SkillButton({
  skill,
  isEquipped,
  info,
  onToggle,
  onLongPress,
  disabled,
}: {
  skill: Skill
  isEquipped: boolean
  info: { stat: keyof BaseStats; label: string; color: string; value: number; summary: string } | null
  onToggle: () => void
  onLongPress: () => void
  disabled: boolean
}) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, LONG_PRESS_DURATION)
  }, [onLongPress])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!isLongPress.current) {
      onToggle()
    }
  }, [onToggle])

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const activeVariant = skill.variants?.find((v) => v.id === skill.activeVariant)
  const hasVariants = skill.variants && skill.variants.length > 0

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      disabled={disabled}
      className={cn(
        "flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left transition-colors select-none",
        isEquipped
          ? "border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 hover:bg-[color:var(--color-accent)]/20"
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50",
        disabled && "opacity-50"
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[color:var(--color-text)]">
            {skill.label}
          </span>
          <span className="text-[9px] text-[color:var(--color-muted)]">
            Lv {skill.level}
          </span>
          {info && (
            <span
              className="rounded px-1 py-0.5 text-[8px] font-medium"
              style={{
                backgroundColor: `${info.color}15`,
                color: info.color,
              }}
            >
              {info.label}
            </span>
          )}
          {hasVariants && (
            <span className="rounded bg-[color:var(--color-accent)]/20 px-1 py-0.5 text-[7px] uppercase tracking-wider text-[color:var(--color-accent)]">
              variants
            </span>
          )}
        </div>
        {activeVariant && (
          <div className="mt-0.5 text-[9px] text-[color:var(--color-accent)]">
            {activeVariant.label}
          </div>
        )}
        {info?.summary && (
          <p className="mt-1 text-[9px] text-[color:var(--color-muted)]">
            {info.summary}
          </p>
        )}
        {hasVariants && (
          <p className="mt-1 text-[8px] italic text-[color:var(--color-muted)]/70">
            Hold to change variant
          </p>
        )}
      </div>
      <span
        className={cn(
          "ml-2 text-[9px]",
          isEquipped ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-accent)]"
        )}
      >
        {isEquipped ? "−" : "+"}
      </span>
    </button>
  )
}

export function SkillsTab() {
  const skills = useEsroStore((s) => s.skills)
  const loadout = useEsroStore((s) => s.loadout)
  const toggleLoadout = useEsroStore((s) => s.toggleLoadout)
  const setSkillVariant = useEsroStore((s) => s.setSkillVariant)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)

  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)

  const playerStats = getPlayerStats()

  /** Get linked stat info and summary for a skill */
  const getSkillInfo = (skillLabel: string) => {
    const skillDef = SKILL_DEFINITIONS.find((sd) => sd.name === skillLabel)
    if (!skillDef) return null
    const stat = skillDef.linkedStat as keyof BaseStats
    return {
      stat,
      label: STAT_LABELS[stat],
      color: STAT_COLORS[stat],
      value: playerStats[stat],
      summary: skillDef.summary,
    }
  }

  const handleSelectVariant = (variantId: string) => {
    if (selectedSkill) {
      setSkillVariant(selectedSkill.id, variantId)
      setSelectedSkill(null)
    }
  }

  const equipped = skills.filter((s) => loadout.includes(s.id))
  const available = skills.filter((s) => !loadout.includes(s.id) && !s.locked)

  return (
    <div className="space-y-4">
      {/* Variant Selector Modal */}
      {selectedSkill && selectedSkill.variants && selectedSkill.variants.length > 0 && (
        <VariantSelector
          skill={selectedSkill}
          onSelect={handleSelectVariant}
          onClose={() => setSelectedSkill(null)}
        />
      )}

      {/* Stats Overview */}
      <div className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 px-3 py-2">
        <span className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Stats
        </span>
        <div className="flex gap-2">
          {(Object.keys(playerStats) as (keyof BaseStats)[]).map((stat) => (
            <div key={stat} className="flex items-center gap-1">
              <span className="text-[10px] font-bold" style={{ color: STAT_COLORS[stat] }}>
                {playerStats[stat]}
              </span>
              <span className="text-[8px]" style={{ color: `${STAT_COLORS[stat]}80` }}>
                {STAT_LABELS[stat]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loadout */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Loadout ({equipped.length}/4)
        </div>

        <div className="space-y-2">
          {equipped.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-3 text-center text-[10px] text-[color:var(--color-muted)]">
              No skills equipped
            </div>
          ) : (
            equipped.map((skill) => {
              const info = getSkillInfo(skill.label)
              return (
                <SkillButton
                  key={skill.id}
                  skill={skill}
                  isEquipped={true}
                  info={info}
                  onToggle={() => toggleLoadout(skill.id)}
                  onLongPress={() => setSelectedSkill(skill)}
                  disabled={false}
                />
              )
            })
          )}
        </div>
      </div>

      {/* Available */}
      {available.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Available
          </div>

          <div className="space-y-2">
            {available.map((skill) => {
              const info = getSkillInfo(skill.label)
              return (
                <SkillButton
                  key={skill.id}
                  skill={skill}
                  isEquipped={false}
                  info={info}
                  onToggle={() => toggleLoadout(skill.id)}
                  onLongPress={() => setSelectedSkill(skill)}
                  disabled={loadout.length >= 4}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
