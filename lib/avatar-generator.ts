import type { AvatarConfig, AvatarLayer, AvatarLayerType } from "./types"

// Simple seeded random number generator
function seededRandom(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return function() {
    hash = Math.imul(hash ^ (hash >>> 15), hash | 1)
    hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61)
    return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296
  }
}

// Color palettes
export const SKIN_COLORS = [
  "#e8c4a0", // warm light
  "#d4a574", // warm medium
  "#8b6f5c", // warm dark
  "#c9b8a8", // cool light
  "#a08878", // cool medium
  "#6b5b50", // cool dark
]

export const HAIR_COLORS = [
  "#2a2a2a", // black
  "#5c4033", // brown
  "#c4a35a", // blonde
  "#8b3a3a", // red
  "#6b4f8a", // purple
  "#4a8b8b", // teal
  "#8a8a8a", // grey
  "#e8e0d0", // white
]

export const EYE_COLORS = [
  "#4a6b8a", // blue
  "#5a8a5a", // green
  "#6b5a4a", // brown
  "#8a6b8a", // purple
  "#8a8a5a", // amber
]

// Pixel patterns for each layer type (16x16 grid, 1 = filled, 0 = empty)
// Each pattern is stored as an array of row strings where '#' = filled

const BASE_SHAPES = [
  // Round
  `
    ....####....
    ..########..
    .##########.
    ############
    ############
    ############
    ############
    ############
    ############
    .##########.
    ..########..
    ....####....
  `,
  // Square
  `
    ..##########..
    .############.
    ##############
    ##############
    ##############
    ##############
    ##############
    ##############
    ##############
    ##############
    .############.
    ..##########..
  `,
  // Oval
  `
    ....######....
    ..##########..
    .############.
    ##############
    ##############
    ##############
    ##############
    ##############
    ##############
    ##############
    ..##########..
    ....######....
  `,
]

const EYES_PATTERNS = [
  // Neutral dots
  { left: [4, 4], right: [9, 4], style: "dot" },
  // Wide
  { left: [3, 4], right: [10, 4], style: "dot" },
  // Close
  { left: [5, 4], right: [8, 4], style: "dot" },
  // Happy (curved)
  { left: [4, 5], right: [9, 5], style: "arc" },
  // Tired (lines)
  { left: [4, 4], right: [9, 4], style: "line" },
  // Alert (tall)
  { left: [4, 3], right: [9, 3], style: "tall" },
]

const MOUTH_PATTERNS = [
  // Neutral line
  { y: 8, width: 4, style: "line" },
  // Smile
  { y: 8, width: 4, style: "smile" },
  // Small
  { y: 8, width: 2, style: "line" },
  // Open
  { y: 8, width: 3, style: "open" },
]

const HAIR_PATTERNS = [
  // None
  null,
  // Short top
  { rows: [0, 1], fullWidth: false },
  // Full short
  { rows: [0, 1, 2], fullWidth: true },
  // Spiky
  { rows: [0, 1], spiky: true },
  // Side parts
  { rows: [0, 1, 2], sides: true },
  // Long
  { rows: [0, 1, 2], long: true },
]

const ACCESSORY_PATTERNS = [
  // None
  null,
  // Glasses
  { type: "glasses", y: 4 },
  // Eyepatch
  { type: "eyepatch", side: "left" },
  // Scar
  { type: "scar", y: 5 },
  // Visor
  { type: "visor", y: 3 },
  // Mask
  { type: "mask", y: 6 },
]

const HAT_PATTERNS = [
  // None
  null,
  // Cap
  { type: "cap", height: 2 },
  // Hood
  { type: "hood", height: 3 },
  // Antenna
  { type: "antenna" },
  // Horns
  { type: "horns" },
  // Halo
  { type: "halo" },
  // Crown
  { type: "crown" },
  // Beanie
  { type: "beanie" },
  // Headset
  { type: "headset" },
]

const FLAIR_PATTERNS = [
  // None
  null,
  // Glow
  { type: "glow" },
  // Static
  { type: "static" },
  // Sparkle
  { type: "sparkle" },
]

// Layer variant counts
export const LAYER_VARIANTS: Record<AvatarLayerType, number> = {
  base: BASE_SHAPES.length,
  skin: SKIN_COLORS.length,
  eyes: EYES_PATTERNS.length,
  mouth: MOUTH_PATTERNS.length,
  hair: HAIR_PATTERNS.length,
  accessory: ACCESSORY_PATTERNS.length,
  hat: HAT_PATTERNS.length,
  flair: FLAIR_PATTERNS.length,
}

// Generate avatar config from seed
export function generateAvatarFromSeed(seed: string): AvatarConfig {
  const rand = seededRandom(seed)
  
  const layers: AvatarLayer[] = [
    { type: "base", variant: Math.floor(rand() * LAYER_VARIANTS.base) },
    { type: "skin", variant: Math.floor(rand() * LAYER_VARIANTS.skin) },
    { type: "eyes", variant: Math.floor(rand() * LAYER_VARIANTS.eyes), color: Math.floor(rand() * EYE_COLORS.length) },
    { type: "mouth", variant: Math.floor(rand() * LAYER_VARIANTS.mouth) },
    { type: "hair", variant: Math.floor(rand() * LAYER_VARIANTS.hair), color: Math.floor(rand() * HAIR_COLORS.length) },
    // Accessories/hats/flair start with "none" variant (0) by default
    { type: "accessory", variant: 0 },
    { type: "hat", variant: 0 },
    { type: "flair", variant: 0 },
  ]
  
  return { seed, layers }
}

// Get a specific layer from config
export function getLayer(config: AvatarConfig, type: AvatarLayerType): AvatarLayer | undefined {
  return config.layers.find(l => l.type === type)
}

// Update a layer in config
export function updateLayer(config: AvatarConfig, layer: AvatarLayer): AvatarConfig {
  return {
    ...config,
    layers: config.layers.map(l => l.type === layer.type ? layer : l)
  }
}

// Render avatar to a 2D pixel grid (14x14)
export function renderAvatarPixels(config: AvatarConfig): string[][] {
  const size = 14
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill("transparent"))
  
  const baseLayer = getLayer(config, "base")
  const skinLayer = getLayer(config, "skin")
  const eyesLayer = getLayer(config, "eyes")
  const mouthLayer = getLayer(config, "mouth")
  const hairLayer = getLayer(config, "hair")
  const accessoryLayer = getLayer(config, "accessory")
  const hatLayer = getLayer(config, "hat")
  
  const skinColor = SKIN_COLORS[skinLayer?.variant ?? 0]
  const hairColor = HAIR_COLORS[hairLayer?.color ?? 0]
  const eyeColor = EYE_COLORS[eyesLayer?.color ?? 0]
  
  // Draw base head shape
  const basePattern = BASE_SHAPES[baseLayer?.variant ?? 0]
  const baseRows = basePattern.trim().split("\n").map(r => r.trim())
  
  for (let y = 0; y < Math.min(baseRows.length, size); y++) {
    const row = baseRows[y]
    for (let x = 0; x < Math.min(row.length, size); x++) {
      if (row[x] === "#") {
        grid[y + 1][x + 1] = skinColor
      }
    }
  }
  
  // Draw eyes
  const eyePattern = EYES_PATTERNS[eyesLayer?.variant ?? 0]
  if (eyePattern) {
    // Left eye
    grid[eyePattern.left[1] + 1][eyePattern.left[0]] = eyeColor
    if (eyePattern.style === "tall") {
      grid[eyePattern.left[1] + 2][eyePattern.left[0]] = eyeColor
    }
    // Right eye
    grid[eyePattern.right[1] + 1][eyePattern.right[0]] = eyeColor
    if (eyePattern.style === "tall") {
      grid[eyePattern.right[1] + 2][eyePattern.right[0]] = eyeColor
    }
  }
  
  // Draw mouth
  const mouthPattern = MOUTH_PATTERNS[mouthLayer?.variant ?? 0]
  if (mouthPattern) {
    const startX = 7 - Math.floor(mouthPattern.width / 2)
    for (let i = 0; i < mouthPattern.width; i++) {
      const mouthColor = "#4a3a3a"
      if (mouthPattern.style === "smile" && i > 0 && i < mouthPattern.width - 1) {
        grid[mouthPattern.y + 1][startX + i] = mouthColor
      } else {
        grid[mouthPattern.y][startX + i] = mouthColor
      }
    }
  }
  
  // Draw hair
  const hairVariant = hairLayer?.variant ?? 0
  if (hairVariant > 0) {
    const pattern = HAIR_PATTERNS[hairVariant]
    if (pattern && "rows" in pattern) {
      for (const rowIdx of pattern.rows) {
        for (let x = 2; x < size - 2; x++) {
          // Check if base has pixel here or above
          if (rowIdx < 3) {
            grid[rowIdx][x] = hairColor
          }
        }
      }
      // Spiky hair adds extra pixels
      if (pattern.spiky) {
        grid[0][4] = hairColor
        grid[0][9] = hairColor
      }
      // Long hair adds side pixels
      if (pattern.long) {
        for (let y = 3; y < 10; y++) {
          grid[y][1] = hairColor
          grid[y][12] = hairColor
        }
      }
    }
  }
  
  // Draw accessory
  const accVariant = accessoryLayer?.variant ?? 0
  if (accVariant > 0) {
    const pattern = ACCESSORY_PATTERNS[accVariant]
    if (pattern) {
      if (pattern.type === "glasses") {
        // Draw simple glasses
        const glassColor = "#2a2a2a"
        grid[pattern.y][3] = glassColor
        grid[pattern.y][4] = glassColor
        grid[pattern.y][5] = glassColor
        grid[pattern.y][6] = glassColor
        grid[pattern.y][7] = glassColor
        grid[pattern.y][8] = glassColor
        grid[pattern.y][9] = glassColor
        grid[pattern.y][10] = glassColor
      } else if (pattern.type === "eyepatch") {
        const patchColor = "#2a2a2a"
        grid[4][3] = patchColor
        grid[4][4] = patchColor
        grid[5][3] = patchColor
        grid[5][4] = patchColor
      } else if (pattern.type === "scar") {
        const scarColor = "#8a5a5a"
        grid[pattern.y][8] = scarColor
        grid[pattern.y + 1][9] = scarColor
        grid[pattern.y + 2][10] = scarColor
      } else if (pattern.type === "visor") {
        const visorColor = "#4a8b8b"
        for (let x = 2; x < 12; x++) {
          grid[pattern.y][x] = visorColor
          grid[pattern.y + 1][x] = visorColor
        }
      }
    }
  }
  
  // Draw hat
  const hatVariant = hatLayer?.variant ?? 0
  if (hatVariant > 0) {
    const pattern = HAT_PATTERNS[hatVariant]
    if (pattern) {
      const hatColor = "#4a3a5a"
      if (pattern.type === "cap") {
        for (let x = 2; x < 12; x++) {
          grid[0][x] = hatColor
        }
        for (let x = 1; x < 13; x++) {
          grid[1][x] = hatColor
        }
      } else if (pattern.type === "antenna") {
        grid[0][7] = "#8a8a8a"
        grid[1][7] = "#8a8a8a"
      } else if (pattern.type === "horns") {
        grid[0][3] = hatColor
        grid[1][3] = hatColor
        grid[0][10] = hatColor
        grid[1][10] = hatColor
      } else if (pattern.type === "halo") {
        const haloColor = "#e8d080"
        for (let x = 4; x < 10; x++) {
          grid[0][x] = haloColor
        }
      } else if (pattern.type === "crown") {
        const crownColor = "#d4a030"
        for (let x = 3; x < 11; x++) {
          grid[1][x] = crownColor
        }
        grid[0][4] = crownColor
        grid[0][7] = crownColor
        grid[0][10] = crownColor
      }
    }
  }
  
  return grid
}
