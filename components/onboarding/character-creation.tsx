"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Zap, Shield, Heart, Eye, Sparkles } from "lucide-react"
import { RACES, COURIERS, ONBOARDING_PANELS, SKILL_DEFINITIONS, STARTER_SKILL_COUNT, calculateCombinedStats, type SkillDefinition } from "@/lib/game-data"
import type { Race, Courier, CharacterCreationStep, BaseStats } from "@/lib/types"

interface CharacterCreationProps {
  onComplete: (data: {
    race: Race
    courier: Courier
    starterSkills: string[]
    handle: string
  }) => void
}

const STAT_ICONS: Record<keyof BaseStats, React.ReactNode> = {
  hp: <Heart className="h-3.5 w-3.5" />,
  atk: <Zap className="h-3.5 w-3.5" />,
  def: <Shield className="h-3.5 w-3.5" />,
  focus: <Eye className="h-3.5 w-3.5" />,
  luck: <Sparkles className="h-3.5 w-3.5" />,
}

const STAT_LABELS: Record<keyof BaseStats, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  focus: "FOC",
  luck: "LCK",
}

function StatBar({ stat, value, max = 20, highlight = false }: { stat: keyof BaseStats; value: number; max?: number; highlight?: boolean }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className={`flex items-center gap-1 text-xs font-mono min-w-[48px] ${highlight ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-text-muted)]"}`}>
        {STAT_ICONS[stat]}
        {STAT_LABELS[stat]}
      </span>
      <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`h-full rounded-full ${highlight ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-text-secondary)]"}`}
        />
      </div>
      <span className="text-xs font-mono text-[color:var(--color-text-secondary)] min-w-[20px] text-right">{value}</span>
    </div>
  )
}

export function CharacterCreation({ onComplete }: CharacterCreationProps) {
  const [step, setStep] = useState<CharacterCreationStep>("briefing")
  const [briefingIndex, setBriefingIndex] = useState(0)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [handle, setHandle] = useState("")

  const combinedStats = useMemo(() => {
    if (selectedRace && selectedCourier) {
      return calculateCombinedStats(selectedRace, selectedCourier)
    }
    return null
  }, [selectedRace, selectedCourier])

  const canProceed = () => {
    switch (step) {
      case "briefing":
        return true
      case "race":
        return selectedRace !== null
      case "courier":
        return selectedCourier !== null
      case "skills":
        return selectedSkills.length === STARTER_SKILL_COUNT
      case "name":
        return handle.trim().length >= 3
      case "confirm":
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    switch (step) {
      case "briefing":
        if (briefingIndex < ONBOARDING_PANELS.length - 1) {
          setBriefingIndex(i => i + 1)
        } else {
          setStep("race")
        }
        break
      case "race":
        setStep("courier")
        break
      case "courier":
        setStep("skills")
        break
      case "skills":
        setStep("name")
        break
      case "name":
        setStep("confirm")
        break
      case "confirm":
        if (selectedRace && selectedCourier) {
          onComplete({
            race: selectedRace,
            courier: selectedCourier,
            starterSkills: selectedSkills,
            handle: handle.trim(),
          })
        }
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case "briefing":
        if (briefingIndex > 0) {
          setBriefingIndex(i => i - 1)
        }
        break
      case "race":
        setStep("briefing")
        setBriefingIndex(ONBOARDING_PANELS.length - 1)
        break
      case "courier":
        setStep("race")
        break
      case "skills":
        setStep("courier")
        break
      case "name":
        setStep("skills")
        break
      case "confirm":
        setStep("name")
        break
    }
  }

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(prev => prev.filter(s => s !== skillName))
    } else if (selectedSkills.length < STARTER_SKILL_COUNT) {
      setSelectedSkills(prev => [...prev, skillName])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0b0f]">
      {/* Scanline */}
      <div 
        className="pointer-events-none fixed inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 123, 255, 0.015) 2px, rgba(168, 123, 255, 0.015) 4px)",
          zIndex: 100,
        }}
      />

      {/* Progress indicator */}
      <div className="p-4 border-b border-[rgba(168,123,255,0.1)]">
        <div className="flex items-center justify-center gap-2">
          {["briefing", "race", "courier", "skills", "name", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                step === s
                  ? "bg-[color:var(--color-accent)]"
                  : ["briefing", "race", "courier", "skills", "name", "confirm"].indexOf(step) > i
                  ? "bg-[color:var(--color-accent)]/50"
                  : "bg-[rgba(255,255,255,0.1)]"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
          {step === "briefing" && `Briefing ${briefingIndex + 1}/${ONBOARDING_PANELS.length}`}
          {step === "race" && "Select Lineage"}
          {step === "courier" && "Select Role"}
          {step === "skills" && `Choose Skills (${selectedSkills.length}/${STARTER_SKILL_COUNT})`}
          {step === "name" && "Set Handle"}
          {step === "confirm" && "Confirm Identity"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {/* Briefing */}
          {step === "briefing" && (
            <motion.div
              key={`briefing-${briefingIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-md"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-6">
                <div className="mb-4 flex items-center gap-2 text-xs text-[color:var(--color-accent)]">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
                  <span className="font-mono uppercase tracking-wider">Relay Briefing</span>
                </div>
                <h2 className="mb-4 text-xl font-bold text-[color:var(--color-text-primary)]">
                  {ONBOARDING_PANELS[briefingIndex].title}
                </h2>
                <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  {ONBOARDING_PANELS[briefingIndex].body}
                </p>
              </div>
            </motion.div>
          )}

          {/* Race Selection */}
          {step === "race" && (
            <motion.div
              key="race"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-lg space-y-3"
            >
              {RACES.map((race) => (
                <button
                  key={race.id}
                  onClick={() => setSelectedRace(race)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedRace?.id === race.id
                      ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)] shadow-[0_0_20px_rgba(168,123,255,0.15)]"
                      : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold"
                      style={{ 
                        backgroundColor: `${race.color}20`,
                        color: race.color,
                        boxShadow: selectedRace?.id === race.id ? `0 0 20px ${race.glow}` : undefined
                      }}
                    >
                      {race.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[color:var(--color-text-primary)]">{race.name}</h3>
                        <span className="text-xs text-[color:var(--color-text-muted)]">/ {race.role}</span>
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--color-text-secondary)] line-clamp-2">
                        {race.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {(Object.keys(race.stats) as (keyof BaseStats)[]).map(stat => (
                          race.stats[stat] !== 0 && (
                            <span 
                              key={stat} 
                              className="text-xs font-mono"
                              style={{ color: race.stats[stat] > 0 ? race.color : "#888" }}
                            >
                              {STAT_LABELS[stat]} {race.stats[stat] > 0 ? "+" : ""}{race.stats[stat]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    {selectedRace?.id === race.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Courier Selection */}
          {step === "courier" && (
            <motion.div
              key="courier"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-lg space-y-3"
            >
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedCourier?.id === courier.id
                      ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)] shadow-[0_0_20px_rgba(168,123,255,0.15)]"
                      : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold"
                      style={{ 
                        backgroundColor: `${courier.color}20`,
                        color: courier.color,
                        boxShadow: selectedCourier?.id === courier.id ? `0 0 20px ${courier.glow}` : undefined
                      }}
                    >
                      {courier.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[color:var(--color-text-primary)]">{courier.name}</h3>
                      <p className="mt-1 text-sm text-[color:var(--color-text-secondary)] line-clamp-2">
                        {courier.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {(Object.keys(courier.stats) as (keyof BaseStats)[]).map(stat => (
                          courier.stats[stat] !== 0 && (
                            <span 
                              key={stat} 
                              className="text-xs font-mono"
                              style={{ color: courier.stats[stat] > 0 ? courier.color : "#888" }}
                            >
                              {STAT_LABELS[stat]} {courier.stats[stat] > 0 ? "+" : ""}{courier.stats[stat]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    {selectedCourier?.id === courier.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Combined stats preview */}
              {combinedStats && (
                <div className="mt-4 rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-4">
                  <div className="mb-3 text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Combined Stats Preview
                  </div>
                  <div className="space-y-2">
                    {(Object.keys(combinedStats) as (keyof BaseStats)[]).map(stat => (
                      <StatBar 
                        key={stat} 
                        stat={stat} 
                        value={combinedStats[stat]} 
                        highlight={
                          (selectedRace?.stats[stat] ?? 0) > 0 || 
                          (selectedCourier?.stats[stat] ?? 0) > 0
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Skills Selection */}
          {step === "skills" && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-lg"
            >
              <p className="mb-4 text-sm text-[color:var(--color-text-secondary)]">
                Choose {STARTER_SKILL_COUNT} starting skills to begin with at level 1. Other skills start at level 0.
              </p>
              <div className="space-y-2">
                {SKILL_DEFINITIONS.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    disabled={!selectedSkills.includes(skill.name) && selectedSkills.length >= STARTER_SKILL_COUNT}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedSkills.includes(skill.name)
                        ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)]"
                        : selectedSkills.length >= STARTER_SKILL_COUNT
                        ? "border-[rgba(255,255,255,0.05)] bg-[rgba(15,16,22,0.5)] opacity-50"
                        : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[rgba(255,255,255,0.05)]">
                          {STAT_ICONS[skill.linkedStat]}
                        </div>
                        <div>
                          <h4 className="font-medium text-[color:var(--color-text-primary)] text-sm">{skill.name}</h4>
                          <p className="text-xs text-[color:var(--color-text-muted)]">{STAT_LABELS[skill.linkedStat]} linked</p>
                        </div>
                      </div>
                      {selectedSkills.includes(skill.name) && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                          <Check className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Name Input */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-md"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-6">
                <label className="block">
                  <span className="text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Relay Handle
                  </span>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.3)] px-4 py-3">
                    <span className="text-[color:var(--color-accent)]">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20))}
                      placeholder="your_handle"
                      className="flex-1 bg-transparent text-[color:var(--color-text-primary)] placeholder-[color:var(--color-text-muted)] outline-none font-mono"
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    3-20 characters, letters, numbers, and underscores only.
                  </p>
                </label>
              </div>
            </motion.div>
          )}

          {/* Confirmation */}
          {step === "confirm" && selectedRace && selectedCourier && combinedStats && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto max-w-md space-y-4"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.3)] bg-[rgba(15,16,22,0.9)] p-6 text-center">
                <div 
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold"
                  style={{ 
                    backgroundColor: `${selectedRace.color}20`,
                    color: selectedRace.color,
                    boxShadow: `0 0 30px ${selectedRace.glow}`
                  }}
                >
                  {selectedRace.icon}
                </div>
                <h2 className="text-2xl font-bold text-[color:var(--color-accent)]">@{handle}</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  {selectedRace.name} {selectedCourier.name}
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-4">
                <div className="mb-3 text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                  Final Stats
                </div>
                <div className="space-y-2">
                  {(Object.keys(combinedStats) as (keyof BaseStats)[]).map(stat => (
                    <StatBar key={stat} stat={stat} value={combinedStats[stat]} />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-4">
                <div className="mb-3 text-xs text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                  Starting Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map(skill => (
                    <span 
                      key={skill}
                      className="rounded-full bg-[rgba(168,123,255,0.2)] px-3 py-1 text-xs font-medium text-[color:var(--color-accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t border-[rgba(168,123,255,0.1)] p-4">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={step === "briefing" && briefingIndex === 0}
            className="flex items-center gap-2 rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-sm text-[color:var(--color-text-secondary)] transition-colors hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-[color:var(--color-accent)] px-6 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {step === "confirm" ? "Initialize" : "Continue"}
            {step !== "confirm" && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
