import { createHash } from "node:crypto"
import {
  applySkillBonuses,
  getRunModifiers,
  planBattle,
  resolveCheck,
  type ExpEventType,
  type RunModifiers,
} from "@/lib/expedition-sim"
import * as orig from "@/lib/sim-original-tmp"
import type { BaseStats, RaceId } from "@/lib/types"
import type { SkillUnlockId } from "@/lib/skill-effects"

/**
 * TEMPORARY verification route (deleted before hand-off).
 *
 * Proves the "additive only" guarantee by running the CURRENT sim and the
 * PRISTINE pre-change sim (commit dc68ab6, vendored as sim-original-tmp) over
 * the same seeded cases. With every unlock OFF the two must agree exactly.
 *
 * The squad profiles and crew sizes are chosen so checks actually SUCCEED —
 * an all-failing sweep never reaches the discovery/loot branch and would make
 * the comparison vacuous.
 */

/** mulberry32 — small deterministic PRNG. */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const EVENTS: ExpEventType[] = ["travel", "discovery", "battle", "hazard", "rest"]
const RISKS: Array<"Low" | "Medium" | "High"> = ["Low", "Medium", "High"]
const RACES: Array<RaceId | undefined> = [undefined, "crownborn", "gloamwhisper"]

/**
 * Weak -> overwhelming. threshold = (RISK_BASE + stage*1.4) * crewSize, so with
 * crewSize 1-3 these span badfail through crit and exercise every branch.
 */
const SQUADS: BaseStats[] = [
  { hp: 30, atk: 7, def: 6, focus: 6, luck: 4 },
  { hp: 40, atk: 14, def: 13, focus: 14, luck: 10 },
  { hp: 60, atk: 26, def: 24, focus: 26, luck: 18 },
  { hp: 90, atk: 40, def: 38, focus: 42, luck: 30 },
]
const CREW_SIZES = [1, 2, 3]

/** Skill bonus payload covering every modifier the unlock work touches. */
const BONUSES: Record<string, number> = {
  partyProtection: 0.3,
  rareChance: 0.25,
  salvageYield: 0.2,
  materialYield: 0.15,
  bonusLoot: 0.2,
  hiddenRoute: 0.1,
  badfailDowngrade: 0.2,
  critChance: 0.15,
  carryCapacity: 2,
}

/** Fields present in BOTH implementations — the additive comparison surface. */
function shared(r: {
  outcome: string
  score: number
  threshold: number
  damage: number
  loot: boolean
  bonusLoot: boolean
  hiddenRoute: boolean
  rareFind: boolean
}) {
  return [
    r.outcome,
    r.score.toFixed(6),
    r.threshold.toFixed(6),
    r.damage,
    r.loot,
    r.bonusLoot,
    r.hiddenRoute,
    r.rareFind,
  ].join("|")
}

export async function GET(req: Request) {
  // ?unlocks=rare_nodes,quality_harvest — proves the ON case has an effect.
  const raw = new URL(req.url).searchParams.get("unlocks")
  const unlocks = (raw ? raw.split(",").filter(Boolean) : []) as SkillUnlockId[]

  const curLines: string[] = []
  const origLines: string[] = []
  const tally = { rows: 0, loot: 0, rareFind: 0, richFind: 0, extraYield: 0, outcomes: {} as Record<string, number> }

  for (const race of RACES) {
    for (const faction of RACES) {
      const mods: RunModifiers = applySkillBonuses(getRunModifiers(race, faction), BONUSES, [], unlocks)
      const oMods = orig.applySkillBonuses(orig.getRunModifiers(race, faction), BONUSES)

      for (const type of EVENTS) {
        for (const risk of RISKS) {
          for (const crewSize of CREW_SIZES) {
            for (let si = 0; si < 4; si++) {
              for (let sq = 0; sq < SQUADS.length; sq++) {
                const squad = SQUADS[sq]
                const key = `${type}/${risk}/c${crewSize}/s${si}/q${sq}`
                // Identical seed for both impls so any divergence is real.
                const seed = si * 7919 + risk.length * 104729 + type.length * 15485863 + crewSize * 31 + sq * 613

                const r = resolveCheck({ type, squad, crewSize, risk, stageIndex: si, mods, rng: seeded(seed) })
                const o = orig.resolveCheck({
                  type,
                  squad,
                  crewSize,
                  risk,
                  stageIndex: si,
                  mods: oMods,
                  rng: seeded(seed),
                })

                curLines.push(`CHK ${key} ${shared(r)}`)
                origLines.push(`CHK ${key} ${shared(o)}`)

                tally.rows++
                if (r.loot) tally.loot++
                if (r.rareFind) tally.rareFind++
                if (r.richFind) tally.richFind++
                if (r.extraYield) tally.extraYield++
                tally.outcomes[r.outcome] = (tally.outcomes[r.outcome] ?? 0) + 1

                const p = planBattle(r.outcome, risk, si, mods, seeded(seed + 1337))
                const op = orig.planBattle(o.outcome, risk, si, oMods, seeded(seed + 1337))
                curLines.push(`PLAN ${key} ${JSON.stringify(p)}`)
                origLines.push(`PLAN ${key} ${JSON.stringify(op)}`)
              }
            }
          }
        }
      }
    }
  }

  // Compare current vs pristine, reporting the first few real divergences.
  const mismatches: string[] = []
  for (let i = 0; i < curLines.length; i++) {
    if (curLines[i] !== origLines[i]) {
      if (mismatches.length < 6) mismatches.push(`  cur:  ${curLines[i]}\n  orig: ${origLines[i]}`)
    }
  }
  const total = mismatches.length === 0 ? 0 : curLines.reduce((n, l, i) => n + (l !== origLines[i] ? 1 : 0), 0)

  const h = (l: string[]) => createHash("sha256").update(l.join("\n")).digest("hex").slice(0, 16)
  const body = [
    `unlocks=${unlocks.length ? unlocks.join(",") : "(none)"}`,
    `rows=${tally.rows}  comparedLines=${curLines.length}`,
    `outcomes=${JSON.stringify(tally.outcomes)}`,
    `loot=${tally.loot}  rareFind=${tally.rareFind}  richFind=${tally.richFind}  extraYield=${tally.extraYield}`,
    `curHash=${h(curLines)}  origHash=${h(origLines)}`,
    `divergentLines=${total}`,
    total === 0 ? "MATCH: current sim identical to pristine sim" : "DIVERGED:\n" + mismatches.join("\n"),
  ].join("\n")

  return new Response(body + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } })
}
