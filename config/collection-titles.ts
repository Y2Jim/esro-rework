import type { OwnedTitle, Rarity } from "@/lib/types"

/**
 * Collection titles — earned by encountering the rarest things in the world,
 * not by grinding a counter. Where faction titles reward sustained play (see
 * config/faction.ts), these mark a single extraordinary moment: the shiny that
 * appears once in hundreds of sightings, the mythic fish that almost never bites.
 *
 * Each entry is a one-shot unlock. The store grants it the first time its
 * condition is met and never revokes it, so a title is a permanent record that
 * you were there when it happened.
 */

export interface CollectionTitleDef {
  id: string
  label: string
  rarity: Rarity
  /** Shown in the title's provenance line and the unlock notification. */
  source: string
  /** One-line flavor for the unlock notification. */
  blurb: string
}

/** Granted the first time any bestiary sighting turns up a shiny variant. */
export const SHINY_BEAST_TITLE: CollectionTitleDef = {
  id: "title_iridescent",
  label: "The Iridescent",
  rarity: "mythic",
  source: "Shiny sighting",
  blurb: "You logged a recoloured beast — the rarest sight in the wilds.",
}

/**
 * Fish titles, keyed to the catch's rarity. Landing a mythic implies you could
 * also have earned the legendary title, so the store grants every entry at or
 * below the catch's tier that the player does not yet own.
 */
export const FISH_TITLES: { rarity: Rarity; title: CollectionTitleDef }[] = [
  {
    rarity: "legendary",
    title: {
      id: "title_goldline_angler",
      label: "Goldline Angler",
      rarity: "legendary",
      source: "Legendary catch",
      blurb: "A legendary fish on the line, and it did not get away.",
    },
  },
  {
    rarity: "mythic",
    title: {
      id: "title_leviathan_marked",
      label: "Leviathan-Marked",
      rarity: "mythic",
      source: "Mythic catch",
      blurb: "You landed a mythic of the deep. The drift remembers.",
    },
  },
]

/** Rarity order used to decide which fish titles a given catch unlocks. */
const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]

/**
 * Fish titles earned by a catch of the given rarity: every title whose
 * threshold rarity is at or below the catch. A mythic catch therefore also
 * back-fills the legendary title for a player who reached mythic first.
 */
export function fishTitlesForCatch(rarity: Rarity): CollectionTitleDef[] {
  const caught = RARITY_ORDER.indexOf(rarity)
  if (caught < 0) return []
  return FISH_TITLES.filter(({ rarity: need }) => RARITY_ORDER.indexOf(need) <= caught).map(
    (e) => e.title,
  )
}

/** Build the OwnedTitle record stored on the profile from a definition. */
export function toOwnedTitle(def: CollectionTitleDef): OwnedTitle {
  return {
    id: def.id,
    label: def.label,
    rarity: def.rarity,
    equipped: false,
    source: def.source,
  }
}
