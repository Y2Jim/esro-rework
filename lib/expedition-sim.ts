import type { BaseStats, RaceId } from "./types"

/**
 * Pure simulation helpers for the active expedition view.
 *
 * Every passive (non-rest) event resolves as a *stat check*: the squad's
 * aggregated stats are compared against a difficulty threshold that scales with
 * the expedition's risk and how deep into the run the squad is. Checks can fail
 * when the squad lacks the relevant stats, producing real consequences (wounds,
 * empty caches, wrong turns). The player's lineage (race) and faction allegiance
 * apply passive modifiers to the whole squad.
 */

export type ExpEventType = "travel" | "discovery" | "battle" | "hazard" | "rest"

export type CheckOutcome = "crit" | "success" | "fail" | "badfail" | "neutral"

export interface StatCheck {
  primary: keyof BaseStats
  secondary: keyof BaseStats
  /** Short label shown in the field log, e.g. "Navigation". */
  label: string
}

/** Which stats govern each event type. `rest` has no check (always recovers). */
export const EVENT_CHECK: Record<ExpEventType, StatCheck | null> = {
  battle: { primary: "atk", secondary: "def", label: "Combat" },
  hazard: { primary: "def", secondary: "focus", label: "Endurance" },
  discovery: { primary: "focus", secondary: "luck", label: "Insight" },
  travel: { primary: "luck", secondary: "focus", label: "Navigation" },
  rest: null,
}

const EMPTY_STATS: BaseStats = { hp: 0, atk: 0, def: 0, focus: 0, luck: 0 }

/** Deterministic string hash so derived member stats are stable per handle. */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Stat leanings per party role; party members have no stored stats of their own. */
const ROLE_LEAN: Record<string, BaseStats> = {
  Logistics: { hp: 14, atk: 3, def: 5, focus: 3, luck: 3 },
  Surveying: { hp: 12, atk: 3, def: 3, focus: 4, luck: 5 },
  Analysis: { hp: 11, atk: 2, def: 3, focus: 6, luck: 3 },
  Crew: { hp: 12, atk: 4, def: 3, focus: 3, luck: 3 },
}

/** Derive stable stats for a non-player party member from role + handle. */
export function deriveMemberStats(handle: string, role: string): BaseStats {
  const lean = ROLE_LEAN[role] ?? ROLE_LEAN.Crew
  const h = hash(handle)
  const v = (n: number) => (h >> (n * 3)) % 3 // 0..2 deterministic variance
  return {
    hp: lean.hp + v(0),
    atk: lean.atk + v(1),
    def: lean.def + v(2),
    focus: lean.focus + v(3),
    luck: lean.luck + v(4),
  }
}

/** Sum a list of stat blocks into a single squad-wide block. */
export function aggregateStats(list: BaseStats[]): BaseStats {
  return list.reduce(
    (acc, s) => ({
      hp: acc.hp + s.hp,
      atk: acc.atk + s.atk,
      def: acc.def + s.def,
      focus: acc.focus + s.focus,
      luck: acc.luck + s.luck,
    }),
    { ...EMPTY_STATS },
  )
}

export interface ActivePassive {
  source: "Lineage" | "Faction"
  name: string
  effect: string
}

export interface RunModifiers {
  /** Per-event-type score multiplier bonus (e.g. 0.15 = +15%). */
  scoreBonus: Partial<Record<ExpEventType, number>>
  /** Flat reduction to crew damage taken on failed checks. */
  damageReduction: number
  /** Added chance a successful discovery yields bonus loot. */
  bonusLootChance: number
  /** Added chance a successful traverse reveals a hidden route. */
  hiddenRouteChance: number
  /** Crowned Courts: bonus XP when running with a party. */
  partyXpBonus: boolean
  /** Human-readable passives for the readiness panel. */
  passives: ActivePassive[]
}

function emptyMods(): RunModifiers {
  return {
    scoreBonus: {},
    damageReduction: 0,
    bonusLootChance: 0,
    hiddenRouteChance: 0,
    partyXpBonus: false,
    passives: [],
  }
}

function addBonus(mods: RunModifiers, type: ExpEventType, amt: number) {
  mods.scoreBonus[type] = (mods.scoreBonus[type] ?? 0) + amt
}

/** Combine the player's lineage + faction into a single set of squad modifiers. */
export function getRunModifiers(raceId: RaceId | undefined, factionId: RaceId | undefined): RunModifiers {
  const mods = emptyMods()

  // ---- Lineage (race) passives ----
  switch (raceId) {
    case "crownborn":
      addBonus(mods, "hazard", 0.15)
      addBonus(mods, "discovery", 0.1)
      mods.passives.push({
        source: "Lineage",
        name: "Crownborn — Composed Focus",
        effect: "Steadier under pressure (+Endurance, +Insight)",
      })
      break
    case "hearthkin":
      addBonus(mods, "hazard", 0.15)
      mods.damageReduction += 1
      mods.passives.push({
        source: "Lineage",
        name: "Hearthkin — Hearth Endurance",
        effect: "Shrugs off setbacks (-1 wound per failure)",
      })
      break
    case "gloamwhisper":
      addBonus(mods, "discovery", 0.15)
      addBonus(mods, "travel", 0.1)
      mods.passives.push({
        source: "Lineage",
        name: "Gloamwhisper — Veiled Reads",
        effect: "Sharper in the dark (+Insight, +Navigation)",
      })
      break
    case "roadsinger":
      addBonus(mods, "travel", 0.2)
      mods.hiddenRouteChance += 0.25
      mods.passives.push({
        source: "Lineage",
        name: "Roadsinger — Wayfinder",
        effect: "Opens hidden paths (+Navigation, +route finds)",
      })
      break
    default:
      break
  }

  // ---- Faction passives ----
  switch (factionId) {
    case "crownborn": // Crowned Courts
      mods.partyXpBonus = true
      mods.passives.push({
        source: "Faction",
        name: "Crowned Courts",
        effect: "EXP increase when partied",
      })
      break
    case "hearthkin": // Hearth Wardens
      mods.damageReduction += 1
      addBonus(mods, "hazard", 0.1)
      mods.passives.push({
        source: "Faction",
        name: "Hearth Wardens",
        effect: "Reduced setbacks on the march",
      })
      break
    case "gloamwhisper": // Veiled Circle
      mods.bonusLootChance += 0.3
      addBonus(mods, "discovery", 0.1)
      mods.passives.push({
        source: "Faction",
        name: "Veiled Circle",
        effect: "Increased loot chance",
      })
      break
    case "roadsinger": // Open Roads Chorus
      mods.hiddenRouteChance += 0.3
      addBonus(mods, "travel", 0.1)
      mods.passives.push({
        source: "Faction",
        name: "Open Roads Chorus",
        effect: "Higher chance of hidden route discovery",
      })
      break
    default:
      break
  }

  return mods
}

const RISK_BASE: Record<"Low" | "Medium" | "High", number> = {
  Low: 4,
  Medium: 5.5,
  High: 7,
}

export interface ResolveInput {
  type: ExpEventType
  squad: BaseStats
  crewSize: number
  risk: "Low" | "Medium" | "High"
  /** 0-based stage index; deeper stages raise the difficulty. */
  stageIndex: number
  mods: RunModifiers
  rng?: () => number
}

export interface ResolveResult {
  outcome: CheckOutcome
  check: StatCheck | null
  score: number
  threshold: number
  /** Crew damage to apply (already adjusted by damage reduction). */
  damage: number
  /** Discovery yielded loot. */
  loot: boolean
  /** Passive-driven extra loot. */
  bonusLoot: boolean
  /** A hidden route was revealed (travel). */
  hiddenRoute: boolean
}

/**
 * Resolve a single event as a stat check. Returns the outcome plus any
 * consequences (wounds, loot, hidden routes) for the view to apply + narrate.
 */
export function resolveCheck(input: ResolveInput): ResolveResult {
  const { type, squad, crewSize, risk, stageIndex, mods } = input
  const rng = input.rng ?? Math.random
  const check = EVENT_CHECK[type]

  const base: ResolveResult = {
    outcome: "neutral",
    check,
    score: 0,
    threshold: 0,
    damage: 0,
    loot: false,
    bonusLoot: false,
    hiddenRoute: false,
  }

  if (!check) return base // rest: no check, always fine

  // Squad capability for this check (primary fully, secondary at half weight).
  let score = squad[check.primary] + squad[check.secondary] * 0.5
  // Luck injects variance — a roll scaled by the squad's collective luck.
  score += rng() * (squad.luck * 0.2 + 2)
  // Apply lineage/faction percentage bonus for this event type.
  const bonus = mods.scoreBonus[type] ?? 0
  score *= 1 + bonus

  // Difficulty scales with party size, risk, and how deep the run is.
  const perMember = RISK_BASE[risk] + stageIndex * 1.4
  const threshold = Math.max(1, perMember * crewSize)
  const margin = score - threshold

  let outcome: CheckOutcome
  if (margin >= threshold * 0.3) outcome = "crit"
  else if (margin >= 0) outcome = "success"
  else if (margin >= -threshold * 0.3) outcome = "fail"
  else outcome = "badfail"

  const result: ResolveResult = { ...base, outcome, score, threshold }
  const passed = outcome === "crit" || outcome === "success"

  if (type === "discovery") {
    result.loot = passed
    if (passed) {
      result.bonusLoot = outcome === "crit" || rng() < mods.bonusLootChance
    }
  } else if (type === "travel") {
    if (passed) {
      result.hiddenRoute = rng() < mods.hiddenRouteChance
    } else {
      // Wrong turn / ambush — light chip damage.
      const raw = outcome === "badfail" ? 2 : 1
      result.damage = Math.max(outcome === "badfail" ? 1 : 0, raw - mods.damageReduction)
    }
  } else if (type === "hazard") {
    if (!passed) {
      const raw = outcome === "badfail" ? 3 : 2
      result.damage = Math.max(1, raw - mods.damageReduction)
    } else if (outcome === "success") {
      // Mitigated but not perfectly.
      result.damage = Math.max(0, 1 - mods.damageReduction)
    }
  }
  // battle damage is handled by the token-clash loop using `outcome`.

  return result
}

/** Difficulty profile for a battle, derived from the pre-rolled combat check. */
export interface BattlePlan {
  enemyHp: number
  /** Probability the squad lands a hit each exchange. */
  squadHitChance: number
  /** Probability the squad takes a hit each exchange. */
  squadTakeChance: number
  /** Squad is overwhelmed — heavier losses, a member may be downed. */
  overwhelmed: boolean
}

export function planBattle(outcome: CheckOutcome, risk: "Low" | "Medium" | "High", stageIndex: number): BattlePlan {
  const riskHp = risk === "High" ? 6 : risk === "Medium" ? 5 : 4
  const enemyHp = riskHp + Math.floor(stageIndex / 2)
  switch (outcome) {
    case "crit":
      return { enemyHp, squadHitChance: 0.95, squadTakeChance: 0.2, overwhelmed: false }
    case "success":
      return { enemyHp, squadHitChance: 0.8, squadTakeChance: 0.4, overwhelmed: false }
    case "fail":
      return { enemyHp: enemyHp + 1, squadHitChance: 0.55, squadTakeChance: 0.7, overwhelmed: false }
    default: // badfail
      return { enemyHp: enemyHp + 2, squadHitChance: 0.4, squadTakeChance: 0.9, overwhelmed: true }
  }
}

const OUTCOME_LABEL: Record<CheckOutcome, string> = {
  crit: "critical success",
  success: "passed",
  fail: "failed",
  badfail: "failed badly",
  neutral: "",
}

/** Short clause appended to a log line describing the check + outcome. */
export function checkClause(result: ResolveResult, statLabel: string): string {
  if (!result.check || result.outcome === "neutral") return ""
  return `${result.check.label} check (${statLabel}) — ${OUTCOME_LABEL[result.outcome]}`
}
