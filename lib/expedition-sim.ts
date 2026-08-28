import type { BaseStats, RaceId } from "./types"
import { getRituals } from "./rituals"
import type { SkillUnlockId } from "./skill-effects"

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
  // Endurance is Defense-led; HP is level-driven and therefore cannot be
  // power-leveled by dumping points into a second allocatable stat.
  hazard: { primary: "def", secondary: "hp", label: "Endurance" },
  discovery: { primary: "focus", secondary: "luck", label: "Insight" },
  travel: { primary: "luck", secondary: "focus", label: "Navigation" },
  rest: null,
}

const EMPTY_STATS: BaseStats = { hp: 0, atk: 0, def: 0, focus: 0, luck: 0 }

/**
 * Convert a primary/secondary pair into a derived check score.
 * Secondary starts at half-rate (2 points per 1 score) and its cost rises as
 * it grows, while primary remains the reliable one-for-one investment.
 */
export function derivedStatScore(primary: number, secondary: number): number {
  const p = Math.max(0, primary)
  const s = Math.max(0, secondary)
  const secondaryRate = 0.5 / (1 + s / 20)
  return p + s * secondaryRate
}

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
  source: "Lineage" | "Faction" | "Skill" | "Ritual"
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

  // --- Skill-driven (see lib/skill-effects.ts) ---
  /** Chance a catastrophic failure is downgraded to an ordinary one. */
  badfailDowngrade: number
  /** Chance to land a critical blow in a battle exchange. */
  critChance: number
  /** Chance to negate an incoming battle exchange. */
  counterChance: number
  /** Squad opens battles with a free exchange. */
  firstStrike: number
  /** Bonus damage dealt per battle exchange. */
  battleDamage: number
  /** Extra damage multiplier against an enemy that is nearly down. */
  finishBonus: number
  /** Chance a crew member who would be downed is spared instead. */
  partyProtection: number
  /** How strongly the player pulls enemy attacks onto themselves (Bulwark). */
  threat: number
  /** Multiplier on hostile encounter frequency (negative = fewer). */
  battleFrequency: number
  /** Multiplier on hazard frequency (negative = fewer). */
  hazardFrequency: number
  /** Reduces the severity of anomalies. */
  anomalyResist: number
  /** Extra loot slots carried per run. */
  carryCapacity: number
  /** Chance a harvest upgrades to a rarer tier. */
  rareChance: number
  /** Multiplier on gathered material quantity. */
  materialYield: number
  /** Extra yield at wreck / ruin nodes. */
  salvageYield: number
  /** Multiplier on run duration (negative = faster). */
  runDuration: number
  /** Multiplier on XP earned. */
  xpBonus: number

  /**
   * Skill-tree content unlocks active for this run.
   *
   * Every behavior keyed off this set is strictly *additive*: when an id is
   * absent the sim must run exactly as it did before the unlock existed. In
   * particular, any new `rng()` draw has to live **inside** the unlock guard —
   * an unconditional draw would shift the random stream and silently change
   * every downstream outcome even with the unlock off.
   */
  unlocks: ReadonlySet<SkillUnlockId>
}

function emptyMods(): RunModifiers {
  return {
    scoreBonus: {},
    damageReduction: 0,
    bonusLootChance: 0,
    hiddenRouteChance: 0,
    partyXpBonus: false,
    passives: [],
    badfailDowngrade: 0,
    critChance: 0,
    counterChance: 0,
    firstStrike: 0,
    battleDamage: 0,
    finishBonus: 0,
    partyProtection: 0,
    threat: 0,
    battleFrequency: 0,
    hazardFrequency: 0,
    anomalyResist: 0,
    carryCapacity: 0,
    rareChance: 0,
    materialYield: 0,
    salvageYield: 0,
    runDuration: 0,
    xpBonus: 0,
    unlocks: new Set(),
  }
}

function addBonus(mods: RunModifiers, type: ExpEventType, amt: number) {
  mods.scoreBonus[type] = (mods.scoreBonus[type] ?? 0) + amt
}

/**
 * Combine the player's lineage + faction + prepped rituals into one set of
 * squad modifiers. `ritualIds` is optional so callers that predate the ritual
 * system keep working unchanged.
 */
export function getRunModifiers(
  raceId: RaceId | undefined,
  factionId: RaceId | undefined,
  ritualIds?: string[]
): RunModifiers {
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

  // ---- Rituals (Focus) ----
  // Ritual effect keys deliberately mirror the skill-bonus keys, so the same
  // additive merge handles both and rituals stack with lineage/faction/skills.
  const rituals = getRituals(ritualIds)
  for (const ritual of rituals) {
    applySkillBonuses(mods, ritual.effects as Record<string, number>)
    mods.passives.push({
      source: "Ritual",
      name: ritual.label,
      effect: ritual.description,
    })
  }

  return mods
}

/**
 * Fold aggregated skill bonuses into a set of run modifiers.
 *
 * Lineage/faction passives and skills stack additively: a skill-driven +12%
 * battle score adds to a lineage's +10% rather than overwriting it.
 */
export function applySkillBonuses(
  mods: RunModifiers,
  bonuses: Partial<Record<string, number>>,
  skillPassives: ActivePassive[] = [],
  /** Content unlocks earned from skill breakpoints. Optional so existing
   *  callers (and the no-unlock baseline) keep their exact behavior. */
  unlocks: Iterable<SkillUnlockId> = [],
): RunModifiers {
  const b = (k: string) => bonuses[k] ?? 0
  mods.unlocks = new Set(unlocks)

  addBonus(mods, "battle", b("battleScore"))
  addBonus(mods, "hazard", b("hazardScore"))
  addBonus(mods, "discovery", b("discoveryScore"))
  addBonus(mods, "travel", b("travelScore"))

  mods.damageReduction += b("damageReduction")
  mods.bonusLootChance += b("bonusLoot")
  mods.hiddenRouteChance += b("hiddenRoute")

  mods.badfailDowngrade += b("badfailDowngrade")
  mods.critChance += b("critChance")
  mods.counterChance += b("counterChance")
  mods.firstStrike += b("firstStrike")
  mods.battleDamage += b("battleDamage")
  mods.finishBonus += b("finishBonus")
  // Several survival skills feed this, so cap it — at 100% no crew could ever be
  // lost, which would remove all risk from a run.
  mods.partyProtection = Math.min(0.75, mods.partyProtection + b("partyProtection"))
  mods.threat += b("threat")
  mods.battleFrequency += b("battleFrequency")
  mods.hazardFrequency += b("hazardFrequency")
  mods.anomalyResist += b("anomalyResist")
  mods.carryCapacity += b("carryCapacity")
  mods.rareChance += b("rareChance")
  mods.materialYield += b("materialYield")
  mods.salvageYield += b("salvageYield")
  // Gathering (Harvesting) speeds up node work, which shortens the run the same
  // way runDuration does — hence the sign flip on a positive-is-faster stat.
  mods.runDuration += b("runDuration") - b("gatherSpeed")
  mods.xpBonus += b("xpBonus")

  mods.passives.push(...skillPassives)
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
  /** Appraisal/Prospecting upgraded the find to a rarer tier. */
  rareFind: boolean
  /** `rare_nodes`: the node held a tier above an ordinary rare find. */
  richFind: boolean
  /** `quality_harvest`: the node was worked clean and gave an extra unit. */
  extraYield: boolean
}

/** Chance `rare_nodes` promotes an already-rare find to the richest tier. */
const RARE_NODE_UPGRADE = 0.35
/** Chance `quality_harvest` yields one additional unit from a clean node. */
const CLEAN_HARVEST_CHANCE = 0.4

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
    rareFind: false,
    richFind: false,
    extraYield: false,
  }

  if (!check) return base // rest: no check, always fine

  // Primary carries the check; secondary starts at half-rate and gets
  // progressively more expensive so it cannot replace primary investment.
  let score = derivedStatScore(squad[check.primary], squad[check.secondary])
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

  // Field Medicine (Triage) can blunt a catastrophe into an ordinary setback.
  if (outcome === "badfail" && rng() < mods.badfailDowngrade) {
    outcome = "fail"
  }
  // Bladecraft (Precision) and Marksmanship can turn a clean pass into a crit.
  if (outcome === "success" && type === "battle" && rng() < mods.critChance) {
    outcome = "crit"
  }

  const result: ResolveResult = { ...base, outcome, score, threshold }
  const passed = outcome === "crit" || outcome === "success"

  if (type === "discovery") {
    result.loot = passed
    if (passed) {
      result.bonusLoot = outcome === "crit" || rng() < mods.bonusLootChance
      // Gathering (Appraisal) / Scavenging (Prospecting) upgrade the tier.
      result.rareFind = rng() < mods.rareChance
      // Both draws below are deliberately inside their unlock guard: an
      // unconditional rng() here would shift the stream for every locked run.
      if (result.rareFind && mods.unlocks.has("rare_nodes")) {
        result.richFind = rng() < RARE_NODE_UPGRADE
      }
      if (mods.unlocks.has("quality_harvest")) {
        result.extraYield = rng() < CLEAN_HARVEST_CHANCE
      }
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
  /** Extra damage per landed hit (Brawling / Marksmanship). */
  bonusDamage: number
  /** Chance to negate an incoming hit entirely (Guardwork / Bulwark). */
  counterChance: number
  /** Squad lands a free opening hit before the enemy can act (Marksmanship). */
  firstStrike: boolean
  /** Extra damage once the enemy is nearly down (Bladecraft's Finishing Blow). */
  finishBonus: number
  /** Chance a crew member who would be downed is spared (Bulwark / Guardwork). */
  partyProtection: number
}

export function planBattle(
  outcome: CheckOutcome,
  risk: "Low" | "Medium" | "High",
  stageIndex: number,
  mods?: RunModifiers,
  rng: () => number = Math.random,
): BattlePlan {
  const riskHp = risk === "High" ? 6 : risk === "Medium" ? 5 : 4
  const enemyHp = riskHp + Math.floor(stageIndex / 2)

  // Skill-driven combat edges. Applied on top of the outcome profile so a
  // well-built squad wins exchanges faster and absorbs fewer of them.
  const bonusDamage = Math.round(mods?.battleDamage ?? 0)
  const counterChance = mods?.counterChance ?? 0
  const firstStrike = rng() < (mods?.firstStrike ?? 0)

  const finishBonus = mods?.finishBonus ?? 0
  const partyProtection = mods?.partyProtection ?? 0

  const base = { bonusDamage, counterChance, firstStrike, finishBonus, partyProtection }

  switch (outcome) {
    case "crit":
      return { ...base, enemyHp, squadHitChance: 0.95, squadTakeChance: 0.2, overwhelmed: false }
    case "success":
      return { ...base, enemyHp, squadHitChance: 0.8, squadTakeChance: 0.4, overwhelmed: false }
    case "fail":
      return { ...base, enemyHp: enemyHp + 1, squadHitChance: 0.55, squadTakeChance: 0.7, overwhelmed: false }
    default: // badfail
      return { ...base, enemyHp: enemyHp + 2, squadHitChance: 0.4, squadTakeChance: 0.9, overwhelmed: true }
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
