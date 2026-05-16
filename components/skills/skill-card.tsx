"use client"

import { useState } from "react"
import type { Skill, SkillEffect } from "@/lib/types"
import { cn } from "@/lib/cn"

const EFFECT_ICONS: Record<SkillEffect["type"], string> = {
  expedition_time: "⏱",
  material_yield: "◈",
  rare_chance: "✧",
  xp_bonus: "↑",
  risk_reduction: "⬡",
  faction_standing: "⚑",
  craft_efficiency: "⚒",
  party_bonus: "⋈",
}

const EFFECT_COLORS: Record<SkillEffect["type"], string> = {
  expedition_time: "text-[color:var(--color-cyan)]",
  material_yield: "text-[color:var(--color-success)]",
  rare_chance: "text-[color:var(--color-legendary)]",
  xp_bonus: "text-[color:var(--color-accent)]",
  risk_reduction: "text-[color:var(--color-amber)]",
  faction_standing: "text-[color:var(--color-epic)]",
  craft_efficiency: "text-[color:var(--color-uncommon)]",
  party_bonus: "text-[color:var(--color-rare)]",
}

export function SkillCard({
  skill,
  selected,
  onToggle,
  full,
}: {
  skill: Skill
  selected: boolean
  onToggle: () => void
  full?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const locked = skill.locked
  const disabled = locked || (full && !selected)

  const handleClick = () => {
    if (!locked) {
      onToggle()
    }
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div className="rounded-md border border-[color:var(--color-border-soft)]">
      <button
        type="button"
        onClick={handleClick}
        disabled={locked}
        className={cn(
          "group relative flex w-full items-center gap-2.5 rounded-md p-2 text-left transition-all",
          selected
            ? "border-[color:color-mix(in_oklab,var(--color-violet)_60%,transparent)] bg-[color:color-mix(in_oklab,var(--color-violet)_10%,var(--color-panel))]"
            : "bg-[color:var(--color-panel)]/50 hover:bg-[color:var(--color-panel)]",
          disabled && !selected && "opacity-50",
          locked && "cursor-not-allowed",
        )}
        aria-pressed={selected}
      >
        {/* slot marker */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border text-[14px]",
            selected
              ? "border-[color:var(--color-violet-bright)] text-[color:var(--color-violet-bright)] text-glow"
              : locked
                ? "border-[color:var(--color-border-soft)] text-[color:var(--color-muted-2)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-lilac)]",
          )}
        >
          {locked ? "✕" : selected ? "✦" : "◇"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4
              className={cn(
                "truncate text-[12px]",
                locked
                  ? "text-[color:var(--color-muted)]"
                  : "text-[color:var(--color-foreground)]",
              )}
            >
              {skill.label}
              {skill.variant && (
                <span className="ml-1.5 align-middle text-[8.5px] uppercase tracking-[0.22em] text-[color:var(--color-lilac)]">
                  · {skill.variant}
                </span>
              )}
            </h4>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              {locked ? "locked" : `lv ${skill.level}/${skill.maxLevel}`}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[color:var(--color-foreground)]/70">
            {skill.summary}
          </p>

          {/* level bar */}
          {!locked && (
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-sm bg-[color:var(--color-bg)]/80">
              <div
                className="h-full bg-[color:var(--color-violet)]"
                style={{
                  width: `${(skill.level / skill.maxLevel) * 100}%`,
                  boxShadow: "0 0 4px rgba(168,123,255,0.5)",
                }}
              />
            </div>
          )}
          
          {/* Effects preview */}
          {skill.effects && skill.effects.length > 0 && !locked && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex gap-1">
                {skill.effects.map((effect, i) => (
                  <span 
                    key={i} 
                    className={cn("text-[12px]", EFFECT_COLORS[effect.type])}
                    title={effect.description}
                  >
                    {EFFECT_ICONS[effect.type]}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleExpand}
                className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)]"
              >
                {expanded ? "hide" : "details"}
              </button>
            </div>
          )}
        </div>
      </button>
      
      {/* Expanded effects panel */}
      {expanded && skill.effects && (
        <div className="border-t border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/30 px-3 py-2">
          <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Effects at Level {skill.level}
          </div>
          <div className="space-y-1">
            {skill.effects.map((effect, i) => {
              const totalBonus = effect.value * skill.level
              const sign = effect.value > 0 ? "+" : ""
              return (
                <div key={i} className="flex items-start gap-2 text-[12px]">
                  <span className={cn("shrink-0", EFFECT_COLORS[effect.type])}>
                    {EFFECT_ICONS[effect.type]}
                  </span>
                  <div className="flex-1">
                    <span className={EFFECT_COLORS[effect.type]}>
                      {sign}{totalBonus}%
                    </span>
                    <span className="ml-1 text-[color:var(--color-foreground)]/70">
                      {effect.description.replace(/per level/i, "").trim()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {skill.primaryExpeditions && skill.primaryExpeditions.length > 0 && (
            <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
              Primary for: {skill.primaryExpeditions.map(e => e.replace(/_/g, " ")).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
