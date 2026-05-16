"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Lock } from "lucide-react"
import { FACTIONS, FACTION_UNLOCK_LEVEL } from "@/lib/game-data"
import type { FactionData, FactionSelectionStep, RaceId } from "@/lib/types"

interface FactionSelectionProps {
  playerLevel: number
  currentFaction?: FactionData | null
  onComplete: (factionId: RaceId) => void
  onCancel?: () => void
}

function FactionEmblem({ faction, selected, locked, size = "md" }: { 
  faction: FactionData
  selected: boolean
  locked?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-10 w-10 text-lg",
    md: "h-14 w-14 text-2xl",
    lg: "h-20 w-20 text-3xl",
  }
  
  return (
    <motion.div
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0, repeatDelay: 1 }}
      className={`relative flex items-center justify-center rounded-lg font-bold transition-all ${sizeClasses[size]} ${
        locked ? "opacity-40 grayscale" : ""
      }`}
      style={{ 
        backgroundColor: locked ? "rgba(100,100,100,0.2)" : `${faction.color}18`,
        color: locked ? "#666" : faction.color,
        boxShadow: selected && !locked ? `0 0 24px ${faction.glow}` : undefined,
        border: `2px solid ${locked ? "rgba(100,100,100,0.3)" : selected ? faction.color : `${faction.color}30`}`,
      }}
    >
      {/* Inner glow effect */}
      {selected && !locked && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{ 
            background: `radial-gradient(circle at center, ${faction.glow} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <span className="relative z-10">{faction.emblem}</span>
      
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
          <Lock className="h-4 w-4 text-white/60" />
        </div>
      )}
    </motion.div>
  )
}

export function FactionSelection({ playerLevel, currentFaction, onComplete, onCancel }: FactionSelectionProps) {
  const [step, setStep] = useState<FactionSelectionStep>("intro")
  const [selectedFaction, setSelectedFaction] = useState<FactionData | null>(currentFaction || null)

  const isLocked = playerLevel < FACTION_UNLOCK_LEVEL

  const nextStep = () => {
    switch (step) {
      case "intro":
        setStep("selection")
        break
      case "selection":
        if (selectedFaction) {
          setStep("confirm")
        }
        break
      case "confirm":
        if (selectedFaction) {
          onComplete(selectedFaction.id)
        }
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case "intro":
        onCancel?.()
        break
      case "selection":
        setStep("intro")
        break
      case "confirm":
        setStep("selection")
        break
    }
  }

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)]">
      {/* Header with progress */}
      <div className="shrink-0 border-b border-[color:var(--color-border)] px-3 py-2">
        <div className="flex items-center justify-center gap-1.5">
          {["intro", "selection", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1 w-8 rounded-full transition-colors ${
                step === s
                  ? "bg-[color:var(--color-accent)]"
                  : ["intro", "selection", "confirm"].indexOf(step) > i
                  ? "bg-[color:var(--color-accent)]/50"
                  : "bg-[color:var(--color-border)]"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-center text-[9px] text-[color:var(--color-muted)] uppercase tracking-wider">
          {step === "intro" && "Faction Introduction"}
          {step === "selection" && "Choose Allegiance"}
          {step === "confirm" && "Confirm Faction"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* All emblems showcase */}
              <div className="flex items-center justify-center gap-3">
                {FACTIONS.map((faction, i) => (
                  <motion.div
                    key={faction.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                  >
                    <FactionEmblem faction={faction} selected={false} locked={isLocked} size="sm" />
                  </motion.div>
                ))}
              </div>

              <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/50 p-4 text-center">
                <h2 className="mb-3 text-lg font-bold text-[color:var(--color-accent)]">
                  Faction Allegiance
                </h2>
                
                {isLocked ? (
                  <>
                    <div className="mb-3 flex items-center justify-center gap-2 text-amber-400 text-sm">
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">Locked until Level {FACTION_UNLOCK_LEVEL}</span>
                    </div>
                    <p className="text-[11px] text-[color:var(--color-muted)] leading-relaxed">
                      Faction allegiance becomes available once you reach Level {FACTION_UNLOCK_LEVEL}. 
                      Continue running expeditions to unlock.
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                      <div
                        className="h-full bg-amber-500/60"
                        style={{ width: `${(playerLevel / FACTION_UNLOCK_LEVEL) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[9px] text-[color:var(--color-muted)]">
                      Level {playerLevel} / {FACTION_UNLOCK_LEVEL}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-[color:var(--color-text-secondary)] leading-relaxed">
                      Your journey has proven your worth. The time has come to pledge allegiance to one of the four great factions. 
                      Each offers unique bonuses and themed UI.
                    </p>
                  </>
                )}
              </div>

              {/* Faction previews */}
              {!isLocked && (
                <div className="space-y-2">
                  {FACTIONS.map((faction) => (
                    <div
                      key={faction.id}
                      className="rounded-lg border p-2"
                      style={{
                        borderColor: `${faction.color}30`,
                        backgroundColor: faction.colorVars.bg,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg" style={{ color: faction.color }}>{faction.emblem}</span>
                        <span className="text-[11px] font-medium" style={{ color: faction.color }}>{faction.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Selection */}
          {step === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {FACTIONS.map((faction) => {
                const isSelected = selectedFaction?.id === faction.id
                return (
                  <button
                    key={faction.id}
                    onClick={() => setSelectedFaction(faction)}
                    className={`relative w-full rounded-lg border p-3 text-left transition-all ${
                      isSelected ? "ring-1" : ""
                    }`}
                    style={{
                      borderColor: isSelected ? faction.color : `${faction.color}30`,
                      backgroundColor: isSelected ? faction.colorVars.bg : "transparent",
                      boxShadow: isSelected ? `0 0 16px ${faction.glow}` : undefined,
                      ["--tw-ring-color" as string]: faction.color,
                    }}
                  >
                    {/* Header row with emblem and name */}
                    <div className="flex items-center gap-3">
                      <FactionEmblem 
                        faction={faction} 
                        selected={isSelected} 
                        size="sm" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[12px]" style={{ color: faction.color }}>
                          {faction.name}
                        </h3>
                        <p className="text-[9px] text-[color:var(--color-muted)] italic">
                          &quot;{faction.motto}&quot;
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: faction.color }}
                        >
                          <Check className="h-3 w-3 text-black" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Full description */}
                    <p className="mt-2 text-[10px] text-[color:var(--color-text-secondary)] leading-relaxed">
                      {faction.lore}
                    </p>
                    
                    {/* Faction bonus */}
                    <div 
                      className="mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-[9px] font-medium"
                      style={{ 
                        backgroundColor: `${faction.color}15`,
                        color: faction.color,
                      }}
                    >
                      <span>★</span>
                      {faction.bonus}
                    </div>
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* Confirm */}
          {step === "confirm" && selectedFaction && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-center"
              >
                <FactionEmblem faction={selectedFaction} selected={true} size="lg" />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 
                  className="text-xl font-bold mb-1"
                  style={{ color: selectedFaction.color }}
                >
                  {selectedFaction.name}
                </h2>
                <p className="text-[11px] text-[color:var(--color-text-secondary)] italic">
                  &quot;{selectedFaction.motto}&quot;
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg border p-3 text-left"
                style={{ 
                  borderColor: `${selectedFaction.color}40`,
                  backgroundColor: selectedFaction.colorVars.bg,
                }}
              >
                <div className="mb-2 text-[9px] text-[color:var(--color-muted)] uppercase tracking-wider">
                  Faction Bonus
                </div>
                <div 
                  className="flex items-center gap-2 text-[11px] font-medium mb-3"
                  style={{ color: selectedFaction.color }}
                >
                  <span className="text-[14px]">★</span>
                  {selectedFaction.bonus}
                </div>
                
                <div className="mb-2 text-[9px] text-[color:var(--color-muted)] uppercase tracking-wider">
                  Additional Benefits
                </div>
                <ul className="space-y-1.5 text-[10px] text-[color:var(--color-text-secondary)]">
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Themed UI colors
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Faction badge on profile
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Access to faction projects
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Bonus standing on aligned expeditions
                  </li>
                </ul>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[9px] text-[color:var(--color-muted)]"
              >
                Theme can be changed in Settings without changing faction.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="shrink-0 border-t border-[color:var(--color-border)] p-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={prevStep}
            className="flex items-center gap-1 rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-[10px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)]/50"
          >
            <ChevronLeft className="h-3 w-3" />
            {step === "intro" ? "Cancel" : "Back"}
          </button>
          <button
            onClick={nextStep}
            disabled={isLocked || (step === "selection" && !selectedFaction)}
            className="flex items-center gap-1 rounded-lg px-4 py-1.5 text-[10px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: step === "confirm" && selectedFaction 
                ? selectedFaction.color 
                : "var(--color-accent)",
            }}
          >
            {step === "confirm" ? "Pledge Allegiance" : "Continue"}
            {step !== "confirm" && <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  )
}
