import type { Contract, ContractType } from "./types"

/** How many of each type appear on the board for a given day. */
const DAILY_SLOTS: Record<ContractType, number> = {
  faction: 3,
  neutral: 2,
  event: 1,
  // Escort work is gated behind the `escort_contracts` breakpoint. The slot is
  // always filled so the board shows the job as locked rather than hiding it,
  // matching how locked expeditions stay visible on the map.
  escort: 1,
}

/** Local-day key, e.g. "2026-08-17". Rolls over at the player's midnight. */
export function dayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Milliseconds until the next local midnight, for the countdown and timer. */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

/** Formats a duration as "6h 12m", or "12m" under an hour. */
export function formatResetIn(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/**
 * FNV-1a. Small, fast, and stable across reloads — unlike Math.random, so the
 * same day always produces the same board.
 */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministic shuffle of a copy, seeded by the given string. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items]
  // Fisher-Yates driven by a hash of (seed, index) rather than a live RNG.
  for (let i = out.length - 1; i > 0; i--) {
    const j = hash(`${seed}:${i}`) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Picks the day's contract board from the full pool.
 *
 * Deterministic by design: the board is a pure function of the day key, so it
 * survives reloads without persistence and rolls over on its own at midnight.
 * Accepted and completed contracts are passed through so a daily reset never
 * yanks a job out from under the player.
 */
export function rotateContracts(
  pool: Contract[],
  now: Date = new Date(),
  keep: Contract[] = [],
): Contract[] {
  const seed = dayKey(now)
  const keptIds = new Set(keep.map((c) => c.id))
  const board: Contract[] = [...keep]

  for (const [type, slots] of Object.entries(DAILY_SLOTS) as [ContractType, number][]) {
    const candidates = pool.filter((c) => c.type === type && !keptIds.has(c.id))
    // Seeding per type keeps one type's pool size from shifting the others.
    const picked = seededShuffle(candidates, `${seed}:${type}`).slice(0, slots)
    for (const c of picked) board.push({ ...c, status: "available" })
  }

  return board
}
