/**
 * Enemy target selection.
 *
 * Combat used to pick a victim with a flat `randItem`, which meant a shielded
 * Bulwark tank and an unarmoured analyst were equally likely to be hit. That
 * made the defensive skills feel inert and gave ranged builds no positional
 * identity. Targets are now drawn from a weighted pool built from each member's
 * battle line, so the front rank soaks most attacks and the back rank is hit
 * last — unless the creature specifically hunts the back line.
 */

/** Where a member stands in a fight. Drives how much attention they draw. */
export type BattleLine = "front" | "mid" | "back"

/**
 * How a creature picks its victim.
 * - `front`: normal behaviour, goes for whoever is closest.
 * - `back`: flanker/ambusher that slips past the line for the squishy targets.
 * - `any`: mindless or area-effect, ignores position entirely.
 */
export type TargetingStyle = "front" | "back" | "any"

/**
 * Base attention each line draws from a normal front-focused attacker.
 * Front is 6x the back line, so a tank reliably eats the hits without making
 * the back line completely untargetable.
 */
const LINE_WEIGHT: Record<BattleLine, number> = {
  front: 6,
  mid: 2,
  back: 1,
}

/** Inverted weights for creatures that deliberately dive the back line. */
const BACKLINE_WEIGHT: Record<BattleLine, number> = {
  front: 1,
  mid: 2,
  back: 6,
}

/**
 * Party roles mapped onto battle lines. Logistics carries the heavy gear and
 * walks up front; Analysis is the archetypal back-line specialist.
 */
const ROLE_LINE: Record<string, BattleLine> = {
  Logistics: "front",
  Crew: "mid",
  Surveying: "mid",
  Analysis: "back",
}

/** Skill unlocks that plant a character in the front rank. */
const FRONT_UNLOCKS = ["shield_wall", "bulwark_stance", "interception"]

/**
 * Which line the player stands in, from the skills they actually took.
 *
 * Threat comes from Bulwark, so any threat at all means they are deliberately
 * holding the line. Marksmanship fights at range and falls back instead. When
 * a build has both, holding the line wins: it is the more deliberate choice and
 * the one the player is spending defensive stats on.
 */
export function playerLine(threat: number, hasRanged: boolean): BattleLine {
  if (threat > 0) return "front"
  if (hasRanged) return "back"
  return "mid"
}

/** Which line a non-player crew member occupies, from their party role. */
export function roleLine(role: string): BattleLine {
  return ROLE_LINE[role] ?? "mid"
}

export interface ThreatTarget {
  /** Battle line this candidate stands in. */
  line: BattleLine
  /**
   * Extra attention drawn on top of their line, as a fraction. Bulwark's
   * `interception` feeds this, so investing in it visibly pulls hits inward.
   */
  bonus?: number
}

/**
 * Pick an index from `candidates`, weighted by line and threat bonus.
 *
 * `roll` is injected so the choice is deterministic under test; it must return
 * a value in [0, 1).
 */
export function pickTarget<T extends ThreatTarget>(
  candidates: T[],
  style: TargetingStyle = "front",
  roll: () => number = Math.random,
): number {
  if (candidates.length === 0) return -1
  // Position is irrelevant for `any`, so fall back to a flat pick rather than
  // building a weight table that would all come out equal anyway.
  if (style === "any") return Math.floor(roll() * candidates.length) % candidates.length

  const table = style === "back" ? BACKLINE_WEIGHT : LINE_WEIGHT
  const weights = candidates.map((c) => {
    const base = table[c.line]
    // A threat bonus only pulls attacks toward you, so ignore it for back-line
    // hunters; taunting a flanker shouldn't make it turn around.
    const scale = style === "front" ? 1 + Math.max(0, c.bonus ?? 0) : 1
    return Math.max(0.0001, base * scale)
  })

  const total = weights.reduce((a, b) => a + b, 0)
  let cursor = roll() * total
  for (let i = 0; i < weights.length; i++) {
    cursor -= weights[i]
    if (cursor <= 0) return i
  }
  // Floating-point drift can leave the cursor marginally above zero; treat that
  // as the final entry rather than returning a miss.
  return weights.length - 1
}

/** Human-readable line label for combat feed messages. */
export const LINE_LABEL: Record<BattleLine, string> = {
  front: "front line",
  mid: "mid line",
  back: "back line",
}

export { FRONT_UNLOCKS }
