/**
 * Fishing content pack — the single source of truth for the fish/variant/material
 * expansion imported from data/esro-fishing-content.json.
 *
 * Everything the pack adds (new catchable species, rare visual variants, and
 * fishing-only crafting materials) plus every drop rate lives here so balance can
 * be retuned from one place. config/fishing.ts merges the fish defined here into
 * the live catch table; the store rolls variants/materials via the helpers below.
 *
 * Design constraints (from the pack brief):
 *   - Additive, not a rebuild: the existing 6-tier rarity-ladder fish stay as-is.
 *   - Regular fish are common/uncommon; rare variants are marked and valued higher
 *     but never economy-breaking.
 *   - Materials are a *secondary* result, tradeable, and fishing-only.
 */

import type { FishDef } from "@/config/fishing"
import type { InventoryItem, Rarity } from "@/lib/types"

const RARITY_ORDER: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "admin",
]

/** Bump a rarity up by `steps` tiers, clamped to the mythic ceiling. */
function bumpRarity(rarity: Rarity, steps = 1): Rarity {
  const i = RARITY_ORDER.indexOf(rarity)
  if (i < 0) return rarity
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 2, i + steps)] // never returns "admin"
}

// ---------------------------------------------------------------------------
// Asset roots (assets copied from the pack into public/)
// ---------------------------------------------------------------------------
const FISH_ART = "/images/esro/fishing/fish"
const MATERIAL_ART = "/images/esro/fishing/materials"

// ---------------------------------------------------------------------------
// Modest reference values. No vendor exists yet; these are metadata for future
// trade/vendor tooling and for showing "worth" in the detail panel.
// ---------------------------------------------------------------------------
export const SELL_VALUE_BY_RARITY: Record<Rarity, number> = {
  common: 5,
  uncommon: 12,
  rare: 30,
  epic: 70,
  legendary: 160,
  mythic: 400,
  admin: 0,
}

// ===========================================================================
// NEW BASE FISH
//
// The 15 pack species that are not already in the live catch table. All sit at
// the common/uncommon end so they enrich the roster without swamping the tuned
// rare ladder of the original six. Weights are intentionally moderate (below the
// original commons) for the same reason. `spots` lists which fishing spots each
// appears in, matched thematically.
// ===========================================================================
export interface PackFishDef extends FishDef {
  /** Fishing spot ids this species can be caught in. */
  spots: string[]
}

export const NEW_BASE_FISH: PackFishDef[] = [
  // --- Relay Shallows: freshwater / marsh, forgiving water ---
  {
    id: "fish-brook-trout",
    label: "Brook Trout",
    rarity: "common",
    sprite: `${FISH_ART}/fish-brook-trout.png`,
    weight: 22,
    biteWindow: 1.6,
    description: "A speckled shallow-water staple. Quick, but not clever.",
    spots: ["relay_shallows"],
  },
  {
    id: "fish-reed-perch",
    label: "Reed Perch",
    rarity: "common",
    sprite: `${FISH_ART}/fish-reed-perch.png`,
    weight: 20,
    biteWindow: 1.6,
    description: "Hides in the pylon reeds and strikes anything that glints.",
    spots: ["relay_shallows"],
  },
  {
    id: "fish-mossback-bass",
    label: "Mossback Bass",
    rarity: "common",
    sprite: `${FISH_ART}/fish-mossback-bass.png`,
    weight: 18,
    biteWindow: 1.5,
    description: "Green with algae from sitting still too long. Surprisingly heavy.",
    spots: ["relay_shallows"],
  },
  {
    id: "fish-mudwhisker-catfish",
    label: "Mudwhisker Catfish",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-mudwhisker-catfish.png`,
    weight: 12,
    biteWindow: 1.4,
    description: "Tastes the silt with long whiskers. Bites late and hard.",
    spots: ["relay_shallows", "drift_channel"],
  },
  {
    id: "fish-marsh-pike",
    label: "Marsh Pike",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-marsh-pike.png`,
    weight: 11,
    biteWindow: 1.2,
    description: "All teeth and impatience. Will take a lure meant for something bigger.",
    spots: ["relay_shallows", "drift_channel"],
  },

  // --- Drift Channel: open relay water ---
  {
    id: "fish-relay-mackerel",
    label: "Relay Mackerel",
    rarity: "common",
    sprite: `${FISH_ART}/fish-relay-mackerel.png`,
    weight: 20,
    biteWindow: 1.4,
    description: "Runs the cable lines in tight schools. The courier's fast food.",
    spots: ["drift_channel"],
  },
  {
    id: "fish-slate-ray",
    label: "Slate Ray",
    rarity: "common",
    sprite: `${FISH_ART}/fish-slate-ray.png`,
    weight: 16,
    biteWindow: 1.3,
    description: "Glides flat along the channel floor like a loose paving stone.",
    spots: ["drift_channel"],
  },
  {
    id: "fish-bluefin",
    label: "Bluefin",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-bluefin.png`,
    weight: 11,
    biteWindow: 1.1,
    description: "Fast, cold and muscular. Fights the whole way in.",
    spots: ["drift_channel"],
  },
  {
    id: "fish-needle-marlin",
    label: "Needle Marlin",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-needle-marlin.png`,
    weight: 9,
    biteWindow: 1.0,
    description: "A living javelin. Landing one is mostly about not letting go.",
    spots: ["drift_channel"],
  },

  // --- Sunken Wreck: deep, strange water ---
  {
    id: "fish-ember-seahorse",
    label: "Ember Seahorse",
    rarity: "common",
    sprite: `${FISH_ART}/fish-ember-seahorse.png`,
    weight: 15,
    biteWindow: 1.5,
    description: "Warm to the touch and utterly unbothered by the current.",
    spots: ["sunken_wreck"],
  },
  {
    id: "fish-sporepuff",
    label: "Sporepuff",
    rarity: "common",
    sprite: `${FISH_ART}/fish-sporepuff.png`,
    weight: 14,
    biteWindow: 1.5,
    description: "Inflates when startled. Do not squeeze; do not inhale.",
    spots: ["sunken_wreck"],
  },
  {
    id: "fish-ember-jelly",
    label: "Ember Jelly",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-ember-jelly.png`,
    weight: 10,
    biteWindow: 1.2,
    description: "Drifts through the wreck like a slow coal. Leaves a faint sting.",
    spots: ["sunken_wreck"],
  },
  {
    id: "fish-copper-squid",
    label: "Copper Squid",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-copper-squid.png`,
    weight: 9,
    biteWindow: 1.1,
    description: "Bleeds a metallic ink that fouls a line for days.",
    spots: ["sunken_wreck"],
  },
  {
    id: "fish-bonejaw",
    label: "Bonejaw",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-bonejaw.png`,
    weight: 8,
    biteWindow: 1.0,
    description: "Feeds on whatever the wreck gives up. Not fussy about the hook.",
    spots: ["sunken_wreck"],
  },
  {
    id: "fish-gloom-angler",
    label: "Gloom Angler",
    rarity: "uncommon",
    sprite: `${FISH_ART}/fish-gloom-angler.png`,
    weight: 7,
    biteWindow: 0.95,
    description: "Its lure lights first. By the time you see the fish, it has seen you.",
    spots: ["sunken_wreck"],
  },
]

// ===========================================================================
// RARE VARIANTS
//
// One special recolour per base species. Keyed by base fish id. Variants aren't
// in any spot pool — they're rolled *after* a base fish is hooked (see
// rollVariant). The 15 new species key directly; the original six are bridged
// through BASE_ALIAS below so their variants attach to the live catch ids.
// ===========================================================================
export interface FishVariantDef {
  id: string
  label: string
  /** Base fish id in this pack's namespace. */
  baseId: string
  rarity: Rarity
  sprite: string
  description: string
}

/**
 * Bridge from the live catch-table ids (config/fishing.ts) to the pack base ids
 * used by the manifest/variants. Only the original six overlap.
 */
export const BASE_ALIAS: Record<string, string> = {
  fish_silverfin: "fish-silverfin",
  fish_glasscarp: "fish-glasscarp",
  fish_voltray: "fish-voltray",
  fish_echo_eel: "fish-echo-eel",
  fish_goldrelay: "fish-goldrelay",
  fish_prism_leviathan: "fish-prism-leviathan",
}

/**
 * Rarity assigned to each base species, used to derive its variant's rarity.
 * The original six keep their live-table tiers; new species use their pack tier.
 */
const BASE_RARITY: Record<string, Rarity> = {
  "fish-silverfin": "common",
  "fish-glasscarp": "uncommon",
  "fish-voltray": "rare",
  "fish-echo-eel": "epic",
  "fish-goldrelay": "legendary",
  "fish-prism-leviathan": "mythic",
  ...Object.fromEntries(NEW_BASE_FISH.map((f) => [f.id, f.rarity])),
}

/** Raw variant list: id, label, base species, sprite, short description. */
const VARIANT_SEED: Omit<FishVariantDef, "rarity">[] = [
  { id: "fish-silverfin-moonlit", label: "Moonlit Silverfin", baseId: "fish-silverfin", sprite: `${FISH_ART}/fish-silverfin-moonlit.png`, description: "A silverfin bleached pale by moon-cycles spent near the surface. Fishers keep the first one they land." },
  { id: "fish-glasscarp-frostglass", label: "Frostglass Carp", baseId: "fish-glasscarp", sprite: `${FISH_ART}/fish-glasscarp-frostglass.png`, description: "Its transparent scales have frozen into faceted frost. Cold long after landing." },
  { id: "fish-voltray-stormwake", label: "Stormwake Voltray", baseId: "fish-voltray", sprite: `${FISH_ART}/fish-voltray-stormwake.png`, description: "Holds a storm's worth of charge. The water around it never quite settles." },
  { id: "fish-echo-eel-starcoil", label: "Starcoil Echo Eel", baseId: "fish-echo-eel", sprite: `${FISH_ART}/fish-echo-eel-starcoil.png`, description: "Repeats sounds from years, not days, ago — and some no one remembers making." },
  { id: "fish-goldrelay-crownflare", label: "Crownflare Goldrelay", baseId: "fish-goldrelay", sprite: `${FISH_ART}/fish-goldrelay-crownflare.png`, description: "A goldrelay burning with a crown of light. Releasing one is said to buy a season of luck." },
  { id: "fish-prism-leviathan-aurora", label: "Aurora Prism Leviathan", baseId: "fish-prism-leviathan", sprite: `${FISH_ART}/fish-prism-leviathan-aurora.png`, description: "The leviathan wearing the drift's full spectrum. Perhaps two have ever been seen." },
  { id: "fish-relay-mackerel-stormline", label: "Stormline Mackerel", baseId: "fish-relay-mackerel", sprite: `${FISH_ART}/fish-relay-mackerel-stormline.png`, description: "A mackerel marked with jagged storm lines. Runs faster than the school it left behind." },
  { id: "fish-bluefin-suncrest", label: "Suncrest Bluefin", baseId: "fish-bluefin", sprite: `${FISH_ART}/fish-bluefin-suncrest.png`, description: "Its crest catches the light like sunrise on cold water." },
  { id: "fish-sporepuff-voidspore", label: "Voidspore Puffer", baseId: "fish-sporepuff", sprite: `${FISH_ART}/fish-sporepuff-voidspore.png`, description: "The spores it releases drink the light instead of scattering it." },
  { id: "fish-needle-marlin-starpiercer", label: "Starpiercer Marlin", baseId: "fish-needle-marlin", sprite: `${FISH_ART}/fish-needle-marlin-starpiercer.png`, description: "A marlin honed to a point that seems to catch on the sky itself." },
  { id: "fish-gloom-angler-abyssal-beacon", label: "Abyssal Beacon Angler", baseId: "fish-gloom-angler", sprite: `${FISH_ART}/fish-gloom-angler-abyssal-beacon.png`, description: "Its lure burns bright enough to read by. Whatever it draws up, you may not want to meet." },
  { id: "fish-ember-seahorse-nebula", label: "Nebula Seahorse", baseId: "fish-ember-seahorse", sprite: `${FISH_ART}/fish-ember-seahorse-nebula.png`, description: "A seahorse dusted with what looks like distant stars." },
  { id: "fish-slate-ray-crystalwing", label: "Crystalwing Ray", baseId: "fish-slate-ray", sprite: `${FISH_ART}/fish-slate-ray-crystalwing.png`, description: "Its flat body has grown over with clear crystal. It chimes when it moves." },
  { id: "fish-ember-jelly-starveil", label: "Starveil Jelly", baseId: "fish-ember-jelly", sprite: `${FISH_ART}/fish-ember-jelly-starveil.png`, description: "A jelly trailing a veil of cold light instead of embers." },
  { id: "fish-copper-squid-voidstar", label: "Voidstar Squid", baseId: "fish-copper-squid", sprite: `${FISH_ART}/fish-copper-squid-voidstar.png`, description: "Its copper has tarnished to something darker, flecked with pinpoint light." },
  { id: "fish-bonejaw-astral", label: "Astral Bonejaw", baseId: "fish-bonejaw", sprite: `${FISH_ART}/fish-bonejaw-astral.png`, description: "Bleached bone gone luminous, as if it fed on something that fell from the sky." },
  { id: "fish-reed-perch-embercrest", label: "Embercrest Perch", baseId: "fish-reed-perch", sprite: `${FISH_ART}/fish-reed-perch-embercrest.png`, description: "A perch with a fin that glows like banked coals." },
  { id: "fish-brook-trout-starlit", label: "Starlit Trout", baseId: "fish-brook-trout", sprite: `${FISH_ART}/fish-brook-trout-starlit.png`, description: "Its speckles have brightened into a scatter of tiny stars." },
  { id: "fish-mossback-bass-voidcurrent", label: "Voidcurrent Bass", baseId: "fish-mossback-bass", sprite: `${FISH_ART}/fish-mossback-bass-voidcurrent.png`, description: "The moss on its back drifts as if caught in a current only it can feel." },
  { id: "fish-mudwhisker-catfish-gilded", label: "Gilded Mudwhisker", baseId: "fish-mudwhisker-catfish", sprite: `${FISH_ART}/fish-mudwhisker-catfish-gilded.png`, description: "Years in the silt have somehow left it plated in gold." },
  { id: "fish-marsh-pike-frostspine", label: "Frostspine Pike", baseId: "fish-marsh-pike", sprite: `${FISH_ART}/fish-marsh-pike-frostspine.png`, description: "A pike whose dorsal spines have iced over into a jagged crest." },
]

/** Finalized variants with derived rarity: one tier above the base, min "rare". */
export const FISH_VARIANTS: FishVariantDef[] = VARIANT_SEED.map((v) => {
  const baseRarity = BASE_RARITY[v.baseId] ?? "common"
  const bumped = bumpRarity(baseRarity, 1)
  const rarity = RARITY_ORDER.indexOf(bumped) < RARITY_ORDER.indexOf("rare") ? "rare" : bumped
  return { ...v, rarity }
})

const VARIANT_BY_BASE: Record<string, FishVariantDef> = Object.fromEntries(
  FISH_VARIANTS.map((v) => [v.baseId, v]),
)

/** Resolve a live catch-table fish id (or pack id) to its variant, if any. */
export function variantForBase(fishId: string): FishVariantDef | undefined {
  const packId = BASE_ALIAS[fishId] ?? fishId
  return VARIANT_BY_BASE[packId]
}

// ===========================================================================
// FISHING-ONLY MATERIALS
//
// Secondary drops. Tradeable, fishing-only, tuned so common ones show up
// regularly and rare ones stay a treat. Descriptions and use-themes come from
// the pack brief.
// ===========================================================================
export interface FishingMaterialDef {
  id: string
  label: string
  rarity: Rarity
  sprite: string
  description: string
  craftingUse: string
  sellValue: number
  tags: string[]
}

export const FISHING_MATERIALS: FishingMaterialDef[] = [
  {
    id: "material-pearlescent-shell-fragment",
    label: "Pearlescent Shell Fragment",
    rarity: "common",
    sprite: `${MATERIAL_ART}/material-pearlescent-shell-fragment.png`,
    description: "A broken shell piece with a soft pearl sheen.",
    craftingUse: "Basic shellcraft ingredient for polish kits and minor recipes.",
    sellValue: 8,
    tags: ["fishing", "material", "shellcraft"],
  },
  {
    id: "material-kelpweave-bundle",
    label: "Kelpweave Bundle",
    rarity: "common",
    sprite: `${MATERIAL_ART}/material-kelpweave-bundle.png`,
    description: "A tight bundle of tough sea-fibre, useful for simple crafting.",
    craftingUse: "Binding fibre for wraps, bait satchels and simple utility crafts.",
    sellValue: 8,
    tags: ["fishing", "material", "fibre"],
  },
  {
    id: "material-opalescent-driftglass",
    label: "Opalescent Driftglass",
    rarity: "uncommon",
    sprite: `${MATERIAL_ART}/material-opalescent-driftglass.png`,
    description: "A smoothed shard of sea-tossed glass with a faint inner shimmer.",
    craftingUse: "Light crafting catalyst for lures, relay-themed trinkets and decor.",
    sellValue: 20,
    tags: ["fishing", "material", "catalyst"],
  },
  {
    id: "material-amber-barnacle-resin",
    label: "Amber Barnacle Resin",
    rarity: "uncommon",
    sprite: `${MATERIAL_ART}/material-amber-barnacle-resin.png`,
    description: "Sticky resin scraped from a barnacle cluster, good for binding and polish.",
    craftingUse: "Reinforcement resin for polish and modest upgrade recipes.",
    sellValue: 20,
    tags: ["fishing", "material", "resin"],
  },
  {
    id: "material-iridescent-tide-thread",
    label: "Iridescent Tide Thread",
    rarity: "uncommon",
    sprite: `${MATERIAL_ART}/material-iridescent-tide-thread.png`,
    description: "Fine thread spun from treated sea-fibre, flexible and strangely lustrous.",
    craftingUse: "Clothwork, lure assembly and decorative crafting.",
    sellValue: 24,
    tags: ["fishing", "material", "thread"],
  },
  {
    id: "material-luminous-roe-cluster",
    label: "Luminous Roe Cluster",
    rarity: "rare",
    sprite: `${MATERIAL_ART}/material-luminous-roe-cluster.png`,
    description: "A softly glowing cluster of roe prized by fishers and crafters alike.",
    craftingUse: "Glowing ingredient for bait, tonics and minor alchemical blends.",
    sellValue: 55,
    tags: ["fishing", "material", "reagent"],
  },
  {
    id: "material-blush-coral-sprig",
    label: "Blush Coral Sprig",
    rarity: "rare",
    sprite: `${MATERIAL_ART}/material-blush-coral-sprig.png`,
    description: "A delicate branch of coral with pastel tones and decorative value.",
    craftingUse: "Ornaments, dyes and refined accessory crafting.",
    sellValue: 55,
    tags: ["fishing", "material", "decor"],
  },
  {
    id: "material-abyssal-pearl",
    label: "Abyssal Pearl",
    rarity: "rare",
    sprite: `${MATERIAL_ART}/material-abyssal-pearl.png`,
    description: "A rare dark pearl with a deep inner gleam, highly valued in trade.",
    craftingUse: "Prestige trade good and centrepiece of higher-end (but fair) recipes.",
    sellValue: 90,
    tags: ["fishing", "material", "prestige", "trade"],
  },
]

const MATERIAL_BY_ID: Record<string, FishingMaterialDef> = Object.fromEntries(
  FISHING_MATERIALS.map((m) => [m.id, m]),
)

// ===========================================================================
// DROP TUNING — every fishing-reward rate lives here.
// ===========================================================================
export const DROP_TUNING = {
  /** Base chance a landed fish turns out to be its rare variant. */
  variantChance: 0.05,
  /** Player luck (0..~1) adds up to this fraction on top of variantChance. */
  variantLuckBonus: 0.06,
  /** Hard ceiling on variant chance however much luck stacks. */
  variantChanceCap: 0.18,

  /** Chance a successful (non-junk) catch also yields a fishing material. */
  materialChance: 0.3,
  /** Luck adds up to this fraction on top of materialChance. */
  materialLuckBonus: 0.1,
  /** Relative weights for which rarity of material drops when one does. */
  materialRarityWeights: { common: 60, uncommon: 30, rare: 10 } as Record<string, number>,

  /** Variants are worth this multiple of the base rarity value. */
  variantSellMultiplier: 1.8,
} as const

// ---------------------------------------------------------------------------
// Roll helpers (pure; caller supplies rng so behaviour stays testable)
// ---------------------------------------------------------------------------

/** Roll whether a landed base fish is upgraded to its rare variant. */
export function rollVariant(
  baseFishId: string,
  rng: () => number,
  luck = 0,
): FishVariantDef | null {
  const variant = variantForBase(baseFishId)
  if (!variant) return null
  const chance = Math.min(
    DROP_TUNING.variantChanceCap,
    DROP_TUNING.variantChance + Math.max(0, luck) * DROP_TUNING.variantLuckBonus,
  )
  return rng() < chance ? variant : null
}

/** Roll an optional bonus fishing material for a successful catch. */
export function rollMaterial(rng: () => number, luck = 0): FishingMaterialDef | null {
  const trigger = Math.min(
    0.6,
    DROP_TUNING.materialChance + Math.max(0, luck) * DROP_TUNING.materialLuckBonus,
  )
  if (rng() >= trigger) return null

  // Pick a rarity band, then a material within it.
  const bands = Object.entries(DROP_TUNING.materialRarityWeights)
  const total = bands.reduce((sum, [, w]) => sum + w, 0)
  let r = rng() * total
  let chosen: string = bands[0][0]
  for (const [rarity, w] of bands) {
    r -= w
    if (r <= 0) {
      chosen = rarity
      break
    }
  }
  const pool = FISHING_MATERIALS.filter((m) => m.rarity === chosen)
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)]
}

// ---------------------------------------------------------------------------
// InventoryItem converters
// ---------------------------------------------------------------------------

/** Convert a rolled rare variant into an inventory item. */
export function variantToItem(variant: FishVariantDef, qty: number): InventoryItem {
  return {
    id: variant.id,
    label: variant.label,
    aspect: "food",
    rarity: variant.rarity,
    qty,
    identified: true,
    description: variant.description,
    type: "fish",
    subtype: "variant",
    image: variant.sprite,
    sellValue: Math.round((SELL_VALUE_BY_RARITY[variant.rarity] ?? 0) * DROP_TUNING.variantSellMultiplier),
    tradeable: true,
    fishCategory: variant.baseId,
    isVariant: true,
    variantOf: variant.baseId,
    obtainMethod: "fishing_only",
    tags: ["fishing", "fish", "variant", "rare-catch"],
  }
}

/** Convert a rolled fishing material into an inventory item. */
export function materialToItem(mat: FishingMaterialDef, qty: number): InventoryItem {
  return {
    id: mat.id,
    label: mat.label,
    aspect: "material",
    rarity: mat.rarity,
    qty,
    identified: true,
    description: mat.description,
    type: "crafting_material",
    subtype: "fishing",
    image: mat.sprite,
    sellValue: mat.sellValue,
    tradeable: true,
    obtainMethod: "fishing_only",
    tags: mat.tags,
    craftingUse: mat.craftingUse,
  }
}

// ---------------------------------------------------------------------------
// Sprite registry — resolve an item id to its sprite for surfaces (like trade)
// that only carry an item id. Covers original + new fish, variants, materials.
// The original six live-table sprites are registered under their live ids.
// ---------------------------------------------------------------------------
export const ITEM_SPRITES: Record<string, string> = {
  // Original six (live catch ids -> existing /fishing sprites)
  fish_silverfin: "/fishing/fish-silverfin.png",
  fish_glasscarp: "/fishing/fish-glasscarp.png",
  fish_voltray: "/fishing/fish-voltray.png",
  fish_echo_eel: "/fishing/fish-echo-eel.png",
  fish_goldrelay: "/fishing/fish-goldrelay.png",
  fish_prism_leviathan: "/fishing/fish-prism-leviathan.png",
  // New base fish
  ...Object.fromEntries(NEW_BASE_FISH.map((f) => [f.id, f.sprite])),
  // Variants
  ...Object.fromEntries(FISH_VARIANTS.map((v) => [v.id, v.sprite])),
  // Materials
  ...Object.fromEntries(FISHING_MATERIALS.map((m) => [m.id, m.sprite])),
}

/** Look up a sprite for any fishing item id (used by trade rows). */
export function fishingSpriteFor(itemId: string): string | undefined {
  return ITEM_SPRITES[itemId]
}
