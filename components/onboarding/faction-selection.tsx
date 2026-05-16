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

function FactionEmblem({ faction, selected, locked, size = "lg" }: { 
  faction: FactionData
  selected: boolean
  locked?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const sizeClasses = {
    sm: "h-12 w-12 text-xl",
    md: "h-16 w-16 text-2xl",
    lg: "h-24 w-24 text-4xl",
    xl: "h-32 w-32 text-5xl",
  }
  
  return (
    <motion.div
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0, repeatDelay: 1 }}
      className={`relative flex items-center justify-center rounded-xl font-bold transition-all ${sizeClasses[size]} ${
        locked ? "opacity-40 grayscale" : ""
      }`}
      style={{ 
        backgroundColor: locked ? "rgba(100,100,100,0.2)" : `${faction.color}15`,
        color: locked ? "#666" : faction.color,
        boxShadow: selected && !locked ? `0 0 40px ${faction.glow}, 0 0 80px ${faction.glow}` : undefined,
        border: `2px solid ${locked ? "rgba(100,100,100,0.3)" : selected ? faction.color : "transparent"}`,
      }}
    >
      {/* Inner glow effect */}
      {selected && !locked && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ 
            background: `radial-gradient(circle at center, ${faction.glow} 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <span className="relative z-10">{faction.emblem}</span>
      
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
          <Lock className="h-6 w-6 text-white/60" />
        </div>
      )}
    </motion.div>
  )
}

export function FactionSelection({ playerLevel, currentFaction, onComplete, onCancel }: FactionSelectionProps) {
  const [step, setStep] = useState<FactionSelectionStep>("intro")
  const [selectedFaction, setSelectedFaction] = useState<FactionData | null>(currentFaction || null)
  const [hoveredFaction, setHoveredFaction] = useState<FactionData | null>(null)

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

  const displayFaction = hoveredFaction || selectedFaction

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b0f]">
      {/* Scanline effect */}
      <div 
        className="pointer-events-none fixed inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 123, 255, 0.015) 2px, rgba(168, 123, 255, 0.015) 4px)",
          zIndex: 100,
        }}
      />

      {/* Progress */}
      <div className="p-4 border-b border-[rgba(168,123,255,0.1)]">
        <div className="flex items-center justify-center gap-2">
          {["intro", "selection", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-12 rounded-full transition-colors ${
                step === s
                  ? "bg-[color:var(--color-accent)]"
                  : ["intro", "selection", "confirm"].indexOf(step) > i
                  ? "bg-[color:var(--color-accent)]/50"
                  : "bg-[rgba(255,255,255,0.1)]"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
          {step === "intro" && "Faction Introduction"}
          {step === "selection" && "Choose Allegiance"}
          {step === "confirm" && "Confirm Faction"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-lg"
            >
              {/* All emblems showcase */}
              <div className="mb-8 flex items-center justify-center gap-6">
                {FACTIONS.map((faction, i) => (
                  <motion.div
                    key={faction.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                  >
                    <FactionEmblem faction={faction} selected={false} locked={isLocked} size="md" />
                  </motion.div>
                ))}
              </div>

              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-6 text-center">
                <h2 className="mb-4 text-2xl font-bold text-[color:var(--color-accent)]">
                  Faction Allegiance
                </h2>
                
                {isLocked ? (
                  <>
                    <div className="mb-4 flex items-center justify-center gap-2 text-amber-400">
                      <Lock className="h-5 w-5" />
                      <span className="font-medium">Locked until Level {FACTION_UNLOCK_LEVEL}</span>
                    </div>
                    <p className="text-sm text-[color:var(--color-text-secondary)] leading-relaxed">
                      Faction allegiance becomes available once you reach Level {FACTION_UNLOCK_LEVEL}. 
                      Continue running expeditions and building your skills to unlock this feature.
                    </p>
                    <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
                      Current Level: {playerLevel} / {FACTION_UNLOCK_LEVEL}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[color:var(--color-text-secondary)] leading-relaxed">
                      Your journey has proven your worth. The time has come to pledge allegiance to one of the four great factions. 
                      Each faction offers unique bonuses, themed UI colors, and exclusive content.
                    </p>
                    <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
                      Choosing a faction will change your ESRO interface to match your allegiance.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Selection */}
          {step === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-2xl"
            >
              {/* Info panel */}
              <AnimatePresence mode="wait">
                {displayFaction && (
                  <motion.div
                    key={displayFaction.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-lg border p-4 text-center"
                    style={{
                      borderColor: `${displayFaction.color}40`,
                      backgroundColor: displayFaction.colorVars.bg,
                    }}
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-2xl" style={{ color: displayFaction.color }}>
                        {displayFaction.emblem}
                      </span>
                      <h3 className="text-xl font-bold" style={{ color: displayFaction.color }}>
                        {displayFaction.name}
                      </h3>
                    </div>
                    <p className="text-sm text-[color:var(--color-text-secondary)] italic mb-2">
                      &quot;{displayFaction.motto}&quot;
                    </p>
                    <p className="text-sm text-[color:var(--color-text-secondary)]">
                      {displayFaction.lore}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Faction grid */}
              <div className="grid grid-cols-2 gap-4">
                {FACTIONS.map((faction) => (
                  <button
                    key={faction.id}
                    onClick={() => setSelectedFaction(faction)}
                    onMouseEnter={() => setHoveredFaction(faction)}
                    onMouseLeave={() => setHoveredFaction(null)}
                    className={`relative rounded-xl border p-6 text-left transition-all ${
                      selectedFaction?.id === faction.id
                        ? "ring-2 ring-offset-2 ring-offset-black"
                        : "hover:scale-[1.02]"
                    }`}
                    style={{
                      borderColor: selectedFaction?.id === faction.id ? faction.color : "rgba(255,255,255,0.1)",
                      backgroundColor: selectedFaction?.id === faction.id ? faction.colorVars.bg : "rgba(15,16,22,0.8)",
                      boxShadow: selectedFaction?.id === faction.id ? `0 0 30px ${faction.glow}` : undefined,
                      ["--tw-ring-color" as string]: faction.color,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <FactionEmblem 
                        faction={faction} 
                        selected={selectedFaction?.id === faction.id} 
                        size="md" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg" style={{ color: faction.color }}>
                          {faction.name}
                        </h3>
                        <p className="mt-1 text-xs text-[color:var(--color-text-muted)] italic">
                          {faction.motto}
                        </p>
                      </div>
                    </div>
                    
                    {selectedFaction?.id === faction.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: faction.color }}
                      >
                        <Check className="h-4 w-4 text-black" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirm */}
          {step === "confirm" && selectedFaction && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 flex justify-center"
              >
                <FactionEmblem faction={selectedFaction} selected={true} size="xl" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 
                  className="text-3xl font-bold mb-2"
                  style={{ color: selectedFaction.color }}
                >
                  {selectedFaction.name}
                </h2>
                <p className="text-lg text-[color:var(--color-text-secondary)] italic mb-4">
                  &quot;{selectedFaction.motto}&quot;
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-4 text-left"
              >
                <div className="mb-3 text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                  Faction Benefits
                </div>
                <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Themed UI colors matching your allegiance
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Faction badge displayed on your profile
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Bonus rewards on faction-aligned expeditions
                  </li>
                  <li className="flex items-center gap-2">
                    <span style={{ color: selectedFaction.color }}>+</span>
                    Access to exclusive faction projects
                  </li>
                </ul>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 text-xs text-[color:var(--color-text-muted)]"
              >
                You can change your UI theme in Settings without changing factions.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t border-[rgba(168,123,255,0.1)] p-4">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <button
            onClick={prevStep}
            className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-sm text-[color:var(--color-text-secondary)] transition-colors hover:border-[rgba(255,255,255,0.2)]"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === "intro" ? "Cancel" : "Back"}
          </button>
          <button
            onClick={nextStep}
            disabled={isLocked || (step === "selection" && !selectedFaction)}
            className="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: step === "confirm" && selectedFaction 
                ? selectedFaction.color 
                : "var(--color-accent)",
            }}
          >
            {step === "confirm" ? "Pledge Allegiance" : "Continue"}
            {step !== "confirm" && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
