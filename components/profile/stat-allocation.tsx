"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { STAT_COLORS, STAT_LABELS } from "@/lib/game-data"
import { ALLOCATABLE_STATS, spentPoints } from "@/lib/leveling"
import { cn } from "@/lib/cn"
import { RotateCcw } from "lucide-react"

/**
 * Level-up stat spending, plus the sub-stats those core stats feed.
 *
 * The sub-stat readout matters as much as the buttons: the expedition sim has
 * always rolled checks against these derived pairs, but nothing surfaced them,
 * so a point spent on Focus had no visible consequence anywhere in the UI.
 */
export function StatAllocation() {
  const profile = useEsroStore((s) => s.profile)
  const playerStats = useEsroStore((s) => s.getPlayerStats())
  const derived = useEsroStore((s) => s.getDerivedStats())
  const allocateStat = useEsroStore((s) => s.allocateStat)
  const respecStats = useEsroStore((s) => s.respecStats)

  if (!profile) return null

  const points = profile.statPoints ?? 0
  const spent = spentPoints(profile.allocated)

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        points > 0
          ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/5"
          : "border-[color:var(--color-border)]",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Attributes
        </div>
        {points > 0 ? (
          <span className="rounded bg-[color:var(--color-accent)]/20 px-2 py-0.5 text-[13px] font-bold text-[color:var(--color-accent)]">
            {points} point{points === 1 ? "" : "s"} to spend
          </span>
        ) : (
          <span className="text-[13px] text-[color:var(--color-muted-2)]">All points spent</span>
        )}
      </div>

      {/* Core stats — HP is intentionally absent; it is derived from DEF. */}
      <div className="mt-3 flex flex-col gap-1.5">
        {ALLOCATABLE_STATS.map((stat) => {
          const invested = profile.allocated?.[stat] ?? 0
          return (
            <div
              key={stat}
              className="flex items-center gap-3 rounded bg-[color:var(--color-panel)]/50 px-2 py-1.5"
            >
              <span
                className="w-10 text-[13px] font-medium uppercase"
                style={{ color: STAT_COLORS[stat] }}
              >
                {STAT_LABELS[stat]}
              </span>
              <span className="text-[16px] font-bold tabular-nums" style={{ color: STAT_COLORS[stat] }}>
                {playerStats[stat]}
              </span>
              {invested > 0 && (
                <span className="text-[13px] text-[color:var(--color-muted-2)]">+{invested} spent</span>
              )}
              <button
                type="button"
                onClick={() => allocateStat(stat)}
                disabled={points === 0}
                aria-label={`Spend a point on ${STAT_LABELS[stat]}`}
                className={cn(
                  "ml-auto flex h-6 w-6 items-center justify-center rounded text-[16px] font-bold transition-colors",
                  points > 0
                    ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/35"
                    : "cursor-not-allowed bg-[color:var(--color-border)]/40 text-[color:var(--color-muted-2)]",
                )}
              >
                +
              </button>
            </div>
          )
        })}
      </div>

      {/* Derived sub-stats: what expedition checks actually roll against. */}
      <div className="mt-3 border-t border-[color:var(--color-border)] pt-2">
        <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Derived
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {derived.map((d) => (
            <div
              key={d.label}
              className="flex items-baseline justify-between rounded bg-[color:var(--color-panel)]/40 px-2 py-1"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] text-[color:var(--color-text)]">{d.label}</div>
                <div className="text-[12px] text-[color:var(--color-muted-2)]">{d.from}</div>
              </div>
              <span className="text-[15px] font-bold tabular-nums text-[color:var(--color-text)]">
                {Math.round(d.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {spent > 0 && (
        <button
          type="button"
          onClick={respecStats}
          className="mt-2 flex items-center gap-1.5 text-[13px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
        >
          <RotateCcw className="h-3 w-3" />
          Refund {spent} point{spent === 1 ? "" : "s"}
        </button>
      )}
    </div>
  )
}
