import type { BaseStats, Profile } from "./types"

/**
 * Character progression: the XP curve and the stat points level-ups grant.
 *
 * Before this module nothing ever incremented `profile.xp` or `profile.level` —
 * `rewards.xp` on every expedition was dead data and Artisanry's `xpBonus`
 * hook had nothing to scale. All XP now flows through `applyXp`.
 */

/** Stat points granted per character level. */
export const POINTS_PER_LEVEL = 3

/** Core stats a player may spend points into. HP is derived, not purchasable. */
export const ALLOCATABLE_STATS = ["atk", "def", "focus", "luck"] as const
export type AllocatableStat = (typeof ALLOCATABLE_STATS)[number]

/** Empty allocation record, used for new characters and for respec. */
export function emptyAllocation(): BaseStats {
  return { hp: 0, atk: 0, def: 0, focus: 0, luck: 0 }
}

/**
 * Total XP required to advance *from* `level` to the next one.
 * Mild superlinear growth keeps early levels brisk and later ones meaningful.
 */
export function xpForLevel(level: number): number {
  return Math.round(80 * Math.pow(Math.max(1, level), 1.35))
}

export interface XpResult {
  level: number
  xp: number
  xpToNext: number
  statPoints: number
  /** Every level crossed by this award, so the UI can announce each one. */
  levelsGained: number[]
}

/**
 * Add XP and resolve any resulting level-ups.
 *
 * Loops rather than leveling once, because a single large expedition reward can
 * span several levels — awarding one level and discarding the surplus would
 * silently lose progress.
 */
export function applyXp(
  profile: Pick<Profile, "level" | "xp" | "xpToNext" | "statPoints">,
  amount: number
): XpResult {
  let level = profile.level
  let xp = profile.xp + Math.max(0, Math.round(amount))
  // Trust the stored threshold, but fall back to the curve if it is missing or
  // nonsensical, otherwise a bad value could make the loop spin forever.
  let xpToNext = profile.xpToNext > 0 ? profile.xpToNext : xpForLevel(level)
  let statPoints = profile.statPoints ?? 0
  const levelsGained: number[] = []

  while (xp >= xpToNext) {
    xp -= xpToNext
    level += 1
    statPoints += POINTS_PER_LEVEL
    levelsGained.push(level)
    xpToNext = xpForLevel(level)
  }

  return { level, xp, xpToNext, statPoints, levelsGained }
}

/** Points actually spent, used to refund an exact amount on respec. */
export function spentPoints(allocated: BaseStats | undefined): number {
  if (!allocated) return 0
  return ALLOCATABLE_STATS.reduce((sum, stat) => sum + (allocated[stat] || 0), 0)
}
