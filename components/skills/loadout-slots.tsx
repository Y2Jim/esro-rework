"use client"

import { skills } from "@/lib/mock-data"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

export function LoadoutSlots({ loadout }: { loadout: string[] }) {
  const toggle = useEsroStore((s) => s.toggleLoadoutSkill)
  const slots = [0, 1, 2, 3].map((i) => {
    const id = loadout[i]
    return id ? skills.find((s) => s.id === id) ?? null : null
  })

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {slots.map((s, i) => {
        if (!s) {
          return (
            <div
              key={i}
              className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/30"
            >
              <span className="text-[18px] text-[color:var(--color-muted-2)]">
                +
              </span>
              <span className="text-[12px] uppercase tracking-[0.25em] text-[color:var(--color-muted-2)]">
                slot {i + 1}
              </span>
            </div>
          )
        }
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={cn(
              "relative flex aspect-square flex-col items-center justify-center rounded-md border bg-[color:var(--color-violet)]/10 p-1.5 text-center transition-all",
              "border-[color:var(--color-violet)]/50 hover:border-[color:var(--color-violet-bright)] hover:bg-[color:var(--color-violet)]/15",
            )}
            aria-label={`unequip ${s.label}`}
          >
            {s.variant && (
              <span
                aria-hidden
                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[color:var(--color-violet-bright)]"
              />
            )}
            <span className="text-[13px] uppercase tracking-[0.18em] text-[color:var(--color-violet-bright)] text-glow">
              {s.label.slice(0, 7)}
            </span>
            <span className="mt-0.5 text-[13px] text-[color:var(--color-lilac)]">
              lv {s.level}
            </span>
          </button>
        )
      })}
    </div>
  )
}
