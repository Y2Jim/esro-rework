/**
 * Rituals — the Focus payoff.
 *
 * Focus was the weakest core stat: it is the *secondary* half of Endurance,
 * Insight and Navigation but primary for nothing, so it never had a visible
 * identity. Rituals make Focus the support stat: it sets how much ritual
 * "attunement" you can carry into a run, and rituals buff the entire party.
 *
 * Rituals are prepped before launch and last the whole expedition. Stronger
 * ones are taught by books found on expeditions — mostly on hidden routes.
 */

export type RitualEffectKey =
  | "damageReduction"
  | "battleScore"
  | "hazardScore"
  | "discoveryScore"
  | "travelScore"
  | "hazardFrequency"
  | "badfailDowngrade"
  | "bonusLoot"
  | "runDuration"
  | "xpBonus"

export interface Ritual {
  id: string
  label: string
  description: string
  /** Focus attunement consumed when prepped. */
  attunement: number
  /** Fractional effects merged into the run's modifiers. */
  effects: Partial<Record<RitualEffectKey, number>>
  /** Starter rituals are known from character creation. */
  starter?: boolean
  /** Where the teaching book is found, for codex copy. */
  source?: string
}

/**
 * Focus converts to attunement capacity at 1 point per 2 Focus. Capacity is
 * what limits how many rituals can be prepped, so investing in Focus directly
 * widens the support toolkit.
 */
export function attunementCapacity(focus: number): number {
  return Math.max(1, Math.floor(focus / 2))
}

export const RITUALS: Ritual[] = [
  // ---- Starters: known immediately so the system is usable from level 1 ----
  {
    id: "wardlight",
    label: "Wardlight",
    description: "A steady lamp-glyph blunts the first blow of every ambush.",
    attunement: 1,
    effects: { damageReduction: 0.1 },
    starter: true,
  },
  {
    id: "surefoot_chant",
    label: "Surefoot Chant",
    description: "Marching cadence keeps the party on the true path.",
    attunement: 1,
    effects: { travelScore: 0.1 },
    starter: true,
  },
  {
    id: "keen_sight",
    label: "Keen Sight",
    description: "Sharpened attention draws the eye to what others walk past.",
    attunement: 1,
    effects: { discoveryScore: 0.1 },
    starter: true,
  },

  // ---- Minor books: rare drops on ordinary routes ----
  {
    id: "gravebind",
    label: "Gravebind",
    description: "Binding-words settle restless ground, thinning hazards ahead.",
    attunement: 2,
    effects: { hazardFrequency: -0.15, hazardScore: 0.1 },
    source: "Minor codex — any route",
  },
  {
    id: "long_marches",
    label: "Rite of Long Marches",
    description: "The road shortens for those who chant it properly.",
    attunement: 2,
    effects: { runDuration: -0.12 },
    source: "Minor codex — any route",
  },

  // ---- Major books: hidden and deep routes only ----
  {
    id: "ash_communion",
    label: "Ash Communion",
    description: "Speaking to the ash turns disasters into mere setbacks.",
    attunement: 3,
    // badfailDowngrade and bonusLoot are raw probabilities in the sim, so these
    // stay fractional — a value of 1 would make the effect unconditional.
    effects: { badfailDowngrade: 0.25, damageReduction: 0.05 },
    source: "Major codex — hidden routes",
  },
  {
    id: "echo_vigil",
    label: "Echo Vigil",
    description: "Standing watch over echoes reveals caches left behind.",
    attunement: 3,
    effects: { bonusLoot: 0.3, discoveryScore: 0.12 },
    source: "Major codex — hidden routes",
  },
  {
    id: "iron_procession",
    label: "Iron Procession",
    description: "The party moves as one body, striking and shielding together.",
    attunement: 4,
    effects: { battleScore: 0.15, damageReduction: 0.1 },
    source: "Major codex — deep ruins",
  },
  {
    id: "scholars_wake",
    label: "Scholar's Wake",
    description: "Every lesson of the road is recorded and carried home.",
    attunement: 3,
    effects: { xpBonus: 0.2 },
    source: "Major codex — deep ruins",
  },
]

export const STARTER_RITUALS = RITUALS.filter((r) => r.starter).map((r) => r.id)

/** Books that can drop on ordinary (non-hidden) routes. */
export const MINOR_RITUAL_BOOKS = ["gravebind", "long_marches"]

/** Books reserved for hidden/deep routes. */
export const MAJOR_RITUAL_BOOKS = [
  "ash_communion",
  "echo_vigil",
  "iron_procession",
  "scholars_wake",
]

export function getRitual(id: string): Ritual | undefined {
  return RITUALS.find((r) => r.id === id)
}

export function getRituals(ids: string[] | undefined): Ritual[] {
  if (!ids?.length) return []
  return ids.map(getRitual).filter((r): r is Ritual => Boolean(r))
}

/** Total attunement consumed by a set of rituals. */
export function attunementUsed(ids: string[] | undefined): number {
  return getRituals(ids).reduce((sum, r) => sum + r.attunement, 0)
}
