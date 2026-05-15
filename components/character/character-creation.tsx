"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/cn"
import { useEsroStore } from "@/store/use-esro-store"
import { RACES, COURIERS, SKILL_DEFINITIONS, ONBOARDING_PANELS, BOOT_CONFIG, computeFinalStats, BASE_STATS, STAT_LABELS, STARTER_SKILL_COUNT } from "@/lib/game-data"
import type { Race, Courier, CharacterCreationStep } from "@/lib/types"
import { EsroLogo } from "@/components/brand/esro-logo"

export function CharacterCreation() {
  const [step, setStep] = useState<CharacterCreationStep>("boot")
  const [onboardingIndex, setOnboardingIndex] = useState(0)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [handle, setHandle] = useState("")
  
  const completeCharacterCreation = useEsroStore((s) => s.completeCharacterCreation)

  const handleComplete = () => {
    if (selectedRace && selectedCourier && handle.trim()) {
      completeCharacterCreation(handle.trim(), selectedRace, selectedCourier, selectedSkills)
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[color:var(--color-bg)]">
      <AnimatePresence mode="wait">
        {step === "boot" && (
          <BootStep key="boot" onNext={() => setStep("intro")} />
        )}
        {step === "intro" && (
          <IntroStep
            key="intro"
            index={onboardingIndex}
            onNext={() => {
              if (onboardingIndex < ONBOARDING_PANELS.length - 1) {
                setOnboardingIndex(onboardingIndex + 1)
              } else {
                setStep("race")
              }
            }}
            onBack={() => {
              if (onboardingIndex > 0) {
                setOnboardingIndex(onboardingIndex - 1)
              }
            }}
          />
        )}
        {step === "race" && (
          <RaceStep
            key="race"
            selected={selectedRace}
            onSelect={setSelectedRace}
            onNext={() => setStep("courier")}
            onBack={() => setStep("intro")}
          />
        )}
        {step === "courier" && (
          <CourierStep
            key="courier"
            selected={selectedCourier}
            race={selectedRace}
            onSelect={setSelectedCourier}
            onNext={() => setStep("skills")}
            onBack={() => setStep("race")}
          />
        )}
        {step === "skills" && (
          <SkillsStep
            key="skills"
            selected={selectedSkills}
            onSelect={setSelectedSkills}
            onNext={() => setStep("name")}
            onBack={() => setStep("courier")}
          />
        )}
        {step === "name" && (
          <NameStep
            key="name"
            handle={handle}
            race={selectedRace}
            onHandleChange={setHandle}
            onNext={() => setStep("confirm")}
            onBack={() => setStep("skills")}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            key="confirm"
            handle={handle}
            race={selectedRace}
            courier={selectedCourier}
            skills={selectedSkills}
            onConfirm={handleComplete}
            onBack={() => setStep("name")}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ BOOT STEP ============
function BootStep({ onNext }: { onNext: () => void }) {
  const [line, setLine] = useState(0)
  const lines = BOOT_CONFIG.body.split("\n\n")

  useState(() => {
    const interval = setInterval(() => {
      setLine((l) => {
        if (l >= lines.length - 1) {
          clearInterval(interval)
          setTimeout(onNext, 800)
          return l
        }
        return l + 1
      })
    }, 600)
    return () => clearInterval(interval)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center px-6"
    >
      <EsroLogo size={80} />
      <div className="mt-6 text-center">
        <div className="text-[18px] font-semibold tracking-[0.35em] text-[color:var(--color-text)] text-glow">
          {BOOT_CONFIG.header}
        </div>
        <div className="mt-4 space-y-2 text-[10px] text-[color:var(--color-muted)]">
          {lines.slice(0, line + 1).map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {l}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ============ INTRO STEP ============
function IntroStep({
  index,
  onNext,
  onBack,
}: {
  index: number
  onNext: () => void
  onBack: () => void
}) {
  const panel = ONBOARDING_PANELS[index]
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col px-4 py-6"
    >
      {/* Progress */}
      <div className="flex gap-1">
        {ONBOARDING_PANELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= index ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-border)]"
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <EsroLogo size={60} />
        <div className="mt-6">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">
            {panel.title}
          </div>
          <div className="mx-auto mt-3 max-w-[280px] text-[11px] leading-relaxed text-[color:var(--color-muted)]">
            {panel.body}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {index > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded border border-[color:var(--color-border)] px-4 py-2.5 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded bg-[color:var(--color-accent)]/20 px-4 py-2.5 text-[11px] text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/30"
        >
          {index === ONBOARDING_PANELS.length - 1 ? "Begin" : "Next"}
        </button>
      </div>
    </motion.div>
  )
}

// ============ RACE STEP ============
function RaceStep({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: Race | null
  onSelect: (race: Race) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">
          Choose Your Race
        </div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Your lineage shapes stat bonuses and faction affinity
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="grid gap-2">
          {RACES.map((race) => {
            const isSelected = selected?.id === race.id
            return (
              <button
                key={race.id}
                type="button"
                onClick={() => onSelect(race)}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 text-left transition-all"
                )}
                style={isSelected ? {
                  borderColor: `${race.color}50`,
                  backgroundColor: `${race.color}08`
                } : {
                  borderColor: "var(--color-border)"
                }}
              >
                {isSelected && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      background: `radial-gradient(circle at 20% 50%, ${race.glow} 0%, transparent 60%)`
                    }}
                  />
                )}

                <div className="relative flex gap-3">
                  <div
                    className={cn(
                      "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all",
                      isSelected ? "scale-105" : "opacity-70"
                    )}
                    style={{
                      backgroundColor: `${race.color}15`,
                      border: `1px solid ${race.color}30`
                    }}
                  >
                    <span
                      className="text-xl"
                      style={{
                        color: race.color,
                        textShadow: isSelected ? `0 0 10px ${race.glow}` : undefined
                      }}
                    >
                      {race.emblem}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: isSelected ? race.color : "var(--color-text)" }}
                      >
                        {race.name}
                      </span>
                      <span
                        className="rounded px-1 py-0.5 text-[7px] uppercase tracking-wider"
                        style={{ backgroundColor: `${race.color}20`, color: race.color }}
                      >
                        {race.icon}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                      {race.role}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(race.stats).map(([stat, value]) => {
                        if (value === 0) return null
                        return (
                          <span
                            key={stat}
                            className="rounded px-1 py-0.5 text-[8px]"
                            style={{ backgroundColor: `${race.color}15`, color: race.color }}
                          >
                            +{value} {STAT_LABELS[stat as keyof typeof STAT_LABELS].abbr}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className={cn(
            "flex-1 rounded px-4 py-2 text-[11px] font-medium transition-colors",
            selected
              ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/30"
              : "bg-[color:var(--color-border)] text-[color:var(--color-muted)] cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}

// ============ COURIER STEP ============
function CourierStep({
  selected,
  race,
  onSelect,
  onNext,
  onBack,
}: {
  selected: Courier | null
  race: Race | null
  onSelect: (courier: Courier) => void
  onNext: () => void
  onBack: () => void
}) {
  const finalStats = computeFinalStats(BASE_STATS, race, selected)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">
          Choose Your Courier
        </div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Your field role determines stat distribution
        </div>
      </div>

      {/* Stats preview */}
      <div className="mx-3 mb-2 flex justify-center gap-2 rounded-lg border border-[color:var(--color-border)] p-2">
        {Object.entries(finalStats).map(([stat, value]) => (
          <div key={stat} className="text-center">
            <div className="text-[13px] font-medium text-[color:var(--color-text)]">{value}</div>
            <div className="text-[8px] text-[color:var(--color-muted)]">
              {STAT_LABELS[stat as keyof typeof STAT_LABELS].abbr}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="grid gap-2">
          {COURIERS.map((courier) => {
            const isSelected = selected?.id === courier.id
            return (
              <button
                key={courier.id}
                type="button"
                onClick={() => onSelect(courier)}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 text-left transition-all"
                )}
                style={isSelected ? {
                  borderColor: `${courier.color}50`,
                  backgroundColor: `${courier.color}08`
                } : {
                  borderColor: "var(--color-border)"
                }}
              >
                <div className="relative flex gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                      isSelected ? "scale-105" : "opacity-70"
                    )}
                    style={{
                      backgroundColor: `${courier.color}15`,
                      border: `1px solid ${courier.color}30`,
                      color: courier.color
                    }}
                  >
                    {courier.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[11px] font-medium"
                      style={{ color: isSelected ? courier.color : "var(--color-text)" }}
                    >
                      {courier.name}
                    </div>
                    <div className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                      {courier.summary}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(courier.stats).map(([stat, value]) => {
                        if (value === 0) return null
                        return (
                          <span
                            key={stat}
                            className="rounded px-1 py-0.5 text-[8px]"
                            style={{ backgroundColor: `${courier.color}15`, color: courier.color }}
                          >
                            +{value} {STAT_LABELS[stat as keyof typeof STAT_LABELS].abbr}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!selected}
          className={cn(
            "flex-1 rounded px-4 py-2 text-[11px] font-medium transition-colors",
            selected
              ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/30"
              : "bg-[color:var(--color-border)] text-[color:var(--color-muted)] cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}

// ============ SKILLS STEP ============
function SkillsStep({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string[]
  onSelect: (skills: string[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggleSkill = (skillName: string) => {
    if (selected.includes(skillName)) {
      onSelect(selected.filter(s => s !== skillName))
    } else if (selected.length < STARTER_SKILL_COUNT) {
      onSelect([...selected, skillName])
    }
  }

  // Group by linked stat
  const grouped = SKILL_DEFINITIONS.reduce((acc, skill) => {
    if (!acc[skill.linkedStat]) acc[skill.linkedStat] = []
    acc[skill.linkedStat].push(skill)
    return acc
  }, {} as Record<string, typeof SKILL_DEFINITIONS>)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">
          Choose Starter Skills
        </div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Select {STARTER_SKILL_COUNT} skills to begin at level 1 ({selected.length}/{STARTER_SKILL_COUNT})
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: "thin" }}>
        <div className="space-y-3">
          {Object.entries(grouped).map(([stat, skills]) => (
            <div key={stat}>
              <div className="mb-1.5 text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                {STAT_LABELS[stat as keyof typeof STAT_LABELS].label} Skills
              </div>
              <div className="grid gap-1.5">
                {skills.map((skill) => {
                  const isSelected = selected.includes(skill.name)
                  const isDisabled = !isSelected && selected.length >= STARTER_SKILL_COUNT
                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => !isDisabled && toggleSkill(skill.name)}
                      disabled={isDisabled}
                      className={cn(
                        "rounded-lg border p-2 text-left transition-all",
                        isSelected
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                          : isDisabled
                            ? "border-[color:var(--color-border-soft)] opacity-40 cursor-not-allowed"
                            : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-[10px] font-medium",
                          isSelected ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-text)]"
                        )}>
                          {skill.name}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[7px] uppercase text-[color:var(--color-accent)]">
                            selected
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[8px] text-[color:var(--color-muted)]">
                        {skill.summary}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selected.length !== STARTER_SKILL_COUNT}
          className={cn(
            "flex-1 rounded px-4 py-2 text-[11px] font-medium transition-colors",
            selected.length === STARTER_SKILL_COUNT
              ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/30"
              : "bg-[color:var(--color-border)] text-[color:var(--color-muted)] cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}

// ============ NAME STEP ============
function NameStep({
  handle,
  race,
  onHandleChange,
  onNext,
  onBack,
}: {
  handle: string
  race: Race | null
  onHandleChange: (h: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const isValid = handle.trim().length >= 3 && handle.trim().length <= 24

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">
          Choose Your Handle
        </div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Your relay identity across the frontier
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {race && (
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${race.color}15`,
              border: `2px solid ${race.color}30`,
              boxShadow: `0 0 30px ${race.glow}`
            }}
          >
            <span className="text-3xl" style={{ color: race.color }}>
              {race.emblem}
            </span>
          </div>
        )}

        <div className="w-full max-w-[260px]">
          <div className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)] mb-2">
            Relay Handle
          </div>
          <input
            type="text"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            placeholder="@your_handle"
            maxLength={24}
            className="esro-input w-full text-center"
          />
          <div className="mt-2 text-center text-[9px] text-[color:var(--color-muted)]">
            {handle.length}/24 characters (minimum 3)
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className={cn(
            "flex-1 rounded px-4 py-2 text-[11px] font-medium transition-colors",
            isValid
              ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/30"
              : "bg-[color:var(--color-border)] text-[color:var(--color-muted)] cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  )
}

// ============ CONFIRM STEP ============
function ConfirmStep({
  handle,
  race,
  courier,
  skills,
  onConfirm,
  onBack,
}: {
  handle: string
  race: Race | null
  courier: Courier | null
  skills: string[]
  onConfirm: () => void
  onBack: () => void
}) {
  if (!race || !courier) return null

  const finalStats = computeFinalStats(BASE_STATS, race, courier)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex h-full flex-col"
    >
      <div className="px-4 py-3 text-center">
        <div className="text-[12px] font-medium text-[color:var(--color-text)]">
          Confirm Identity
        </div>
        <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
          Review your character before beginning
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3" style={{ scrollbarWidth: "thin" }}>
        {/* Character card */}
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: `${race.color}30`,
            backgroundColor: `${race.color}08`
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${race.color}15`,
                border: `2px solid ${race.color}40`,
                boxShadow: `0 0 20px ${race.glow}`
              }}
            >
              <span className="text-3xl" style={{ color: race.color, textShadow: `0 0 10px ${race.glow}` }}>
                {race.emblem}
              </span>
            </div>
            <div>
              <div className="text-[14px] font-medium text-[color:var(--color-text)]">
                {handle || "@unnamed"}
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: race.color }}>{race.name}</span>
                <span className="text-[color:var(--color-muted)]">/</span>
                <span style={{ color: courier.color }}>{courier.name}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Object.entries(finalStats).map(([stat, value]) => (
              <div key={stat} className="text-center">
                <div className="text-[14px] font-medium text-[color:var(--color-text)]">{value}</div>
                <div className="text-[8px] text-[color:var(--color-muted)]">
                  {STAT_LABELS[stat as keyof typeof STAT_LABELS].abbr}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="mt-3 rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Starter Skills
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded bg-[color:var(--color-accent)]/15 px-2 py-1 text-[10px] text-[color:var(--color-accent)]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Affinity */}
        <div className="mt-3 rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Faction Affinity
          </div>
          <div className="mt-2 text-[10px] text-[color:var(--color-muted)]">
            {race.affinity}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-[color:var(--color-border)] p-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border border-[color:var(--color-border)] px-4 py-2 text-[11px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded px-4 py-2.5 text-[11px] font-medium transition-colors"
          style={{
            backgroundColor: `${race.color}20`,
            color: race.color,
            border: `1px solid ${race.color}40`
          }}
        >
          Establish Identity
        </button>
      </div>
    </motion.div>
  )
}
