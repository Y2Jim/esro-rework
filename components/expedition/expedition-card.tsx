"use client"

import type { Expedition } from "@/lib/types"
import { cn } from "@/lib/cn"

function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60)
  return `${m}m`
}

const riskTone: Record<Expedition["risk"], string> = {
  Low: "text-[color:var(--color-lilac)]",
  Medium: "text-[color:var(--color-violet-bright)]",
  High: "text-[color:var(--color-danger)]",
}

export function ExpeditionCard({ exp }: { exp: Expedition }) {
  return (
    <article className="group rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/50 p-2.5 transition-colors hover:border-[color:var(--color-border)]">
      <header className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-[15px] font-medium text-[color:var(--color-foreground)]">
            {exp.label}
          </h4>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[13px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            {/* Ungated runs have no requiredSkill; don't render "req · undefined". */}
            <span>{exp.requiredSkill ? `req · ${exp.requiredSkill}` : "open to all"}</span>
            <span className="text-[color:var(--color-muted-2)]">·</span>
            <span>party {exp.suggestedParty}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={cn(
              "text-[14px] uppercase tracking-[0.2em]",
              riskTone[exp.risk],
            )}
          >
            {exp.risk}
          </span>
          <span className="text-[13px] text-[color:var(--color-muted)]">
            {formatDuration(exp.duration)}
          </span>
        </div>
      </header>

      <div className="my-1.5 hr-dashed" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {exp.tags.map((t) => (
            <span
              key={t}
              className="rounded-sm border border-[color:var(--color-border-soft)] px-1.5 py-[1px] text-[12px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-sm border border-[color:var(--color-cyan-muted)]/50 bg-[color:var(--color-cyan)]/10 px-2 py-[3px] text-[13px] uppercase tracking-[0.25em] text-[color:var(--color-cyan)] transition-all hover:text-glow-cyan hover:border-[color:var(--color-cyan)] hover:bg-[color:var(--color-cyan)]/20"
        >
          begin
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[color:var(--color-muted)]">
        <span className="uppercase tracking-[0.2em]">rewards</span>
        <span className="text-[color:var(--color-green)]">
          +{exp.rewards.xp} xp
        </span>
        <span className="text-[color:var(--color-muted-2)]">·</span>
        <span className="text-[color:var(--color-amber)]">
          {exp.rewards.tokens} tokens
        </span>
        <span className="text-[color:var(--color-muted-2)]">·</span>
        <span className="truncate text-[color:var(--color-cyan)]/80">
          {exp.rewards.materials.join(", ")}
        </span>
      </div>
    </article>
  )
}
