import type { Rarity } from "@/lib/types"

/**
 * Bait table.
 *
 * Bait is REQUIRED to cast, and one piece is consumed per cast whether or not
 * anything bites. Because that could otherwise hard-lock a courier who unlocks
 * fishing at Luck 15 with an empty inventory, Pale Grubs can always be dug for
 * free (see DIG_* below) — so the requirement never becomes a dead end.
 *
 * Bait pulls in two independent directions:
 *   `pull`        flattens the rarity curve (stacks with Luck in pickFish)
 *   `attracts`    biases *which* species bites, without touching rarity
 *
 * Keeping those separate is what stops the highest tier from being the automatic
 * answer: Void Chum is the rarity play, but if you specifically want Glass Carp,
 * Glowcap Lure still beats it.
 *
 * LADDER INVARIANT: `attracts` must climb the fish table alongside `tier`.
 * The fish ladder is silverfin -> glasscarp -> voltray -> echo_eel -> goldrelay
 * -> prism_leviathan. A high tier that targets a fish low on that ladder fights
 * its own `pull` and can end up worse for rare catches than no bait at all,
 * because `attractMult` would be inflating a common fish.
 *
 * Both mid tiers originally tripped this: tier 3 and tier 4 each targeted Volt
 * Ray, which is the *most common* member of the deep pool, so their advertised
 * rarity pull was measurably false at the Sunken Wreck (tier 3 came in at 13.5%
 * rare-end versus 16.1% for a bare hook). Retargeting them one rung up the
 * ladder fixed it. scripts/verify-bait.mjs asserts this and reads this table
 * directly, so a future retune cannot silently reintroduce the inversion.
 */

export interface BaitDef {
  id: string
  label: string
  /** 1-5, ascending. Used for "best owned bait" auto-selection. */
  tier: number
  rarity: Rarity
  /** Pixel-art sprite in /public/fishing. */
  sprite: string
  /** Flattens the rarity curve. Stacks with Luck as an exponent in pickFish. */
  pull: number
  /** Fish ids this bait specifically draws in. */
  attracts: string[]
  /** Weight multiplier applied to `attracts` entries, after the rarity curve. */
  attractMult: number
  /** Multiplier on the spot's junkChance. Below 1 means less junk. */
  junkMult: number
  /**
   * Short effect line shown under the bait name in the fishing UI.
   *
   * MUST NOT name individual fish species. This string is the only player-facing
   * surface that could reveal a fish before it has been caught (the fishing log
   * only lists species already landed), so naming one here spoils the discovery.
   * Describe the *habitat* the bait works in instead — "shallow, sunlit water",
   * "the deep channel" — which still differentiates the tiers without leaking
   * the fish table. Use `attracts` for the actual targeting.
   */
  effect: string
  description: string
}

export const BAIT: BaitDef[] = [
  {
    id: "bait_grubs",
    label: "Pale Grubs",
    tier: 1,
    rarity: "common",
    sprite: "/fishing/bait-grubs.png",
    pull: 0,
    attracts: ["fish_silverfin"],
    attractMult: 1.4,
    junkMult: 1,
    effect: "Draws Silverfin. Snags plenty of junk.",
    description: "Turned out of wet gravel by hand. Free, and worth exactly that.",
  },
  {
    id: "bait_dough",
    label: "Fungal Dough",
    tier: 2,
    rarity: "common",
    sprite: "/fishing/bait-dough.png",
    pull: 0.05,
    attracts: ["fish_silverfin", "fish_glasscarp"],
    attractMult: 1.5,
    junkMult: 0.8,
    effect: "Draws Silverfin and Glass Carp. Less junk.",
    description: "Flour and river water, kneaded until it stops arguing.",
  },
  {
    id: "bait_glowlure",
    label: "Glowcap Lure",
    tier: 3,
    rarity: "uncommon",
    sprite: "/fishing/bait-glowlure.png",
    pull: 0.12,
    attracts: ["fish_glasscarp", "fish_echo_eel"],
    attractMult: 1.7,
    junkMult: 0.6,
    effect: "Draws Glass Carp and Echo Eel. Pulls rarer fish.",
    description: "A pinch of glowcap bound to a hook. Visible six feet down.",
  },
  {
    id: "bait_voltchum",
    label: "Volt Chum",
    tier: 4,
    rarity: "rare",
    sprite: "/fishing/bait-voltchum.png",
    pull: 0.2,
    attracts: ["fish_echo_eel", "fish_goldrelay"],
    attractMult: 1.8,
    junkMult: 0.45,
    effect: "Draws Echo Eel and Gold Relay. Strong rarity pull.",
    description: "Ground carp cut with crystal dust. It hums against the tin.",
  },
  {
    id: "bait_voidchum",
    label: "Void Chum",
    tier: 5,
    rarity: "epic",
    sprite: "/fishing/bait-voidchum.png",
    pull: 0.3,
    attracts: ["fish_goldrelay", "fish_prism_leviathan"],
    attractMult: 2,
    junkMult: 0.3,
    effect: "Draws Gold Relay and Prism Leviathan. Severe rarity pull.",
    description: "Something in the water recognises this and comes up to look.",
  },
]

export function getBait(id: string): BaitDef | undefined {
  return BAIT.find((b) => b.id === id)
}

/** Bait ids, cheapest first — used to pick the best bait a courier owns. */
export const BAIT_IDS = BAIT.map((b) => b.id)

/** The free fallback that keeps "bait required" from becoming a dead end. */
export const DIG_BAIT_ID = "bait_grubs"
export const DIG_COOLDOWN_MS = 45_000
/** Inclusive roll range for a single dig. */
export const DIG_MIN = 1
export const DIG_MAX = 3
