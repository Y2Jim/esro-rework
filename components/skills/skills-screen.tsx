"use client"

import { skills } from "@/lib/mock-data"
import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { useEsroStore } from "@/store/use-esro-store"
import { LoadoutSlots } from "./loadout-slots"
import { SkillCard } from "./skill-card"

export function SkillsScreen() {
  const loadout = useEsroStore((s) => s.loadout)
  const toggle = useEsroStore((s) => s.toggleLoadoutSkill)

  const unlocked = skills.filter((s) => !s.locked)
  const locked = skills.filter((s) => s.locked)

  return (
    <ScreenScroll className="pb-3">
      <ScreenSection
        title="equipped loadout"
        right={
          <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            select 4
          </span>
        }
      >
        <LoadoutSlots loadout={loadout} />
      </ScreenSection>

      <ScreenSection
        title="available · operator relay"
        right={
          <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {unlocked.length} unlocked
          </span>
        }
      >
        <ul className="grid grid-cols-1 gap-1.5">
          {unlocked.map((s) => (
            <li key={s.id}>
              <SkillCard
                skill={s}
                selected={loadout.includes(s.id)}
                onToggle={() => toggle(s.id)}
                full={loadout.length >= 4 && !loadout.includes(s.id)}
              />
            </li>
          ))}
        </ul>
      </ScreenSection>

      <ScreenSection
        title="locked · requires archive key"
        right={
          <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            {locked.length}
          </span>
        }
      >
        <ul className="grid grid-cols-1 gap-1.5">
          {locked.map((s) => (
            <li key={s.id}>
              <SkillCard skill={s} selected={false} onToggle={() => {}} />
            </li>
          ))}
        </ul>
      </ScreenSection>
    </ScreenScroll>
  )
}
