import { renderAvatarPixels } from "../lib/avatar-generator"
import { CANDIDATES } from "./cosmetic-preview.mts"
import type { AvatarConfig, AvatarLayerType } from "../lib/types"

const GRID = 14
const HEADS = [0, 1, 2]
const HAIRS = [0, 4]
function cfg(head: number, hair: number, layer: AvatarLayerType, v: number): AvatarConfig {
  return { seed: "harness", layers: [
    { type: "base", variant: head }, { type: "skin", variant: 1 },
    { type: "eyes", variant: 0, color: 0 }, { type: "hair", variant: hair, color: 0 },
    { type: "accessory", variant: layer === "accessory" ? v : 0 },
    { type: "hat", variant: layer === "hat" ? v : 0 },
    { type: "flair", variant: 0 } ] }
}
// Shipped variant numbers, in the same order as CANDIDATES
const IDS: Record<string, number> = {
  tide_goggles: 22, ashfall_veil: 23, currentweave_mask: 24,
  stormglass_lens: 25, leviathans_regard: 26, tidecallers_visage: 27,
  reed_hat: 24, lantern_rig: 25, deepline_coil: 26,
  stormglass_crown: 27, kelpwarden_wreath: 28, abyssal_diadem: 29,
}
let bad = 0
for (const c of CANDIDATES) {
  const v = IDS[c.id]
  for (const head of HEADS) for (const hair of HAIRS) {
    const base = renderAvatarPixels(cfg(head, hair, c.layer, 0))
    const expected = base.map((r) => [...r])
    c.draw(expected)
    const actual = renderAvatarPixels(cfg(head, hair, c.layer, v))
    const diffs: string[] = []
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++)
      if (expected[y][x] !== actual[y][x]) diffs.push(`(${x},${y}) want ${expected[y][x]} got ${actual[y][x]}`)
    if (diffs.length) { bad++; console.log(`MISMATCH ${c.label} v${v} head${head} hair${hair}: ${diffs.slice(0,4).join("  ")}${diffs.length>4?` +${diffs.length-4}`:""}`) }
  }
}
console.log(bad === 0 ? `\nAll ${CANDIDATES.length} shipped cosmetics render pixel-identical to their verified designs.` : `\n${bad} mismatched render(s)`)
