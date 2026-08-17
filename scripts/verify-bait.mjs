// Verification of the bait maths. Mirrors pickFish + the Focus window so we can
// assert distributions without booting the app, but reads the bait table itself
// out of config/bait.ts so the two cannot drift apart.
import { readFileSync } from "node:fs"
const FISH = {
  fish_silverfin: { rarity: "common", weight: 40, biteWindow: 1.6 },
  fish_glasscarp: { rarity: "uncommon", weight: 24, biteWindow: 1.3 },
  fish_voltray: { rarity: "rare", weight: 14, biteWindow: 1.0 },
  fish_echo_eel: { rarity: "epic", weight: 7, biteWindow: 0.85 },
  fish_goldrelay: { rarity: "legendary", weight: 3, biteWindow: 0.7 },
  fish_prism_leviathan: { rarity: "mythic", weight: 1, biteWindow: 0.55 },
}
const SPOTS = {
  relay_shallows: { pool: ["fish_silverfin", "fish_glasscarp", "fish_voltray"], junkChance: 0.22 },
  drift_channel: { pool: ["fish_glasscarp", "fish_voltray", "fish_echo_eel", "fish_goldrelay"], junkChance: 0.12 },
  sunken_wreck: { pool: ["fish_voltray", "fish_echo_eel", "fish_goldrelay", "fish_prism_leviathan"], junkChance: 0.08 },
}
// Parsed out of the real config rather than mirrored here. A hardcoded copy
// silently goes stale the moment the table is retuned, which is exactly how a
// test starts asserting the old design instead of the current one.
const baitSrc = readFileSync(new URL("../config/bait.ts", import.meta.url), "utf8")
const BAIT = Object.fromEntries(
  [...baitSrc.matchAll(/\{\s*id: "(bait_[a-z]+)",[\s\S]*?junkMult: ([\d.]+),/g)].map((m) => {
    const block = m[0]
    const num = (k) => Number(block.match(new RegExp(`${k}: ([\\d.]+)`))[1])
    return [
      m[1],
      {
        tier: num("tier"),
        pull: num("pull"),
        attracts: [...block.matchAll(/"(fish_[a-z_]+)"/g)].map((f) => f[1]),
        attractMult: num("attractMult"),
        junkMult: Number(m[2]),
      },
    ]
  }),
)
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]

function pickFish(spot, luck, rng, bait) {
  const pool = spot.pool.map((id) => ({ id, ...FISH[id] }))
  const flatten = Math.max(0.2, 1 - luck - (bait?.pull ?? 0))
  const weights = pool.map((f) => {
    const w = f.weight ** flatten
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

const N = 120_000
function dist(spot, bait, luck = 0) {
  const c = {}
  for (let i = 0; i < N; i++) {
    const f = pickFish(spot, luck, Math.random, bait)
    c[f.id] = (c[f.id] ?? 0) + 1
  }
  const out = {}
  for (const id of spot.pool) out[id] = (100 * (c[id] ?? 0)) / N
  return out
}

let failures = 0
const check = (cond, msg) => {
  if (!cond) {
    failures++
    console.log("  FAIL:", msg)
  }
}

// ---- Distribution matrix ----
for (const [spotName, spot] of Object.entries(SPOTS)) {
  console.log(`\n[v0] ${spotName} (%), Luck 0`)
  const none = dist(spot, undefined)
  const header = ["none", ...Object.keys(BAIT).map((b) => b.replace("bait_", ""))]
  console.log("  " + "fish".padEnd(21) + header.map((h) => h.padStart(9)).join(""))
  const rows = { none }
  for (const [bn, b] of Object.entries(BAIT)) rows[bn] = dist(spot, b)
  for (const id of spot.pool) {
    const cells = ["none", ...Object.keys(BAIT)].map((k) => rows[k][id].toFixed(2).padStart(9))
    console.log("  " + id.padEnd(21) + cells.join(""))
  }

  // Invariant 1: the rarity ladder inside the pool is never fully inverted —
  // the single rarest fish in the pool must stay the rarest outcome.
  const byRarity = [...spot.pool].sort(
    (a, b) => RARITY_ORDER.indexOf(FISH[a].rarity) - RARITY_ORDER.indexOf(FISH[b].rarity),
  )
  const rarest = byRarity[byRarity.length - 1]
  const commonest = byRarity[0]
  for (const [bn, row] of Object.entries(rows)) {
    check(row[rarest] < row[commonest], `${spotName}/${bn}: rarest (${rarest}) must stay below commonest (${commonest})`)
  }

  // Invariant 2: a bait must deliver on what it advertises, measured as the
  // combined share of the fish it targets. Asserting each target individually
  // would be wrong: `pull` deliberately drains share from the commonest fish in
  // the pool, so a bait that targets both a common and a rare fish can lift the
  // pair while still (correctly) lowering the common one.
  for (const [bn, b] of Object.entries(BAIT)) {
    const present = b.attracts.filter((t) => spot.pool.includes(t))
    if (present.length === 0) continue
    const sum = (row) => present.reduce((a, t) => a + row[t], 0)
    check(
      sum(rows[bn]) > sum(none),
      `${spotName}/${bn}: must raise combined share of its targets (${present.join("+")})`,
    )
  }


}

// Invariant 2b: the ladder invariant documented in config/bait.ts. A tier 3+
// bait must beat a bare hook at moving catches OFF the commonest fish in the
// deep pool. That is the real failure mode: attractMult inflating a common fish
// and fighting the bait's own `pull`.
//
// Deliberately measured as "everything above the commonest fish" rather than
// just the top two tiers. A narrower metric reports a false failure for bait
// that targets the epic tier — lifting Echo Eel necessarily dilutes the
// legendary/mythic slice while still being a clear upgrade over no bait.
{
  const deep = SPOTS.sunken_wreck
  const commonestDeep = "fish_voltray"
  const aboveCommon = (row) =>
    deep.pool.filter((id) => id !== commonestDeep).reduce((a, id) => a + row[id], 0)
  const bare = aboveCommon(dist(deep, undefined))
  console.log("\n[v0] wreck: share better than %s — bare hook %s%%", commonestDeep, bare.toFixed(2))
  for (const [bn, b] of Object.entries(BAIT)) {
    if (b.tier < 3) continue
    const got = aboveCommon(dist(deep, b))
    console.log(`  ${bn.padEnd(16)} ${got.toFixed(2)}%`)
    check(got > bare, `${bn} (tier ${b.tier}) must beat bare hook at avoiding ${commonestDeep}`)
  }
}

// Invariant 3: Void Chum is the rare-end play at the deep spot, and beats every
// other bait there. This is the payoff for the whole crafting chain.
const wreck = SPOTS.sunken_wreck
const rareEnd = (row) => (row.fish_goldrelay ?? 0) + (row.fish_prism_leviathan ?? 0)
const wreckRows = { none: dist(wreck, undefined) }
for (const [bn, b] of Object.entries(BAIT)) wreckRows[bn] = dist(wreck, b)
console.log("\n[v0] sunken_wreck rare-end share (legendary + mythic):")
for (const [bn, row] of Object.entries(wreckRows)) {
  console.log(`  ${bn.padEnd(16)} ${rareEnd(row).toFixed(2)}%`)
}
for (const bn of Object.keys(BAIT)) {
  if (bn === "bait_voidchum") continue
  check(
    rareEnd(wreckRows.bait_voidchum) > rareEnd(wreckRows[bn]),
    `void chum must beat ${bn} on the wreck rare-end`,
  )
}

// Invariant 4: mid-tier bait is the right tool for its OWN water, so the best
// tier is not just automatically correct everywhere.
const shallows = SPOTS.relay_shallows
const sGlow = dist(shallows, BAIT.bait_glowlure)
const sVoid = dist(shallows, BAIT.bait_voidchum)
console.log(
  "\n[v0] relay_shallows Glass Carp: glowlure=%s%% voidchum=%s%%",
  sGlow.fish_glasscarp.toFixed(2),
  sVoid.fish_glasscarp.toFixed(2),
)
check(
  sGlow.fish_glasscarp > sVoid.fish_glasscarp,
  "glowlure should beat void chum for Glass Carp specifically (targeting must matter)",
)

// ---- Junk ----
console.log("\n[v0] junk chance at sunken_wreck (base 8%):")
for (const [bn, b] of Object.entries(BAIT)) {
  console.log(`  ${bn.padEnd(16)} ${(wreck.junkChance * b.junkMult * 100).toFixed(1)}%`)
}
check(wreck.junkChance * BAIT.bait_voidchum.junkMult < wreck.junkChance, "junkMult must reduce junk")

// ---- Hidden Focus window ----
const win = (biteWindow, success, focus) =>
  Math.round(biteWindow * 1000 * (1 + success) * (1 + Math.min(0.5, focus * 0.02)))
console.log("\n[v0] Echo Eel window ms @ success 0:")
for (const f of [0, 5, 15, 25, 40, 60]) console.log(`  FOC ${String(f).padStart(2)}  ${win(0.85, 0, f)}ms`)
check(win(0.85, 0, 25) > win(0.85, 0, 5), "higher Focus must widen the window")
check(win(0.85, 0, 60) === win(0.85, 0, 25), "Focus bonus must clamp at +50%")
check(win(0.85, 0, 0) === 850, "FOC 0 must leave the base window untouched")

// ---- Luck must still compose with bait rather than be swamped ----
const wLow = dist(wreck, BAIT.bait_voidchum, 0)
const wHigh = dist(wreck, BAIT.bait_voidchum, 0.4)
console.log("\n[v0] void chum rare-end: luck 0 = %s%%, luck 0.4 = %s%%", rareEnd(wLow).toFixed(2), rareEnd(wHigh).toFixed(2))
check(rareEnd(wHigh) > rareEnd(wLow), "Luck must still add on top of bait")

console.log(failures === 0 ? "\n[v0] all invariants passed" : `\n[v0] ${failures} invariant(s) FAILED`)
process.exit(failures === 0 ? 0 : 1)
