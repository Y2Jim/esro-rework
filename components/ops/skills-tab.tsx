"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

export function SkillsTab() {
  const skills = useEsroStore((s) => s.skills)
  const loadout = useEsroStore((s) => s.loadout)
  const toggleLoadout = useEsroStore((s) => s.toggleLoadout)

  const equipped = skills.filter((s) => loadout.includes(s.id))
  const available = skills.filter((s) => !loadout.includes(s.id) && !s.locked)

  return (
    <div className="space-y-4">
      {/* Loadout */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Loadout ({equipped.length}/4)
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => {
            const skill = equipped[i]
            return (
              <button
                key={i}
                type="button"
                onClick={() => skill && toggleLoadout(skill.id)}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors",
                  skill
                    ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 hover:bg-[color:var(--color-accent)]/20"
                    : "border-dashed border-[color:var(--color-border)]"
                )}
              >
                {skill ? (
                  <>
                    <span className="text-[10px] font-medium text-[color:var(--color-text)]">
                      {skill.label.slice(0, 6)}
                    </span>
                    <span className="text-[9px] text-[color:var(--color-muted)]">
                      Lv {skill.level}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] text-[color:var(--color-muted)]">—</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Available */}
      {available.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Available
          </div>
          
          <div className="space-y-1">
            {available.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleLoadout(skill.id)}
                disabled={loadout.length >= 4}
                className="flex w-full items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-left transition-colors hover:border-[color:var(--color-accent)]/50 disabled:opacity-50"
              >
                <div>
                  <span className="text-[11px] font-medium text-[color:var(--color-text)]">
                    {skill.label}
                  </span>
                  <span className="ml-2 text-[10px] text-[color:var(--color-muted)]">
                    Lv {skill.level}
                  </span>
                </div>
                <span className="text-[9px] text-[color:var(--color-accent)]">+</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
