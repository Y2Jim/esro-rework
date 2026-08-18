/**
 * Bestiary — named fauna for the relay wilds, and the pack beasts you can tame.
 *
 * Combat previously drew from a flat list of six display strings living inside
 * the expedition view, so a creature had no identity beyond one line of feed
 * text: nothing recorded that you had met it, and nothing could be done with it.
 * This module promotes those same six names into real entries and adds the
 * tameable fauna that back the pack-beast unlocks.
 *
 * Two rules keep this honest:
 *
 * 1. The original six labels are preserved verbatim (article included) so every
 *    existing battle line reads exactly as it did before.
 * 2. Constructs and anomalies are deliberately *not* tameable. A Corrupted Relay
 *    is broken infrastructure, not an animal, so the tame path is restricted to
 *    living beasts via `pack`.
 */

import type { Rarity } from "./types"
import type { SkillUnlockId } from "./skill-effects"

export type CreatureClass = "construct" | "anomaly" | "beast" | "scavenger"

export type RiskTier = "Low" | "Medium" | "High"

/** Stats a tamed beast contributes when set as the active pack animal. */
export interface PackStats {
  /** Extra loot slots carried out of a run. Replaces the old flat bonus. */
  carry: number
  /** Flat reduction to crew damage, as the beast absorbs part of the march. */
  hardiness: number
  /** Multiplier on run duration; negative is faster. */
  pace: number
}

export interface Creature {
  id: string
  /** Clean name for the bestiary UI, e.g. "Static Wraith". */
  name: string
  /**
   * Exact phrase used in battle narration, e.g. "a Static Wraith".
   *
   * Stored separately from `name` because the feed needs the article to read
   * naturally while the codex should not display one. The original six values
   * are byte-identical to the strings this replaced.
   */
  display: string
  kind: CreatureClass
  rarity: Rarity
  /** Glyph sigil, matching the app's existing text-glyph iconography. */
  glyph: string
  /** Where it is found, for codex copy. */
  habitat: string
  description: string
  /** Risk tiers this creature can appear at. */
  tiers: RiskTier[]
  /**
   * Pack profile. Present only on tameable beasts; its absence is what makes a
   * construct or anomaly impossible to tame.
   */
  pack?: PackStats
}

export const CREATURES: Creature[] = [
  // ---- The original six. Labels preserved exactly; none are tameable. ----
  {
    id: "static_wraith",
    name: "Static Wraith",
    display: "a Static Wraith",
    kind: "anomaly",
    rarity: "uncommon",
    glyph: "◈",
    habitat: "Relay Reach",
    description:
      "A standing charge that learned a shape. It drifts along dead cable runs and discharges when the air tastes of iron.",
    tiers: ["Low", "Medium", "High"],
  },
  {
    id: "signal_husk",
    name: "Signal Husk",
    display: "a Signal Husk",
    kind: "construct",
    rarity: "common",
    glyph: "▣",
    habitat: "Relay Reach",
    description:
      "A courier drone that outlived its route. It still walks the old path, still broadcasts, still expects an answer.",
    tiers: ["Low", "Medium"],
  },
  {
    id: "drift_scavengers",
    name: "Drift Scavengers",
    display: "Drift Scavengers",
    kind: "scavenger",
    rarity: "common",
    glyph: "⋔",
    habitat: "Wandering Flats",
    description:
      "Not one thing but a loose company of them, following caravans at the edge of lamplight and taking what falls behind.",
    tiers: ["Low", "Medium"],
  },
  {
    id: "corrupted_relay",
    name: "Corrupted Relay",
    display: "a Corrupted Relay",
    kind: "construct",
    rarity: "rare",
    glyph: "◉",
    habitat: "Relay Reach",
    description:
      "A tower that inverted its own protocol. It answers every ping with something that is almost, but not quite, your own voice.",
    tiers: ["Medium", "High"],
  },
  {
    id: "anomaly_swarm",
    name: "Anomaly Swarm",
    display: "an Anomaly Swarm",
    kind: "anomaly",
    rarity: "epic",
    glyph: "❋",
    habitat: "The Gloaming",
    description:
      "A cloud of small contradictions. Individually harmless; collectively it edits the ground you were about to stand on.",
    tiers: ["High"],
  },
  {
    id: "hollow_sentinel",
    name: "Hollow Sentinel",
    display: "a Hollow Sentinel",
    kind: "construct",
    rarity: "epic",
    glyph: "⬢",
    habitat: "Gilded Terraces",
    description:
      "Court armour with nothing inside but standing orders. It guards a doorway that has not existed for a very long time.",
    tiers: ["Medium", "High"],
  },

  // ---- Tameable pack beasts. `pack` is what gates the tame path. ----
  {
    id: "dray_lumen",
    name: "Dray Lumen",
    display: "a Dray Lumen",
    kind: "beast",
    rarity: "common",
    glyph: "☾",
    habitat: "Relay Reach",
    description:
      "A patient, slab-shouldered grazer that feeds on ambient charge. Couriers have used them to haul cable for generations.",
    tiers: ["Low", "Medium"],
    pack: { carry: 1, hardiness: 0, pace: 0 },
  },
  {
    id: "pack_ibex",
    name: "Gilded Ibex",
    display: "a Gilded Ibex",
    kind: "beast",
    rarity: "uncommon",
    glyph: "⩕",
    habitat: "Gilded Terraces",
    description:
      "Sure-footed on terrace stone and utterly unbothered by height. It will take a shorter line than you would have chosen.",
    tiers: ["Low", "Medium"],
    pack: { carry: 1, hardiness: 0, pace: -0.08 },
  },
  {
    id: "gloamhound",
    name: "Gloamhound",
    display: "a Gloamhound",
    kind: "beast",
    rarity: "rare",
    glyph: "⟁",
    habitat: "The Gloaming",
    description:
      "Hunts by absence rather than scent, reading the shape of what is missing. Walks a half-step ahead and waits at every turn.",
    tiers: ["Medium", "High"],
    pack: { carry: 2, hardiness: 1, pace: 0 },
  },
  {
    id: "flatstrider",
    name: "Flatstrider",
    display: "a Flatstrider",
    kind: "beast",
    rarity: "rare",
    glyph: "⋀",
    habitat: "Wandering Flats",
    description:
      "Long-limbed and tireless across open ground. It covers the empty stretches that break lesser caravans.",
    tiers: ["Medium"],
    pack: { carry: 2, hardiness: 0, pace: -0.12 },
  },
  {
    id: "emberback_drake",
    name: "Emberback Drake",
    display: "an Emberback Drake",
    kind: "beast",
    rarity: "legendary",
    glyph: "✦",
    habitat: "Emberhold Vale",
    description:
      "Vale-bred and slow to trust. Carries a furnace under its plating, and everything that hunts the deep roads knows it.",
    tiers: ["High"],
    pack: { carry: 3, hardiness: 2, pace: -0.05 },
  },
]

const BY_ID = new Map(CREATURES.map((c) => [c.id, c]))

export function getCreature(id: string): Creature | undefined {
  return BY_ID.get(id)
}

/** Every creature that can be tamed, i.e. carries a pack profile. */
export const TAMEABLE: Creature[] = CREATURES.filter((c) => c.pack)

/** Creatures that can appear at a given risk tier. */
export function creaturesForTier(tier: RiskTier): Creature[] {
  return CREATURES.filter((c) => c.tiers.includes(tier))
}

/** Skill unlock that permits taming at all. */
export const TAME_UNLOCK: SkillUnlockId = "pack_beasts"
/** Skill unlock that improves tame odds and allows the sturdier beasts. */
export const TAME_MASTER_UNLOCK: SkillUnlockId = "pack_train"

/**
 * Odds a defeated beast can be brought in rather than left behind.
 *
 * Rarer beasts resist more, so the curve is keyed to rarity. `pack_train`
 * roughly doubles the base chance, which is what makes the second tier of the
 * Beast Tending line worth taking.
 */
const TAME_BASE: Partial<Record<Rarity, number>> = {
  common: 0.45,
  uncommon: 0.32,
  rare: 0.2,
  epic: 0.12,
  legendary: 0.07,
}

export function tameChance(creature: Creature, hasMaster: boolean): number {
  if (!creature.pack) return 0
  const base = TAME_BASE[creature.rarity] ?? 0.2
  return hasMaster ? Math.min(0.85, base * 2) : base
}

/**
 * Aggregate pack contribution for the active mount.
 *
 * Returns zeroes when nothing is mounted so callers can add this
 * unconditionally without special-casing the unmounted state.
 */
export function packContribution(creature: Creature | undefined): PackStats {
  if (!creature?.pack) return { carry: 0, hardiness: 0, pace: 0 }
  return creature.pack
}

export const CLASS_LABEL: Record<CreatureClass, string> = {
  construct: "Construct",
  anomaly: "Anomaly",
  beast: "Beast",
  scavenger: "Scavenger",
}
