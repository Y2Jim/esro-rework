"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { RITUALS, getRituals } from "@/lib/rituals"
import { BookOpen, Lock } from "lucide-react"

/**
 * The ritual codex: what the character can invoke, and what is still out there.
 *
 * Locked entries are shown deliberately — the whole point of ritual books is
 * that they are a reason to push down hidden routes, which only works if the
 * player can see what they are hunting for.
 */
export function KnownRituals() {
  const profile = useEsroStore((s) => s.profile)
  // Focus is a primitive so selecting it directly is safe, but getAttunement()
  // returns a new object each call and must be invoked during render instead.
  const focus = useEsroStore((s) => s.getPlayerStats().focus)
  const getAttunement = useEsroStore((s) => s.getAttunement)
  const attunement = getAttunement()
  const hasRitualism = useEsroStore((s) => s.hasRitualism())

  if (!profile) return null

  const known = getRituals(profile.knownRituals)
  // Books can be looted by anyone, but only Ritualism can actually prepare them.
  // The panel stays visible either way so the skill's payoff is legible.
  const locked = RITUALS.filter((r) => !(profile.knownRituals ?? []).includes(r.id))
  // Locked rituals are identified only by where they come from, and several
  // share a source. Listing each one repeats the same line, so group by source
  // and show a count instead — same information, without looking like a bug.
  const lockedBySource = [...new Set(locked.map((r) => r.source ?? "Unknown origin"))].map(
    (source) => ({
      source,
      count: locked.filter((r) => (r.source ?? "Unknown origin") === source).length,
    }),
  )

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          <BookOpen className="h-3.5 w-3.5" />
          Rituals
        </div>
        {/* Capacity is the Focus payoff, so it is stated plainly. */}
        <span className="text-[13px] text-[color:var(--color-muted)]">
          Attunement {attunement.capacity}{" "}
          <span className="text-[color:var(--color-muted-2)]">(FOC {focus})</span>
        </span>
      </div>

      {!hasRitualism && (
        <div className="mt-2 flex items-center gap-1.5 rounded border border-[color:var(--color-amber)]/30 bg-[color:var(--color-amber)]/5 px-2 py-1.5 text-[13px] text-[color:var(--color-amber)]">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Requires Ritualism to prepare on expeditions.</span>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1.5">
        {known.map((r) => (
          <div key={r.id} className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] text-[color:var(--color-text)]">{r.label}</span>
              <span className="shrink-0 text-[12px] text-[color:var(--color-muted-2)]">
                {r.attunement} att
              </span>
            </div>
            <div className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
              {r.description}
            </div>
          </div>
        ))}
      </div>

      {locked.length > 0 && (
        <div className="mt-2 border-t border-[color:var(--color-border)] pt-2">
          <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted-2)]">
            Undiscovered ({locked.length})
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {lockedBySource.map(({ source, count }) => (
              <div
                key={source}
                className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-muted-2)]"
              >
                <Lock className="h-3 w-3 shrink-0" />
                <span className="truncate">{source}</span>
                {count > 1 && <span className="shrink-0">×{count}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
