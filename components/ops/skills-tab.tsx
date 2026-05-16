"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { SKILL_DEFINITIONS, STAT_LABELS, STAT_COLORS } from "@/lib/game-data"
import type { BaseStats } from "@/lib/types"

export function SkillsTab() {
  const skills = useEsroStore((s) => s.skills)
  const loadout = useEsroStore((s) => s.loadout)
  const toggleLoadout = useEsroStore((s) => s.toggleLoadout)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)
  
  const playerStats = getPlayerStats()
  
  /** Get linked stat info for a skill */
  const getSkillStatInfo = (skillLabel: string) => {
    const skillDef = SKILL_DEFINITIONS.find(sd => sd.name === skillLabel)
    if (!skillDef) return null
    const stat = skillDef.linkedStat as keyof BaseStats
    return {
      stat,
      label: STAT_LABELS[stat],
      color: STAT_COLORS[stat],
      value: playerStats[stat],
    }
  }

  const equipped = skills.filter((s) => loadout.includes(s.id))
  const available = skills.filter((s) => !loadout.includes(s.id) && !s.locked)

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 px-3 py-2">
        <span className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">Stats</span>
        <div className="flex gap-2">
          {(Object.keys(playerStats) as (keyof BaseStats)[]).map((stat) => (
            <div key={stat} className="flex items-center gap-1">
              <span 
                className="text-[10px] font-bold"
                style={{ color: STAT_COLORS[stat] }}
              >
                {playerStats[stat]}
              </span>
              <span 
                className="text-[8px]"
                style={{ color: `${STAT_COLORS[stat]}80` }}
              >
                {STAT_LABELS[stat]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loadout */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Loadout ({equipped.length}/4)
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => {
            const skill = equipped[i]
            const statInfo = skill ? getSkillStatInfo(skill.label) : null
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
                    {statInfo && (
                      <span 
                        className="mt-0.5 text-[7px] font-medium"
                        style={{ color: statInfo.color }}
                      >
                        {statInfo.label}
                      </span>
                    )}
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
            {available.map((skill) => {
              const statInfo = getSkillStatInfo(skill.label)
              return (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleLoadout(skill.id)}
                  disabled={loadout.length >= 4}
                  className="flex w-full items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-left transition-colors hover:border-[color:var(--color-accent)]/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-[11px] font-medium text-[color:var(--color-text)]">
                        {skill.label}
                      </span>
                      <span className="ml-2 text-[10px] text-[color:var(--color-muted)]">
                        Lv {skill.level}
                      </span>
                    </div>
                    {statInfo && (
                      <span 
                        className="rounded px-1 py-0.5 text-[8px] font-medium"
                        style={{ 
                          backgroundColor: `${statInfo.color}15`,
                          color: statInfo.color,
                        }}
                      >
                        {statInfo.label}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-[color:var(--color-accent)]">+</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
