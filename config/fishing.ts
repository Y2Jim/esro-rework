import type { BaitDef } from "@/config/bait"
import type { InventoryItem, Rarity } from "@/lib/types"
import {
  NEW_BASE_FISH,
  FISH_VARIANTS,
  SELL_VALUE_BY_RARITY,
} from "@/config/fishing-content"

/**
 * Fishing catch table.
 *
 * Gating (see lib/skill-effects.ts):
 *   Luck 15          -> "fishing_basic"  : the Cast Line action itself
 *   Fishing level 10 -> "fishing_wrecks" : the submerged wreck spot
 *
 * Entry is a Luck stat gate rather than a Fishing level gate because Fishing XP
 * can only be earned by fishing — a skill cannot gate its own entry point.
 */

export interface FishDef {
  id: string
  label: string
  rarity: Rarity
  /** Pixel-art sprite in /public/fishing. */
  sprite: string
  /** Relative draw weight within a spot. Higher = more common. */
  weight: number
  /** Seconds the bite window stays open — rarer fish are twitchier. */
  biteWindow: number
  description: string
}

export const FISH: FishDef[] = [
  {
    id: "fish_silverfin",
    label: "Silverfin",
    rarity: "common",
    sprite: "/fishing/fish-silverfin.png",
    weight: 40,
    biteWindow: 1.6,
    description: "Bland, bony and everywhere. The relay runner's breakfast.",
  },
  {
    id: "fish_glasscarp",
    label: "Glass Carp",
    rarity: "uncommon",
    sprite: "/fishing/fish-glasscarp.png",
    weight: 24,
    biteWindow: 1.3,
    description: "You can watch its heart beat straight through the scales.",
  },
  {
    id: "fish_voltray",
    label: "Volt Ray",
    rarity: "rare",
    sprite: "/fishing/fish-voltray.png",
    weight: 14,
    biteWindow: 1.0,
    description: "Holds a charge for hours after landing. Handle with gloves.",
  },
  {
    id: "fish_echo_eel",
    label: "Echo Eel",
    rarity: "epic",
    sprite: "/fishing/fish-echo-eel.png",
    weight: 7,
    biteWindow: 0.85,
    description: "Repeats sounds it heard days ago. Nobody likes what it says.",
  },
  {
    id: "fish_goldrelay",
    label: "Gold Relay Koi",
    rarity: "legendary",
    sprite: "/fishing/fish-goldrelay.png",
    weight: 3,
    biteWindow: 0.7,
    description: "Couriers swear releasing one buys a week of good routes.",
  },
  {
    id: "fish_prism_leviathan",
    label: "Prism Leviathan",
    rarity: "mythic",
    sprite: "/fishing/fish-prism-leviathan.png",
    weight: 1,
    biteWindow: 0.55,
    description: "Small enough to hold. Old enough to have watched the drift form.",
  },
  // Pack roster: the new species live in config/fishing-content.ts and are merged
  // in here so the catch mechanic (pickFish/getFish) treats them like any other.
  ...NEW_BASE_FISH,
]

/** The consolation prize. Never counts as a catch streak. */
export const JUNK: FishDef = {
  id: "junk_boot",
  label: "Waterlogged Boot",
  rarity: "common",
  sprite: "/fishing/junk-boot.png",
  weight: 0,
  biteWindow: 2.2,
  description: "Left foot. Someone out there is having a worse day.",
}

export interface FishingSpot {
  id: string
  label: string
  blurb: string
  /** Unlock id required to fish here, if any. */
  requires?: string
  /** Fish ids available here. */
  pool: string[]
  /** Chance a bite turns out to be junk. */
  junkChance: number
}

/** Pack species that list this spot in their `spots` field, as raw fish ids. */
function packPoolFor(spotId: string): string[] {
  return NEW_BASE_FISH.filter((f) => f.spots.includes(spotId)).map((f) => f.id)
}

export const FISHING_SPOTS: FishingSpot[] = [
  {
    id: "relay_shallows",
    label: "Relay Shallows",
    blurb: "Warm, slow water under the cable pylons. Forgiving to beginners.",
    pool: ["fish_silverfin", "fish_glasscarp", "fish_voltray", ...packPoolFor("relay_shallows")],
    junkChance: 0.22,
  },
  {
    id: "drift_channel",
    label: "Drift Channel",
    blurb: "Fast current pulling toward open water. Bigger fish, shorter tempers.",
    pool: ["fish_glasscarp", "fish_voltray", "fish_echo_eel", "fish_goldrelay", ...packPoolFor("drift_channel")],
    junkChance: 0.12,
  },
  {
    id: "sunken_wreck",
    label: "Sunken Wreck",
    blurb: "Something old rests on the bottom here, and something older feeds on it.",
    requires: "fishing_wrecks",
    pool: ["fish_voltray", "fish_echo_eel", "fish_goldrelay", "fish_prism_leviathan", ...packPoolFor("sunken_wreck")],
    junkChance: 0.08,
  },
]

/**
 * FishDef view of every rare variant, so getFish (and thus the fishing tab's
 * landed panel + recent-catches log) can render a landed variant by id. Variants
 * are never in a spot pool — they're rolled post-catch — so weight is 0.
 */
const VARIANT_DEFS: FishDef[] = FISH_VARIANTS.map((v) => ({
  id: v.id,
  label: v.label,
  rarity: v.rarity,
  sprite: v.sprite,
  weight: 0,
  // Look up the base fish directly from FISH (not getFish) to avoid a temporal
  // dead zone: getFish references VARIANT_DEFS, so calling it here — during
  // VARIANT_DEFS' own initialization — would access the const before it exists.
  biteWindow: FISH.find((f) => f.id === v.baseId)?.biteWindow ?? 1,
  description: v.description,
}))

export function getFish(id: string): FishDef | undefined {
  if (id === JUNK.id) return JUNK
  return FISH.find((f) => f.id === id) ?? VARIANT_DEFS.find((v) => v.id === id)
}

/**
 * Weighted pick from a spot's pool, biased toward rarity by `luck` and `bait`.
 *
 * `bait` is optional so existing callers and tests keep working unchanged.
 */
export function pickFish(
  spot: FishingSpot,
  luck: number,
  rng: () => number,
  bait?: BaitDef,
): FishDef {
  const pool = spot.pool.map((id) => getFish(id)).filter((f): f is FishDef => !!f)
  if (pool.length === 0) return JUNK

  // Luck flattens the weight curve so rare entries get proportionally closer
  // to common ones, rather than just adding a flat bonus to the roll. Bait's
  // `pull` stacks into the same exponent so the two compose instead of being
  // two unrelated systems fighting over the same roll.
  const flatten = Math.max(0.2, 1 - luck - (bait?.pull ?? 0))
  const weights = pool.map((f) => {
    const w = f.weight ** flatten
    // Applied AFTER the exponent so targeting shifts which fish of a given tier
    // bites without collapsing the rarity ladder the exponent just built.
    return bait?.attracts.includes(f.id) ? w * bait.attractMult : w
  })
  const total = weights.reduce((a, b) => a + b, 0)

  let r = rng() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

/** Convert a landed catch into an inventory item. */
export function fishToItem(fish: FishDef, qty: number): InventoryItem {
  const isJunk = fish.id === JUNK.id
  return {
    id: fish.id,
    label: fish.label,
    aspect: isJunk ? "salvage" : "food",
    rarity: fish.rarity,
    qty,
    identified: true,
    description: fish.description,
    type: isJunk ? "misc" : "fish",
    image: fish.sprite,
    ...(isJunk
      ? {}
      : {
          fishCategory: fish.id,
          tradeable: true,
          obtainMethod: "fishing_only",
          sellValue: SELL_VALUE_BY_RARITY[fish.rarity] ?? 0,
          tags: ["fishing", "fish"],
        }),
  }
}
