"use client"

import { party } from "@/lib/mock-data"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { PartySlot } from "./party-slot"

export function PartyScreen() {
  const filled = party.length
  const slots = [0, 1, 2, 3].map((i) => party[i] ?? null)

  return (
    <ScreenScroll className="pb-3">
      <ScreenSection
        title="active party"
        right={
          <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {filled}/4
          </span>
        }
      >
        <ul className="flex flex-col gap-1.5">
          {slots.map((m, i) => (
            <li key={i}>
              <PartySlot member={m} slot={i + 1} />
            </li>
          ))}
        </ul>
      </ScreenSection>

      <ScreenSection title="coordination">
        <div className="rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/50 p-2.5">
          <div className="text-[10.5px] leading-relaxed text-[color:var(--color-foreground)]/80">
            Party relay is synchronized. Members on this channel receive shared
            expedition logs and reward claims.
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              className="flex-1 rounded-sm border border-[color:color-mix(in_oklab,var(--color-violet)_50%,transparent)] px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-violet-bright)] transition-colors hover:text-glow"
            >
              share relay
            </button>
            <button
              type="button"
              className="flex-1 rounded-sm border border-[color:var(--color-border-soft)] px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)]"
            >
              leave party
            </button>
          </div>
        </div>
      </ScreenSection>
    </ScreenScroll>
  )
}
