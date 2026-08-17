/**
 * Cosmetic design harness.
 *
 * Renders candidate head cosmetics against ALL THREE head shapes (round /
 * square / oval) using the real `renderAvatarPixels` for the underlying head,
 * so there is no duplicated head-drawing logic to drift.
 *
 * Outputs:
 *   - ASCII art + per-candidate check results to stdout
 *   - a colour PNG contact sheet to /tmp/agent-browser/cosmetics-<tag>.png
 *
 * Usage:
 *   npx tsx scripts/cosmetic-preview.mts masks
 *   npx tsx scripts/cosmetic-preview.mts candidates
 *   npx tsx scripts/cosmetic-preview.mts existing accessory 14,18,19
 */

import zlib from "node:zlib"
import fs from "node:fs"
import path from "node:path"
import { renderAvatarPixels, SKIN_COLORS } from "../lib/avatar-generator"
import type { AvatarConfig, AvatarLayerType } from "../lib/types"

const GRID = 14
const HEADS = [
  { variant: 0, name: "round" },
  { variant: 1, name: "square" },
  { variant: 2, name: "oval" },
]
// Bald keeps the head silhouette unobstructed; Long (4) is the bulkiest hair and
// the worst case for a hat overlapping hair.
const HAIRS = [
  { variant: 0, name: "bald" },
  { variant: 4, name: "long" },
]

const SKIN_VARIANT = 1
const HAIR_COLOR = 0

type Grid = string[][]

function config(head: number, hair: number, layer: AvatarLayerType, variant: number): AvatarConfig {
  const layers = [
    { type: "base" as const, variant: head },
    { type: "skin" as const, variant: SKIN_VARIANT },
    { type: "eyes" as const, variant: 0, color: 0 },
    { type: "hair" as const, variant: hair, color: HAIR_COLOR },
    { type: "accessory" as const, variant: layer === "accessory" ? variant : 0 },
    { type: "hat" as const, variant: layer === "hat" ? variant : 0 },
    { type: "flair" as const, variant: 0 },
  ]
  return { seed: "harness", layers }
}

function render(head: number, hair: number, layer: AvatarLayerType, variant: number): Grid {
  return renderAvatarPixels(config(head, hair, layer, variant))
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => [...row])
}

// ---------------------------------------------------------------------------
// Candidate draw functions. These operate on the same 14x14 grid and use the
// same setPixel contract as lib/avatar-generator.ts, so a verified function can
// be moved into the generator verbatim.
// ---------------------------------------------------------------------------

function setPixel(grid: Grid, x: number, y: number, color: string) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = color
  }
}

/** Records any draw that fell outside the grid, which setPixel silently drops. */
let clipped: string[] = []
function px(grid: Grid, x: number, y: number, color: string) {
  if (y < 0 || y >= GRID || x < 0 || x >= GRID) clipped.push(`(${x},${y})`)
  setPixel(grid, x, y, color)
}

interface Candidate {
  id: string
  label: string
  layer: "accessory" | "hat"
  rarity: string
  /** "rest" must touch the skull on every head shape; "float" may hover. */
  anchor: "rest" | "float"
  /** Rows that must be fully sealed (no skin peeking) on every head shape. */
  sealRows?: number[]
  draw: (g: Grid) => void
}

function hline(g: Grid, x0: number, x1: number, y: number, color: string) {
  for (let x = x0; x <= x1; x++) px(g, x, y, color)
}

/**
 * Head-shape budget (from `masks`), inclusive x extents:
 *   row 1: oval only 4-9            row 6: round/oval 2-11, square 3-10
 *   row 2: round 6-7, others 4-9    row 7: round/oval 2-11, square 3-10
 *   row 3: round 4-9, others 3-10   row 8: round/square 3-10, oval 2-11
 *   row 4: ALL 3-10  <- safest band  row 9: ALL 3-10
 *   row 5: round/square 3-10, oval 2-11
 * Anything sitting on the face uses 3-10; anything that must fully hide the
 * face uses 2-11 so the wider oval cannot peek at the temples.
 */
const CANDIDATES: Candidate[] = [
  // ---------------------------------------------------------------- accessory
  {
    id: "tide_goggles",
    label: "Tide Goggles",
    layer: "accessory",
    rarity: "common",
    anchor: "rest",
    sealRows: [4],
    draw: (g) => {
      const frame = "#22262e"
      const glass = "#4fb3a0"
      const shine = "#9fe8d8"
      // Strap sits on row 4, the one row every head shape spans identically.
      hline(g, 3, 10, 4, frame)
      px(g, 3, 5, frame)
      px(g, 4, 5, shine)
      px(g, 5, 5, glass)
      px(g, 6, 5, frame)
      px(g, 7, 5, frame)
      px(g, 8, 5, shine)
      px(g, 9, 5, glass)
      px(g, 10, 5, frame)
    },
  },
  {
    id: "ashfall_veil",
    label: "Ashfall Veil",
    layer: "accessory",
    rarity: "uncommon",
    anchor: "rest",
    draw: (g) => {
      const cloth = "#6f6558"
      const fold = "#52483d"
      const dust = "#8d8375"
      // Ties at the temples, then cloth draping to a point off the chin.
      px(g, 3, 6, fold)
      px(g, 10, 6, fold)
      hline(g, 3, 10, 7, cloth)
      px(g, 5, 7, fold)
      px(g, 8, 7, fold)
      hline(g, 3, 10, 8, cloth)
      px(g, 4, 8, fold)
      px(g, 9, 8, fold)
      hline(g, 4, 9, 9, cloth)
      px(g, 6, 9, dust)
      px(g, 7, 9, dust)
      px(g, 6, 10, fold)
      px(g, 7, 10, fold)
    },
  },
  {
    id: "currentweave_mask",
    label: "Currentweave Mask",
    layer: "accessory",
    rarity: "rare",
    anchor: "rest",
    draw: (g) => {
      const deep = "#1f3a44"
      const weave = "#2f6b6f"
      const thread = "#55a89a"
      const crest = "#a8e6d4"
      px(g, 3, 5, deep)
      px(g, 10, 5, deep)
      hline(g, 3, 10, 6, deep)
      px(g, 5, 6, crest)
      px(g, 8, 6, crest)
      hline(g, 3, 10, 7, weave)
      px(g, 4, 7, thread)
      px(g, 6, 7, thread)
      px(g, 8, 7, thread)
      px(g, 10, 7, thread)
      hline(g, 3, 10, 8, deep)
      px(g, 5, 8, thread)
      px(g, 7, 8, thread)
      px(g, 9, 8, thread)
      hline(g, 4, 9, 9, weave)
      px(g, 5, 9, crest)
      px(g, 8, 9, crest)
      px(g, 6, 10, deep)
      px(g, 7, 10, deep)
    },
  },
  {
    id: "stormglass_lens",
    label: "Stormglass Lens",
    layer: "accessory",
    rarity: "epic",
    anchor: "rest",
    // Rows 4-6 fully sealed: an epic must out-read the rare below it, and the
    // first pass failed that — a thin brow band looked like a headband next to
    // Currentweave's full lower-face weave. This is a wraparound visor instead.
    sealRows: [4, 5, 6],
    draw: (g) => {
      const frame = "#141826"
      const glassDeep = "#1d3557"
      const glass = "#2f6ba8"
      const arc = "#8fd4ff"
      const hot = "#ffffff"
      // Brow ridge, narrow enough for round's row-3 extent (4-9).
      hline(g, 4, 9, 3, frame)
      px(g, 6, 3, arc)
      px(g, 7, 3, arc)
      // Visor body spans the union on 5-6 so the wider oval cannot peek through.
      hline(g, 3, 10, 4, frame)
      px(g, 4, 4, glassDeep)
      px(g, 9, 4, glassDeep)
      hline(g, 2, 11, 5, glassDeep)
      px(g, 2, 5, frame)
      px(g, 11, 5, frame)
      px(g, 4, 5, arc)
      px(g, 5, 5, hot)
      px(g, 6, 5, arc)
      px(g, 7, 5, arc)
      px(g, 8, 5, hot)
      px(g, 9, 5, arc)
      hline(g, 2, 11, 6, glass)
      px(g, 2, 6, frame)
      px(g, 11, 6, frame)
      px(g, 5, 6, glassDeep)
      px(g, 6, 6, arc)
      px(g, 7, 6, arc)
      px(g, 8, 6, glassDeep)
      // Chin vents hint at a sealed rig without covering the mouth.
      px(g, 3, 7, frame)
      px(g, 10, 7, frame)
    },
  },
  {
    id: "leviathans_regard",
    label: "Leviathan's Regard",
    layer: "accessory",
    rarity: "legendary",
    anchor: "rest",
    sealRows: [4],
    draw: (g) => {
      const scaleDark = "#11313a"
      const plate = "#1d5a63"
      const edge = "#37a08e"
      const glow = "#9ffff0"
      const gold = "#d8b45a"
      // Crest tip lands on row 2's intersection (x 6-7) so it seats on round too.
      px(g, 6, 2, gold)
      px(g, 7, 2, gold)
      hline(g, 4, 9, 3, plate)
      px(g, 6, 3, gold)
      px(g, 7, 3, gold)
      hline(g, 3, 10, 4, scaleDark)
      px(g, 4, 4, edge)
      px(g, 9, 4, edge)
      px(g, 3, 5, scaleDark)
      px(g, 4, 5, glow)
      px(g, 5, 5, glow)
      px(g, 6, 5, scaleDark)
      px(g, 7, 5, scaleDark)
      px(g, 8, 5, glow)
      px(g, 9, 5, glow)
      px(g, 10, 5, scaleDark)
      // Gill slits down the cheeks.
      px(g, 3, 6, edge)
      px(g, 4, 6, plate)
      px(g, 9, 6, plate)
      px(g, 10, 6, edge)
      px(g, 3, 7, edge)
      px(g, 10, 7, edge)
      px(g, 3, 8, scaleDark)
      px(g, 10, 8, scaleDark)
    },
  },
  {
    id: "tidecallers_visage",
    label: "Tidecaller's Visage",
    layer: "accessory",
    rarity: "mythic",
    anchor: "rest",
    // A full-face mask must hide the face on every head, so it spans the union.
    sealRows: [4, 5, 6, 7, 8],
    draw: (g) => {
      const abyss = "#0b2030"
      const deep = "#14415e"
      const tide = "#2b7fa8"
      const foam = "#7fd0e8"
      const crest = "#d8f6ff"
      hline(g, 5, 8, 2, crest)
      hline(g, 4, 9, 3, deep)
      px(g, 6, 3, crest)
      px(g, 7, 3, crest)
      hline(g, 3, 10, 4, abyss)
      px(g, 4, 4, tide)
      px(g, 9, 4, tide)
      hline(g, 2, 11, 5, deep)
      px(g, 2, 5, tide)
      px(g, 11, 5, tide)
      px(g, 4, 5, foam)
      px(g, 5, 5, foam)
      px(g, 6, 5, abyss)
      px(g, 7, 5, abyss)
      px(g, 8, 5, foam)
      px(g, 9, 5, foam)
      hline(g, 2, 11, 6, tide)
      px(g, 5, 6, crest)
      px(g, 8, 6, crest)
      px(g, 6, 6, deep)
      px(g, 7, 6, deep)
      hline(g, 2, 11, 7, deep)
      px(g, 4, 7, foam)
      px(g, 9, 7, foam)
      hline(g, 2, 11, 8, tide)
      px(g, 2, 8, deep)
      px(g, 11, 8, deep)
      hline(g, 5, 8, 8, abyss)
      hline(g, 3, 10, 9, deep)
      px(g, 6, 9, foam)
      px(g, 7, 9, foam)
      px(g, 6, 10, tide)
      px(g, 7, 10, tide)
    },
  },
  // --------------------------------------------------------------------- hats
  {
    id: "reed_hat",
    label: "Reed Hat",
    layer: "hat",
    rarity: "common",
    anchor: "rest",
    draw: (g) => {
      const reed = "#b8975a"
      const reedDark = "#8a6f3f"
      px(g, 6, 0, reedDark)
      px(g, 7, 0, reedDark)
      hline(g, 5, 8, 1, reed)
      hline(g, 3, 10, 2, reed)
      px(g, 3, 2, reedDark)
      px(g, 10, 2, reedDark)
    },
  },
  {
    id: "lantern_rig",
    label: "Lantern Rig",
    layer: "hat",
    rarity: "uncommon",
    anchor: "rest",
    draw: (g) => {
      const strap = "#3a3f4a"
      const metal = "#7b8290"
      const metalHi = "#aab2c0"
      const bulb = "#ffc861"
      const glow = "#fff4d0"
      // Headband.
      hline(g, 4, 9, 1, strap)
      hline(g, 4, 9, 2, strap)
      px(g, 4, 2, metal)
      px(g, 9, 2, metal)
      // Lantern housing, offset to one side so it reads as a mounted lamp rather
      // than a symmetrical band. The bulb is 2x2 with a highlight: the first pass
      // used single pixels and the lantern — the whole concept — vanished at 28px.
      px(g, 5, 0, metal)
      px(g, 6, 0, metalHi)
      px(g, 5, 1, metalHi)
      px(g, 6, 1, glow)
      px(g, 5, 2, bulb)
      px(g, 6, 2, glow)
      px(g, 5, 3, bulb)
      px(g, 6, 3, bulb)
    },
  },
  {
    id: "deepline_coil",
    label: "Deepline Coil",
    layer: "hat",
    rarity: "rare",
    anchor: "rest",
    draw: (g) => {
      const copper = "#b0713a"
      const copperHi = "#e0a566"
      const line = "#cfc6b0"
      const hook = "#9aa5b0"
      px(g, 6, 0, copperHi)
      px(g, 7, 0, copperHi)
      hline(g, 4, 9, 1, copper)
      px(g, 5, 1, copperHi)
      px(g, 8, 1, copperHi)
      hline(g, 4, 9, 2, copper)
      px(g, 6, 2, line)
      px(g, 7, 2, line)
      px(g, 3, 3, hook)
      px(g, 10, 3, hook)
    },
  },
  {
    id: "stormglass_crown",
    label: "Stormglass Crown",
    layer: "hat",
    rarity: "epic",
    anchor: "rest",
    draw: (g) => {
      const glassDark = "#23324f"
      const glass = "#3f6ea8"
      const arc = "#a8dcff"
      const hot = "#ffffff"
      // Gapped spires give a jagged silhouette instead of a solid slab.
      px(g, 3, 0, glass)
      px(g, 5, 0, arc)
      px(g, 7, 0, hot)
      px(g, 9, 0, arc)
      px(g, 10, 0, glass)
      hline(g, 3, 10, 1, glassDark)
      px(g, 5, 1, glass)
      px(g, 8, 1, glass)
      hline(g, 4, 9, 2, glass)
      px(g, 6, 2, hot)
      px(g, 7, 2, hot)
    },
  },
  {
    id: "kelpwarden_wreath",
    label: "Kelpwarden Wreath",
    layer: "hat",
    rarity: "legendary",
    anchor: "rest",
    draw: (g) => {
      const kelpDark = "#1f4a33"
      const kelp = "#327a4f"
      const kelpLight = "#5fb87a"
      const amber = "#e8a13c"
      const amberHi = "#ffd98a"
      px(g, 4, 0, kelp)
      px(g, 5, 0, kelpLight)
      px(g, 6, 0, kelpDark)
      px(g, 7, 0, kelpDark)
      px(g, 8, 0, kelpLight)
      px(g, 9, 0, kelp)
      hline(g, 3, 10, 1, kelp)
      px(g, 4, 1, kelpDark)
      px(g, 9, 1, kelpDark)
      px(g, 6, 1, kelpLight)
      px(g, 7, 1, kelpLight)
      hline(g, 4, 9, 2, kelpDark)
      px(g, 5, 2, kelp)
      px(g, 8, 2, kelp)
      px(g, 3, 2, amber)
      px(g, 10, 2, amber)
      px(g, 3, 3, amberHi)
      px(g, 10, 3, amberHi)
    },
  },
  {
    id: "abyssal_diadem",
    label: "Abyssal Diadem",
    layer: "hat",
    rarity: "mythic",
    anchor: "rest",
    draw: (g) => {
      const abyss = "#0a1622"
      const voidBlue = "#16304a"
      const tide = "#2a6f96"
      const lumen = "#6fe0f0"
      const pearl = "#eafdff"
      const gold = "#d9c07a"
      px(g, 2, 0, lumen)
      px(g, 3, 0, tide)
      px(g, 5, 0, pearl)
      px(g, 6, 0, lumen)
      px(g, 7, 0, lumen)
      px(g, 8, 0, pearl)
      px(g, 10, 0, tide)
      px(g, 11, 0, lumen)
      hline(g, 2, 11, 1, voidBlue)
      px(g, 4, 1, tide)
      px(g, 9, 1, tide)
      px(g, 6, 1, gold)
      px(g, 7, 1, gold)
      hline(g, 3, 10, 2, abyss)
      px(g, 5, 2, lumen)
      px(g, 8, 2, lumen)
      px(g, 6, 2, gold)
      px(g, 7, 2, gold)
      px(g, 4, 3, tide)
      px(g, 9, 3, tide)
      px(g, 6, 3, gold)
      px(g, 7, 3, gold)
    },
  },
]

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function headMask(base: Grid): boolean[][] {
  return base.map((row) => row.map((c) => c !== "transparent"))
}

function skinSet(): Set<string> {
  // Every skin tone plus its shaded variant, so "skin peeking" is detected
  // regardless of which tone the harness renders.
  const s = new Set<string>()
  for (const c of SKIN_COLORS) s.add(c.toLowerCase())
  return s
}

function isSkin(color: string): boolean {
  const c = color.toLowerCase()
  if (skinSet().has(c)) return true
  // shaded skin is darkenColor(skin, 0.15)
  for (const base of SKIN_COLORS) {
    const r = Math.floor(parseInt(base.slice(1, 3), 16) * 0.85)
    const g = Math.floor(parseInt(base.slice(3, 5), 16) * 0.85)
    const b = Math.floor(parseInt(base.slice(5, 7), 16) * 0.85)
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    if (hex === c) return true
  }
  return false
}

function diffPixels(base: Grid, cand: Grid): [number, number][] {
  const out: [number, number][] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (base[y][x] !== cand[y][x]) out.push([x, y])
    }
  }
  return out
}

/** Connected components of cosmetic pixels, flagging those not touching the skull. */
function islandCheck(base: Grid, cosmetic: [number, number][]): { islands: number; floating: [number, number][] } {
  const mask = headMask(base)
  const key = (x: number, y: number) => `${x},${y}`
  const set = new Set(cosmetic.map(([x, y]) => key(x, y)))
  const seen = new Set<string>()
  let islands = 0
  const floating: [number, number][] = []

  for (const [sx, sy] of cosmetic) {
    if (seen.has(key(sx, sy))) continue
    islands++
    // flood this component
    const comp: [number, number][] = []
    const stack: [number, number][] = [[sx, sy]]
    seen.add(key(sx, sy))
    let touches = false
    while (stack.length) {
      const [x, y] = stack.pop()!
      comp.push([x, y])
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue
          if (mask[ny][nx]) touches = true
          const k = key(nx, ny)
          if (set.has(k) && !seen.has(k)) {
            seen.add(k)
            stack.push([nx, ny])
          }
        }
      }
    }
    if (!touches) floating.push(...comp)
  }
  return { islands, floating }
}

/** Any skin still visible in the rows a covering cosmetic claims to seal. */
function sealCheck(cand: Grid, rows: number[]): [number, number][] {
  const leaks: [number, number][] = []
  for (const y of rows) {
    for (let x = 0; x < GRID; x++) {
      if (isSkin(cand[y][x])) leaks.push([x, y])
    }
  }
  return leaks
}

// ---------------------------------------------------------------------------
// ASCII rendering
// ---------------------------------------------------------------------------

function asciiRow(grids: { grid: Grid; problem?: Set<string> }[], legend: Map<string, string>): string[] {
  const lines: string[] = []
  for (let y = 0; y < GRID; y++) {
    let line = ""
    for (const { grid, problem } of grids) {
      for (let x = 0; x < GRID; x++) {
        const c = grid[y][x]
        if (problem?.has(`${x},${y}`)) {
          line += "!"
        } else if (c === "transparent") {
          line += "."
        } else {
          let sym = legend.get(c)
          if (!sym) {
            sym = SYMBOLS[legend.size % SYMBOLS.length]
            legend.set(c, sym)
          }
          line += sym
        }
      }
      line += "  "
    }
    lines.push(line)
  }
  return lines
}

const SYMBOLS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// ---------------------------------------------------------------------------
// PNG contact sheet
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf: Buffer): number {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePNG(w: number, h: number, rgb: Buffer): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour RGB
  const stride = 1 + w * 3
  const raw = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0
    rgb.copy(raw, y * stride + 1, y * w * 3, (y + 1) * w * 3)
  }
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

function hexToRGB(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

const BG: [number, number, number] = [22, 22, 28]
const GUTTER: [number, number, number] = [8, 8, 10]

/** Lays cells out as rows; each row is one cosmetic across head shapes/hair. */
function contactSheet(rows: Grid[][], scale = 10, pad = 2): Buffer {
  const cols = Math.max(...rows.map((r) => r.length))
  const cellW = GRID * scale + pad * 2
  const cellH = GRID * scale + pad * 2
  const w = cols * cellW
  const h = rows.length * cellH
  const rgb = Buffer.alloc(w * h * 3)
  // gutter background
  for (let i = 0; i < w * h; i++) {
    rgb[i * 3] = GUTTER[0]
    rgb[i * 3 + 1] = GUTTER[1]
    rgb[i * 3 + 2] = GUTTER[2]
  }
  rows.forEach((row, ri) => {
    row.forEach((grid, ci) => {
      const ox = ci * cellW + pad
      const oy = ri * cellH + pad
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const c = grid[gy][gx]
          const rgbv = c === "transparent" ? BG : hexToRGB(c)
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px2 = (oy + gy * scale + sy) * w + (ox + gx * scale + sx)
              rgb[px2 * 3] = rgbv[0]
              rgb[px2 * 3 + 1] = rgbv[1]
              rgb[px2 * 3 + 2] = rgbv[2]
            }
          }
        }
      }
    })
  })
  return encodePNG(w, h, rgb)
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdMasks() {
  console.log("Head silhouette extents per row (inclusive), by base variant:\n")
  const legend = new Map<string, string>()
  const grids = HEADS.map((h) => ({ grid: render(h.variant, 0, "accessory", 0) }))
  console.log(HEADS.map((h) => h.name.padEnd(GRID + 2)).join(""))
  for (const line of asciiRow(grids, legend)) console.log(line)

  console.log("\nrow |    round     |   square     |    oval      | intersection | union")
  for (let y = 0; y < GRID; y++) {
    const parts = HEADS.map((h) => {
      const g = render(h.variant, 0, "accessory", 0)
      const xs = [...Array(GRID).keys()].filter((x) => g[y][x] !== "transparent")
      return xs
    })
    const fmt = (xs: number[]) => (xs.length ? `${xs[0]}-${xs[xs.length - 1]}`.padEnd(12) : "—".padEnd(12))
    const inter = [...Array(GRID).keys()].filter((x) => parts.every((p) => p.includes(x)))
    const uni = [...Array(GRID).keys()].filter((x) => parts.some((p) => p.includes(x)))
    console.log(
      `${String(y).padStart(3)} | ${parts.map(fmt).join(" | ")} | ${fmt(inter)} | ${fmt(uni)}`
    )
  }
  console.log("\nDesign rules implied:")
  console.log("  - face-level art that must sit ON skin: stay within the intersection column")
  console.log("  - art that must FULLY COVER a row: span the union column")
}

function evaluate(c: Candidate, sheetRows: Grid[][]): boolean {
  let ok = true
  const legend = new Map<string, string>()
  const cells: Grid[] = []
  const asciiCells: { grid: Grid; problem?: Set<string> }[] = []

  console.log(`\n${"=".repeat(78)}`)
  console.log(`${c.label}  [${c.rarity}]  ${c.layer} anchor=${c.anchor}`)
  console.log("=".repeat(78))

  for (const hair of HAIRS) {
    for (const head of HEADS) {
      clipped = []
      const base = render(head.variant, hair.variant, c.layer, 0)
      const cand = cloneGrid(base)
      c.draw(cand)
      const cosmetic = diffPixels(base, cand)
      const problem = new Set<string>()

      if (hair.variant === 0) {
        const { islands, floating } = islandCheck(base, cosmetic)
        if (c.anchor === "rest" && floating.length) {
          ok = false
          for (const [x, y] of floating) problem.add(`${x},${y}`)
          console.log(
            `  FAIL ${head.name}/${hair.name}: ${floating.length} px float off the skull ` +
              floating.map(([x, y]) => `(${x},${y})`).join(" ")
          )
        }
        if (c.sealRows) {
          const leaks = sealCheck(cand, c.sealRows)
          if (leaks.length) {
            ok = false
            for (const [x, y] of leaks) problem.add(`${x},${y}`)
            console.log(
              `  FAIL ${head.name}/${hair.name}: skin peeks in sealed rows ` +
                leaks.map(([x, y]) => `(${x},${y})`).join(" ")
            )
          }
        }
        if (clipped.length) {
          ok = false
          console.log(`  FAIL ${head.name}: ${clipped.length} px drawn outside grid ${clipped.join(" ")}`)
        }
        if (islands > 1 && c.anchor === "rest") {
          console.log(`  note ${head.name}: ${islands} separate clusters (intentional for split designs)`)
        }
      }

      cells.push(cand)
      if (hair.variant === 0) asciiCells.push({ grid: cand, problem })
    }
  }

  console.log(`\n  ${HEADS.map((h) => h.name.padEnd(GRID + 2)).join("")}`)
  for (const line of asciiRow(asciiCells, legend)) console.log("  " + line)
  console.log("  legend: " + [...legend.entries()].map(([col, sym]) => `${sym}=${col}`).join(" "))
  console.log(ok ? "  RESULT: pass" : "  RESULT: FAIL")

  sheetRows.push(cells)
  return ok
}

function cmdCandidates() {
  if (!CANDIDATES.length) {
    console.log("No candidates defined yet.")
    return
  }
  const sheetRows: Grid[][] = []
  let pass = 0
  for (const c of CANDIDATES) {
    if (evaluate(c, sheetRows)) pass++
  }
  const out = "/tmp/agent-browser/cosmetics-candidates.png"
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, contactSheet(sheetRows))
  console.log(`\n${"=".repeat(78)}`)
  console.log(`${pass}/${CANDIDATES.length} candidates pass automated checks`)
  console.log(`contact sheet: ${out}`)
  console.log("row order (each row = bald round/square/oval then long-hair round/square/oval):")
  CANDIDATES.forEach((c, i) => console.log(`  ${i + 1}. ${c.label} [${c.rarity}]`))
}

/** Renders already-shipped variants, to sanity-check the harness and match style. */
function cmdExisting(layer: AvatarLayerType, list: string) {
  const variants = list
    .split(",")
    .flatMap((tok) => {
      const m = tok.match(/^(\d+)-(\d+)$/)
      if (m) {
        const out = []
        for (let i = +m[1]; i <= +m[2]; i++) out.push(i)
        return out
      }
      return [Number(tok)]
    })
  const sheetRows: Grid[][] = []
  for (const v of variants) {
    const legend = new Map<string, string>()
    const asciiCells: { grid: Grid; problem?: Set<string> }[] = []
    const cells: Grid[] = []
    console.log(`\n${"=".repeat(78)}\n${layer} variant ${v}\n${"=".repeat(78)}`)
    for (const hair of HAIRS) {
      for (const head of HEADS) {
        const base = render(head.variant, hair.variant, layer, 0)
        const cand = render(head.variant, hair.variant, layer, v)
        const cosmetic = diffPixels(base, cand)
        const problem = new Set<string>()
        if (hair.variant === 0) {
          const { floating } = islandCheck(base, cosmetic)
          if (floating.length) {
            for (const [x, y] of floating) problem.add(`${x},${y}`)
            console.log(
              `  ${head.name}: ${floating.length} px detached from skull ` +
                floating.map(([x, y]) => `(${x},${y})`).join(" ")
            )
          }
          asciiCells.push({ grid: cand, problem })
        }
        cells.push(cand)
      }
    }
    console.log(`\n  ${HEADS.map((h) => h.name.padEnd(GRID + 2)).join("")}`)
    for (const line of asciiRow(asciiCells, legend)) console.log("  " + line)
    sheetRows.push(cells)
  }
  const out = `/tmp/agent-browser/cosmetics-existing-${layer}.png`
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, contactSheet(sheetRows))
  console.log(`\ncontact sheet: ${out}`)
  console.log("row order: " + variants.join(", "))
}

/**
 * Hats draw AFTER accessories (layer order in renderAvatarPixels), so a hat
 * silently overwrites accessory pixels in the rows they share. This measures how
 * much of each accessory's art survives under each hat, and flags the case that
 * actually matters: a signature feature being erased so the accessory reads as
 * broken rather than layered.
 */
function cmdStack() {
  const accessories = CANDIDATES.filter((c) => c.layer === "accessory")
  const hats = CANDIDATES.filter((c) => c.layer === "hat")
  const base = render(0, 0, "accessory", 0)

  console.log("Accessory pixel survival under each candidate hat (round head, bald):\n")
  const header = ["accessory".padEnd(22), ...hats.map((h) => h.label.slice(0, 13).padEnd(14))].join("")
  console.log(header)
  console.log("-".repeat(header.length))

  const worst: string[] = []
  for (const acc of accessories) {
    const accGrid = cloneGrid(base)
    acc.draw(accGrid)
    const accPx = diffPixels(base, accGrid)
    const cells: string[] = []
    for (const hat of hats) {
      const both = cloneGrid(base)
      acc.draw(both)
      hat.draw(both)
      // Accessory pixels still showing the accessory's colour after the hat drew.
      const survived = accPx.filter(([x, y]) => both[y][x] === accGrid[y][x]).length
      const pct = Math.round((survived / accPx.length) * 100)
      cells.push(`${pct}%`.padEnd(14))
      if (pct < 70) worst.push(`${acc.label} under ${hat.label}: only ${pct}% survives`)
    }
    console.log(acc.label.slice(0, 21).padEnd(22) + cells.join(""))
  }

  console.log("\nCombos losing >30% of the accessory:")
  if (worst.length === 0) console.log("  none — every accessory stays legible under every hat")
  else for (const w of worst) console.log("  " + w)

  // Visual sheet of the riskiest combos: tall accessories under tall hats.
  const sheetRows: Grid[][] = []
  const labels: string[] = []
  for (const acc of accessories) {
    for (const hat of hats) {
      const cells: Grid[] = []
      for (const head of HEADS) {
        const g = render(head.variant, 0, "accessory", 0)
        acc.draw(g)
        hat.draw(g)
        cells.push(g)
      }
      sheetRows.push(cells)
      labels.push(`${acc.label} + ${hat.label}`)
    }
  }
  const out = "/tmp/agent-browser/cosmetics-stacked.png"
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, contactSheet(sheetRows, 6))
  console.log(`\ncontact sheet: ${out}`)
  console.log(`${labels.length} combos, row order (round/square/oval each):`)
  labels.forEach((l, i) => console.log(`  ${i + 1}. ${l}`))
}

/**
 * Renders at the scales the UI actually uses, to confirm the art still reads
 * when it is not blown up 10x. Anything that turns to mush here is too fussy
 * regardless of how good the large version looks.
 */
function cmdSmall() {
  const sheetRows: Grid[][] = []
  for (const c of CANDIDATES) {
    const cells: Grid[] = []
    for (const head of HEADS) {
      const g = render(head.variant, 0, c.layer, 0)
      c.draw(g)
      cells.push(g)
    }
    sheetRows.push(cells)
  }
  for (const scale of [2, 3, 5]) {
    const out = `/tmp/agent-browser/cosmetics-small-${scale}x.png`
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, contactSheet(sheetRows, scale, 1))
    console.log(`${GRID * scale}px sheet: ${out}`)
  }
  console.log("\nrow order:")
  CANDIDATES.forEach((c, i) => console.log(`  ${i + 1}. ${c.label} [${c.rarity}] ${c.layer}`))
}

const [cmd, a, b] = process.argv.slice(2)
if (cmd === "masks") cmdMasks()
else if (cmd === "candidates") cmdCandidates()
else if (cmd === "stack") cmdStack()
else if (cmd === "small") cmdSmall()
else if (cmd === "existing") cmdExisting((a as AvatarLayerType) ?? "accessory", b ?? "1")
else {
  console.log("commands: masks | candidates | stack | small | existing <layer> <variants>")
}

export { CANDIDATES }
