/**
 * Cross-checks the four places a cosmetic must be declared consistently:
 *
 *   1. lib/avatar-generator.ts  - the art (accVariant/hatVariant branches)
 *   2. lib/avatar-generator.ts  - LAYER_VARIANTS counts (must cover every branch)
 *   3. lib/mock-data.ts         - VANITY_ITEMS (label + variant + rarity)
 *   4. store/use-esro-store.ts  - devtools labels[] and the reward drop pool
 *
 * Every one of these is a silent-failure surface: a cosmetic missing from the
 * drop pool is simply unobtainable, a label array that is too short renders
 * `undefined` in devtools, and a LAYER_VARIANTS count that is too low makes the
 * art unreachable. None of these produce a type error.
 */
import * as fs from "node:fs"
import { LAYER_VARIANTS } from "../lib/avatar-generator"
import { vanityItems as VANITY_ITEMS } from "../lib/mock-data"

const genSrc = fs.readFileSync("lib/avatar-generator.ts", "utf8")
const storeSrc = fs.readFileSync("store/use-esro-store.ts", "utf8")

let problems = 0
const fail = (m: string) => {
  console.log("  FAIL " + m)
  problems++
}

// ---- 1. which variants does the generator actually draw? --------------------
const drawn: Record<"accessory" | "hat", Set<number>> = { accessory: new Set(), hat: new Set() }
for (const m of genSrc.matchAll(/accVariant === (\d+)/g)) drawn.accessory.add(Number(m[1]))
for (const m of genSrc.matchAll(/hatVariant === (\d+)/g)) drawn.hat.add(Number(m[1]))

console.log("Generator branches:")
for (const layer of ["accessory", "hat"] as const) {
  const list = [...drawn[layer]].sort((a, b) => a - b)
  console.log(`  ${layer}: ${list.length} variants, max ${Math.max(...list)}`)
}

// ---- 2. LAYER_VARIANTS must cover every drawn branch ------------------------
console.log("\nLAYER_VARIANTS coverage:")
for (const layer of ["accessory", "hat"] as const) {
  const max = Math.max(...drawn[layer])
  const count = (LAYER_VARIANTS as Record<string, number>)[layer]
  if (count <= max) fail(`${layer}: LAYER_VARIANTS=${count} but variant ${max} is drawn (needs >= ${max + 1})`)
  else console.log(`  ok ${layer}: ${count} covers max drawn variant ${max}`)
}

// ---- 3. VANITY_ITEMS must point at art that exists -------------------------
console.log("\nVANITY_ITEMS -> art:")
const vanity = VANITY_ITEMS.filter((v) => v.layerType === "accessory" || v.layerType === "hat")
for (const v of vanity) {
  if (v.variant === 0) continue
  if (!drawn[v.layerType as "accessory" | "hat"].has(v.variant))
    fail(`"${v.label}" (${v.layerType} v${v.variant}) has no branch in the generator`)
}
console.log(`  checked ${vanity.length} accessory/hat entries`)

// duplicate ids / duplicate (layer,variant) pairs
const seenId = new Map<string, string>()
const seenSlot = new Map<string, string>()
for (const v of VANITY_ITEMS) {
  if (seenId.has(v.id)) fail(`duplicate vanity id ${v.id}: "${v.label}" and "${seenId.get(v.id)}"`)
  seenId.set(v.id, v.label)
  const slot = `${v.layerType}:${v.variant}`
  if (v.variant !== 0 && seenSlot.has(slot))
    fail(`duplicate slot ${slot}: "${v.label}" and "${seenSlot.get(slot)}"`)
  seenSlot.set(slot, v.label)
}

// ---- 4. devtools label arrays must be long enough and match VANITY_ITEMS ----
console.log("\nDevtools labels:")
function labelsFor(layer: "accessory" | "hat"): string[] {
  const re = new RegExp(`\\{ type: "${layer}", maxVariants: (\\d+)[^\\n]*labels: \\[([^\\]]*)\\]`)
  const m = storeSrc.match(re)
  if (!m) {
    fail(`could not locate devtools entry for ${layer}`)
    return []
  }
  const maxVariants = Number(m[1])
  const labels = [...m[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1].replace(/\\"/g, '"'))
  if (labels.length !== maxVariants)
    fail(`${layer}: maxVariants=${maxVariants} but ${labels.length} labels (must match)`)
  const maxDrawn = Math.max(...drawn[layer])
  if (labels.length <= maxDrawn)
    fail(`${layer}: only ${labels.length} labels but variant ${maxDrawn} is drawn -> undefined label`)
  else console.log(`  ok ${layer}: ${labels.length} labels cover max drawn ${maxDrawn}`)
  return labels
}
const labels = { accessory: labelsFor("accessory"), hat: labelsFor("hat") }

// A vanity label should match the devtools label at the same index. The original
// low variants have long-standing naming drift ("Glasses" vs "Signal Glasses")
// that predates this change, so those are reported as warnings; drift in the
// Tidal Set range is a real error since those labels were written together.
const TIDAL_START = { accessory: 22, hat: 24 } as const
const drift: string[] = []
for (const v of vanity) {
  const layer = v.layerType as "accessory" | "hat"
  const at = labels[layer][v.variant]
  if (!at || at === v.label) continue
  const msg = `${layer} v${v.variant}: VANITY_ITEMS "${v.label}" vs devtools "${at}"`
  if (v.variant >= TIDAL_START[layer]) fail("label mismatch " + msg)
  else drift.push(msg)
}
if (drift.length) {
  console.log(`  note: ${drift.length} pre-existing label drift(s) outside the Tidal Set (not introduced here):`)
  for (const d of drift) console.log(`    - ${d}`)
}

// ---- 5. every new cosmetic must be obtainable from the drop pool -----------
console.log("\nDrop pool reachability:")
const poolMatch = storeSrc.match(/const POOL: Record<Rarity, PoolItem\[\]> = \{([\s\S]*?)\n\}/)
if (!poolMatch) fail("could not locate the POOL drop table")
const poolSrc = poolMatch?.[1] ?? ""
const pooled = new Map<string, string>() // "layer:variant" -> tier
for (const tierMatch of poolSrc.matchAll(/^\s{2}(\w+):\s*\[([\s\S]*?)^\s{2}\],/gm)) {
  const tier = tierMatch[1]
  for (const e of tierMatch[2].matchAll(/layerType: "(\w+)", variant: (\d+)/g))
    pooled.set(`${e[1]}:${e[2]}`, tier)
}

// Check the Tidal Set specifically: each piece must drop from its own rarity tier.
const TIDAL = [
  ["accessory", 22, "common"], ["accessory", 23, "uncommon"], ["accessory", 24, "rare"],
  ["accessory", 25, "epic"], ["accessory", 26, "legendary"], ["accessory", 27, "mythic"],
  ["hat", 24, "common"], ["hat", 25, "uncommon"], ["hat", 26, "rare"],
  ["hat", 27, "epic"], ["hat", 28, "legendary"], ["hat", 29, "mythic"],
] as const
for (const [layer, variant, wantTier] of TIDAL) {
  const slot = `${layer}:${variant}`
  const gotTier = pooled.get(slot)
  const item = vanity.find((v) => v.layerType === layer && v.variant === variant)
  if (!item) {
    fail(`${slot} missing from VANITY_ITEMS`)
    continue
  }
  if (!gotTier) fail(`"${item.label}" (${slot}) is not in any drop tier -> unobtainable`)
  else if (gotTier !== wantTier)
    fail(`"${item.label}" drops from ${gotTier} but its rarity is ${wantTier}`)
  if (item.rarity !== wantTier)
    fail(`"${item.label}" VANITY_ITEMS rarity=${item.rarity}, expected ${wantTier}`)
}
console.log(`  checked ${TIDAL.length} Tidal Set pieces against drop tiers + rarities`)

// Rarity ladder sanity: all six tiers represented exactly once per layer.
for (const layer of ["accessory", "hat"] as const) {
  const tiers = TIDAL.filter((t) => t[0] === layer).map((t) => t[2])
  if (new Set(tiers).size !== 6) fail(`${layer}: Tidal Set does not span all six rarities`)
}

console.log(
  problems === 0
    ? "\nALL CONSISTENT - art, counts, vanity items, devtools labels and drop pool agree"
    : `\n${problems} PROBLEM(S)`,
)
process.exit(problems === 0 ? 0 : 1)
