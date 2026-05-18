"use client"

import { expeditions, activeExpedition } from "@/lib/mock-data"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { ExpeditionCard } from "./expedition-card"
import { ActiveExpeditionPanel } from "./active-expedition"
import { useEsroStore } from "@/store/use-esro-store"

export function ExpeditionScreen() {
  const loadout = useEsroStore((s) => s.loadout)

  return (
    <ScreenScroll className="pb-3">
      <ActiveExpeditionPanel active={activeExpedition} />

      <ScreenSection
        title="loadout summary"
        right={
          <span className="text-[13px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {loadout.length}/4 equipped
          </span>
        }
      >
        <div className="flex flex-wrap gap-1">
          {loadout.length === 0 && (
            <div className="rounded-md border border-dashed border-[color:var(--color-border-soft)] px-2.5 py-1.5 text-[14px] text-[color:var(--color-muted)]">
              no skills equipped · open skills page
            </div>
          )}
          {loadout.map((id) => (
            <span
              key={id}
              className="rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/60 px-2 py-[2px] text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-lilac)]"
            >
              {id}
            </span>
          ))}
        </div>
      </ScreenSection>

      <ScreenSection
        title="expedition ledger"
        right={
          <span className="text-[13px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {expeditions.length} runs
          </span>
        }
      >
        <ul className="flex flex-col gap-1.5">
          {expeditions.map((e) => (
            <li key={e.id}>
              <ExpeditionCard exp={e} />
            </li>
          ))}
        </ul>
      </ScreenSection>
    </ScreenScroll>
  )
}
