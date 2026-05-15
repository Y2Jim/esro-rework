"use client"

import { useState } from "react"
import { cn } from "@/lib/cn"
import { RACES, FACTION_UNLOCK_LEVEL } from "@/lib/game-data"
import type { Race } from "@/lib/types"

interface FactionIntroProps {
  playerLevel: number
  onSelectFaction: (race: Race) => void
}

export function FactionIntro({ playerLevel, onSelectFaction }: FactionIntroProps) {
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const isLocked = playerLevel < FACTION_UNLOCK_LEVEL

  // Show locked state
  if (isLocked) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[color:var(--color-muted)]/40">
          <span className="text-3xl text-[color:var(--color-muted)]/60">⬡</span>
        </div>
        <div className="text-center">
          <div className="text-[13px] font-medium text-[color:var(--color-text)]">Factions Locked</div>
          <div className="mt-2 max-w-[220px] text-[11px] leading-relaxed text-[color:var(--color-muted)]">
            Reach level {FACTION_UNLOCK_LEVEL} to unlock faction selection. Your allegiance will shape your path through the frontier.
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-[10px] text-[color:var(--color-muted)]">
            <span>Level {playerLevel}</span>
            <span className="text-[color:var(--color-muted)]/40">/</span>
            <span className="text-[color:var(--color-accent)]">{FACTION_UNLOCK_LEVEL}</span>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation modal
  if (showConfirm && selectedRace) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-6">
        {/* Large emblem */}
        <div 
          className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ 
            backgroundColor: `${selectedRace.color}15`,
            boxShadow: `0 0 40px ${selectedRace.glow}, 0 0 80px ${selectedRace.glow}`,
            border: `2px solid ${selectedRace.color}50`
          }}
        >
          <span 
            className="text-5xl"
            style={{ color: selectedRace.color, textShadow: `0 0 20px ${selectedRace.glow}` }}
          >
            {selectedRace.emblem}
          </span>
        </div>

        <div className="text-center">
          <div 
            className="text-[14px] font-medium"
            style={{ color: selectedRace.color }}
          >
            Join {selectedRace.name}?
          </div>
          <div className="mx-auto mt-2 max-w-[260px] text-[10px] leading-relaxed text-[color:var(--color-muted)]">
            Your UI theme will change to reflect your faction allegiance. You can change this later in profile settings.
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onSelectFaction(selectedRace)}
            className="rounded px-4 py-2 text-[11px] font-medium transition-colors"
            style={{ 
              backgroundColor: `${selectedRace.color}20`,
              color: selectedRace.color,
              border: `1px solid ${selectedRace.color}50`
            }}
          >
            Confirm Allegiance
          </button>
        </div>
      </div>
    )
  }

  // Main faction selection
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-3 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">Choose Your Allegiance</div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Your faction shapes your identity on the frontier
        </div>
      </div>

      {/* Faction grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="grid gap-2">
          {RACES.map((race) => {
            const isSelected = selectedRace?.id === race.id
            return (
              <button
                key={race.id}
                type="button"
                onClick={() => setSelectedRace(race)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-3 text-left transition-all",
                  isSelected 
                    ? "border-[color:var(--color-border)]" 
                    : "border-[color:var(--color-border)] hover:border-[color:var(--color-border)]"
                )}
                style={isSelected ? { 
                  borderColor: `${race.color}50`,
                  backgroundColor: `${race.color}08`
                } : undefined}
              >
                {/* Glow effect on selection */}
                {isSelected && (
                  <div 
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{ 
                      background: `radial-gradient(circle at 20% 50%, ${race.glow} 0%, transparent 60%)`
                    }}
                  />
                )}

                <div className="relative flex gap-3">
                  {/* Emblem */}
                  <div 
                    className={cn(
                      "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-all",
                      isSelected ? "scale-105" : "opacity-70 group-hover:opacity-100"
                    )}
                    style={{ 
                      backgroundColor: `${race.color}15`,
                      border: `1px solid ${race.color}30`
                    }}
                  >
                    <span 
                      className="text-2xl"
                      style={{ 
                        color: race.color,
                        textShadow: isSelected ? `0 0 10px ${race.glow}` : undefined
                      }}
                    >
                      {race.emblem}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[12px] font-medium"
                        style={{ color: isSelected ? race.color : "var(--color-text)" }}
                      >
                        {race.name}
                      </span>
                      <span 
                        className="rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider"
                        style={{ 
                          backgroundColor: `${race.color}20`,
                          color: race.color
                        }}
                      >
                        {race.icon}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                      {race.role}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[color:var(--color-muted-2)]">
                      {race.summary}
                    </div>
                  </div>
                </div>

                {/* Expanded details on selection */}
                {isSelected && (
                  <div className="relative mt-3 border-t border-[color:var(--color-border)]/50 pt-3">
                    <div className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">Affinity</div>
                    <div className="mt-1 text-[10px] leading-relaxed text-[color:var(--color-text)]">
                      {race.affinity}
                    </div>

                    {/* Stat bonuses */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(race.stats).map(([stat, value]) => {
                        if (value === 0) return null
                        const statLabels: Record<string, string> = {
                          hp: "HP",
                          atk: "ATK",
                          def: "DEF",
                          focus: "FOC",
                          luck: "LCK"
                        }
                        return (
                          <span 
                            key={stat}
                            className="rounded px-1.5 py-0.5 text-[9px]"
                            style={{ 
                              backgroundColor: `${race.color}15`,
                              color: race.color
                            }}
                          >
                            +{value} {statLabels[stat]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom action */}
      {selectedRace && (
        <div className="border-t border-[color:var(--color-border)] p-3">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="w-full rounded py-2 text-[11px] font-medium transition-colors"
            style={{ 
              backgroundColor: `${selectedRace.color}20`,
              color: selectedRace.color,
              border: `1px solid ${selectedRace.color}40`
            }}
          >
            Select {selectedRace.name}
          </button>
        </div>
      )}
    </div>
  )
}
