"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Zap, Shield, Heart, Eye, Sparkles, RefreshCw } from "lucide-react"

/** Typewriter/rolling text component for immersive briefings */
function RollingText({ text, speed = 25, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  
  // Store onComplete in a ref to avoid resetting the animation when callback changes
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setDisplayedText("")
    setIsComplete(false)
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
        onCompleteRef.current?.()
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span>
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1.5 h-3.5 ml-0.5 bg-[color:var(--color-accent)] align-middle"
        />
      )}
    </span>
  )
}

/** Name generation pools per Lua config */
const NAME_POOLS = {
  first: [
    'Amber', 'Ashen', 'Aster', 'Autumn', 'Black', 'Bloom', 'Blue', 'Bright',
    'Bronze', 'Cinder', 'Cloud', 'Copper', 'Crimson', 'Crystal', 'Dawn', 'Deep',
    'Dream', 'Drift', 'Dusk', 'Echo', 'Ember', 'Even', 'Fable', 'Fallen',
    'Fern', 'Gilded', 'Glass', 'Glimmer', 'Gold', 'Gray', 'Green', 'Hallow',
    'Haze', 'Honey', 'Iron', 'Ivory', 'Jade', 'Juniper', 'Lark', 'Lilac',
    'Lost', 'Lunar', 'Marble', 'Mist', 'Moon', 'Morrow', 'Moss', 'Night',
    'Oak', 'Opal', 'Pale', 'Pearl', 'Petal', 'Raven', 'Red', 'River',
    'Rose', 'Rune', 'Sable', 'Saffron', 'Sea', 'Shade', 'Shadow', 'Silver',
    'Snow', 'Soft', 'Solar', 'Song', 'Star', 'Still', 'Stone', 'Storm',
    'Summer', 'Sun', 'Swift', 'Thorn', 'Velvet', 'Verdant', 'Violet', 'Wander',
    'White', 'Wild', 'Willow', 'Wind', 'Winter', 'Wisp', 'Wood', 'Woven',
    'Arc', 'Auric', 'Birch', 'Blaze', 'Bramble', 'Cobalt', 'Dust',
    'Ebon', 'Ever', 'Flint', 'Frost', 'Glow', 'Golden', 'Harrow', 'Hearth',
    'Hollow', 'Indigo', 'Kindle', 'Meadow', 'Nova', 'Pine', 'Quiet', 'Rain',
    'Sage', 'Scarlet', 'Shard', 'Slate', 'Steel', 'Sylvan', 'Thunder', 'Umber',
    'Vale', 'Verdigris', 'Warm', 'Whisper', 'Wilde', 'Yew', 'Zephyr'
  ],
  second: [
    'Ash', 'Bloom', 'Branch', 'Brook', 'Cairn', 'Candle', 'Chord', 'Cloak',
    'Crown', 'Dancer', 'Dew', 'Drifter', 'Ember', 'Fern', 'Field', 'Flare',
    'Flower', 'Fox', 'Garden', 'Gale', 'Glim', 'Grove', 'Harbor', 'Hearth',
    'Heart', 'Hollow', 'Lace', 'Leaf', 'Light', 'Loom', 'Lotus', 'Lute',
    'March', 'Mark', 'Meadow', 'Mirror', 'Moth', 'Needle', 'Petal', 'Pond',
    'Quill', 'Rain', 'Reed', 'Rest', 'Rill', 'Road', 'Rune', 'Shade',
    'Shell', 'Shore', 'Sigil', 'Silk', 'Song', 'Spark', 'Spire', 'Star',
    'Step', 'Stone', 'Tale', 'Thread', 'Thistle', 'Torch', 'Trail', 'Vale',
    'Veil', 'Vow', 'Wave', 'Whisper', 'Will', 'Wing', 'Wish', 'Wisp',
    'Wood', 'Wren', 'Bloomer', 'Watcher', 'Walker', 'Seeker', 'Keeper', 'Singer',
    'Beacon', 'Blade', 'Briar', 'Caller', 'Charm', 'Dreamer', 'Dust', 'Fable',
    'Feather', 'Flame', 'Gazer', 'Glen', 'Harrow', 'Haven', 'Haze',
    'Lantern', 'Lore', 'Mender', 'Mist', 'Oracle', 'Pine', 'Rider',
    'River', 'Sparrow', 'Spirit', 'Stag', 'Summit', 'Sylph', 'Talon', 'Tempest',
    'Thorn', 'Traveler', 'Ward', 'Weaver', 'Wilder', 'Wythe'
  ],
  tail: [
    'Aster', 'Bell', 'Briar', 'Cairn', 'Cindra', 'Corvin', 'Dale', 'Dawn',
    'Elar', 'Elowen', 'Ember', 'Faelis', 'Fenn', 'Gray', 'Hale', 'Iris',
    'Juno', 'Korin', 'Luneth', 'Lys', 'Morrow', 'Nettle', 'Nyra', 'Orin',
    'Quill', 'Rill', 'Riven', 'Rowan', 'Sable', 'Sorrel', 'Talyn', 'Thorne',
    'Vale', 'Vesper', 'Wren', 'Yarrow', 'Zephyr', 'Sylra', 'Vey', 'Auren',
    'Avel', 'Blythe', 'Caelum', 'Dusk', 'Eryn', 'Fable', 'Galen', 'Harrow',
    'Ione', 'Kael', 'Liora', 'Mire', 'Noctis', 'Orrin', 'Pyre', 'Rook',
    'Seren', 'Tarin', 'Wilder', 'Ysra', 'Zorin'
  ],
  rareTail: [
    'ofGlass', 'ofVelvet', 'ofDawn', 'ofNight', 'ofRain', 'ofEmbers',
    'ofThorns', 'ofStars', 'ofShadows', 'ofMoths', 'ofAsh', 'ofEchoes',
    'ofCinders', 'ofFrost', 'ofLanterns', 'ofMist', 'ofMoonlight', 'ofPetals',
    'ofSilence', 'ofStorms', 'ofTwilight', 'ofWhispers'
  ],
  ultraRareTail: [
    'theEclipsed', 'theGilded', 'theHollow', 'theMoonbound', 'theRuneborn',
    'theStarforged', 'theVeiled', 'theWandering', 'ofTheFirstDawn',
    'ofTheLastEmber', 'ofTheSilverWilds', 'ofTheStillVale'
  ]
}

/** Pick random element from array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Roll chance (chance out of outOf) */
function rollChance(chance: number, outOf: number): boolean {
  return Math.random() * outOf < chance
}

/** Generate a handle per Lua name generation spec */
function generateHandle(): string {
  const first = pick(NAME_POOLS.first)
  const second = pick(NAME_POOLS.second)
  let base = first + second

  // 45% chance to add tail
  if (rollChance(45, 100)) {
    base = base + '_' + pick(NAME_POOLS.tail)
  }

  // Ultra rare tail (0.5%), rare tail (1%), or number tail (35%)
  if (rollChance(5, 1000)) {
    base = base + '_' + pick(NAME_POOLS.ultraRareTail)
  } else if (rollChance(5, 500)) {
    base = base + '_' + pick(NAME_POOLS.rareTail)
  } else if (rollChance(35, 100)) {
    base = base + '_' + (Math.floor(Math.random() * 990) + 10)
  }

  return base
}
import { RACES, COURIERS, ONBOARDING_PANELS, SKILL_DEFINITIONS, STARTER_SKILL_COUNT, calculateCombinedStats, type SkillDefinition } from "@/lib/game-data"
import { generateAvatarFromSeed, LAYER_VARIANTS, SKIN_COLORS, HAIR_COLORS, EYE_COLORS, HEAD_SHAPE_NAMES, HAIR_STYLE_NAMES } from "@/lib/avatar-generator"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import type { Race, Courier, CharacterCreationStep, BaseStats, AvatarConfig, AvatarLayer } from "@/lib/types"

interface CharacterCreationProps {
  onComplete: (data: {
    race: Race
    courier: Courier
    starterSkills: string[]
    handle: string
    avatar: AvatarConfig
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
  const [step, setStep] = useState<CharacterCreationStep>("incoming")
  const [briefingIndex, setBriefingIndex] = useState(0)
  const [titleComplete, setTitleComplete] = useState(false)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [generatedHandle, setGeneratedHandle] = useState("")
  const [avatarSeed, setAvatarSeed] = useState("initial-seed")
  const [avatar, setAvatar] = useState<AvatarConfig>(() => generateAvatarFromSeed("initial-seed"))
  const [mounted, setMounted] = useState(false)
  
  // Generate random values only on client after mount to avoid hydration mismatch
  useEffect(() => {
    if (!mounted) {
      setMounted(true)
      const seed = `seed-${Date.now()}`
      setAvatarSeed(seed)
      setAvatar(generateAvatarFromSeed(seed))
      setGeneratedHandle(generateHandle())
    }
  }, [mounted])
  
  // Regenerate avatar with new random seed
  const randomizeAvatar = () => {
    const newSeed = `seed-${Date.now()}-${Math.random()}`
    setAvatarSeed(newSeed)
    setAvatar(generateAvatarFromSeed(newSeed))
  }
  
  // Update a specific layer
  const updateAvatarLayer = (layerType: AvatarLayer["type"], variant: number, color?: number) => {
    setAvatar(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.type === layerType
          ? { ...layer, variant, ...(color !== undefined ? { color } : {}) }
          : layer
      )
    }))
  }

  const combinedStats = useMemo(() => {
    if (selectedRace && selectedCourier) {
      return calculateCombinedStats(selectedRace, selectedCourier)
    }
    return null
  }, [selectedRace, selectedCourier])

  const canProceed = () => {
    switch (step) {
      case "incoming":
        return true
      case "briefing":
        return true
      case "race":
        return selectedRace !== null
      case "courier":
        return selectedCourier !== null
      case "avatar":
        return true // Avatar is always valid
      case "skills":
        return selectedSkills.length === STARTER_SKILL_COUNT
      case "name":
        return true // Handle is auto-generated as Relay[suffix]
      case "confirm":
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    switch (step) {
      case "incoming":
        setStep("briefing")
        break
      case "briefing":
if (briefingIndex < ONBOARDING_PANELS.length - 1) {
        setTitleComplete(false)
        setBriefingIndex(i => i + 1)
        } else {
          setStep("race")
        }
        break
      case "race":
        setStep("courier")
        break
      case "courier":
        setStep("avatar")
        break
      case "avatar":
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
            handle: generatedHandle,
            avatar: avatar,
          })
        }
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case "incoming":
        // Can't go back from incoming
        break
      case "briefing":
if (briefingIndex > 0) {
        setTitleComplete(false)
        setBriefingIndex(i => i - 1)
        } else {
          setStep("incoming")
        }
        break
      case "race":
        setStep("briefing")
        setBriefingIndex(ONBOARDING_PANELS.length - 1)
        break
      case "courier":
        setStep("race")
        break
      case "avatar":
        setStep("courier")
        break
      case "skills":
        setStep("avatar")
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
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0a0b0f] overflow-hidden font-mono">
      {/* Scanline */}
      <div 
        className="pointer-events-none absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 123, 255, 0.015) 2px, rgba(168, 123, 255, 0.015) 4px)",
          zIndex: 100,
        }}
      />

      {/* Progress indicator - extra top padding for LB-Phone native header */}
      <div className="px-4 pb-3 pt-8 border-b border-[rgba(168,123,255,0.1)]">
        <div className="flex items-center justify-center gap-1.5">
          {["incoming", "briefing", "race", "courier", "avatar", "skills", "name", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`h-1 w-5 rounded-full transition-colors ${
                step === s
                  ? "bg-[color:var(--color-accent)]"
                  : ["incoming", "briefing", "race", "courier", "avatar", "skills", "name", "confirm"].indexOf(step) > i
                  ? "bg-[color:var(--color-accent)]/50"
                  : "bg-[rgba(255,255,255,0.1)]"
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-center text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-widest">
          {step === "incoming" && "Signal Detected"}
          {step === "briefing" && `Transmission ${briefingIndex + 1}/${ONBOARDING_PANELS.length}`}
          {step === "race" && "Select Lineage"}
          {step === "courier" && "Select Role"}
          {step === "avatar" && "Customize Avatar"}
          {step === "skills" && `Choose Skills (${selectedSkills.length}/${STARTER_SKILL_COUNT})`}
          {step === "name" && "Handle Assignment"}
          {step === "confirm" && "Confirm Identity"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* Incoming Transmission Alert */}
          {step === "incoming" && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-sm flex flex-col items-center justify-center min-h-[300px]"
            >
              {/* Pulsing signal icon */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mb-6 relative"
              >
                <div className="w-16 h-16 rounded-full border-2 border-[color:var(--color-accent)] flex items-center justify-center">
                  <Zap className="w-7 h-7 text-[color:var(--color-accent)]" />
                </div>
                {/* Ripple rings */}
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-[color:var(--color-accent)]"
                />
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full border border-[color:var(--color-accent)]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-lg font-bold text-[color:var(--color-accent)] uppercase tracking-wider mb-2">
                  Incoming Transmission
                </h2>
                <p className="text-[14px] text-[color:var(--color-text-secondary)]">
                  Establishing secure relay connection...
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8"
              >
                <button
                  type="button"
                  onClick={() => setStep("briefing")}
                  className="flex items-center gap-2 rounded-lg border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 px-6 py-2.5 text-[14px] font-medium text-[color:var(--color-accent)] uppercase tracking-wider transition-colors hover:bg-[color:var(--color-accent)]/20"
                >
                  Accept Transmission
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Briefing */}
          {step === "briefing" && (
            <motion.div
              key={`briefing-${briefingIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mx-auto max-w-sm"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.95)] p-6">
                <div className="mb-3 flex items-center gap-2 text-[14px] text-[color:var(--color-accent)]">
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" 
                  />
                  <span className="font-mono uppercase tracking-widest">Incoming Transmission</span>
                </div>
                <h2 className="mb-3 text-lg font-bold text-[color:var(--color-text-primary)]">
                  <RollingText 
                    key={`title-${briefingIndex}`}
                    text={ONBOARDING_PANELS[briefingIndex].title} 
                    speed={40}
                    onComplete={() => setTitleComplete(true)}
                  />
                </h2>
                <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)] min-h-[120px]">
                  {titleComplete && (
                    <RollingText 
                      key={`body-${briefingIndex}`}
                      text={ONBOARDING_PANELS[briefingIndex].body} 
                      speed={18}
                    />
                  )}
                </p>
              </div>
              
              {/* Briefing progress dots */}
              <div className="mt-4 flex justify-center gap-1.5">
                {ONBOARDING_PANELS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i === briefingIndex
                        ? "bg-[color:var(--color-accent)]"
                        : i < briefingIndex
                        ? "bg-[color:var(--color-accent)]/40"
                        : "bg-[rgba(255,255,255,0.15)]"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Race Selection */}
          {step === "race" && (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm space-y-2"
            >
              {RACES.map((race) => (
                <button
                  key={race.id}
                  onClick={() => setSelectedRace(race)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedRace?.id === race.id
                      ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)] shadow-[0_0_16px_rgba(168,123,255,0.15)]"
                      : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
                      style={{ 
                        backgroundColor: `${race.color}20`,
                        color: race.color,
                        boxShadow: selectedRace?.id === race.id ? `0 0 16px ${race.glow}` : undefined
                      }}
                    >
                      {race.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] text-[color:var(--color-text-primary)]">{race.name}</h3>
                        <span className="text-[14px] text-[color:var(--color-text-muted)]">/ {race.role}</span>
                      </div>
                      <p className="mt-0.5 text-[15px] text-[color:var(--color-text-secondary)]">
                        {race.summary}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {(Object.keys(race.stats) as (keyof BaseStats)[]).map(stat => (
                          race.stats[stat] !== 0 && (
                            <span 
                              key={stat} 
                              className="text-[14px] font-mono"
                              style={{ color: race.stats[stat] > 0 ? race.color : "#888" }}
                            >
                              {STAT_LABELS[stat]} {race.stats[stat] > 0 ? "+" : ""}{race.stats[stat]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    {selectedRace?.id === race.id && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                        <Check className="h-3 w-3 text-black" />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm space-y-2"
            >
              {COURIERS.map((courier) => (
                <button
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedCourier?.id === courier.id
                      ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)] shadow-[0_0_16px_rgba(168,123,255,0.15)]"
                      : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
                      style={{ 
                        backgroundColor: `${courier.color}20`,
                        color: courier.color,
                        boxShadow: selectedCourier?.id === courier.id ? `0 0 16px ${courier.glow}` : undefined
                      }}
                    >
                      {courier.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[15px] text-[color:var(--color-text-primary)]">{courier.name}</h3>
                      <p className="mt-0.5 text-[15px] text-[color:var(--color-text-secondary)]">
                        {courier.summary}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {(Object.keys(courier.stats) as (keyof BaseStats)[]).map(stat => (
                          courier.stats[stat] !== 0 && (
                            <span 
                              key={stat} 
                              className="text-[14px] font-mono"
                              style={{ color: courier.stats[stat] > 0 ? courier.color : "#888" }}
                            >
                              {STAT_LABELS[stat]} {courier.stats[stat] > 0 ? "+" : ""}{courier.stats[stat]}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                    {selectedCourier?.id === courier.id && (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Combined stats preview */}
              {combinedStats && (
                <div className="mt-3 rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-3">
                  <div className="mb-2 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Combined Stats
                  </div>
                  <div className="space-y-1.5">
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

          {/* Avatar Customization */}
          {step === "avatar" && (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm space-y-3"
            >
              {/* Avatar preview */}
              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.9)] p-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="relative">
                    <PixelAvatar config={avatar} size="md" />
                  </div>
                  <button
                    type="button"
                    onClick={randomizeAvatar}
                    className="flex items-center gap-1.5 rounded-lg border border-[rgba(168,123,255,0.3)] bg-[rgba(168,123,255,0.1)] px-3 py-1.5 text-[15px] text-[color:var(--color-accent)] transition-colors hover:bg-[rgba(168,123,255,0.2)]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Randomize
                  </button>
                </div>
              </div>

              {/* Customization options */}
              <div className="space-y-2">
                {/* Skin */}
                <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-2.5">
                  <div className="mb-1.5 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Skin Tone
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_COLORS.map((color, i) => {
                      const currentSkin = avatar.layers.find(l => l.type === "skin")?.variant ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => updateAvatarLayer("skin", i)}
                          className={`h-6 w-6 rounded-full border-2 transition-all ${
                            currentSkin === i
                              ? "border-[color:var(--color-accent)] scale-110"
                              : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Hair */}
                <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-2.5">
                  <div className="mb-1.5 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Hair Style
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {HAIR_STYLE_NAMES.map((name, i) => {
                      const currentHair = avatar.layers.find(l => l.type === "hair")?.variant ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => updateAvatarLayer("hair", i)}
                          className={`rounded border px-2 py-1 text-[13px] font-mono transition-all ${
                            currentHair === i
                              ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.2)] text-[color:var(--color-accent)]"
                              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[color:var(--color-text-secondary)] hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                  <div className="text-[14px] text-[color:var(--color-text-muted)] mb-1.5">Hair Color</div>
                  <div className="flex flex-wrap gap-1.5">
                    {HAIR_COLORS.map((color, i) => {
                      const currentColor = avatar.layers.find(l => l.type === "hair")?.color ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const hairLayer = avatar.layers.find(l => l.type === "hair")
                            if (hairLayer) updateAvatarLayer("hair", hairLayer.variant, i)
                          }}
                          className={`h-5 w-5 rounded-full border-2 transition-all ${
                            currentColor === i
                              ? "border-[color:var(--color-accent)] scale-110"
                              : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Eyes */}
                <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-2.5">
                  <div className="mb-1.5 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Eyes
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Array.from({ length: LAYER_VARIANTS.eyes }, (_, i) => {
                      const currentEyes = avatar.layers.find(l => l.type === "eyes")?.variant ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => updateAvatarLayer("eyes", i)}
                          className={`h-7 w-7 rounded border text-[14px] font-mono transition-all ${
                            currentEyes === i
                              ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.2)] text-[color:var(--color-accent)]"
                              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[color:var(--color-text-secondary)] hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                  <div className="text-[14px] text-[color:var(--color-text-muted)] mb-1.5">Eye Color</div>
                  <div className="flex flex-wrap gap-1.5">
                    {EYE_COLORS.map((color, i) => {
                      const currentColor = avatar.layers.find(l => l.type === "eyes")?.color ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const eyesLayer = avatar.layers.find(l => l.type === "eyes")
                            if (eyesLayer) updateAvatarLayer("eyes", eyesLayer.variant, i)
                          }}
                          className={`h-5 w-5 rounded-full border-2 transition-all ${
                            currentColor === i
                              ? "border-[color:var(--color-accent)] scale-110"
                              : "border-transparent hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Head Shape */}
                <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-2.5">
                  <div className="mb-1.5 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                    Head Shape
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HEAD_SHAPE_NAMES.map((name, i) => {
                      const currentBase = avatar.layers.find(l => l.type === "base")?.variant ?? 0
                      return (
                        <button
                          key={i}
                          onClick={() => updateAvatarLayer("base", i)}
                          className={`rounded border px-2.5 py-1.5 text-[14px] font-mono transition-all ${
                            currentBase === i
                              ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.2)] text-[color:var(--color-accent)]"
                              : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[color:var(--color-text-secondary)] hover:border-[rgba(255,255,255,0.3)]"
                          }`}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Skills Selection */}
          {step === "skills" && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm"
            >
              <p className="mb-3 text-[15px] text-[color:var(--color-text-secondary)]">
                Choose {STARTER_SKILL_COUNT} starting skills at level 1. Others start locked.
              </p>
              <div className="space-y-1.5">
                {SKILL_DEFINITIONS.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    disabled={!selectedSkills.includes(skill.name) && selectedSkills.length >= STARTER_SKILL_COUNT}
                    className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                      selectedSkills.includes(skill.name)
                        ? "border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)]"
                        : selectedSkills.length >= STARTER_SKILL_COUNT
                        ? "border-[rgba(255,255,255,0.05)] bg-[rgba(15,16,22,0.5)] opacity-50"
                        : "border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] hover:border-[rgba(168,123,255,0.3)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-[rgba(255,255,255,0.05)]">
                          {STAT_ICONS[skill.linkedStat]}
                        </div>
                        <div>
                          <h4 className="font-medium text-[color:var(--color-text-primary)] text-[14px]">{skill.name}</h4>
                          <p className="text-[14px] text-[color:var(--color-text-muted)]">{STAT_LABELS[skill.linkedStat]} linked</p>
                        </div>
                      </div>
                      {selectedSkills.includes(skill.name) && (
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                          <Check className="h-2.5 w-2.5 text-black" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Handle Assignment */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.95)] p-5">
                <div className="mb-3 flex items-center gap-2 text-[14px] text-[color:var(--color-accent)]">
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" 
                  />
                  <span className="font-mono uppercase tracking-widest">Handle Assignment</span>
                </div>
                
                <p className="mb-4 text-[14px] text-[color:var(--color-text-secondary)] leading-relaxed">
                  The network has generated your unique handle. This name will identify you across all relay channels and field operations.
                </p>
                
                <div className="rounded-lg border border-[color:var(--color-accent)]/30 bg-[rgba(168,123,255,0.08)] p-4 text-center">
                  <div className="text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider mb-2">
                    Your Handle
                  </div>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-lg font-bold text-[color:var(--color-accent)] font-mono break-all"
                  >
                    @{generatedHandle}
                  </motion.div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setGeneratedHandle(generateHandle())}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[14px] text-[color:var(--color-text-secondary)] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[color:var(--color-text-primary)]"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generate New Handle
                </button>
              </div>
            </motion.div>
          )}

          {/* Confirmation */}
          {step === "confirm" && selectedRace && selectedCourier && combinedStats && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto max-w-sm space-y-3"
            >
              <div className="rounded-lg border border-[rgba(168,123,255,0.3)] bg-[rgba(15,16,22,0.95)] p-4 text-center">
                <div className="mx-auto mb-3">
                  <PixelAvatar config={avatar} size="md" />
                </div>
                <h2 className="text-lg font-bold text-[color:var(--color-accent)] font-mono">@{generatedHandle}</h2>
                <p className="mt-0.5 text-[14px]" style={{ color: selectedRace.color }}>
                  {selectedRace.name} {selectedCourier.name}
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-3">
                <div className="mb-2 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                  Final Stats
                </div>
                <div className="space-y-1.5">
                  {(Object.keys(combinedStats) as (keyof BaseStats)[]).map(stat => (
                    <StatBar key={stat} stat={stat} value={combinedStats[stat]} />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(15,16,22,0.8)] p-3">
                <div className="mb-2 text-[14px] text-[color:var(--color-text-muted)] font-mono uppercase tracking-wider">
                  Starting Skills
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map(skill => (
                    <span 
                      key={skill}
                      className="rounded-full bg-[rgba(168,123,255,0.2)] px-2.5 py-0.5 text-[14px] font-medium text-[color:var(--color-accent)]"
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

      {/* Navigation - hidden during incoming step */}
      {step !== "incoming" && (
        <div className="border-t border-[rgba(168,123,255,0.1)] p-4">
          <div className="mx-auto flex max-w-sm items-center justify-between gap-3">
            <button
              onClick={prevStep}
              disabled={step === "briefing" && briefingIndex === 0}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 font-mono text-[15px] uppercase tracking-wider text-[color:var(--color-text-secondary)] transition-colors hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 rounded-lg bg-[color:var(--color-accent)] px-5 py-2 font-mono text-[15px] font-medium uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {step === "confirm" ? "Initialize" : "Continue"}
              {step !== "confirm" && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
