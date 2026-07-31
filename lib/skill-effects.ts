import type { BaseStats, Skill } from "./types"

/**
 * ============================================================================
 * SKILL MECHANICS REGISTRY
 * ============================================================================
 *
 * Single source of truth for what every skill actually *does*. Before this
 * file, a skill's only mechanical effect was a generic `linkedStat` bump and
 * the `effects` array was never read by any system — every skill summary was a
 * promise the game did not keep.
 *
 * Three scaling layers stack, so a skill matters at every point of its curve:
 *
 *   1. SUB-STAT HOOKS — each of a skill's three sub-stats drives its own
 *      distinct effect, scaling with that sub-stat's level. This is what makes
 *      Foraging vs Appraisal a real build decision instead of flavour text.
 *   2. LINKED-STAT SCALING — the skill's overall level feeds its BaseStat
 *      (+1 per 2 levels), preserved from the original behaviour.
 *   3. TIER BREAKPOINTS — at levels 5 / 10 / 15 a skill grants a named unlock
 *      (content, not numbers) so progression lands in steps you can feel.
 */

// ---------------------------------------------------------------------------
// Effect keys
// ---------------------------------------------------------------------------

/**
 * Every mechanical lever a skill can pull. Grouped by the system that reads it
 * so it stays obvious which of these is load-bearing where.
 */
export type SkillBonusKey =
  // --- Expedition stat checks (multiplicative score bonuses) ---
  | "battleScore"
  | "hazardScore"
  | "discoveryScore"
  | "travelScore"
  // --- Expedition survivability ---
  | "damageReduction" // flat wounds shaved off a failed check
  | "maxHpBonus" // extra crew HP pool
  | "badfailDowngrade" // chance a catastrophic failure becomes an ordinary one
  | "partyProtection" // chance a downed party member is spared
  | "recoveryRate" // post-run crew healing speed
  // --- Combat resolution ---
  | "critChance"
  | "counterChance" // negate an incoming exchange
  | "firstStrike" // free opening exchange
  | "battleDamage" // damage dealt per exchange
  | "finishBonus" // bonus damage against a nearly-dead enemy
  // --- Encounter frequency (fewer bad rolls, not better rolls) ---
  | "battleFrequency" // negative = fewer hostile encounters
  | "hazardFrequency" // negative = fewer hazards
  | "anomalyResist"
  // --- Gathering ---
  | "materialYield"
  | "rareChance"
  | "gatherSpeed"
  | "carryCapacity" // extra loot slots per run
  | "bonusLoot"
  | "salvageYield" // wreck / ruin nodes
  | "fishingYield"
  | "fishingSuccess"
  // --- Crafting ---
  | "craftCost" // negative = cheaper
  | "craftSpeed"
  | "craftQuality"
  // --- Economy & meta ---
  | "xpBonus"
  | "contractReward"
  | "factionContribution"
  | "sellValue"
  | "rollLuck" // rarity weighting in the rolling pool
  | "hiddenRoute"
  | "runDuration" // negative = faster expeditions
  | "mountFatigue" // negative = mounts tire slower

export type SkillBonuses = Record<SkillBonusKey, number>

export function emptySkillBonuses(): SkillBonuses {
  return {
    battleScore: 0,
    hazardScore: 0,
    discoveryScore: 0,
    travelScore: 0,
    damageReduction: 0,
    maxHpBonus: 0,
    badfailDowngrade: 0,
    partyProtection: 0,
    recoveryRate: 0,
    critChance: 0,
    counterChance: 0,
    firstStrike: 0,
    battleDamage: 0,
    finishBonus: 0,
    battleFrequency: 0,
    hazardFrequency: 0,
    anomalyResist: 0,
    materialYield: 0,
    rareChance: 0,
    gatherSpeed: 0,
    carryCapacity: 0,
    bonusLoot: 0,
    salvageYield: 0,
    fishingYield: 0,
    fishingSuccess: 0,
    craftCost: 0,
    craftSpeed: 0,
    craftQuality: 0,
    xpBonus: 0,
    contractReward: 0,
    factionContribution: 0,
    sellValue: 0,
    rollLuck: 0,
    hiddenRoute: 0,
    runDuration: 0,
    mountFatigue: 0,
  }
}

/** Which system consumes a given lever — drives the grouping in the Skills UI. */
export const BONUS_SYSTEM: Record<SkillBonusKey, string> = {
  battleScore: "Combat",
  hazardScore: "Expedition",
  discoveryScore: "Expedition",
  travelScore: "Expedition",
  damageReduction: "Survival",
  maxHpBonus: "Survival",
  badfailDowngrade: "Survival",
  partyProtection: "Survival",
  recoveryRate: "Survival",
  critChance: "Combat",
  counterChance: "Combat",
  firstStrike: "Combat",
  battleDamage: "Combat",
  finishBonus: "Combat",
  battleFrequency: "Expedition",
  hazardFrequency: "Expedition",
  anomalyResist: "Survival",
  materialYield: "Gathering",
  rareChance: "Gathering",
  gatherSpeed: "Gathering",
  carryCapacity: "Gathering",
  bonusLoot: "Gathering",
  salvageYield: "Gathering",
  fishingYield: "Fishing",
  fishingSuccess: "Fishing",
  craftCost: "Crafting",
  craftSpeed: "Crafting",
  craftQuality: "Crafting",
  xpBonus: "Progression",
  contractReward: "Economy",
  factionContribution: "Faction",
  sellValue: "Economy",
  rollLuck: "Rolling",
  hiddenRoute: "Expedition",
  runDuration: "Expedition",
  mountFatigue: "Mounts",
}

/** How a lever is rendered: a percentage, a flat number, or a slot count. */
export const BONUS_FORMAT: Record<SkillBonusKey, "pct" | "flat"> = {
  battleScore: "pct",
  hazardScore: "pct",
  discoveryScore: "pct",
  travelScore: "pct",
  damageReduction: "flat",
  maxHpBonus: "flat",
  badfailDowngrade: "pct",
  partyProtection: "pct",
  recoveryRate: "pct",
  critChance: "pct",
  counterChance: "pct",
  firstStrike: "pct",
  battleDamage: "pct",
  finishBonus: "pct",
  battleFrequency: "pct",
  hazardFrequency: "pct",
  anomalyResist: "pct",
  materialYield: "pct",
  rareChance: "pct",
  gatherSpeed: "pct",
  carryCapacity: "flat",
  bonusLoot: "pct",
  salvageYield: "pct",
  fishingYield: "pct",
  fishingSuccess: "pct",
  craftCost: "pct",
  craftSpeed: "pct",
  craftQuality: "pct",
  xpBonus: "pct",
  contractReward: "pct",
  factionContribution: "pct",
  sellValue: "pct",
  rollLuck: "pct",
  hiddenRoute: "pct",
  runDuration: "pct",
  mountFatigue: "pct",
}

// ---------------------------------------------------------------------------
// Unlocks
// ---------------------------------------------------------------------------

/**
 * Content gated behind a skill tier. Consumed by the map (node access), the
 * crafting bench (recipes), and the activity list (fishing, mounts).
 */
export type SkillUnlockId =
  | "hidden_routes"
  | "deep_ruins"
  | "rare_nodes"
  | "quality_harvest"
  | "fishing_basic"
  | "fishing_wrecks"
  | "mount_basic"
  | "mount_pack"
  | "field_surgery"
  | "advanced_recipes"
  | "master_recipes"
  | "anomaly_zones"
  | "escort_contracts"
  | "faction_rites"
  | "archive_translation"

export interface SkillBreakpoint {
  level: number
  unlock: SkillUnlockId
  label: string
  detail: string
}

export interface SubStatHook {
  /** Sub-stat id, matching config/skills.json. */
  id: string
  effect: SkillBonusKey
  /** Bonus contributed per level of this sub-stat. */
  perLevel: number
  /** Plain-language description for the UI. */
  detail: string
}

export interface SkillMechanic {
  /** Matches the `name` in config/skills.json. */
  name: string
  linkedStat: keyof BaseStats
  /** Corrected summary — several originals promised systems that did not exist. */
  summary: string
  hooks: SubStatHook[]
  breakpoints: SkillBreakpoint[]
}

// ---------------------------------------------------------------------------
// The registry: 15 skills x 3 sub-stats = 45 distinct mechanical hooks
// ---------------------------------------------------------------------------

export const SKILL_MECHANICS: SkillMechanic[] = [
  // ======================= HP =======================
  {
    name: "Conditioning",
    linkedStat: "hp",
    // Original read "+3% expedition duration", which as written was a penalty
    // (longer runs). Inverted to a speed gain, which is what it clearly meant.
    summary: "Shortens expeditions and blunts fatigue. Heavier packs, longer marches.",
    hooks: [
      { id: "marching", effect: "runDuration", perLevel: -0.006, detail: "Faster expedition legs" },
      { id: "recovery", effect: "recoveryRate", perLevel: 0.02, detail: "Quicker crew recovery after a run" },
      { id: "loadbearing", effect: "carryCapacity", perLevel: 0.2, detail: "Extra loot slots per run" },
    ],
    breakpoints: [
      { level: 5, unlock: "deep_ruins", label: "Long March", detail: "Endure the deep ruin routes" },
      { level: 10, unlock: "mount_pack", label: "Pack Discipline", detail: "Handle a loaded pack mount" },
    ],
  },
  {
    name: "Field Medicine",
    linkedStat: "hp",
    summary: "Turns disasters into setbacks and gets the crew back on their feet faster.",
    hooks: [
      { id: "triage", effect: "badfailDowngrade", perLevel: 0.03, detail: "Chance a critical failure is downgraded" },
      { id: "stabilization", effect: "damageReduction", perLevel: 0.1, detail: "Wounds shaved off failed checks" },
      { id: "remedies", effect: "recoveryRate", perLevel: 0.025, detail: "Faster post-run healing" },
    ],
    breakpoints: [
      { level: 5, unlock: "field_surgery", label: "Field Surgery", detail: "Revive a downed crew member mid-run" },
      { level: 10, unlock: "escort_contracts", label: "Medical Escort", detail: "Take on protected-convoy contracts" },
    ],
  },
  {
    name: "Beast Tending",
    linkedStat: "hp",
    summary: "Mounts carry more and tire slower, raising what a run can bring home.",
    hooks: [
      { id: "handling", effect: "carryCapacity", perLevel: 0.25, detail: "Extra loot slots per run" },
      { id: "soothing", effect: "mountFatigue", perLevel: -0.025, detail: "Mounts tire more slowly" },
      { id: "harnessing", effect: "materialYield", perLevel: 0.015, detail: "More hauled back per haul" },
    ],
    breakpoints: [
      { level: 5, unlock: "mount_basic", label: "First Saddle", detail: "Bring a mount on expeditions" },
      { level: 10, unlock: "mount_pack", label: "Pack Train", detail: "Run a second pack animal" },
    ],
  },

  // ======================= ATK =======================
  {
    name: "Bladecraft",
    linkedStat: "atk",
    summary: "Close-quarters edge work: stronger openings, punishing counters, clean finishes.",
    hooks: [
      { id: "edgework", effect: "battleScore", perLevel: 0.02, detail: "Higher combat check scores" },
      { id: "riposte", effect: "counterChance", perLevel: 0.02, detail: "Chance to negate an incoming hit" },
      { id: "finishing", effect: "finishBonus", perLevel: 0.03, detail: "Bonus damage to a failing enemy" },
    ],
    breakpoints: [
      { level: 5, unlock: "deep_ruins", label: "Cut Deeper", detail: "Clear the guarded ruin approaches" },
      { level: 10, unlock: "advanced_recipes", label: "Blade Smithing", detail: "Craft advanced edged gear" },
    ],
  },
  {
    name: "Marksmanship",
    linkedStat: "atk",
    summary: "Opens fights at range and lands more critical hits.",
    hooks: [
      { id: "sighting", effect: "battleScore", perLevel: 0.015, detail: "Higher combat check scores" },
      { id: "draw", effect: "firstStrike", perLevel: 0.025, detail: "Chance of a free opening shot" },
      { id: "precision", effect: "critChance", perLevel: 0.02, detail: "Critical hit chance" },
    ],
    breakpoints: [
      { level: 5, unlock: "escort_contracts", label: "Overwatch", detail: "Accept escort contracts" },
      { level: 10, unlock: "advanced_recipes", label: "Munitions", detail: "Craft advanced ranged gear" },
    ],
  },
  {
    name: "Brawling",
    linkedStat: "atk",
    summary: "Hits harder up close and discourages hostiles from starting anything.",
    hooks: [
      { id: "clinch", effect: "battleScore", perLevel: 0.015, detail: "Higher combat check scores" },
      { id: "breaks", effect: "battleFrequency", perLevel: -0.015, detail: "Fewer hostile encounters" },
      { id: "impact", effect: "battleDamage", perLevel: 0.02, detail: "Damage dealt per exchange" },
    ],
    breakpoints: [{ level: 5, unlock: "deep_ruins", label: "Hold the Line", detail: "Push into contested ruins" }],
  },

  // ======================= DEF =======================
  {
    name: "Bulwark",
    linkedStat: "def",
    summary: "Soaks damage for the whole crew and keeps the convoy standing.",
    hooks: [
      { id: "shielding", effect: "damageReduction", perLevel: 0.15, detail: "Wounds shaved off failed checks" },
      { id: "bracing", effect: "hazardScore", perLevel: 0.02, detail: "Higher hazard check scores" },
      { id: "interception", effect: "partyProtection", perLevel: 0.02, detail: "Chance to shield a downed ally" },
    ],
    breakpoints: [
      { level: 5, unlock: "escort_contracts", label: "Convoy Guard", detail: "Accept escort contracts" },
      { level: 10, unlock: "anomaly_zones", label: "Storm Wall", detail: "Enter anomaly-touched zones" },
    ],
  },
  {
    name: "Guardwork",
    linkedStat: "def",
    summary: "Fewer ambushes on the road and safer escorts when they come.",
    hooks: [
      { id: "formation", effect: "battleFrequency", perLevel: -0.02, detail: "Fewer hostile encounters" },
      { id: "watchkeeping", effect: "travelScore", perLevel: 0.02, detail: "Higher travel check scores" },
      { id: "escorting", effect: "partyProtection", perLevel: 0.02, detail: "Chance to shield a downed ally" },
    ],
    breakpoints: [{ level: 5, unlock: "escort_contracts", label: "Escort Duty", detail: "Accept escort contracts" }],
  },
  {
    name: "Warding",
    linkedStat: "def",
    summary: "Holds anomalies at arm's length and cuts how often they strike.",
    hooks: [
      { id: "barriers", effect: "hazardScore", perLevel: 0.02, detail: "Higher hazard check scores" },
      { id: "anchors", effect: "hazardFrequency", perLevel: -0.02, detail: "Fewer hazard events" },
      { id: "resistance", effect: "anomalyResist", perLevel: 0.025, detail: "Reduced anomaly exposure" },
    ],
    breakpoints: [
      { level: 5, unlock: "anomaly_zones", label: "Ward Walker", detail: "Enter anomaly-touched zones" },
      { level: 10, unlock: "faction_rites", label: "Sealed Circles", detail: "Lead faction warding rites" },
    ],
  },

  // ======================= LUCK =======================
  {
    name: "Gathering",
    linkedStat: "luck",
    summary: "More materials per node, gathered faster, at better quality.",
    hooks: [
      { id: "foraging", effect: "materialYield", perLevel: 0.025, detail: "Material quantity per node" },
      { id: "harvesting", effect: "gatherSpeed", perLevel: 0.02, detail: "Gathering speed" },
      { id: "appraisal", effect: "rareChance", perLevel: 0.015, detail: "Chance of a higher rarity tier" },
    ],
    breakpoints: [
      { level: 5, unlock: "quality_harvest", label: "Clean Harvest", detail: "Harvest without degrading a node" },
      { level: 10, unlock: "rare_nodes", label: "Rich Seams", detail: "Work rare material nodes" },
    ],
  },
  {
    name: "Fishing",
    linkedStat: "luck",
    summary: "Works water and wreck sites for catches and submerged salvage.",
    hooks: [
      { id: "casting", effect: "fishingYield", perLevel: 0.03, detail: "Catch quantity" },
      { id: "tension", effect: "fishingSuccess", perLevel: 0.02, detail: "Chance to land a catch" },
      { id: "salvage", effect: "salvageYield", perLevel: 0.025, detail: "Yield from wreck sites" },
    ],
    breakpoints: [
      { level: 5, unlock: "fishing_basic", label: "Cast Line", detail: "Fish at water nodes" },
      { level: 10, unlock: "fishing_wrecks", label: "Wreck Diving", detail: "Salvage submerged wrecks" },
    ],
  },
  {
    name: "Scavenging",
    linkedStat: "luck",
    summary: "Spots what others walked past, and gets a better price for it.",
    hooks: [
      { id: "spotting", effect: "discoveryScore", perLevel: 0.02, detail: "Higher discovery check scores" },
      { id: "extraction", effect: "bonusLoot", perLevel: 0.02, detail: "Chance of bonus loot" },
      { id: "haggling", effect: "sellValue", perLevel: 0.02, detail: "Better prices when selling" },
    ],
    breakpoints: [
      { level: 5, unlock: "deep_ruins", label: "Ruin Crawler", detail: "Search the deep ruin levels" },
      { level: 10, unlock: "rare_nodes", label: "Tech Stripper", detail: "Strip rare component caches" },
    ],
  },

  // ======================= FOCUS =======================
  {
    name: "Pathfinding",
    linkedStat: "focus",
    summary: "Reads the ground, finds routes nobody charted, and shortens the trip.",
    hooks: [
      { id: "surveying", effect: "travelScore", perLevel: 0.02, detail: "Higher travel check scores" },
      { id: "routing", effect: "hiddenRoute", perLevel: 0.025, detail: "Chance to reveal a hidden route" },
      { id: "survival", effect: "runDuration", perLevel: -0.005, detail: "Shorter expedition legs" },
    ],
    breakpoints: [
      { level: 5, unlock: "hidden_routes", label: "Trailblazer", detail: "Hidden map routes become visible" },
      { level: 10, unlock: "anomaly_zones", label: "Deep Survey", detail: "Chart anomaly-touched zones" },
    ],
  },
  {
    name: "Ritualism",
    linkedStat: "focus",
    summary: "Sharpens contract terms, marks better gear, and carries weight in the faction.",
    hooks: [
      { id: "channeling", effect: "contractReward", perLevel: 0.02, detail: "Contract payouts" },
      { id: "sigils", effect: "craftQuality", perLevel: 0.02, detail: "Crafted item quality" },
      { id: "invocation", effect: "factionContribution", perLevel: 0.025, detail: "Faction contribution value" },
    ],
    breakpoints: [
      { level: 5, unlock: "faction_rites", label: "Rite Keeper", detail: "Lead faction rites" },
      { level: 10, unlock: "master_recipes", label: "Marked Work", detail: "Craft master-tier gear" },
    ],
  },
  {
    name: "Lorekeeping",
    linkedStat: "focus",
    summary: "Turns archives into experience, and knows what a find is really worth.",
    hooks: [
      { id: "recall", effect: "xpBonus", perLevel: 0.02, detail: "Experience gained" },
      { id: "translation", effect: "discoveryScore", perLevel: 0.02, detail: "Higher discovery check scores" },
      { id: "analysis", effect: "rollLuck", perLevel: 0.015, detail: "Better rarity odds when rolling" },
    ],
    breakpoints: [
      { level: 5, unlock: "archive_translation", label: "Translator", detail: "Read sealed archive fragments" },
      { level: 10, unlock: "master_recipes", label: "Lost Techniques", detail: "Craft master-tier gear" },
    ],
  },
]

export function getSkillMechanic(name: string): SkillMechanic | undefined {
  return SKILL_MECHANICS.find((m) => m.name === name)
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/** Tier thresholds. A skill's breakpoints fire as its level crosses these. */
export const SKILL_TIERS = [5, 10, 15] as const

/**
 * Roll every unlocked skill's sub-stat hooks into one bonus set.
 *
 * A sub-stat contributes `perLevel * subStatLevel`. When a skill has no
 * per-sub-stat detail recorded we fall back to the skill's own level spread
 * evenly across its hooks, so a skill is never silently worth nothing.
 */
export function aggregateSkillBonuses(skills: Skill[]): SkillBonuses {
  const out = emptySkillBonuses()

  for (const skill of skills) {
    if (skill.locked || skill.level <= 0) continue
    const mech = getSkillMechanic(skill.label)
    if (!mech) continue

    for (const hook of mech.hooks) {
      const sub = skill.stats?.find((s) => s.id === hook.id)
      // Fall back to the parent skill level when sub-stats aren't tracked yet.
      const lvl = sub ? sub.level : skill.level
      out[hook.effect] += hook.perLevel * lvl
    }
  }

  return out
}

/** Every unlock the player's current skill levels have earned. */
export function getSkillUnlocks(skills: Skill[]): Set<SkillUnlockId> {
  const unlocked = new Set<SkillUnlockId>()
  for (const skill of skills) {
    if (skill.locked || skill.level <= 0) continue
    const mech = getSkillMechanic(skill.label)
    if (!mech) continue
    for (const bp of mech.breakpoints) {
      if (skill.level >= bp.level) unlocked.add(bp.unlock)
    }
  }
  return unlocked
}

/** The next breakpoint a skill is working toward, for the progress UI. */
export function nextBreakpoint(skill: Skill): SkillBreakpoint | undefined {
  const mech = getSkillMechanic(skill.label)
  if (!mech) return undefined
  return mech.breakpoints.find((bp) => skill.level < bp.level)
}

/** Linked-stat contribution: +1 per 2 skill levels (original behaviour). */
export function skillStatContribution(skill: Skill): { stat: keyof BaseStats; amount: number } | null {
  const mech = getSkillMechanic(skill.label)
  if (!mech || skill.locked || skill.level <= 0) return null
  return { stat: mech.linkedStat, amount: Math.floor(skill.level / 2) }
}

/** Format a bonus for display, e.g. "+12%" or "+2". */
export function formatBonus(key: SkillBonusKey, value: number): string {
  if (BONUS_FORMAT[key] === "flat") {
    const rounded = Math.round(value * 10) / 10
    return `${rounded >= 0 ? "+" : ""}${rounded}`
  }
  const pct = Math.round(value * 1000) / 10
  return `${pct >= 0 ? "+" : ""}${pct}%`
}

/** Human-readable label for a lever, derived from its key. */
export const BONUS_LABEL: Record<SkillBonusKey, string> = {
  battleScore: "Combat Score",
  hazardScore: "Hazard Score",
  discoveryScore: "Discovery Score",
  travelScore: "Travel Score",
  damageReduction: "Damage Reduction",
  maxHpBonus: "Max Crew HP",
  badfailDowngrade: "Disaster Downgrade",
  partyProtection: "Ally Protection",
  recoveryRate: "Recovery Rate",
  critChance: "Critical Chance",
  counterChance: "Counter Chance",
  firstStrike: "First Strike",
  battleDamage: "Combat Damage",
  finishBonus: "Finishing Blow",
  battleFrequency: "Hostile Encounters",
  hazardFrequency: "Hazard Events",
  anomalyResist: "Anomaly Resistance",
  materialYield: "Material Yield",
  rareChance: "Rare Find Chance",
  gatherSpeed: "Gathering Speed",
  carryCapacity: "Carry Capacity",
  bonusLoot: "Bonus Loot Chance",
  salvageYield: "Salvage Yield",
  fishingYield: "Catch Yield",
  fishingSuccess: "Catch Rate",
  craftCost: "Crafting Cost",
  craftSpeed: "Crafting Speed",
  craftQuality: "Craft Quality",
  xpBonus: "Experience Gain",
  contractReward: "Contract Rewards",
  factionContribution: "Faction Contribution",
  sellValue: "Sell Value",
  rollLuck: "Roll Rarity Odds",
  hiddenRoute: "Hidden Route Chance",
  runDuration: "Expedition Duration",
  mountFatigue: "Mount Fatigue",
}
