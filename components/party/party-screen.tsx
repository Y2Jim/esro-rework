"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { PartySlot } from "./party-slot"
import type { PartyMember } from "@/lib/types"

export function PartyScreen() {
  const party = useEsroStore((s) => s.party)
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  
  // Update the player's own party entry with current profile data
  const partyWithUpdatedPlayer: (PartyMember | null)[] = party.map((m) => {
    // Check if this is the current player (leader or matching handle)
    if (m.leader || m.handle === identity.handle) {
      return {
        ...m,
        handle: profile.handle || identity.handle,
        title: profile.title?.label || m.title,
        titleRarity: profile.title?.rarity || m.titleRarity,
        avatar: identity.avatar,
      }
    }
    return m
  })
  
  const filled = partyWithUpdatedPlayer.length
  const slots = [0, 1, 2, 3].map((i) => partyWithUpdatedPlayer[i] ?? null)

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
              className="flex-1 rounded-sm border border-[color:var(--color-green-muted)]/50 bg-[color:var(--color-green)]/10 px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-green)] transition-colors hover:text-glow-green hover:border-[color:var(--color-green)] hover:bg-[color:var(--color-green)]/20"
            >
              share relay
            </button>
            <button
              type="button"
              className="flex-1 rounded-sm border border-[color:var(--color-danger-muted)]/40 px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-danger-muted)] transition-colors hover:border-[color:var(--color-danger)] hover:text-[color:var(--color-danger)]"
            >
              leave party
            </button>
          </div>
        </div>
      </ScreenSection>
    </ScreenScroll>
  )
}
