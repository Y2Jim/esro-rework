"use client"

import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import type { AvatarConfig } from "@/lib/types"

/** Sped-up run length (seconds of viewing time) and tick cadence. */
const RUN_SECONDS = 90
const TICK_MS = 200

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
}

interface BattleState {
  enemy: string
  hpMax: number
  hp: number
  active: boolean
  clash: boolean
  cooldown: number
}

const EVENT_STYLE: Record<EventType, { color: string; label: string }> = {
  travel: { color: "var(--color-cyan)", label: "Travel" },
  discovery: { color: "var(--color-violet-bright)", label: "Discovery" },
  battle: { color: "var(--color-danger)", label: "Battle" },
  hazard: { color: "var(--color-amber)", label: "Hazard" },
  rest: { color: "var(--color-green)", label: "Regroup" },
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

const ENEMIES = [
  "a Static Wraith",
  "a Signal Husk",
  "Drift Scavengers",
  "a Corrupted Relay",
  "an Anomaly Swarm",
  "a Hollow Sentinel",
]

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
        return {
          handle,
          short: shortHandle(handle),
          avatar: identity.avatar,
          role: "You",
          isPlayer: true,
          hpMax: 6,
          hp: 6,
          flashUntil: 0,
        }
      }
      const m = party.find((p) => p.handle === handle)
      return {
        handle,
        short: shortHandle(handle),
        avatar: m?.avatar ?? identity.avatar,
        role: m?.role ?? "Crew",
        isPlayer: false,
        hpMax: 5,
        hp: 5,
        flashUntil: 0,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition?.id])

  // Simulation state lives in refs; we force a render each tick for smoothness.
  const [, forceTick] = useReducer((x) => x + 1, 0)
  const [phase, setPhase] = useState<"running" | "complete">("running")
  const phaseRef = useRef<"running" | "complete">("running")

  const elapsedRef = useRef(0)
  const crewRef = useRef<CrewMember[]>(initialCrew)
  const feedRef = useRef<FeedEntry[]>([])
  const battleRef = useRef<BattleState | null>(null)
  const firedRef = useRef<Set<number>>(new Set())
  const timelineRef = useRef<TimelineEvent[]>([])
  const feedIdRef = useRef(0)
  const battlesWonRef = useRef(0)

  // Reset all sim state when a new expedition starts.
  useEffect(() => {
    elapsedRef.current = 0
    crewRef.current = initialCrew
    feedRef.current = []
    battleRef.current = null
    firedRef.current = new Set()
    feedIdRef.current = 0
    battlesWonRef.current = 0
    timelineRef.current = buildTimeline(risk, initialCrew)
    phaseRef.current = "running"
    setPhase("running")
    forceTick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExpedition?.id])

  const progress = Math.min(1, elapsedRef.current / RUN_SECONDS)
  const stageOf = (p: number) => Math.min(totalStages, Math.floor(p * totalStages) + 1)

  const pushFeed = (type: EventType, text: string) => {
    feedIdRef.current += 1
    feedRef.current = [
      { id: feedIdRef.current, type, text, stage: stageOf(elapsedRef.current / RUN_SECONDS) },
      ...feedRef.current,
    ].slice(0, 24)
  }

  const damageRandomCrew = () => {
    const candidates = crewRef.current.filter((c) => c.hp > 1)
    if (candidates.length === 0) return
    const target = randItem(candidates)
    target.hp -= 1
    target.flashUntil = Date.now() + 600
  }

  const fireEvent = (ev: TimelineEvent) => {
    if (ev.type === "battle") {
      const enemy = randItem(ENEMIES)
      const hp = 4 + Math.floor(Math.random() * 4) // 4-7 pips
      battleRef.current = { enemy, hpMax: hp, hp, active: true, clash: false, cooldown: 400 }
      pushFeed("battle", `Contact — ${enemy} engaging the squad.`)
    } else if (ev.type === "hazard") {
      if (Math.random() < 0.6) damageRandomCrew()
      pushFeed("hazard", ev.text ?? "Hazard encountered.")
    } else {
      pushFeed(ev.type, ev.text ?? "")
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
    // Enemy takes a hit each exchange.
    b.hp = Math.max(0, b.hp - (1 + (Math.random() < 0.4 ? 1 : 0)))
    // Squad occasionally takes a glancing hit.
    if (Math.random() < 0.45) damageRandomCrew()
    if (b.hp <= 0) {
      b.active = false
      battlesWonRef.current += 1
      pushFeed("battle", `${b.enemy} neutralized — squad pressing on.`)
      if (Math.random() < 0.5) pushFeed("discovery", "Salvage stripped from the wreckage.")
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
      elapsedRef.current = Math.min(elapsedRef.current + TICK_MS / 1000, RUN_SECONDS)
      const p = elapsedRef.current / RUN_SECONDS
      timelineRef.current.forEach((ev, idx) => {
        if (!firedRef.current.has(idx) && p >= ev.at) {
          firedRef.current.add(idx)
          fireEvent(ev)
        }
      })
      advanceBattle()
      if (elapsedRef.current >= RUN_SECONDS && !battleRef.current?.active) {
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
                <span>ETA {etaLabel}</span>
              </div>
            </div>
          </div>

          {/* Field view: squad vs threat (token clash) */}
          <div className="border-b border-[color:var(--color-border-soft)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Squad cluster */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex -space-x-2">
                  {crew.slice(0, 3).map((c) => (
                    <div
                      key={c.handle}
                      className="rounded-sm ring-1 ring-[color:var(--color-bg)]"
                    >
                      <PixelAvatar config={c.avatar} size="xs" showFlair={false} />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-cyan)]">
                  Squad
                </span>
              </div>

              {/* Center status */}
              <div className="flex flex-1 flex-col items-center">
                {battle?.active ? (
                  <motion.div
                    animate={battle.clash ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-danger)]"
                  >
                    Engaging
                  </motion.div>
                ) : (
                  <div className="text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    Advancing
                  </div>
                )}
                {/* connector */}
                <div className="mt-1 flex w-full items-center gap-1 px-2">
                  <div className="h-px flex-1 bg-[color:var(--color-border)]" />
                  <span
                    className="text-[12px]"
                    style={{ color: battle?.active ? "var(--color-danger)" : "var(--color-muted)" }}
                  >
                    {battle?.active ? "✦" : "»"}
                  </span>
                  <div className="h-px flex-1 bg-[color:var(--color-border)]" />
                </div>
              </div>

              {/* Threat token */}
              <div className="flex flex-col items-center gap-1">
                <AnimatePresence mode="wait">
                  {battle?.active ? (
                    <motion.div
                      key="enemy"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={
                        battle.clash
                          ? { opacity: 1, scale: 1, x: [-4, 0] }
                          : { opacity: 1, scale: 1, x: 0 }
                      }
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="flex h-6 w-6 rotate-45 items-center justify-center rounded-sm border border-[color:var(--color-danger)]/60 bg-[color:var(--color-danger)]/15"
                    >
                      <span className="-rotate-45 text-[12px] text-[color:var(--color-danger)]">✶</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waypoint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      className="flex h-6 w-6 items-center justify-center"
                    >
                      <span className="text-[14px] text-[color:var(--color-muted)]">◇</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <span
                  className="max-w-[84px] truncate text-[11px] uppercase tracking-wider"
                  style={{ color: battle?.active ? "var(--color-danger)" : "var(--color-muted)" }}
                >
                  {battle?.active ? battle.enemy : "Clear"}
                </span>
              </div>
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
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
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
                        className="mt-0.5 shrink-0 text-[10px] uppercase tracking-wider"
                        style={{ color: style.color }}
                      >
                        {style.label}
                      </span>
                      <span className="text-[13px] leading-snug text-[color:var(--color-foreground)]/90">
                        {entry.text}
                      </span>
                      <span className="ml-auto shrink-0 text-[10px] text-[color:var(--color-muted)]">
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
            className="text-[13px] uppercase tracking-[0.3em] text-[color:var(--color-success)]"
          >
            Expedition Complete
          </motion.div>
          <div className="mt-1 text-[18px] font-semibold text-[color:var(--color-text)]">
            {activeExpedition.label}
          </div>

          {/* Returning crew */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {crew.map((c) => (
              <div key={c.handle} className="flex flex-col items-center gap-1">
                <PixelAvatar config={c.avatar} size="sm" showFlair={c.isPlayer} />
                <span className="max-w-[72px] truncate text-[11px] text-[color:var(--color-muted)]">
                  {c.short}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[12px] text-[color:var(--color-success)]">
            Full squad returned · {battlesWonRef.current} threats cleared
          </div>

          {/* Reward summary */}
          <div className="mt-5 w-full max-w-[300px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-4">
            <div className="mb-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Rewards
            </div>
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
          </div>

          <button
            type="button"
            onClick={completeActiveExpedition}
            className="mt-6 rounded-lg border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/15 px-6 py-2.5 text-[14px] font-medium uppercase tracking-wider text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/25"
          >
            Collect &amp; Return
          </button>
        </div>
      )}
    </div>
  )
}
