import type {
  BaseStats,
  BattleLine,
  FactionBaseState,
  RaceId,
  StoredGroup,
} from "./types"
import { aggregateStats } from "./expedition-sim"
import { getFactionById } from "./world-map"
import { FACTION_BUILDINGS } from "@/config/faction"

/** Level a claimable node's monster garrison is scaled to (endgame). */
export const ENDGAME_NODE_LEVEL = 12
/** Level a faction base's standing defenders are scaled to (tougher still). */
export const BASE_DEFENSE_LEVEL = 16
/** Full integrity of every faction base. */
export const BASE_MAX_INTEGRITY = 100
/** How long a base-assaulted building stays offline before recovering. */
export const BUILDING_DISABLE_MS = 1000 * 60 * 30 // 30 min
/** Integrity regained per minute of real time since the last recovery tick. */
export const BASE_INTEGRITY_REGEN_PER_MIN = 0.5

/**
 * Territory-war combat model.
 *
 * This is a standalone, auto-resolved layer that sits beside the expedition
 * sim. Groups are reduced to two scalars — offense and toughness — and traded
 * blow-for-blow until one side breaks, producing a cinematic exchange log. Run
 * buffs never enter here: a stored garrison is only ever base + equipment
 * derived stats, so a node is defended at the strength it was captured with.
 */

/** Raw damage-dealing weight of a stat block. */
export function statsOffense(stats: BaseStats): number {
  return stats.atk * 1.6 + stats.focus * 0.5 + stats.luck * 0.35
}

/** Raw staying-power of a stat block. */
export function statsToughness(stats: BaseStats): number {
  return stats.hp * 0.6 + stats.def * 1.4
}

/** Single headline number for rosters, gating, and rival auto-resolution. */
export function groupPower(group: StoredGroup): number {
  const agg = aggregateStats(group.members.map((m) => m.stats))
  return Math.round(statsOffense(agg) * 2 + statsToughness(agg))
}

/**
 * Freeze a set of members into a defender garrison. Callers pass already
 * equipment-derived base stats (never run-buffed values), matching the design
 * rule that a stored group keeps gear but loses the buffs it deployed with.
 */
export function snapshotGroup(
  members: { handle: string; role: string; avatar?: import("./types").AvatarConfig; stats: BaseStats }[],
  factionId: RaceId | null,
  opts: { monster?: boolean } = {},
): StoredGroup {
  const group: StoredGroup = {
    factionId,
    members: members.map((m) => ({
      handle: m.handle,
      role: m.role,
      avatar: m.avatar,
      stats: { ...m.stats },
    })),
    power: 0,
    monster: opts.monster,
    capturedAt: Date.now(),
  }
  group.power = groupPower(group)
  return group
}

const MONSTER_ARCHETYPES = [
  { handle: "Relay Wraith", role: "Skirmisher", lean: { hp: 10, atk: 9, def: 4, focus: 6, luck: 4 } },
  { handle: "Static Maw", role: "Bruiser", lean: { hp: 16, atk: 8, def: 8, focus: 2, luck: 2 } },
  { handle: "Gloom Stalker", role: "Ambusher", lean: { hp: 9, atk: 10, def: 3, focus: 7, luck: 6 } },
  { handle: "Rust Colossus", role: "Anchor", lean: { hp: 20, atk: 7, def: 11, focus: 2, luck: 1 } },
]

/**
 * The hard AI monster garrison that holds a neutral node until a faction takes
 * it. Scaled to endgame off the node's level so an unprepared squad is punished
 * — this is the "as it was pre-update" defender for a node's first claim.
 */
export function buildMonsterGarrison(nodeLevel: number): StoredGroup {
  const tier = Math.max(1, nodeLevel)
  // Endgame nodes field a full pack; the multiplier climbs with node level.
  const scale = 1 + tier * 0.32
  const members = MONSTER_ARCHETYPES.map((a) => ({
    handle: a.handle,
    role: a.role,
    stats: {
      hp: Math.round(a.lean.hp * scale),
      atk: Math.round(a.lean.atk * scale),
      def: Math.round(a.lean.def * scale),
      focus: Math.round(a.lean.focus * scale),
      luck: Math.round(a.lean.luck * scale),
    } satisfies BaseStats,
  }))
  return snapshotGroup(members, null, { monster: true })
}

const FACTION_UNIT_ROLES = [
  { role: "Vanguard", lean: { hp: 16, atk: 9, def: 9, focus: 4, luck: 3 } },
  { role: "Outrider", lean: { hp: 11, atk: 10, def: 5, focus: 6, luck: 5 } },
  { role: "Warden", lean: { hp: 18, atk: 7, def: 11, focus: 3, luck: 2 } },
]

/**
 * A faction's own soldiers — used both as rival expansion forces and as the
 * standing defenders of a faction base. Scaled off `level`.
 */
export function buildFactionGarrison(factionId: RaceId, level: number): StoredGroup {
  const scale = 1 + Math.max(1, level) * 0.3
  const faction = getFactionById(factionId)
  const tag = faction ? faction.name.split(" ")[0] : "Faction"
  const members = FACTION_UNIT_ROLES.map((u) => ({
    handle: `${tag} ${u.role}`,
    role: u.role,
    stats: {
      hp: Math.round(u.lean.hp * scale),
      atk: Math.round(u.lean.atk * scale),
      def: Math.round(u.lean.def * scale),
      focus: Math.round(u.lean.focus * scale),
      luck: Math.round(u.lean.luck * scale),
    } satisfies BaseStats,
  }))
  return snapshotGroup(members, factionId)
}

/**
 * Seed every faction's home base. Rival bases stand fully developed so they are
 * worth raiding; the player's base mirrors the shared building template.
 */
export function buildInitialFactionBases(
  factionIds: RaceId[],
  playerFactionId?: RaceId | null,
): Record<string, FactionBaseState> {
  const bases: Record<string, FactionBaseState> = {}
  for (const id of factionIds) {
    const isPlayer = id === playerFactionId
    const buildings = FACTION_BUILDINGS.map((b) => ({
      ...b,
      // Rivals field maxed buildings (more to knock offline); the player base
      // mirrors the template's starting levels.
      level: isPlayer ? b.level : b.maxLevel,
      baseMaterials: b.baseMaterials.map((m) => ({ ...m })),
    }))
    bases[id] = {
      factionId: id,
      integrity: BASE_MAX_INTEGRITY,
      maxIntegrity: BASE_MAX_INTEGRITY,
      buildings,
      lastRecoveredAt: Date.now(),
    }
  }
  return bases
}

/**
 * Apply elapsed-time recovery to a base: integrity ticks back up and any
 * building whose disable window has passed comes back online. Pure — returns a
 * new base state, or the same reference when nothing changed.
 */
export function recoverBaseState(base: FactionBaseState, now: number = Date.now()): FactionBaseState {
  const elapsedMin = (now - base.lastRecoveredAt) / 60000
  const regen = elapsedMin * BASE_INTEGRITY_REGEN_PER_MIN
  const nextIntegrity = Math.min(base.maxIntegrity, base.integrity + regen)
  const buildings = base.buildings.map((b) =>
    b.disabledUntil && b.disabledUntil <= now ? { ...b, disabledUntil: undefined } : b,
  )
  const integrityChanged = nextIntegrity - base.integrity >= 0.01
  const buildingsChanged = buildings.some((b, i) => b !== base.buildings[i])
  if (!integrityChanged && !buildingsChanged) return base
  return {
    ...base,
    integrity: nextIntegrity,
    buildings,
    lastRecoveredAt: now,
  }
}

function sideLabel(group: StoredGroup, fallback: string): string {
  if (group.monster) return "The garrison"
  const faction = getFactionById(group.factionId)
  return faction ? faction.name : fallback
}

export interface TerritoryBattleResult {
  log: BattleLine[]
  result: "win" | "loss"
  /** 0..1 — attacker HP fraction remaining on a win (decisiveness). */
  margin: number
}

/**
 * Auto-resolve an invaders-vs-defenders clash into a cinematic exchange log.
 * Deterministic given `rng`; the caller supplies the roster snapshots.
 */
export function simulateTerritoryBattle(
  attacker: StoredGroup,
  defender: StoredGroup,
  rng: () => number = Math.random,
): TerritoryBattleResult {
  const aStats = aggregateStats(attacker.members.map((m) => m.stats))
  const dStats = aggregateStats(defender.members.map((m) => m.stats))

  const aMax = Math.max(1, statsToughness(aStats))
  const dMax = Math.max(1, statsToughness(dStats))
  let aHp = aMax
  let dHp = dMax

  const aOff = Math.max(1, statsOffense(aStats))
  const dOff = Math.max(1, statsOffense(dStats))

  const aName = sideLabel(attacker, "The invaders")
  const dName = sideLabel(defender, "The defenders")

  const log: BattleLine[] = []
  const frac = () => ({
    attackerHp: Math.max(0, aHp / aMax),
    defenderHp: Math.max(0, dHp / dMax),
  })

  log.push({ side: "system", text: `${aName} move on the position. ${dName} hold the line.`, ...frac() })

  const roll = () => 0.75 + rng() * 0.5 // 0.75..1.25 swing per exchange
  let round = 0
  const maxRounds = 12
  while (aHp > 0 && dHp > 0 && round < maxRounds) {
    round++
    // Attacker strikes.
    const aDmg = aOff * 0.22 * roll()
    dHp -= aDmg
    log.push({
      side: "attacker",
      text: attackerBeat(aName, dName, aDmg, dHp <= 0),
      ...frac(),
    })
    if (dHp <= 0) break
    // Defenders answer.
    const dDmg = dOff * 0.22 * roll()
    aHp -= dDmg
    log.push({
      side: "defender",
      text: defenderBeat(dName, aName, dDmg, aHp <= 0),
      ...frac(),
    })
  }

  const aFrac = Math.max(0, aHp / aMax)
  const dFrac = Math.max(0, dHp / dMax)
  const win = dHp <= 0 || (aHp > 0 && aFrac >= dFrac)
  const margin = win ? Math.max(0.05, aFrac) : 0

  log.push({
    side: "system",
    text: win
      ? `${aName} break the defenders and seize the ground.`
      : `${dName} hold. ${aName} are driven back.`,
    attackerHp: aFrac,
    defenderHp: dFrac,
  })

  return { log, result: win ? "win" : "loss", margin }
}

function attackerBeat(atk: string, def: string, dmg: number, killing: boolean): string {
  if (killing) return `${atk} punch through the last of ${def}.`
  if (dmg > 12) return `${atk} land a crushing push against ${def}.`
  if (dmg > 6) return `${atk} press hard and gain ground.`
  return `${atk} trade blows and chip at the line.`
}

function defenderBeat(def: string, atk: string, dmg: number, killing: boolean): string {
  if (killing) return `${def} rout ${atk} with a final volley.`
  if (dmg > 12) return `${def} answer with a devastating counter.`
  if (dmg > 6) return `${def} dig in and return fire.`
  return `${def} hold formation and absorb the hit.`
}

/**
 * Translate a base-assault victory margin into concrete damage: a slice of
 * integrity plus a proportional number of buildings knocked offline. Buildings
 * already offline are skipped so a raid can't "re-break" them.
 */
export function planBaseAssaultDamage(
  margin: number,
  base: FactionBaseState,
  now: number = Date.now(),
): { integrityLost: number; buildingsHit: string[] } {
  // 12%..40% of max integrity depending on how decisive the win was.
  const integrityLost = Math.round(base.maxIntegrity * (0.12 + margin * 0.28))

  const online = base.buildings.filter(
    (b) => b.level > 0 && !(b.disabledUntil && b.disabledUntil > now),
  )
  // One building for a narrow win, up to three for a rout.
  const hitCount = Math.min(online.length, 1 + Math.floor(margin * 2.5))
  const buildingsHit = online
    .slice()
    .sort((a, b) => b.level - a.level)
    .slice(0, hitCount)
    .map((b) => b.id)

  return { integrityLost, buildingsHit }
}
