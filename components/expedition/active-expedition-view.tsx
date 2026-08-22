"use client"

import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { STAT_LABELS, STAT_COLORS } from "@/lib/game-data"
import {
  aggregateStats,
  applySkillBonuses,
  checkClause,
  deriveMemberStats,
  EVENT_CHECK,
  getRunModifiers,
  planBattle,
  resolveCheck,
  type BattlePlan,
  type CheckOutcome,
  type ExpEventType,
} from "@/lib/expedition-sim"
import { hostilesForTier, tameablesForTier, type RiskTier } from "@/lib/bestiary"
import { aggregateSkillBonuses, getSkillUnlocks, skillPassiveList } from "@/lib/skill-effects"
import type { AvatarConfig, BaseStats, RaceId } from "@/lib/types"

/** Sped-up run length (seconds of viewing time) and tick cadence. */
const RUN_SECONDS = 90
const TICK_MS = 200

/**
 * When a check fails the squad is set back: the token slides backward on the
 * tracker (`back` seconds of progress lost) and the mission runs longer
 * (`extend` seconds added to the total run). Severity scales with the failure.
 */
const SETBACK_SECONDS: Partial<Record<CheckOutcome, { back: number; extend: number }>> = {
  fail: { back: 3, extend: 5 },
  badfail: { back: 7, extend: 10 },
}

type EventType = "travel" | "discovery" | "battle" | "hazard" | "rest"

interface TimelineEvent {
  at: number // progress threshold 0..1
  type: EventType
  text?: string // pre-rolled for non-battle events
}

interface FeedEntry {
  id: number
  type: EventType
  text: string
  stage: number
  outcome?: CheckOutcome
}

interface CrewMember {
  handle: string
  short: string
  avatar: AvatarConfig
  role: string
  isPlayer: boolean
  hpMax: number
  hp: number
  flashUntil: number
  stats: BaseStats
  /** Loot units this member had secured at the moment they were defeated (hp 0). */
  downedAtLoot?: number
}

interface BattleState {
  enemy: string
  /** Bestiary id of the enemy, so a win can be recorded as a defeat. */
  creatureId: string
  hpMax: number
  hp: number
  active: boolean
  clash: boolean
  cooldown: number
  plan: BattlePlan
}

const EVENT_STYLE: Record<EventType, { color: string; label: string }> = {
  travel: { color: "var(--color-cyan)", label: "Travel" },
  discovery: { color: "var(--color-violet-bright)", label: "Discovery" },
  battle: { color: "var(--color-danger)", label: "Battle" },
  hazard: { color: "var(--color-amber)", label: "Hazard" },
  rest: { color: "var(--color-green)", label: "Regroup" },
}

/** Marker glyph + color for the resolved outcome of a stat check. */
const OUTCOME_STYLE: Record<CheckOutcome, { glyph: string; color: string } | null> = {
  crit: { glyph: "++", color: "var(--color-success)" },
  success: { glyph: "+", color: "var(--color-success)" },
  fail: { glyph: "!", color: "var(--color-amber)" },
  badfail: { glyph: "x", color: "var(--color-danger)" },
  neutral: null,
}

const SECTORS = [
  "the Verge",
  "Sector 7",
  "the Hollow Span",
  "Relay Delta",
  "the Glass Flats",
  "Node Cascade",
  "the Underpass",
  "Sector Null",
]

// Enemies now come from the bestiary (lib/bestiary.ts) rather than a local
// string list, so every fight can be recorded against a real creature id.

const TEXT_POOLS: Record<Exclude<EventType, "battle">, string[]> = {
  travel: [
    "Crossing the {sector} junction.",
    "Relay jump toward {sector}.",
    "Threading a collapsed corridor into {sector}.",
    "Following the signal trail through {sector}.",
  ],
  discovery: [
    "Recovered a signal fragment.",
    "Cache located — supplies stowed.",
    "Rare resonance detected nearby.",
    "Salvaged usable relay components.",
    "Uncovered a buried archive shard.",
  ],
  hazard: [
    "Signal interference — recalibrating.",
    "Unstable footing slows the squad.",
    "Radiation pocket — rerouting.",
    "Comms dropout — regrouping under cover.",
  ],
  rest: [
    "Squad regroups to recover.",
    "{a} shares rations with {b}.",
    "Brief respite — spirits holding.",
    "{a} keeps watch while the others rest.",
  ],
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shortHandle(handle: string) {
  const base = handle.replace(/^@/, "")
  return base.length > 9 ? base.slice(0, 9) : base
}

/** Build a paced event timeline, weighted by expedition risk. */
function buildTimeline(risk: string, crew: CrewMember[]): TimelineEvent[] {
  const slots = [0.06, 0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.93]

  let plan: EventType[]
  if (risk === "High") {
    plan = ["travel", "battle", "discovery", "hazard", "battle", "travel", "discovery", "battle", "hazard", "rest", "battle", "discovery"]
  } else if (risk === "Low") {
    plan = ["travel", "discovery", "travel", "rest", "discovery", "battle", "travel", "discovery", "rest", "hazard", "discovery", "travel"]
  } else {
    plan = ["travel", "discovery", "battle", "travel", "hazard", "discovery", "battle", "rest", "discovery", "travel", "battle", "discovery"]
  }

  const names = crew.map((c) => c.short)
  const pickPair = () => {
    const a = randItem(names)
    let b = randItem(names)
    if (names.length > 1) {
      let guard = 0
      while (b === a && guard < 5) {
        b = randItem(names)
        guard++
      }
    }
    return { a, b }
  }

  return slots.map((at, i) => {
    const type = plan[i] ?? "travel"
    if (type === "battle") return { at, type }
    let text = randItem(TEXT_POOLS[type])
    text = text.replace("{sector}", randItem(SECTORS))
    const { a, b } = pickPair()
    text = text.replace("{a}", a).replace("{b}", b)
    return { at, type, text }
  })
}

export function ActiveExpeditionView() {
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const expeditions = useEsroStore((s) => s.expeditions)
  const party = useEsroStore((s) => s.party)
  const identity = useEsroStore((s) => s.identity)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)
  const characterRace = useEsroStore((s) => s.characterRace)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const skills = useEsroStore((s) => s.skills)
  // Selected as raw state (not via getSkillUnlocks(), which builds a new Set on
  // every call and would hand zustand a fresh snapshot each render).
  const debugUnlocks = useEsroStore((s) => s.debugUnlocks)
  const recordEncounter = useEsroStore((s) => s.recordEncounter)
  const recordDefeat = useEsroStore((s) => s.recordDefeat)
  const cancelExpedition = useEsroStore((s) => s.cancelExpedition)
  const completeActiveExpedition = useEsroStore((s) => s.completeActiveExpedition)

  const exp = useMemo(
    () => expeditions.find((e) => e.id === activeExpedition?.id),
    [expeditions, activeExpedition?.id],
  )

  const totalStages = activeExpedition?.totalStages ?? exp?.stages?.length ?? 4
  const risk = exp?.risk ?? "Medium"

  // Build the deploying crew once per run.
  const initialCrew = useMemo<CrewMember[]>(() => {
    const handles = activeExpedition?.partyMembers?.length
      ? activeExpedition.partyMembers
      : [identity.handle]
    return handles.map((handle) => {
      if (handle === identity.handle) {
        const stats = getPlayerStats()
        return {
          handle,
          short: shortHandle(handle),
          avatar: identity.avatar,
          role: "You",
          isPlayer: true,
          hpMax: 6,
          hp: 6,
          flashUntil: 0,
          stats,
        }
      }
      const m = party.find((p) => p.handle === handle)
      const role = m?.role ?? "Crew"
      return {
        handle,
        short: shortHandle(handle),
        avatar: m?.avatar ?? identity.avatar,
        role,
        isPlayer: false,
        hpMax: 5,
        hp: 5,
        flashUntil: 0,
        stats: deriveMemberStats(handle, role),
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition?.id])

  // Aggregate squad stats and the player's active lineage/faction passives.
  const squadStats = useMemo<BaseStats>(
    () => aggregateStats(initialCrew.map((c) => c.stats)),
    [initialCrew],
  )
  // Lineage + faction passives, then every unlocked skill's sub-stat effects
  // folded in on top. Skills stack additively with lineage/faction traits.
  //
  // Derived here rather than via a store selector: aggregateSkillBonuses builds
  // a fresh object each call, so selecting it directly gave zustand a new
  // snapshot every render and looped forever.
  // Rituals prepped at launch are stored on the run itself, so they stay fixed
  // for its duration even if the player's Focus or known list changes mid-run.
  const runRituals = activeExpedition?.rituals
  const runMods = useMemo(() => {
    // Earned breakpoint unlocks plus any forced via admin dev tools, mirroring
    // the store's getSkillUnlocks() so a devtools toggle affects a live run.
    const unlocks = getSkillUnlocks(skills, getPlayerStats())
    for (const id of debugUnlocks) unlocks.add(id)
    return applySkillBonuses(
      getRunModifiers(
        characterRace?.id as RaceId | undefined,
        characterFaction?.id as RaceId | undefined,
        runRituals,
      ),
      aggregateSkillBonuses(skills),
      skillPassiveList(skills),
      unlocks,
    )
  }, [characterRace?.id, characterFaction?.id, skills, runRituals, debugUnlocks, getPlayerStats])

  // Pathfinding (Marching), Conditioning (Survival) and Gathering (Harvesting)
  // shorten the run. runDuration is negative for faster, so it is added. Floored
  // at 40% of the base so stacked bonuses can never trivialize an expedition.
  const runLength = useMemo(
    () => Math.max(RUN_SECONDS * 0.4, RUN_SECONDS * (1 + runMods.runDuration)),
    [runMods.runDuration],
  )

  // Simulation state lives in refs; we force a render each tick for smoothness.
  const [, forceTick] = useReducer((x) => x + 1, 0)
  const [phase, setPhase] = useState<"running" | "complete">("running")
  const phaseRef = useRef<"running" | "complete">("running")

  const elapsedRef = useRef(0)
  // Total run length grows as failures extend the mission.
  const runSecondsRef = useRef(runLength)
  // Cumulative extra seconds added by setbacks, for the header/summary.
  const setbackTotalRef = useRef(0)
  const crewRef = useRef<CrewMember[]>(initialCrew)
  const feedRef = useRef<FeedEntry[]>([])
  const battleRef = useRef<BattleState | null>(null)
  const firedRef = useRef<Set<number>>(new Set())
  const timelineRef = useRef<TimelineEvent[]>([])
  const feedIdRef = useRef(0)
  const battlesWonRef = useRef(0)
  // Run outcome tallies for the completion summary.
  const checksPassedRef = useRef(0)
  const checksFailedRef = useRef(0)
  const lootFoundRef = useRef(0)
  // Total loot units secured over the run (caches + battle salvage). Used to
  // decide what is delivered: survivors carry the full haul, a total wipe loses it.
  const lootUnitsRef = useRef(0)
  const hiddenRoutesRef = useRef(0)
  const woundedRef = useRef(false)
  // Whether the entire squad was defeated (all hp 0) before reaching the end.
  const wipedRef = useRef(false)
  // `field_surgery` is a once-per-run save, so it needs run-scoped state.
  const fieldSurgeryUsedRef = useRef(false)
  // Rare/rich finds and clean-harvest extras, surfaced in the run summary.
  const rareFindsRef = useRef(0)
  const richFindsRef = useRef(0)
  const cleanHarvestsRef = useRef(0)

  // Reset all sim state when a new expedition starts.
  useEffect(() => {
    elapsedRef.current = 0
    runSecondsRef.current = runLength
    setbackTotalRef.current = 0
    crewRef.current = initialCrew
    feedRef.current = []
    battleRef.current = null
    firedRef.current = new Set()
    feedIdRef.current = 0
    battlesWonRef.current = 0
    checksPassedRef.current = 0
    checksFailedRef.current = 0
    lootFoundRef.current = 0
    lootUnitsRef.current = 0
    hiddenRoutesRef.current = 0
    woundedRef.current = false
    wipedRef.current = false
    fieldSurgeryUsedRef.current = false
    rareFindsRef.current = 0
    richFindsRef.current = 0
    cleanHarvestsRef.current = 0
    timelineRef.current = buildTimeline(risk, initialCrew)
    phaseRef.current = "running"
    setPhase("running")
    forceTick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition?.id])

  const progress = Math.min(1, elapsedRef.current / runSecondsRef.current)
  const stageOf = (p: number) => Math.min(totalStages, Math.floor(p * totalStages) + 1)

  const pushFeed = (type: EventType, text: string, outcome?: CheckOutcome) => {
    feedIdRef.current += 1
    feedRef.current = [
      { id: feedIdRef.current, type, text, outcome, stage: stageOf(elapsedRef.current / runSecondsRef.current) },
      ...feedRef.current,
    ].slice(0, 24)
  }

  /**
   * Apply a setback for a failed check: slide the squad backward on the tracker
   * and extend the total mission time. Returns the seconds added (0 if none).
   */
  const applySetback = (outcome: CheckOutcome): number => {
    const s = SETBACK_SECONDS[outcome]
    if (!s) return 0
    elapsedRef.current = Math.max(0, elapsedRef.current - s.back)
    runSecondsRef.current += s.extend
    setbackTotalRef.current += s.extend
    return s.extend
  }

  const damageRandomCrew = (amount = 1) => {
    // Only members still standing can take a hit.
    const candidates = crewRef.current.filter((c) => c.hp > 0)
    if (candidates.length === 0) return
    const target = randItem(candidates)
    const before = target.hp
    let next = Math.max(0, target.hp - amount)
    // Bulwark/Guardwork/Field Medicine can pull someone back from a downing and
    // leave them on their last point instead. partyProtection was advertised on
    // those skills but never read, so it did nothing. Applied here rather than in
    // the battle loop so hazard damage is covered too.
    if (next === 0 && before > 0 && Math.random() < runMods.partyProtection) {
      next = 1
      pushFeed("battle", `${target.short} is dragged clear — still standing.`, "success")
    }
    // Field Medicine's `field_surgery` breakpoint: one guaranteed save per run,
    // checked only after partyProtection has already failed its roll.
    if (next === 0 && before > 0 && runMods.unlocks.has("field_surgery") && !fieldSurgeryUsedRef.current) {
      fieldSurgeryUsedRef.current = true
      next = 2
      pushFeed(
        "battle",
        `${target.short} is stabilized on the spot — field surgery holds them together.`,
        "success",
      )
    }
    target.hp = next
    target.flashUntil = Date.now() + 600
    woundedRef.current = true
    // Member just went down: freeze the loot they had secured up to this point.
    if (target.hp === 0 && before > 0) {
      target.downedAtLoot = lootUnitsRef.current
      pushFeed(
        "battle",
        `${target.short} goes down — their cargo is sealed at this point in the run.`,
        "badfail",
      )
    }
  }

  const tallyOutcome = (outcome: CheckOutcome) => {
    if (outcome === "crit" || outcome === "success") checksPassedRef.current += 1
    else if (outcome === "fail" || outcome === "badfail") checksFailedRef.current += 1
  }

  const fireEvent = (ev: TimelineEvent) => {
    const p = elapsedRef.current / runSecondsRef.current
    const stageIndex = stageOf(p) - 1
    const crewSize = crewRef.current.length

    // Rest events never require a check — the squad simply recovers.
    if (ev.type === "rest") {
      pushFeed("rest", ev.text ?? "Squad regroups.")
      return
    }

    const result = resolveCheck({
      type: ev.type as ExpEventType,
      squad: squadStats,
      crewSize,
      risk,
      stageIndex,
      mods: runMods,
    })
    tallyOutcome(result.outcome)
    const check = EVENT_CHECK[ev.type as ExpEventType]
    const statLabel = check ? STAT_LABELS[check.primary] : ""
    const clause = checkClause(result, statLabel)
    // Failed checks push the squad back and lengthen the mission.
    const delay = applySetback(result.outcome)
    const delayNote = delay > 0 ? ` Route +${delay}s.` : ""

    if (ev.type === "battle") {
      // Roll a real creature scoped to this run's risk tier, and log the
      // sighting so the codex fills in as the squad meets things.
      const foe = randItem(hostilesForTier(risk as RiskTier))
      const enemy = foe.display
      recordEncounter(foe.id)
      const plan = planBattle(result.outcome, risk, stageIndex, runMods)
      // Marksmanship: open the engagement with a free hit. This opening was
      // previously computed but never applied, so first strike did nothing.
      const openingHp = plan.firstStrike
        ? Math.max(0, plan.enemyHp - (1 + plan.bonusDamage))
        : plan.enemyHp
      battleRef.current = {
        enemy,
        creatureId: foe.id,
        hpMax: plan.enemyHp,
        hp: openingHp,
        active: true,
        clash: false,
        cooldown: 400,
        plan,
      }
      const intro = plan.overwhelmed
        ? `Ambush — ${enemy} overwhelms the approach. (${clause})${delayNote}`
        : `Contact — ${enemy} engaging the squad. (${clause})${delayNote}`
      pushFeed("battle", intro, result.outcome)
      // Narrate the opening so the passive is visible in the feed.
      if (plan.firstStrike) {
        pushFeed(
          "battle",
          `Opening shot lands before ${enemy} can close — ${1 + plan.bonusDamage} damage.`,
          "crit",
        )
      }
      return
    }

    if (ev.type === "hazard") {
      if (result.damage > 0) damageRandomCrew(result.damage)
      const base = ev.text ?? "Hazard encountered."
      const tail =
        result.damage > 0
          ? ` ${result.damage} wounded — ${clause}.`
          : ` Squad holds — ${clause}.`
      pushFeed("hazard", base + tail + delayNote, result.outcome)
      return
    }

    if (ev.type === "discovery") {
      // Tameable beasts are sighted rather than fought, so there is a path to
      // taming that doesn't require killing the animal first.
      const beasts = tameablesForTier(risk as RiskTier)
      if (beasts.length && Math.random() < 0.35) {
        const beast = randItem(beasts)
        recordEncounter(beast.id)
        pushFeed("discovery", `Tracks sighted — ${beast.display} moving through ${beast.habitat.toLowerCase()}.`)
      }
      if (result.loot) {
        lootFoundRef.current += 1
        lootUnitsRef.current += result.bonusLoot ? 2 : 1
        const base = ev.text ?? "Cache located."
        const bonus = result.bonusLoot ? " Veiled instincts turn up an extra haul." : ""
        // rareFind was computed by the sim but never read, so Appraisal and
        // Prospecting had no visible payoff. `rare_nodes` promotes it further.
        let tier = ""
        if (result.richFind) {
          richFindsRef.current += 1
          lootUnitsRef.current += 2
          tier = " The seam runs deep — a rare-node yield, richer than anything on the manifest."
        } else if (result.rareFind) {
          rareFindsRef.current += 1
          lootUnitsRef.current += 1
          tier = " The find appraises a tier above expectation."
        }
        // quality_harvest: node worked clean, so it gives up one more unit.
        let clean = ""
        if (result.extraYield) {
          cleanHarvestsRef.current += 1
          lootUnitsRef.current += 1
          clean = " Worked clean — the node gives up an extra unit."
        }
        pushFeed("discovery", `${base}${bonus}${tier}${clean} (${clause})`, result.outcome)
      } else {
        pushFeed("discovery", `Cache picked clean — nothing recoverable. (${clause})${delayNote}`, result.outcome)
      }
      return
    }

    // travel
    if (result.hiddenRoute) {
      hiddenRoutesRef.current += 1
      pushFeed("travel", `${ev.text ?? "Crossing the route."} A hidden path opens ahead. (${clause})`, result.outcome)
    } else if (result.damage > 0) {
      damageRandomCrew(result.damage)
      pushFeed("travel", `Wrong turn — the squad backtracks under fire. (${clause})${delayNote}`, result.outcome)
    } else if (delay > 0) {
      // Failed navigation with no damage: forced detour onto a longer route.
      pushFeed("travel", `Detour — the route doubles back through ${randItem(SECTORS)}. (${clause})${delayNote}`, result.outcome)
    } else {
      pushFeed("travel", `${ev.text ?? "Crossing the route."} (${clause})`, result.outcome)
    }
  }

  const advanceBattle = () => {
    const b = battleRef.current
    if (!b || !b.active) return
    b.cooldown -= TICK_MS
    if (b.cooldown > 0) {
      b.clash = false
      return
    }
    b.cooldown = 600
    b.clash = true
    // Squad lands a hit based on its combat readiness (from the pre-rolled check).
    // Brawling/Marksmanship bonusDamage is added here; previously every hit
    // dealt exactly 1, so those passives had no effect on battle length.
    if (Math.random() < b.plan.squadHitChance) {
      // Finishing Blow: once the enemy is into its last third, hits land harder.
      // finishBonus was previously computed but never read by the loop.
      const nearlyDown = b.hp <= Math.max(1, Math.ceil(b.plan.enemyHp / 3))
      const finisher = nearlyDown ? b.plan.finishBonus : 0
      const dealt = 1 + b.plan.bonusDamage + finisher
      b.hp = Math.max(0, b.hp - dealt)
      if (nearlyDown && finisher > 0) {
        pushFeed("battle", `Opening found — ${b.enemy} staggered.`, "success")
      }
    }
    // Squad takes a hit based on how badly outmatched it is, unless Guardwork
    // negates the blow outright. counterChance was previously never read.
    if (Math.random() < b.plan.squadTakeChance) {
      if (Math.random() < b.plan.counterChance) {
        pushFeed("battle", `Guard turns the blow — ${b.enemy} left open.`, "success")
      } else {
        damageRandomCrew(b.plan.overwhelmed && Math.random() < 0.5 ? 2 : 1)
      }
    }
    if (b.hp <= 0) {
      b.active = false
      battlesWonRef.current += 1
      recordDefeat(b.creatureId)
      pushFeed("battle", `${b.enemy} neutralized — squad pressing on.`, "success")
      if (Math.random() < 0.5) {
        lootFoundRef.current += 1
        lootUnitsRef.current += 1
        pushFeed("discovery", "Salvage stripped from the wreckage.")
      }
      window.setTimeout(() => {
        battleRef.current = null
        forceTick()
      }, 1300)
    }
  }

  // Master simulation loop.
  useEffect(() => {
    const iv = window.setInterval(() => {
      if (phaseRef.current !== "running") return
      elapsedRef.current = Math.min(elapsedRef.current + TICK_MS / 1000, runSecondsRef.current)
      const p = elapsedRef.current / runSecondsRef.current
      timelineRef.current.forEach((ev, idx) => {
        if (!firedRef.current.has(idx) && p >= ev.at) {
          firedRef.current.add(idx)
          fireEvent(ev)
        }
      })
      advanceBattle()
      // Total squad wipe: everyone is down. The run ends immediately and all loot is lost.
      if (crewRef.current.every((c) => c.hp <= 0)) {
        wipedRef.current = true
        if (battleRef.current) battleRef.current.active = false
        pushFeed("battle", "Squad eliminated — transponders dark. All cargo is lost.", "badfail")
        phaseRef.current = "complete"
        setPhase("complete")
        forceTick()
        return
      }
      if (elapsedRef.current >= runSecondsRef.current && !battleRef.current?.active) {
        phaseRef.current = "complete"
        setPhase("complete")
      }
      forceTick()
    }, TICK_MS)
    return () => window.clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition?.id])

  if (!activeExpedition) return null

  const crew = crewRef.current
  const battle = battleRef.current
  const etaSeconds = Math.max(0, Math.round((exp?.duration ?? 600) * (1 - progress)))
  const etaLabel =
    etaSeconds >= 60 ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s` : `${etaSeconds}s`
  const currentStage = stageOf(progress)
  // Express accrued setback time in the expedition's own (lore) duration scale.
  const delayLoreSeconds = Math.round(setbackTotalRef.current * ((exp?.duration ?? 600) / runLength))
  const delayLabel =
    delayLoreSeconds >= 60 ? `+${Math.floor(delayLoreSeconds / 60)}m ${delayLoreSeconds % 60}s` : `+${delayLoreSeconds}s`

  // Survival outcome for the completion summary.
  const survivors = crew.filter((c) => c.hp > 0)
  const downed = crew.filter((c) => c.hp <= 0)
  const wiped = wipedRef.current || survivors.length === 0
  // Survivors carry the full haul; a total wipe loses everything.
  const lootMultiplier = wiped ? 0 : 1
  const totalLootUnits = lootUnitsRef.current

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)]">
      {phase === "running" ? (
        <>
          {/* Header */}
          <div className="border-b border-[color:var(--color-border)] px-4 pb-3 pt-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                  Active Expedition
                </div>
                <div className="truncate text-[16px] font-semibold text-[color:var(--color-text)]">
                  {activeExpedition.label}
                </div>
              </div>
              <button
                type="button"
                onClick={cancelExpedition}
                className="shrink-0 rounded border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 px-2.5 py-1 text-[12px] uppercase tracking-wider text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/20"
              >
                Abort
              </button>
            </div>

            {/* Route progress with stage pips */}
            <div className="mt-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-[color:var(--color-panel)]">
                <motion.div
                  className="h-full rounded-full bg-[color:var(--color-accent)]"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ ease: "linear", duration: TICK_MS / 1000 }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[12px] text-[color:var(--color-muted)]">
                <span>
                  Stage {currentStage}/{totalStages}
                </span>
                <span>{Math.round(progress * 100)}%</span>
                <span className="flex items-center gap-1.5">
                  {delayLoreSeconds > 0 && (
                    <span className="text-[color:var(--color-amber)]" title="Time added by setbacks">
                      {delayLabel}
                    </span>
                  )}
                  <span>ETA {etaLabel}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Field view: squad vs threat (token clash) */}
          <div className="border-b border-[color:var(--color-border-soft)] px-4 py-3">
            {/* Status labels above the route */}
            <div className="mb-3 flex items-center justify-between">
              <motion.span
                className="text-[13px] font-semibold uppercase tracking-[0.18em]"
                animate={battle?.clash ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{ color: battle?.active ? "var(--color-danger)" : "var(--color-cyan)" }}
              >
                {battle?.active ? "Engaging" : "Advancing"}
              </motion.span>
              <span
                className="max-w-[140px] truncate text-[13px] uppercase tracking-wider"
                style={{ color: battle?.active ? "var(--color-danger)" : "var(--color-muted)" }}
              >
                {battle?.active ? battle.enemy : "→ Extraction Point"}
              </span>
            </div>

            {/* Route track: the squad token travels start → finish flag as progress advances */}
            <div className="relative h-10">
              {/* baseline path with traveled fill */}
              <div className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[color:var(--color-panel)]">
                <motion.div
                  className="h-full rounded-full bg-[color:var(--color-accent)]/70"
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ ease: "linear", duration: TICK_MS / 1000 }}
                />
              </div>

              {/* stage waypoint markers */}
              {Array.from({ length: Math.max(0, totalStages - 1) }).map((_, i) => {
                const pos = ((i + 1) / totalStages) * 100
                const passed = progress * 100 >= pos
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border transition-colors"
                    style={{
                      left: `${pos}%`,
                      borderColor: passed ? "var(--color-accent)" : "var(--color-border)",
                      backgroundColor: passed ? "var(--color-accent)" : "var(--color-bg)",
                    }}
                  />
                )
              })}

              {/* start node */}
              <div className="absolute left-1 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--color-cyan)]/60 bg-[color:var(--color-cyan)]/25" />

              {/* finish flag — fills in on arrival */}
              <div
                className="absolute right-0 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm border transition-colors"
                style={{
                  borderColor: progress >= 1 ? "var(--color-success)" : "var(--color-border)",
                  backgroundColor: progress >= 1 ? "var(--color-success)" : "transparent",
                  color: progress >= 1 ? "var(--color-bg)" : "var(--color-muted)",
                }}
              >
                <span className="text-[12px] leading-none">⚑</span>
              </div>

              {/* threat token — appears just ahead of the squad during a battle */}
              {battle?.active && (
                <motion.div
                  className="absolute top-1/2 z-10 -translate-y-1/2"
                  style={{ left: `${Math.min(progress * 100 + 9, 92)}%` }}
                  animate={battle.clash ? { x: [-4, 0], y: "-50%" } : { x: 0, y: "-50%" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex h-6 w-6 -translate-x-1/2 rotate-45 items-center justify-center rounded-sm border border-[color:var(--color-danger)]/60 bg-[color:var(--color-danger)]/15">
                    <span className="-rotate-45 text-[12px] text-[color:var(--color-danger)]">✶</span>
                  </div>
                </motion.div>
              )}

              {/* traveling squad token */}
              <motion.div
                className="absolute top-1/2 z-20 -translate-y-1/2"
                animate={{ left: `${progress * 100}%` }}
                transition={{ ease: "linear", duration: TICK_MS / 1000 }}
              >
                <div className="-translate-x-1/2">
                  <motion.div
                    className="flex -space-x-2 rounded-full bg-[color:var(--color-bg)]/85 p-0.5 ring-1 ring-[color:var(--color-accent)]/40"
                    animate={battle?.clash ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {crew.slice(0, 3).map((c) => (
                      <div key={c.handle} className="rounded-sm ring-1 ring-[color:var(--color-bg)]">
                        <PixelAvatar config={c.avatar} size="xs" showFlair={false} />
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Enemy HP pips */}
            {battle?.active && (
              <div className="mt-2 flex items-center justify-end gap-1">
                {Array.from({ length: battle.hpMax }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-2.5 rounded-sm transition-colors",
                      i < battle.hp
                        ? "bg-[color:var(--color-danger)]"
                        : "bg-[color:var(--color-panel)]",
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Crew roster with HP pips */}
          <div className="border-b border-[color:var(--color-border-soft)] px-4 py-3">
            <div className="mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Crew
            </div>
            <div className="flex flex-wrap gap-2">
              {crew.map((c) => {
                const flashing = c.flashUntil > Date.now()
                return (
                  <div
                    key={c.handle}
                    className={cn(
                      "flex min-w-[88px] flex-1 flex-col items-center gap-1 rounded-lg border p-2 transition-colors",
                      c.isPlayer
                        ? "border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5"
                        : "border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/40",
                      flashing && "border-[color:var(--color-danger)]/70 bg-[color:var(--color-danger)]/10",
                    )}
                  >
                    <motion.div animate={flashing ? { x: [-2, 2, -1, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
                      <PixelAvatar config={c.avatar} size="sm" showFlair={c.isPlayer} />
                    </motion.div>
                    <span className="max-w-[80px] truncate text-[12px] font-medium text-[color:var(--color-text)]">
                      {c.short}
                    </span>
                    <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                      {c.role}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: c.hpMax }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "h-1 w-1.5 rounded-sm",
                            i < c.hp
                              ? "bg-[color:var(--color-success)]"
                              : "bg-[color:var(--color-panel)]",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Squad readiness: aggregated stats + active lineage/faction passives */}
          <div className="border-b border-[color:var(--color-border-soft)] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Squad Readiness
              </span>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {(["atk", "def", "focus", "luck"] as const).map((stat) => (
                  <span
                    key={stat}
                    className="flex items-center gap-1 rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[13px] tabular-nums"
                    title={`Squad ${STAT_LABELS[stat]}`}
                  >
                    <span className="uppercase tracking-wider" style={{ color: STAT_COLORS[stat] }}>
                      {STAT_LABELS[stat]}
                    </span>
                    <span className="font-medium text-[color:var(--color-text)]">{squadStats[stat]}</span>
                  </span>
                ))}
              </div>
            </div>
            {runMods.passives.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {runMods.passives.map((pas) => (
                  <span
                    key={pas.name}
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[13px]",
                      pas.source === "Lineage"
                        ? "border-[color:var(--color-accent)]/40 text-[color:var(--color-accent)]"
                        : "border-[color:var(--color-cyan)]/40 text-[color:var(--color-cyan)]",
                    )}
                    title={pas.effect}
                  >
                    {pas.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[color:var(--color-muted)]">
                No lineage or faction passives active — checks rely on raw squad stats.
              </p>
            )}
          </div>

          {/* Live event feed */}
          <div className="min-h-0 flex-1 px-4 py-3">
            <div className="mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Field Log
            </div>
            <div
              className="h-full space-y-1.5 overflow-y-auto pb-6"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187,129,255,0.4) transparent" }}
            >
              <AnimatePresence initial={false}>
                {feedRef.current.map((entry) => {
                  const style = EVENT_STYLE[entry.type]
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 rounded border-l-2 bg-[color:var(--color-panel)]/40 py-1 pl-2 pr-2"
                      style={{ borderLeftColor: style.color }}
                    >
                      <span
                        className="mt-0.5 shrink-0 text-[12px] uppercase tracking-wider"
                        style={{ color: style.color }}
                      >
                        {style.label}
                      </span>
                      {entry.outcome && OUTCOME_STYLE[entry.outcome] && (
                        <span
                          className="mt-0.5 shrink-0 font-mono text-[13px] font-bold leading-none"
                          style={{ color: OUTCOME_STYLE[entry.outcome]!.color }}
                          aria-hidden="true"
                        >
                          {OUTCOME_STYLE[entry.outcome]!.glyph}
                        </span>
                      )}
                      <span className="text-[13px] leading-snug text-[color:var(--color-foreground)]/90">
                        {entry.text}
                      </span>
                      <span className="ml-auto shrink-0 text-[12px] text-[color:var(--color-muted)]">
                        S{entry.stage}
                      </span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </>
      ) : (
        /* Completion summary */
        <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[13px] uppercase tracking-[0.3em]"
            style={{ color: wiped ? "var(--color-danger)" : "var(--color-success)" }}
          >
            {wiped ? "Squad Lost" : "Expedition Complete"}
          </motion.div>
          <div className="mt-1 text-[18px] font-semibold text-[color:var(--color-text)]">
            {activeExpedition.label}
          </div>

          {/* Returning crew */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {crew.map((c) => {
              const isDown = c.hp <= 0
              return (
                <div key={c.handle} className="flex flex-col items-center gap-1">
                  <div className={cn("relative", isDown && "opacity-45 grayscale")}>
                    <PixelAvatar config={c.avatar} size="sm" showFlair={c.isPlayer} />
                    {isDown && (
                      <span className="absolute inset-0 flex items-center justify-center text-[16px] font-bold text-[color:var(--color-danger)]">
                        ✕
                      </span>
                    )}
                  </div>
                  <span
                    className="max-w-[72px] truncate text-[13px]"
                    style={{ color: isDown ? "var(--color-danger)" : "var(--color-muted)" }}
                  >
                    {c.short}
                  </span>
                  {isDown && (
                    <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-danger)]/80">
                      Down
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div
            className="mt-2 text-[12px]"
            style={{
              color: wiped
                ? "var(--color-danger)"
                : downed.length > 0
                  ? "var(--color-amber)"
                  : woundedRef.current
                    ? "var(--color-amber)"
                    : "var(--color-success)",
            }}
          >
            {wiped
              ? "Entire squad eliminated — no one returned"
              : downed.length > 0
                ? `${survivors.length} returned · ${downed.length} lost in the field`
                : woundedRef.current
                  ? "Squad returned, battered"
                  : "Full squad returned unscathed"}{" "}
            · {battlesWonRef.current} threats cleared
          </div>

          {/* Stat-check outcome breakdown */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px]">
            <span className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1">
              <span className="text-[color:var(--color-success)]">{checksPassedRef.current}</span>
              <span className="text-[color:var(--color-muted)]"> checks passed</span>
            </span>
            <span className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1">
              <span className="text-[color:var(--color-danger)]">{checksFailedRef.current}</span>
              <span className="text-[color:var(--color-muted)]"> failed</span>
            </span>
            <span className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1">
              <span className="text-[color:var(--color-violet-bright)]">{lootFoundRef.current}</span>
              <span className="text-[color:var(--color-muted)]"> caches found</span>
            </span>
            {hiddenRoutesRef.current > 0 && (
              <span className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1">
                <span className="text-[color:var(--color-cyan)]">{hiddenRoutesRef.current}</span>
                <span className="text-[color:var(--color-muted)]"> hidden routes</span>
              </span>
            )}
            {delayLoreSeconds > 0 && (
              <span className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1">
                <span className="text-[color:var(--color-amber)]">{delayLabel}</span>
                <span className="text-[color:var(--color-muted)]"> lost to setbacks</span>
              </span>
            )}
          </div>

          {/* Lost-member salvage breakdown */}
          {downed.length > 0 && !wiped && (
            <div className="mt-4 w-full max-w-[300px] text-[12px] text-[color:var(--color-muted)]">
              {downed.map((c) => (
                <div key={c.handle} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="truncate text-[color:var(--color-danger)]/90">{c.short} fell</span>
                  <span>
                    secured {c.downedAtLoot ?? 0}/{totalLootUnits} before going down
                  </span>
                </div>
              ))}
              <div className="mt-1 text-[13px] text-[color:var(--color-muted)]/80">
                Survivors recovered the remaining cargo and carried the full haul home.
              </div>
            </div>
          )}

          {/* Reward summary */}
          <div className="mt-5 w-full max-w-[300px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-4">
            <div className="mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              {wiped ? "Rewards Lost" : "Rewards"}
            </div>
            {wiped ? (
              <div className="text-[13px] text-[color:var(--color-danger)]">
                The entire squad was defeated. All loot was abandoned in the field — no rewards
                recovered.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-4 text-[14px]">
                  {exp?.rewards.xp ? (
                    <span className="text-[color:var(--color-cyan)]">+{exp.rewards.xp} XP</span>
                  ) : null}
                  {exp?.rewards.tokens ? (
                    <span className="text-[color:var(--color-amber)]">+{exp.rewards.tokens} tokens</span>
                  ) : null}
                </div>
                {exp?.rewards.possibleDrops && exp.rewards.possibleDrops.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {exp.rewards.possibleDrops.slice(0, 4).map((drop, i) => (
                      <span
                        key={i}
                        className={cn("rounded px-1.5 py-0.5 text-[12px]", rarityColor[drop.rarity])}
                      >
                        {drop.label}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => completeActiveExpedition(lootMultiplier)}
            className={cn(
              "mt-6 rounded-lg border px-6 py-2.5 text-[14px] font-medium uppercase tracking-wider transition-colors",
              wiped
                ? "border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/25"
                : "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/25",
            )}
          >
            {wiped ? "Return Empty-Handed" : "Collect & Return"}
          </button>
        </div>
      )}
    </div>
  )
}
