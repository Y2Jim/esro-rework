"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { getRituals } from "@/lib/rituals"
import { cn } from "@/lib/cn"
import { X, BookOpen } from "lucide-react"

/**
 * Pre-launch ritual prep — the Focus payoff, gated by attunement capacity.
 *
 * Shown between picking a site and launching, so the choice of which party
 * buffs to carry is made deliberately rather than buried in a settings screen.
 */
export function RitualPrep({
  expeditionName,
  onLaunch,
  onClose,
}: {
  expeditionName: string
  onLaunch: (ritualIds: string[]) => void
  onClose: () => void
}) {
  const profile = useEsroStore((s) => s.profile)
  const prepared = useEsroStore((s) => s.preparedRituals)
  const toggleRitual = useEsroStore((s) => s.toggleRitual)
  const { capacity, used } = useEsroStore((s) => s.getAttunement())

  const known = getRituals(profile?.knownRituals)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-xs flex-col rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-panel)] shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[color:var(--color-border)] px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[15px] font-medium text-[color:var(--color-text)]">
              <BookOpen className="h-3.5 w-3.5" />
              Prepare Rituals
            </div>
            <div className="truncate text-[13px] text-[color:var(--color-muted)]">
              {expeditionName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ritual preparation"
            className="text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Attunement meter */}
        <div className="border-b border-[color:var(--color-border)] px-3 py-2">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-[color:var(--color-muted)]">Attunement</span>
            <span className="tabular-nums text-[color:var(--color-text)]">
              {used}/{capacity}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <div
              className="h-full bg-[color:var(--color-accent)] transition-all"
              style={{ width: `${capacity > 0 ? (used / capacity) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-1 text-[12px] text-[color:var(--color-muted-2)]">
            Capacity comes from Focus. Rituals buff the whole party for the run.
          </div>
        </div>

        {/* Ritual list */}
        <div
          className="flex-1 overflow-y-auto px-3 py-2"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
        >
          {known.length === 0 ? (
            <div className="py-4 text-center text-[13px] text-[color:var(--color-muted)]">
              No rituals known.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {known.map((r) => {
                const on = prepared.includes(r.id)
                // Grey out what will not fit, so the limit is legible before clicking.
                const wontFit = !on && used + r.attunement > capacity
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRitual(r.id)}
                    disabled={wontFit}
                    aria-pressed={on}
                    className={cn(
                      "rounded border px-2 py-1.5 text-left transition-colors",
                      on
                        ? "border-[color:var(--color-accent)]/60 bg-[color:var(--color-accent)]/10"
                        : wontFit
                          ? "cursor-not-allowed border-[color:var(--color-border-soft)] opacity-50"
                          : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/40",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "text-[14px]",
                          on
                            ? "text-[color:var(--color-accent)]"
                            : "text-[color:var(--color-text)]",
                        )}
                      >
                        {r.label}
                      </span>
                      <span className="shrink-0 text-[12px] text-[color:var(--color-muted-2)]">
                        {r.attunement} att
                      </span>
                    </div>
                    <div className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
                      {r.description}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Launch */}
        <div className="border-t border-[color:var(--color-border)] px-3 py-2">
          <button
            type="button"
            onClick={() => onLaunch(prepared)}
            className="w-full rounded bg-[color:var(--color-accent)] px-3 py-2 text-[14px] font-medium uppercase tracking-wider text-black transition-opacity hover:opacity-90"
          >
            Launch{prepared.length > 0 ? ` with ${prepared.length}` : " without rituals"}
          </button>
        </div>
      </div>
    </div>
  )
}
