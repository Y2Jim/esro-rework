/**
 * Balance harness for the derived-stat weighting change.
 *
 * Sweeps the same squad/risk/stage/crew matrix the sim actually uses and
 * reports outcome distributions, so the new primary/secondary curve can be
 * tuned against measured pass rates instead of guesswork.
 *
 * Run: node scripts/tune-derived.mjs
 */

const RISK_BASE = { Low: 6, Medium: 9, High: 13 }
const EVENT_CHECK = {
  battle: { primary: "atk", secondary: "def" },
  hazard: { primary: "def", secondary: "focus" },
  discovery: { primary: "focus", secondary: "luck" },
  travel: { primary: "luck", secondary: "focus" },
}

const SQUADS = [
  { hp: 30, atk: 7, def: 6, focus: 6, luck: 4 },
  { hp: 40, atk: 14, def: 13, focus: 14, luck: 10 },
  { hp: 60, atk: 26, def: 24, focus: 26, luck: 18 },
  { hp: 90, atk: 40, def: 38, focus: 42, luck: 30 },
]
const RISKS = ["Low", "Medium", "High"]
const CREW = [1, 2, 3]
const TYPES = Object.keys(EVENT_CHECK)

function seeded(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Old: secondary at flat half weight. */
function scoreOld(squad, check) {
  return squad[check.primary] + squad[check.secondary] * 0.5
}

/** New: primary weighted, secondary on a diminishing curve. */
function scoreNew(squad, check, K, primaryWeight, scale = 1) {
  const sec = squad[check.secondary] / scale
  return squad[check.primary] * primaryWeight + 0.5 * K * Math.log1p(sec / K)
}

function outcomeOf(score, threshold) {
  const margin = score - threshold
  if (margin >= threshold * 0.3) return "crit"
  if (margin >= 0) return "success"
  if (margin >= -threshold * 0.3) return "fail"
  return "badfail"
}

function sweep(scoreFn) {
  const tally = { crit: 0, success: 0, fail: 0, badfail: 0 }
  let n = 0
  for (const type of TYPES) {
    const check = EVENT_CHECK[type]
    for (const risk of RISKS) {
      for (const crewSize of CREW) {
        for (let si = 0; si < 4; si++) {
          for (const squad of SQUADS) {
            // Average over many rolls so the luck variance term is smoothed.
            for (let r = 0; r < 400; r++) {
              const rng = seeded(si * 7919 + risk.length * 104729 + crewSize * 31 + r * 613)
              let score = scoreFn(squad, check)
              score += rng() * (squad.luck * 0.2 + 2)
              const threshold = Math.max(1, (RISK_BASE[risk] + si * 1.4) * crewSize)
              tally[outcomeOf(score, threshold)]++
              n++
            }
          }
        }
      }
    }
  }
  const pct = (k) => ((tally[k] / n) * 100).toFixed(1)
  return { pass: (((tally.crit + tally.success) / n) * 100).toFixed(1), crit: pct("crit"), badfail: pct("badfail") }
}

const base = sweep((s, c) => scoreOld(s, c))
console.log("baseline (secondary flat x0.5):", base)
console.log()

// Sweep K and primaryWeight to find a pairing that preserves the pass rate.
console.log("K     pw     pass%  crit%  badfail%   (baseline pass " + base.pass + ")")
for (const K of [10, 15, 20, 30, 40]) {
  for (const pw of [1.0, 1.1, 1.15, 1.2, 1.25, 1.3]) {
    const r = sweep((s, c) => scoreNew(s, c, K, pw))
    const delta = (Number(r.pass) - Number(base.pass)).toFixed(1)
    const flag = Math.abs(Number(delta)) <= 1.0 ? "  <== close" : ""
    console.log(
      `${String(K).padEnd(5)} ${String(pw).padEnd(6)} ${r.pass.padStart(5)} ${r.crit.padStart(6)} ${r.badfail.padStart(8)}   d=${delta}${flag}`,
    )
  }
}

// Show the marginal-rate story: how much a point of secondary is worth as it grows.
console.log("\nsecondary marginal value per point (K=20, should fall from 0.5):")
const K = 20
for (const v of [0, 5, 10, 20, 40, 80]) {
  const marginal = 0.5 * K * Math.log1p((v + 1) / K) - 0.5 * K * Math.log1p(v / K)
  console.log(`  at ${String(v).padStart(3)}: ${marginal.toFixed(3)}  (ratio primary:secondary = ${(1 / marginal).toFixed(1)}x)`)
}

// HP-as-secondary magnitude check for the Endurance rework.
console.log("\nEndurance (def primary, hp secondary) scale check:")
for (const scale of [1, 2, 3, 4]) {
  const vals = SQUADS.map((s) => (0.5 * K * Math.log1p(s.hp / scale / K)).toFixed(1))
  console.log(`  scale ${scale}: hp contribution across squads = ${vals.join(", ")}  (def = ${SQUADS.map((s) => s.def).join(", ")})`)
}
