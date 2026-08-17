// Throwaway verification of the bait maths. Mirrors pickFish + the Focus
// window so we can assert distributions without booting the app.
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
const BAIT = {
  bait_grubs: { tier: 1, pull: 0, attracts: ["fish_silverfin"], attractMult: 1.4, junkMult: 1 },
  bait_dough: { tier: 2, pull: 0.05, attracts: ["fish_silverfin", "fish_glasscarp"], attractMult: 1.5, junkMult: 0.8 },
  bait_glowlure: { tier: 3, pull: 0.12, attracts: ["fish_glasscarp", "fish_voltray"], attractMult: 1.7, junkMult: 0.6 },
  bait_voltchum: { tier: 4, pull: 0.2, attracts: ["fish_voltray", "fish_echo_eel"], attractMult: 1.8, junkMult: 0.45 },
  bait_voidchum: { tier: 5, pull: 0.3, attracts: ["fish_goldrelay", "fish_prism_leviathan"], attractMult: 2, junkMult: 0.3 },
}
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

  // Invariant 2: a bait must actually deliver on what it advertises — every
  // fish it lists in `attracts` and that exists here gets a bigger share.
  for (const [bn, b] of Object.entries(BAIT)) {
    for (const target of b.attracts) {
      if (!spot.pool.includes(target)) continue
      check(rows[bn][target] > none[target], `${spotName}/${bn}: should raise its target ${target}`)
    }
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
