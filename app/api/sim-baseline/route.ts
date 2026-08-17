import { createHash } from "node:crypto"
import {
  applySkillBonuses,
  getRunModifiers,
  planBattle,
  resolveCheck,
  type ExpEventType,
  type RunModifiers,
} from "@/lib/expedition-sim"
import type { BaseStats, RaceId } from "@/lib/types"

/**
 * TEMPORARY verification route (deleted before hand-off).
 *
 * Produces a deterministic fingerprint of the expedition simulation so the
 * "additive only" guarantee can be proven: with every skill unlock OFF, the
 * output of this route must be byte-identical before and after the unlock work.
 * Uses a seeded PRNG so there is no Math.random noise.
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
const RACES: Array<RaceId | undefined> = [undefined, "crownborn", "hearthkin", "gloamwhisper", "roadsinger"]

const SQUAD: BaseStats = { hp: 30, atk: 7, def: 6, focus: 6, luck: 4 }

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

export async function GET(req: Request) {
  const lines: string[] = []
  // ?unlocks=rare_nodes,quality_harvest — proves the ON case has an effect.
  const raw = new URL(req.url).searchParams.get("unlocks")
  const unlocks = (raw ? raw.split(",").filter(Boolean) : []) as SkillUnlockId[]

  for (const race of RACES) {
    for (const faction of RACES) {
      const base = getRunModifiers(race, faction)
      const mods: RunModifiers = applySkillBonuses(base, BONUSES, [], unlocks)
      // Record the modifier block itself: any retune would change this.
      lines.push(
        `MODS ${race ?? "-"}/${faction ?? "-"} ` +
          JSON.stringify({ ...mods, passives: mods.passives.map((p) => p.name) }),
      )

      for (const type of EVENTS) {
        for (const risk of RISKS) {
          for (let stage = 0; stage < 4; stage++) {
            // Fresh seed per case so one extra rng() draw cannot be masked.
            const rng = seeded(stage * 7919 + risk.length * 104729 + type.length * 15485863)
            const r = resolveCheck({ type, squad: SQUAD, crewSize: 3, risk, stageIndex: stage, mods, rng })
            lines.push(
              `CHK ${type}/${risk}/${stage} ` +
                [
                  r.outcome,
                  r.score.toFixed(6),
                  r.threshold.toFixed(6),
                  r.damage,
                  r.loot,
                  r.bonusLoot,
                  r.hiddenRoute,
                  r.rareFind,
                  r.richFind,
                  r.extraYield,
                ].join("|"),
            )
            // planBattle consumes the rng too, so fingerprint it as well.
            const plan = planBattle(r.outcome, risk, stage, mods, seeded(stage + 1337))
            lines.push(`PLAN ${type}/${risk}/${stage} ` + JSON.stringify(plan))
          }
        }
      }
    }
  }

  const body = lines.join("\n")
  const hash = createHash("sha256").update(body).digest("hex")
  return new Response(`${hash}\ncases=${lines.length}\n${body}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}
