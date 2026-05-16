"use client"

import type { Skill } from "@/lib/types"
import { cn } from "@/lib/cn"

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
  const locked = skill.locked
  const disabled = locked || (full && !selected)

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition-all",
        selected
          ? "border-[color:color-mix(in_oklab,var(--color-violet)_60%,transparent)] bg-[color:color-mix(in_oklab,var(--color-violet)_10%,var(--color-panel))]"
          : "border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/50 hover:border-[color:var(--color-border)]",
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
          <span className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
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
      </div>
    </button>
  )
}
