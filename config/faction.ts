import type {
  FactionActivity,
  FactionBuilding,
  FactionBuildingEffect,
  FactionPerk,
  FactionRally,
} from "@/lib/types"

// ============ RANK TIERS ============

export type RankTierGroup = "recruit" | "core" | "officer" | "leadership"

export interface RankTier {
  rank: number
  title: string
  /** Cumulative standing required to reach this rank. */
  standing: number
  tier: RankTierGroup
  rewards: string[]
}

export const RANK_TIERS: RankTier[] = [
  { rank: 0, title: "Initiate", standing: 0, tier: "recruit", rewards: ["Basic access", "Faction chat"] },
  { rank: 1, title: "Member", standing: 100, tier: "recruit", rewards: ["Route Tender title", "Public projects"] },
  { rank: 2, title: "Trusted", standing: 250, tier: "recruit", rewards: ["Signal Keeper title", "Project voting"] },
  { rank: 3, title: "Pathfinder", standing: 500, tier: "core", rewards: ["Priority contracts", "Faction expeditions"] },
  { rank: 4, title: "Veteran", standing: 800, tier: "core", rewards: ["Waystone Keeper title", "Faction armory access"] },
  { rank: 5, title: "Elite", standing: 1200, tier: "core", rewards: ["Elite Waykeeper title", "Rare schematics"] },
  { rank: 6, title: "Vanguard", standing: 1800, tier: "officer", rewards: ["Faction Wars participant", "Lead skirmishes"] },
  { rank: 7, title: "Officer", standing: 2500, tier: "officer", rewards: ["Officer insignia", "Territory defense"] },
  { rank: 8, title: "Captain", standing: 3500, tier: "officer", rewards: ["Captain title", "Coordinate war efforts"] },
  { rank: 9, title: "Commander", standing: 5000, tier: "leadership", rewards: ["Legendary title", "Faction council seat"] },
  { rank: 10, title: "Warlord", standing: 7500, tier: "leadership", rewards: ["Warlord title", "Declare faction wars"] },
  { rank: 11, title: "Archon", standing: 10000, tier: "leadership", rewards: ["Archon title", "Shape faction destiny"] },
]

export function getRankTitle(rank: number): string {
  return RANK_TIERS[Math.min(Math.max(rank, 0), RANK_TIERS.length - 1)].title
}

// ============ BUILDINGS (drive crafting upgrades) ============

export const FACTION_BUILDINGS: FactionBuilding[] = [
  {
    id: "workshop",
    label: "Courier Workshop",
    description: "A shared bench that streamlines every craft. Higher levels cut crafting time across all recipes.",
    icon: "⚒",
    level: 1,
    maxLevel: 5,
    effect: "craft_speed",
    perLevel: 0.08,
    effectLabel: "-8% craft time",
    requiredRank: 0,
    baseTokenCost: 120,
    baseMaterials: [
      { itemId: "iron_dust", label: "Iron Dust", qty: 4 },
      { itemId: "deep_stone", label: "Deep Stone", qty: 1 },
    ],
  },
  {
    id: "forge",
    label: "Relay Forge",
    description: "A resonance forge that stretches raw output. Higher levels yield bonus units from each craft.",
    icon: "🜂",
    level: 0,
    maxLevel: 5,
    effect: "craft_yield",
    perLevel: 0.2,
    effectLabel: "+20% yield chance",
    requiredRank: 1,
    baseTokenCost: 180,
    baseMaterials: [
      { itemId: "ember_ore", label: "Ember Ore", qty: 3 },
      { itemId: "crystal_shard", label: "Crystal Shard", qty: 2 },
    ],
  },
  {
    id: "apothecary",
    label: "Apothecary",
    description: "A stocked lab that trims recipe requirements. Higher levels reduce the materials each craft consumes.",
    icon: "⚗",
    level: 0,
    maxLevel: 4,
    effect: "cost_reduction",
    perLevel: 0.1,
    effectLabel: "-10% material cost",
    requiredRank: 2,
    baseTokenCost: 240,
    baseMaterials: [
      { itemId: "signal_essence", label: "Signal Essence", qty: 3 },
      { itemId: "void_salt", label: "Void Salt", qty: 1 },
    ],
  },
  {
    id: "relay_spire",
    label: "Relay Spire",
    description: "A broadcast spire that amplifies every deed logged for the faction. Higher levels boost standing gains.",
    icon: "🗼",
    level: 0,
    maxLevel: 5,
    effect: "standing_gain",
    perLevel: 0.15,
    effectLabel: "+15% standing gain",
    requiredRank: 3,
    baseTokenCost: 300,
    baseMaterials: [
      { itemId: "signal_catalyst", label: "Signal Catalyst", qty: 1 },
      { itemId: "refined_crystal", label: "Refined Crystal", qty: 2 },
    ],
  },
]

/** Cost to raise a building from its current level to the next. Scales with level. */
export function buildingUpgradeCost(b: FactionBuilding): {
  tokens: number
  materials: { itemId: string; label: string; qty: number }[]
} {
  const nextLevel = b.level + 1
  const scale = nextLevel // level 1 = 1x, level 2 = 2x, ...
  return {
    tokens: b.baseTokenCost * scale,
    materials: b.baseMaterials.map((m) => ({ ...m, qty: m.qty * scale })),
  }
}

export interface CraftingBonuses {
  /** Fraction of craft time removed (0-0.6). */
  speed: number
  /** Chance-weighted bonus yield multiplier (0+). */
  yield: number
  /** Fraction of material cost removed (0-0.5). */
  cost: number
  /** Fraction added to standing gains (0+). */
  standing: number
}

export function craftingBonusesFrom(buildings: FactionBuilding[]): CraftingBonuses {
  const levelOf = (effect: FactionBuildingEffect) =>
    buildings.filter((b) => b.effect === effect).reduce((sum, b) => sum + b.level, 0)
  const perLevel = (effect: FactionBuildingEffect) =>
    buildings.find((b) => b.effect === effect)?.perLevel ?? 0
  return {
    speed: Math.min(0.6, levelOf("craft_speed") * perLevel("craft_speed")),
    yield: levelOf("craft_yield") * perLevel("craft_yield"),
    cost: Math.min(0.5, levelOf("cost_reduction") * perLevel("cost_reduction")),
    standing: levelOf("standing_gain") * perLevel("standing_gain"),
  }
}

// ============ PERKS (rank-based passive buffs) ============

export const FACTION_PERKS: FactionPerk[] = [
  {
    id: "safe_passage",
    label: "Safe Passage",
    description: "Faction waystations shelter your squad, softening the worst of field setbacks.",
    icon: "✦",
    requiredRank: 1,
    effectLabel: "-10% expedition setback time",
  },
  {
    id: "shared_ledger",
    label: "Shared Ledger",
    description: "Project and rally contributions are logged twice — once for you, once for the cause.",
    icon: "◈",
    requiredRank: 2,
    effectLabel: "+10% standing from contributions",
  },
  {
    id: "quartermaster",
    label: "Quartermaster's Favor",
    description: "Faction stores extend a discount on your crafting requisitions.",
    icon: "⚒",
    requiredRank: 3,
    effectLabel: "-5% craft material cost",
  },
  {
    id: "vanguard",
    label: "Vanguard Rites",
    description: "Vanguard standing grants your party a combat edge on deployment.",
    icon: "⚔",
    requiredRank: 6,
    effectLabel: "+8% squad battle strength",
  },
  {
    id: "warcouncil",
    label: "War Council Seat",
    description: "Officers rally the faction faster, boosting all rally rewards.",
    icon: "△",
    requiredRank: 7,
    effectLabel: "+25% rally rewards",
  },
]

export function unlockedPerks(rank: number): FactionPerk[] {
  return FACTION_PERKS.filter((p) => rank >= p.requiredRank)
}

/** Current cumulative effect summary for a building at its present level. */
export function buildingEffectDescription(b: FactionBuilding): string {
  if (b.level === 0) return "Not yet built"
  const pct = Math.round(b.level * b.perLevel * 100)
  switch (b.effect) {
    case "craft_speed":
      return `-${pct}% craft time`
    case "craft_yield":
      return `+${pct}% bonus yield`
    case "cost_reduction":
      return `-${pct}% material cost`
    case "standing_gain":
      return `+${pct}% standing gain`
    default:
      return `Lv.${b.level}`
  }
}

/** Compact relative time label, e.g. "6m ago", "3h ago", "2d ago". */
export function formatRelativeTime(at: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - at)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ============ SEED DATA ============

const now = Date.now()

export const seedFactionRallies: FactionRally[] = [
  {
    id: "rally_signal_storm",
    label: "Signal Storm Response",
    description: "A cascade failure hit the eastern relays. Pour resources in before the window closes to restore the grid.",
    icon: "⚡",
    progress: 1840,
    goal: 5000,
    endsAt: now + 1000 * 60 * 60 * 18, // ~18h
    reward: { tokens: 400, standing: 250, item: "Signal Catalyst" },
    contribution: 0,
    joined: false,
  },
  {
    id: "rally_archive_purge",
    label: "Archive Purge",
    description: "Corrupted fragments are spreading through the deep archive. Clear them for a shared bounty.",
    icon: "▤",
    progress: 620,
    goal: 3000,
    endsAt: now + 1000 * 60 * 60 * 42, // ~42h
    reward: { tokens: 250, standing: 180 },
    contribution: 0,
    joined: false,
  },
]

export const seedFactionActivity: FactionActivity[] = [
  { id: "fa1", kind: "rank_up", handle: "@Relay3e8f2", text: "reached Rank 3 — Veteran", at: now - 1000 * 60 * 6 },
  { id: "fa2", kind: "contribution", handle: "@Relay9d2e7", text: "contributed to Deep Archive Cataloging", at: now - 1000 * 60 * 14, amount: 40 },
  { id: "fa3", kind: "project_complete", handle: "Waykeepers", text: "completed Perimeter Beacon Line", at: now - 1000 * 60 * 55 },
  { id: "fa4", kind: "building", handle: "@Relay7a3b2", text: "upgraded the Courier Workshop to Lv.2", at: now - 1000 * 60 * 90 },
  { id: "fa5", kind: "rally", handle: "@palesignal", text: "joined Signal Storm Response", at: now - 1000 * 60 * 120 },
  { id: "fa6", kind: "join", handle: "@Relay1c4a9", text: "joined the Waykeepers", at: now - 1000 * 60 * 240 },
]
