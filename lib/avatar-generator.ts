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
  "#f4d4b8", // light warm
  "#e8c4a0", // medium warm
  "#d4a574", // tan
  "#c49468", // medium
  "#8b6f5c", // dark warm
  "#6b5548", // dark
]

export const HAIR_COLORS = [
  "#1a1a1a", // black
  "#3d2314", // dark brown
  "#5c4033", // brown
  "#8b6914", // golden brown
  "#c4a35a", // blonde
  "#e8d8a0", // light blonde
  "#8b3a3a", // auburn
  "#5a2a2a", // dark red
  "#6b4f8a", // purple
  "#4a6b8b", // blue
  "#8a8a8a", // grey
  "#e8e8e8", // white
]

export const EYE_COLORS = [
  "#2a4a6a", // dark blue
  "#4a7090", // blue
  "#3a5a3a", // dark green
  "#5a8a5a", // green
  "#5a4a3a", // brown
  "#3a3030", // dark brown
  "#6a5a7a", // purple
  "#7a6a4a", // amber
]

// Lipstick colors keyed by mouth variant. Variant 0 is the neutral mouth line
// (no entry here). Variant 1 (Rose) ships unlocked; 2-6 are gacha rewards.
export const LIPSTICK_COLORS: Record<number, { base: string; highlight: string; name: string }> = {
  1: { base: "#c0395b", highlight: "#e06a86", name: "Rose" },
  2: { base: "#a01028", highlight: "#d13a54", name: "Crimson" },
  3: { base: "#e0564a", highlight: "#ff8577", name: "Coral" },
  4: { base: "#7d2748", highlight: "#a84a6e", name: "Berry" },
  5: { base: "#5e2a56", highlight: "#8a4d80", name: "Plum" },
  6: { base: "#b07a6a", highlight: "#c99686", name: "Nude" },
}

// Head shape names for UI
export const HEAD_SHAPE_NAMES = ["Round", "Square", "Oval"]

// Hair style names for UI
export const HAIR_STYLE_NAMES = [
  "Bald",
  "Buzz Cut", 
  "Spiky",
  "Side Part",
  "Long",
  "Mohawk",
  "Bangs",
  "Curly",
  "Slicked Back",
  "Undercut",
]

// Eye style names for UI
export const EYE_STYLE_NAMES = [
  "Normal",
  "Wide",
  "Narrow",
  "Happy",
  "Tired",
  "Big",
]

// Layer variant counts
export const LAYER_VARIANTS: Record<AvatarLayerType, number> = {
  base: 3,        // head shapes: round, square, oval
  skin: SKIN_COLORS.length,
  eyes: 6,
  mouth: 7,       // 0=neutral line, 1-6=lipstick colors (see LIPSTICK_COLORS)
  hair: 10,       // increased hair options
  accessory: 28,  // 0=none, 1-16 standard, 17-21 mythic, 22-27 tidal set
  hat: 30,        // 0=none, 1-18 standard, 19-23 mythic, 24-29 tidal set
  flair: 18,      // 0=none, 1-12 standard, 13-17 mythic
}

// Generate avatar config from seed
export function generateAvatarFromSeed(seed: string): AvatarConfig {
  const safeSeed = seed || "default"
  const rand = seededRandom(safeSeed)
  
  const layers: AvatarLayer[] = [
    { type: "base", variant: Math.floor(rand() * LAYER_VARIANTS.base) },
    { type: "skin", variant: Math.floor(rand() * LAYER_VARIANTS.skin) },
    { type: "eyes", variant: Math.floor(rand() * LAYER_VARIANTS.eyes), color: Math.floor(rand() * EYE_COLORS.length) },
    { type: "hair", variant: Math.floor(rand() * LAYER_VARIANTS.hair), color: Math.floor(rand() * HAIR_COLORS.length) },
    { type: "mouth", variant: 0 },
    { type: "accessory", variant: 0 },
    { type: "hat", variant: 0 },
    { type: "flair", variant: 0 },
  ]
  
  return { seed: safeSeed, layers }
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

// Helper to set pixel with bounds checking
function setPixel(grid: string[][], x: number, y: number, color: string) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = color
  }
}

// Render avatar to a 2D pixel grid (14x14)
export function renderAvatarPixels(config: AvatarConfig): string[][] {
  const size = 14
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill("transparent"))
  
  const baseLayer = getLayer(config, "base")
  const skinLayer = getLayer(config, "skin")
  const eyesLayer = getLayer(config, "eyes")
  const hairLayer = getLayer(config, "hair")
  const accessoryLayer = getLayer(config, "accessory")
  const hatLayer = getLayer(config, "hat")
  
  const skinColor = SKIN_COLORS[skinLayer?.variant ?? 0]
  const skinShadow = darkenColor(skinColor, 0.15)
  const hairColor = HAIR_COLORS[hairLayer?.color ?? 0]
  const eyeColor = EYE_COLORS[eyesLayer?.color ?? 0]
  const eyeWhite = "#f0f0f0"
  const mouthColor = "#4a2a2a" // Still used for default mouth drawn on face
  
  const baseVariant = baseLayer?.variant ?? 0
  const eyesVariant = eyesLayer?.variant ?? 0
  const hairVariant = hairLayer?.variant ?? 0
  const accVariant = accessoryLayer?.variant ?? 0
  const hatVariant = hatLayer?.variant ?? 0
  
  // Draw base head shape (centered, clear face area)
  // Base shapes: 0 = round, 1 = square, 2 = oval
  if (baseVariant === 0) {
    // Round face
    for (let y = 2; y < 12; y++) {
      for (let x = 2; x < 12; x++) {
        const dx = x - 6.5
        const dy = y - 6.5
        if (dx * dx + dy * dy < 22) {
          setPixel(grid, x, y, skinColor)
        }
      }
    }
  } else if (baseVariant === 1) {
    // Square face
    for (let y = 2; y < 12; y++) {
      for (let x = 3; x < 11; x++) {
        setPixel(grid, x, y, skinColor)
      }
    }
    // Round corners
    setPixel(grid, 3, 2, "transparent")
    setPixel(grid, 10, 2, "transparent")
    setPixel(grid, 3, 11, "transparent")
    setPixel(grid, 10, 11, "transparent")
  } else {
    // Oval face
    for (let y = 1; y < 13; y++) {
      const width = y < 3 || y > 10 ? 3 : (y < 5 || y > 8 ? 4 : 5)
      const start = 7 - width
      const end = 7 + width
      for (let x = start; x < end; x++) {
        setPixel(grid, x, y, skinColor)
      }
    }
  }
  
  // Add subtle shading on sides
  for (let y = 4; y < 10; y++) {
    if (grid[y][3] === skinColor) setPixel(grid, 3, y, skinShadow)
    if (grid[y][10] === skinColor) setPixel(grid, 10, y, skinShadow)
  }
  
  // Draw eyes - clear 2x2 or 2x1 eyes with visible pupils
  // Eye variants: 0=normal, 1=wide, 2=narrow, 3=happy, 4=tired, 5=big
  const eyeY = 5
  const leftEyeX = 4
  const rightEyeX = 8
  
  if (eyesVariant === 0) {
    // Normal eyes - 2 wide with pupil on outer edge
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
  } else if (eyesVariant === 1) {
    // Wide eyes - 2x2 with centered pupil
    setPixel(grid, leftEyeX, eyeY - 1, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY - 1, eyeWhite)
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY - 1, eyeWhite)
    setPixel(grid, rightEyeX + 1, eyeY - 1, eyeWhite)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
  } else if (eyesVariant === 2) {
    // Narrow/squinting eyes - single pixel
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
  } else if (eyesVariant === 3) {
    // Happy eyes - curved/closed
    setPixel(grid, leftEyeX, eyeY, eyeColor)
    setPixel(grid, leftEyeX + 1, eyeY - 1, eyeColor)
    setPixel(grid, rightEyeX, eyeY - 1, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeColor)
  } else if (eyesVariant === 4) {
    // Tired eyes - half-lidded
    setPixel(grid, leftEyeX, eyeY, skinShadow)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, skinShadow)
  } else {
    // Big eyes - 2x2 with large pupils (more anime-style)
    setPixel(grid, leftEyeX, eyeY - 1, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY - 1, eyeColor)
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY - 1, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY - 1, eyeWhite)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
  }
  
  // Draw mouth. Variant 0 = neutral line (default face). Variants 1-6 are
  // lipstick colors (see LIPSTICK_COLORS). Variant 1 (rose) ships unlocked for
  // everyone; the rest are recovered from the gacha.
  const mouthLayer = getLayer(config, "mouth")
  const mouthVariant = mouthLayer?.variant ?? 0
  const mouthY = 8
  const lipstick = LIPSTICK_COLORS[mouthVariant]
  if (lipstick) {
    setPixel(grid, 5, mouthY, lipstick.base)
    setPixel(grid, 6, mouthY, lipstick.highlight)
    setPixel(grid, 7, mouthY, lipstick.highlight)
    setPixel(grid, 8, mouthY, lipstick.base)
    setPixel(grid, 6, mouthY + 1, lipstick.base)
    setPixel(grid, 7, mouthY + 1, lipstick.base)
  } else {
    setPixel(grid, 5, mouthY, mouthColor)
    setPixel(grid, 6, mouthY, mouthColor)
    setPixel(grid, 7, mouthY, mouthColor)
    setPixel(grid, 8, mouthY, mouthColor)
  }
  
  // Draw hair
  // Hair variants: 0=bald, 1=buzz cut, 2=spiky, 3=side part, 4=long, 5=mohawk, 6=bangs, 7=curly, 8=slicked back, 9=undercut
  if (hairVariant === 1) {
    // Buzz Cut - very short, close to head
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 3, 2, hairColor)
    setPixel(grid, 10, 2, hairColor)
    setPixel(grid, 4, 1, hairColor)
    setPixel(grid, 9, 1, hairColor)
  } else if (hairVariant === 2) {
    // Spiky - pointed upward spikes
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 3, 2, hairColor)
    setPixel(grid, 10, 2, hairColor)
    // Spikes pointing up
    setPixel(grid, 4, 0, hairColor)
    setPixel(grid, 5, 1, hairColor)
    setPixel(grid, 6, 0, hairColor)
    setPixel(grid, 7, 1, hairColor)
    setPixel(grid, 8, 0, hairColor)
    setPixel(grid, 9, 1, hairColor)
  } else if (hairVariant === 3) {
    // Side Part - swept to one side
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    // Hair falls on left side
    setPixel(grid, 2, 2, hairColor)
    setPixel(grid, 2, 3, hairColor)
    setPixel(grid, 2, 4, hairColor)
    setPixel(grid, 3, 3, hairColor)
  } else if (hairVariant === 4) {
    // Long - shoulder length hair
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    // Hair hanging down both sides
    for (let y = 2; y < 12; y++) {
      setPixel(grid, 2, y, hairColor)
      setPixel(grid, 11, y, hairColor)
    }
    setPixel(grid, 3, 11, hairColor)
    setPixel(grid, 10, 11, hairColor)
  } else if (hairVariant === 5) {
    // Mohawk - tall center strip
    for (let x = 5; x < 9; x++) {
      setPixel(grid, x, 0, hairColor)
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    // Shaved sides hint
    setPixel(grid, 4, 2, darkenColor(hairColor, 0.4))
    setPixel(grid, 9, 2, darkenColor(hairColor, 0.4))
  } else if (hairVariant === 6) {
    // Bangs - fringe covering forehead
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    // Fringe hanging over forehead
    setPixel(grid, 4, 3, hairColor)
    setPixel(grid, 5, 3, hairColor)
    setPixel(grid, 6, 3, hairColor)
    setPixel(grid, 7, 3, hairColor)
    setPixel(grid, 5, 4, hairColor)
    setPixel(grid, 6, 4, hairColor)
  } else if (hairVariant === 7) {
    // Curly/Afro - big rounded hair
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, hairColor)
      setPixel(grid, x, 1, hairColor)
    }
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    // Volume on sides
    setPixel(grid, 1, 1, hairColor)
    setPixel(grid, 12, 1, hairColor)
    setPixel(grid, 1, 2, hairColor)
    setPixel(grid, 12, 2, hairColor)
    setPixel(grid, 2, 3, hairColor)
    setPixel(grid, 11, 3, hairColor)
  } else if (hairVariant === 8) {
    // Slicked Back - combed back from forehead
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
    }
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    // Combed lines
    setPixel(grid, 3, 2, darkenColor(hairColor, 0.2))
    setPixel(grid, 10, 2, darkenColor(hairColor, 0.2))
    setPixel(grid, 5, 1, darkenColor(hairColor, 0.15))
    setPixel(grid, 8, 1, darkenColor(hairColor, 0.15))
  } else if (hairVariant === 9) {
    // Undercut - long on top, shaved sides
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    // Swept to one side on top
    setPixel(grid, 3, 2, hairColor)
    setPixel(grid, 3, 1, hairColor)
    setPixel(grid, 2, 2, hairColor)
    // Shaved sides (darker)
    setPixel(grid, 3, 3, darkenColor(hairColor, 0.4))
    setPixel(grid, 10, 2, darkenColor(hairColor, 0.4))
    setPixel(grid, 10, 3, darkenColor(hairColor, 0.4))
  }
  
  // Draw accessory
  // Variants: 0=none, 1=glasses, 2=eyepatch, 3=scar, 4=visor, 5=shades, 6=mask
  if (accVariant === 1) {
    // Glasses - clear lenses with thin frames
    const glassColor = "#1a1a1a"
    const lensColor = "#8ab8d8"
    // Left lens frame + lens
    setPixel(grid, 3, 5, glassColor)
    setPixel(grid, 4, 4, glassColor)
    setPixel(grid, 5, 4, glassColor)
    setPixel(grid, 6, 5, glassColor)
    setPixel(grid, 4, 5, lensColor)
    setPixel(grid, 5, 5, lensColor)
    // Bridge
    setPixel(grid, 6, 5, glassColor)
    setPixel(grid, 7, 5, glassColor)
    // Right lens frame + lens
    setPixel(grid, 8, 4, glassColor)
    setPixel(grid, 9, 4, glassColor)
    setPixel(grid, 7, 5, glassColor)
    setPixel(grid, 10, 5, glassColor)
    setPixel(grid, 8, 5, lensColor)
    setPixel(grid, 9, 5, lensColor)
  } else if (accVariant === 5) {
    // Shades - dark sunglasses over eyes
    const frameColor = "#1a1a1a"
    const lensColor = "#2a2a3a"
    // Left lens (dark, covers eye)
    setPixel(grid, 3, 4, frameColor)
    setPixel(grid, 4, 4, frameColor)
    setPixel(grid, 5, 4, frameColor)
    setPixel(grid, 6, 4, frameColor)
    setPixel(grid, 3, 5, frameColor)
    setPixel(grid, 4, 5, lensColor)
    setPixel(grid, 5, 5, lensColor)
    setPixel(grid, 6, 5, frameColor)
    // Bridge
    setPixel(grid, 6, 5, frameColor)
    setPixel(grid, 7, 5, frameColor)
    // Right lens (dark, covers eye)
    setPixel(grid, 7, 4, frameColor)
    setPixel(grid, 8, 4, frameColor)
    setPixel(grid, 9, 4, frameColor)
    setPixel(grid, 10, 4, frameColor)
    setPixel(grid, 7, 5, frameColor)
    setPixel(grid, 8, 5, lensColor)
    setPixel(grid, 9, 5, lensColor)
    setPixel(grid, 10, 5, frameColor)
  } else if (accVariant === 2) {
    // Eyepatch
    const patchColor = "#2a2020"
    setPixel(grid, 3, 4, patchColor)
    setPixel(grid, 4, 4, patchColor)
    setPixel(grid, 5, 4, patchColor)
    setPixel(grid, 3, 5, patchColor)
    setPixel(grid, 4, 5, patchColor)
    setPixel(grid, 5, 5, patchColor)
    setPixel(grid, 3, 6, patchColor)
    // Strap
    setPixel(grid, 2, 3, patchColor)
    setPixel(grid, 11, 3, patchColor)
  } else if (accVariant === 3) {
    // Scar
    const scarColor = "#c08080"
    setPixel(grid, 9, 4, scarColor)
    setPixel(grid, 8, 5, scarColor)
    setPixel(grid, 9, 6, scarColor)
    setPixel(grid, 8, 7, scarColor)
  } else if (accVariant === 4) {
    // Visor
    const visorColor = "#60a0c0"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 4, visorColor)
      setPixel(grid, x, 5, visorColor)
    }
  } else if (accVariant === 6) {
    // Face mask (covers mouth)
    const maskColor = "#404050"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 7, maskColor)
      setPixel(grid, x, 8, maskColor)
      setPixel(grid, x, 9, maskColor)
    }
  } else if (accVariant === 7) {
    // Worn Bandana (covers lower face)
    const bandanaColor = "#8b6b4a"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 7, bandanaColor)
      setPixel(grid, x, 8, bandanaColor)
    }
    setPixel(grid, 4, 9, bandanaColor)
    setPixel(grid, 9, 9, bandanaColor)
  } else if (accVariant === 8) {
    // Relay Earpiece (small device on side)
    const deviceColor = "#606080"
    const glowColor = "#60c0ff"
    setPixel(grid, 2, 5, deviceColor)
    setPixel(grid, 2, 6, deviceColor)
    setPixel(grid, 1, 5, glowColor)
  } else if (accVariant === 9) {
    // Signal Monocle (single eye lens)
    const frameColor = "#d4a030"
    const lensColor = "#a0d0e0"
    setPixel(grid, 8, 4, frameColor)
    setPixel(grid, 9, 4, frameColor)
    setPixel(grid, 10, 4, frameColor)
    setPixel(grid, 8, 5, frameColor)
    setPixel(grid, 9, 5, lensColor)
    setPixel(grid, 10, 5, frameColor)
    setPixel(grid, 8, 6, frameColor)
    setPixel(grid, 9, 6, frameColor)
    setPixel(grid, 10, 6, frameColor)
    // Chain
    setPixel(grid, 11, 5, frameColor)
    setPixel(grid, 11, 6, frameColor)
  } else if (accVariant === 10) {
    // Route Mask (half face mask)
    const maskColor = "#505060"
    const ventColor = "#303040"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 6, maskColor)
      setPixel(grid, x, 7, maskColor)
      setPixel(grid, x, 8, maskColor)
    }
    setPixel(grid, 5, 7, ventColor)
    setPixel(grid, 6, 7, ventColor)
    setPixel(grid, 7, 7, ventColor)
    setPixel(grid, 8, 7, ventColor)
  } else if (accVariant === 11) {
    // Deep Scanner (tech visor with lights)
    const visorColor = "#303050"
    const scanColor = "#40ff80"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 4, visorColor)
      setPixel(grid, x, 5, visorColor)
    }
    setPixel(grid, 4, 5, scanColor)
    setPixel(grid, 6, 5, scanColor)
    setPixel(grid, 8, 5, scanColor)
    setPixel(grid, 10, 5, scanColor)
  } else if (accVariant === 12) {
    // Rift Lens (glowing eye piece)
    const frameColor = "#4a3060"
    const lensColor = "#a060ff"
    const glowColor = "#d0a0ff"
    // Left lens with glow
    setPixel(grid, 3, 4, frameColor)
    setPixel(grid, 4, 4, glowColor)
    setPixel(grid, 5, 4, glowColor)
    setPixel(grid, 6, 4, frameColor)
    setPixel(grid, 3, 5, frameColor)
    setPixel(grid, 4, 5, lensColor)
    setPixel(grid, 5, 5, lensColor)
    setPixel(grid, 6, 5, frameColor)
    // Right lens with glow
    setPixel(grid, 7, 4, frameColor)
    setPixel(grid, 8, 4, glowColor)
    setPixel(grid, 9, 4, glowColor)
    setPixel(grid, 10, 4, frameColor)
    setPixel(grid, 7, 5, frameColor)
    setPixel(grid, 8, 5, lensColor)
    setPixel(grid, 9, 5, lensColor)
    setPixel(grid, 10, 5, frameColor)
  } else if (accVariant === 13) {
    // Echo Mask (full face with pattern)
    const maskColor = "#404050"
    const patternColor = "#6080a0"
    for (let x = 4; x < 10; x++) {
      for (let y = 4; y < 10; y++) {
        setPixel(grid, x, y, maskColor)
      }
    }
    // Pattern lines
    setPixel(grid, 5, 5, patternColor)
    setPixel(grid, 8, 5, patternColor)
    setPixel(grid, 6, 7, patternColor)
    setPixel(grid, 7, 7, patternColor)
    setPixel(grid, 5, 9, patternColor)
    setPixel(grid, 8, 9, patternColor)
  } else if (accVariant === 14) {
    // Void Visor (dark with purple glow)
    const visorColor = "#1a1020"
    const glowColor = "#8040c0"
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 4, visorColor)
      setPixel(grid, x, 5, visorColor)
    }
    setPixel(grid, 2, 4, glowColor)
    setPixel(grid, 11, 4, glowColor)
    setPixel(grid, 2, 5, glowColor)
    setPixel(grid, 11, 5, glowColor)
  } else if (accVariant === 15) {
    // Prismatic Lens (rainbow shifting)
    const colors = ["#ff6080", "#ffb060", "#60ff80", "#60b0ff", "#a060ff"]
    setPixel(grid, 3, 5, colors[0])
    setPixel(grid, 4, 4, colors[1])
    setPixel(grid, 5, 4, colors[1])
    setPixel(grid, 6, 5, colors[2])
    setPixel(grid, 4, 5, colors[2])
    setPixel(grid, 5, 5, colors[2])
    setPixel(grid, 7, 5, "#1a1a1a")
    setPixel(grid, 8, 4, colors[3])
    setPixel(grid, 9, 4, colors[3])
    setPixel(grid, 10, 5, colors[4])
    setPixel(grid, 8, 5, colors[4])
    setPixel(grid, 9, 5, colors[4])
  } else if (accVariant === 16) {
    // All-Seeing Eye (legendary third eye)
    const frameColor = "#d4a030"
    const eyeColor = "#40e0ff"
    const pupilColor = "#1a1a1a"
    // Third eye on forehead
    setPixel(grid, 6, 3, frameColor)
    setPixel(grid, 7, 3, frameColor)
    setPixel(grid, 5, 4, frameColor)
    setPixel(grid, 6, 4, eyeColor)
    setPixel(grid, 7, 4, pupilColor)
    setPixel(grid, 8, 4, frameColor)
    setPixel(grid, 6, 5, frameColor)
    setPixel(grid, 7, 5, frameColor)
  } else if (accVariant === 17) {
    // MYTHIC: Voidtouched Gaze (eyes replaced with void energy)
    const voidCore = "#1a0820"
    const voidGlow = "#8040c0"
    const voidBright = "#c080ff"
    // Replace eyes with void orbs
    setPixel(grid, 4, 5, voidCore)
    setPixel(grid, 5, 5, voidGlow)
    setPixel(grid, 4, 4, voidBright)
    setPixel(grid, 9, 5, voidCore)
    setPixel(grid, 8, 5, voidGlow)
    setPixel(grid, 9, 4, voidBright)
    // Void tendrils
    setPixel(grid, 3, 4, voidGlow)
    setPixel(grid, 10, 4, voidGlow)
    setPixel(grid, 2, 3, voidBright)
    setPixel(grid, 11, 3, voidBright)
  } else if (accVariant === 18) {
    // MYTHIC: Relay Sea Mask (oceanic flowing mask)
    const deepBlue = "#1a3050"
    const waveBlue = "#3080b0"
    const foamWhite = "#a0d0e0"
    const shimmer = "#60e0ff"
    // Full face coverage with wave pattern
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 5, deepBlue)
      setPixel(grid, x, 6, waveBlue)
      setPixel(grid, x, 7, deepBlue)
      setPixel(grid, x, 8, waveBlue)
    }
    // Wave crests
    setPixel(grid, 4, 5, foamWhite)
    setPixel(grid, 7, 5, shimmer)
    setPixel(grid, 10, 5, foamWhite)
    setPixel(grid, 5, 7, shimmer)
    setPixel(grid, 8, 7, foamWhite)
    // Eye holes with glow
    setPixel(grid, 5, 5, shimmer)
    setPixel(grid, 8, 5, shimmer)
  } else if (accVariant === 19) {
    // MYTHIC: Shardheart Visor (crystalline fractured visor)
    const crystalCore = "#c060e0"
    const crystalEdge = "#ff80c0"
    const crystalGlow = "#e0a0ff"
    const shardDark = "#603080"
    // Fractured crystal visor
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 4, shardDark)
      setPixel(grid, x, 5, crystalCore)
    }
    // Fracture lines and glowing points
    setPixel(grid, 3, 4, crystalGlow)
    setPixel(grid, 5, 5, crystalEdge)
    setPixel(grid, 7, 4, crystalGlow)
    setPixel(grid, 9, 5, crystalEdge)
    setPixel(grid, 11, 4, crystalGlow)
    // Shard extensions
    setPixel(grid, 2, 3, crystalEdge)
    setPixel(grid, 6, 3, crystalGlow)
    setPixel(grid, 11, 3, crystalEdge)
  } else if (accVariant === 20) {
    // MYTHIC: Eternal Courier's Mark (golden time-worn insignia)
    const goldDark = "#b08030"
    const goldBright = "#ffd080"
    const goldGlow = "#ffe8b0"
    const amberCore = "#ff9040"
    // Central insignia
    setPixel(grid, 6, 4, goldGlow)
    setPixel(grid, 7, 4, goldGlow)
    setPixel(grid, 5, 5, goldBright)
    setPixel(grid, 6, 5, amberCore)
    setPixel(grid, 7, 5, amberCore)
    setPixel(grid, 8, 5, goldBright)
    setPixel(grid, 6, 6, goldDark)
    setPixel(grid, 7, 6, goldDark)
    // Trailing light lines
    setPixel(grid, 4, 4, goldBright)
    setPixel(grid, 3, 3, goldGlow)
    setPixel(grid, 9, 4, goldBright)
    setPixel(grid, 10, 3, goldGlow)
  } else if (accVariant === 21) {
    // MYTHIC: Primordial Echo (ancient runes around face)
    const runeGlow = "#40ffb0"
    const runeDark = "#206050"
    const runeAncient = "#80ffd0"
    const voidBlack = "#0a1010"
    // Rune circle around face
    setPixel(grid, 3, 3, runeGlow)
    setPixel(grid, 10, 3, runeGlow)
    setPixel(grid, 2, 5, runeAncient)
    setPixel(grid, 11, 5, runeAncient)
    setPixel(grid, 2, 7, runeDark)
    setPixel(grid, 11, 7, runeDark)
    setPixel(grid, 4, 9, runeGlow)
    setPixel(grid, 9, 9, runeGlow)
    // Central void mark
    setPixel(grid, 6, 4, voidBlack)
    setPixel(grid, 7, 4, voidBlack)
    setPixel(grid, 6, 5, runeAncient)
    setPixel(grid, 7, 5, runeAncient)
  } else if (accVariant === 22) {
    // Tide Goggles (common) - strap sits on row 4, the one row all three head
    // shapes span identically (x 3-10), so it seats cleanly on every silhouette
    const frame = "#22262e"
    const glass = "#4fb3a0"
    const shine = "#9fe8d8"
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 4, frame)
    setPixel(grid, 3, 5, frame)
    setPixel(grid, 4, 5, shine)
    setPixel(grid, 5, 5, glass)
    setPixel(grid, 6, 5, frame)
    setPixel(grid, 7, 5, frame)
    setPixel(grid, 8, 5, shine)
    setPixel(grid, 9, 5, glass)
    setPixel(grid, 10, 5, frame)
  } else if (accVariant === 23) {
    // Ashfall Veil (uncommon) - cloth tied at the temples, draping to a point
    const cloth = "#6f6558"
    const fold = "#52483d"
    const dust = "#8d8375"
    setPixel(grid, 3, 6, fold)
    setPixel(grid, 10, 6, fold)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 7, cloth)
    setPixel(grid, 5, 7, fold)
    setPixel(grid, 8, 7, fold)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 8, cloth)
    setPixel(grid, 4, 8, fold)
    setPixel(grid, 9, 8, fold)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 9, cloth)
    setPixel(grid, 6, 9, dust)
    setPixel(grid, 7, 9, dust)
    setPixel(grid, 6, 10, fold)
    setPixel(grid, 7, 10, fold)
  } else if (accVariant === 24) {
    // RARE: Currentweave Mask - woven lower-face mask with threaded highlights
    const deep = "#1f3a44"
    const weave = "#2f6b6f"
    const thread = "#55a89a"
    const crest = "#a8e6d4"
    setPixel(grid, 3, 5, deep)
    setPixel(grid, 10, 5, deep)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 6, deep)
    setPixel(grid, 5, 6, crest)
    setPixel(grid, 8, 6, crest)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 7, weave)
    setPixel(grid, 4, 7, thread)
    setPixel(grid, 6, 7, thread)
    setPixel(grid, 8, 7, thread)
    setPixel(grid, 10, 7, thread)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 8, deep)
    setPixel(grid, 5, 8, thread)
    setPixel(grid, 7, 8, thread)
    setPixel(grid, 9, 8, thread)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 9, weave)
    setPixel(grid, 5, 9, crest)
    setPixel(grid, 8, 9, crest)
    setPixel(grid, 6, 10, deep)
    setPixel(grid, 7, 10, deep)
  } else if (accVariant === 25) {
    // EPIC: Stormglass Lens - wraparound visor. Rows 5-6 span the union extent
    // (x 2-11) so the wider oval head cannot peek through at the temples
    const frame = "#141826"
    const glassDeep = "#1d3557"
    const glass = "#2f6ba8"
    const arc = "#8fd4ff"
    const hot = "#ffffff"
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 3, frame)
    setPixel(grid, 6, 3, arc)
    setPixel(grid, 7, 3, arc)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 4, frame)
    setPixel(grid, 4, 4, glassDeep)
    setPixel(grid, 9, 4, glassDeep)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 5, glassDeep)
    setPixel(grid, 2, 5, frame)
    setPixel(grid, 11, 5, frame)
    setPixel(grid, 4, 5, arc)
    setPixel(grid, 5, 5, hot)
    setPixel(grid, 6, 5, arc)
    setPixel(grid, 7, 5, arc)
    setPixel(grid, 8, 5, hot)
    setPixel(grid, 9, 5, arc)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 6, glass)
    setPixel(grid, 2, 6, frame)
    setPixel(grid, 11, 6, frame)
    setPixel(grid, 5, 6, glassDeep)
    setPixel(grid, 6, 6, arc)
    setPixel(grid, 7, 6, arc)
    setPixel(grid, 8, 6, glassDeep)
    setPixel(grid, 3, 7, frame)
    setPixel(grid, 10, 7, frame)
  } else if (accVariant === 26) {
    // LEGENDARY: Leviathan's Regard - scaled plate with gill slits and gold crest.
    // Crest tip lands on x 6-7 at row 2, the only span the narrow round head
    // occupies there, so it stays anchored on all three shapes
    const scaleDark = "#11313a"
    const plate = "#1d5a63"
    const edge = "#37a08e"
    const glow = "#9ffff0"
    const gold = "#d8b45a"
    setPixel(grid, 6, 2, gold)
    setPixel(grid, 7, 2, gold)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 3, plate)
    setPixel(grid, 6, 3, gold)
    setPixel(grid, 7, 3, gold)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 4, scaleDark)
    setPixel(grid, 4, 4, edge)
    setPixel(grid, 9, 4, edge)
    setPixel(grid, 3, 5, scaleDark)
    setPixel(grid, 4, 5, glow)
    setPixel(grid, 5, 5, glow)
    setPixel(grid, 6, 5, scaleDark)
    setPixel(grid, 7, 5, scaleDark)
    setPixel(grid, 8, 5, glow)
    setPixel(grid, 9, 5, glow)
    setPixel(grid, 10, 5, scaleDark)
    setPixel(grid, 3, 6, edge)
    setPixel(grid, 4, 6, plate)
    setPixel(grid, 9, 6, plate)
    setPixel(grid, 10, 6, edge)
    setPixel(grid, 3, 7, edge)
    setPixel(grid, 10, 7, edge)
    setPixel(grid, 3, 8, scaleDark)
    setPixel(grid, 10, 8, scaleDark)
  } else if (accVariant === 27) {
    // MYTHIC: Tidecaller's Visage - full-face mask. Rows 5-8 span the union
    // extent so no head shape leaks skin through the covering
    const abyss = "#0b2030"
    const deep = "#14415e"
    const tide = "#2b7fa8"
    const foam = "#7fd0e8"
    const crest = "#d8f6ff"
    for (let x = 5; x <= 8; x++) setPixel(grid, x, 2, crest)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 3, deep)
    setPixel(grid, 6, 3, crest)
    setPixel(grid, 7, 3, crest)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 4, abyss)
    setPixel(grid, 4, 4, tide)
    setPixel(grid, 9, 4, tide)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 5, deep)
    setPixel(grid, 2, 5, tide)
    setPixel(grid, 11, 5, tide)
    setPixel(grid, 4, 5, foam)
    setPixel(grid, 5, 5, foam)
    setPixel(grid, 6, 5, abyss)
    setPixel(grid, 7, 5, abyss)
    setPixel(grid, 8, 5, foam)
    setPixel(grid, 9, 5, foam)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 6, tide)
    setPixel(grid, 5, 6, crest)
    setPixel(grid, 8, 6, crest)
    setPixel(grid, 6, 6, deep)
    setPixel(grid, 7, 6, deep)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 7, deep)
    setPixel(grid, 4, 7, foam)
    setPixel(grid, 9, 7, foam)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 8, tide)
    setPixel(grid, 2, 8, deep)
    setPixel(grid, 11, 8, deep)
    for (let x = 5; x <= 8; x++) setPixel(grid, x, 8, abyss)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 9, deep)
    setPixel(grid, 6, 9, foam)
    setPixel(grid, 7, 9, foam)
    setPixel(grid, 6, 10, tide)
    setPixel(grid, 7, 10, tide)
  }
  
  // Draw hat
  // Variants: 0=none, 1=cap, 2=hood, 3=antenna, 4=horns, 5=halo, 6=crown
  if (hatVariant === 1) {
    // Cap
    const capColor = "#4050a0"
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, capColor)
      setPixel(grid, x, 1, capColor)
    }
    // Brim
    for (let x = 1; x < 8; x++) {
      setPixel(grid, x, 2, capColor)
    }
  } else if (hatVariant === 2) {
    // Hood - frames the face with curved opening
    const hoodOuter = "#505060"
    const hoodInner = "#404050"
    const hoodDeep = "#303040"
    // Top curve of hood
    setPixel(grid, 4, 0, hoodOuter)
    setPixel(grid, 5, 0, hoodOuter)
    setPixel(grid, 6, 0, hoodOuter)
    setPixel(grid, 7, 0, hoodOuter)
    setPixel(grid, 8, 0, hoodOuter)
    setPixel(grid, 9, 0, hoodOuter)
    // Second row - hood curves down at edges
    setPixel(grid, 2, 1, hoodOuter)
    setPixel(grid, 3, 1, hoodOuter)
    setPixel(grid, 10, 1, hoodOuter)
    setPixel(grid, 11, 1, hoodOuter)
    // Inner shadow of hood opening (top)
    setPixel(grid, 4, 1, hoodInner)
    setPixel(grid, 5, 1, hoodDeep)
    setPixel(grid, 6, 1, hoodDeep)
    setPixel(grid, 7, 1, hoodDeep)
    setPixel(grid, 8, 1, hoodDeep)
    setPixel(grid, 9, 1, hoodInner)
    // Left side frame curving around face
    setPixel(grid, 1, 2, hoodOuter)
    setPixel(grid, 2, 2, hoodInner)
    setPixel(grid, 3, 2, hoodDeep)
    setPixel(grid, 1, 3, hoodOuter)
    setPixel(grid, 2, 3, hoodInner)
    setPixel(grid, 1, 4, hoodOuter)
    setPixel(grid, 2, 4, hoodInner)
    setPixel(grid, 1, 5, hoodInner)
    // Right side frame curving around face
    setPixel(grid, 12, 2, hoodOuter)
    setPixel(grid, 11, 2, hoodInner)
    setPixel(grid, 10, 2, hoodDeep)
    setPixel(grid, 12, 3, hoodOuter)
    setPixel(grid, 11, 3, hoodInner)
    setPixel(grid, 12, 4, hoodOuter)
    setPixel(grid, 11, 4, hoodInner)
    setPixel(grid, 12, 5, hoodInner)
  } else if (hatVariant === 3) {
    // Antenna
    const antennaColor = "#808080"
    const tipColor = "#ff6060"
    setPixel(grid, 7, 0, tipColor)
    setPixel(grid, 7, 1, antennaColor)
  } else if (hatVariant === 4) {
    // Horns
    const hornColor = "#a06040"
    setPixel(grid, 3, 0, hornColor)
    setPixel(grid, 3, 1, hornColor)
    setPixel(grid, 2, 0, hornColor)
    setPixel(grid, 10, 0, hornColor)
    setPixel(grid, 10, 1, hornColor)
    setPixel(grid, 11, 0, hornColor)
  } else if (hatVariant === 5) {
    // Halo
    const haloColor = "#f0d860"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 0, haloColor)
    }
    setPixel(grid, 3, 1, haloColor)
    setPixel(grid, 10, 1, haloColor)
  } else if (hatVariant === 6) {
    // Crown
    const crownColor = "#d4a030"
    const gemColor = "#e04040"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, crownColor)
    }
    setPixel(grid, 4, 0, crownColor)
    setPixel(grid, 7, 0, gemColor)
    setPixel(grid, 10, 0, crownColor)
  } else if (hatVariant === 7) {
    // Dust Hood - deep cowl that frames face with heavy shadow
    const hoodOuter = "#6b5a4a"
    const hoodMid = "#5a4a3a"
    const hoodInner = "#4a3a2a"
    const hoodDeep = "#3a2a1a"
    // Top of hood - wider coverage
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 0, hoodOuter)
    }
    // Second row - hood extends wider
    setPixel(grid, 1, 1, hoodOuter)
    setPixel(grid, 2, 1, hoodOuter)
    setPixel(grid, 11, 1, hoodOuter)
    setPixel(grid, 12, 1, hoodOuter)
    // Inner shadow at top of face opening
    setPixel(grid, 3, 1, hoodMid)
    setPixel(grid, 4, 1, hoodInner)
    setPixel(grid, 5, 1, hoodDeep)
    setPixel(grid, 6, 1, hoodDeep)
    setPixel(grid, 7, 1, hoodDeep)
    setPixel(grid, 8, 1, hoodDeep)
    setPixel(grid, 9, 1, hoodInner)
    setPixel(grid, 10, 1, hoodMid)
    // Left side - thick frame curving around face
    setPixel(grid, 0, 2, hoodOuter)
    setPixel(grid, 1, 2, hoodMid)
    setPixel(grid, 2, 2, hoodInner)
    setPixel(grid, 3, 2, hoodDeep)
    setPixel(grid, 0, 3, hoodOuter)
    setPixel(grid, 1, 3, hoodMid)
    setPixel(grid, 2, 3, hoodInner)
    setPixel(grid, 0, 4, hoodOuter)
    setPixel(grid, 1, 4, hoodMid)
    setPixel(grid, 2, 4, hoodInner)
    setPixel(grid, 0, 5, hoodMid)
    setPixel(grid, 1, 5, hoodInner)
    setPixel(grid, 0, 6, hoodInner)
    // Right side - thick frame curving around face
    setPixel(grid, 13, 2, hoodOuter)
    setPixel(grid, 12, 2, hoodMid)
    setPixel(grid, 11, 2, hoodInner)
    setPixel(grid, 10, 2, hoodDeep)
    setPixel(grid, 13, 3, hoodOuter)
    setPixel(grid, 12, 3, hoodMid)
    setPixel(grid, 11, 3, hoodInner)
    setPixel(grid, 13, 4, hoodOuter)
    setPixel(grid, 12, 4, hoodMid)
    setPixel(grid, 11, 4, hoodInner)
    setPixel(grid, 13, 5, hoodMid)
    setPixel(grid, 12, 5, hoodInner)
    setPixel(grid, 13, 6, hoodInner)
  } else if (hatVariant === 8) {
    // Signal Beanie (tight cap)
    const beanieColor = "#4a6080"
    const stripeColor = "#6080a0"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 0, beanieColor)
      setPixel(grid, x, 1, stripeColor)
      setPixel(grid, x, 2, beanieColor)
    }
  } else if (hatVariant === 9) {
    // Worn Helmet (protective headgear)
    const helmetColor = "#606060"
    const visorColor = "#405060"
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, helmetColor)
      setPixel(grid, x, 1, helmetColor)
    }
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 2, visorColor)
    }
  } else if (hatVariant === 10) {
    // Relay Headset (tech headphones)
    const bandColor = "#404040"
    const earColor = "#505060"
    const lightColor = "#40ff80"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 0, bandColor)
    }
    setPixel(grid, 2, 3, earColor)
    setPixel(grid, 2, 4, earColor)
    setPixel(grid, 2, 5, earColor)
    setPixel(grid, 1, 4, lightColor)
    setPixel(grid, 11, 3, earColor)
    setPixel(grid, 11, 4, earColor)
    setPixel(grid, 11, 5, earColor)
    setPixel(grid, 12, 4, lightColor)
  } else if (hatVariant === 11) {
    // Archive Hood (mystical hood)
    const hoodColor = "#3a3050"
    const runeColor = "#8060c0"
    for (let x = 1; x < 13; x++) {
      setPixel(grid, x, 0, hoodColor)
      setPixel(grid, x, 1, hoodColor)
    }
    setPixel(grid, 1, 2, hoodColor)
    setPixel(grid, 12, 2, hoodColor)
    setPixel(grid, 1, 3, hoodColor)
    setPixel(grid, 12, 3, hoodColor)
    // Rune on forehead
    setPixel(grid, 6, 1, runeColor)
    setPixel(grid, 7, 1, runeColor)
  } else if (hatVariant === 12) {
    // Scout Helm (light helmet with visor)
    const helmColor = "#708060"
    const visorColor = "#a0c090"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 0, helmColor)
      setPixel(grid, x, 1, helmColor)
    }
    setPixel(grid, 2, 1, helmColor)
    setPixel(grid, 11, 1, helmColor)
    for (let x = 2; x < 7; x++) {
      setPixel(grid, x, 2, visorColor)
    }
  } else if (hatVariant === 13) {
    // Drift Crown (ethereal crown)
    const crownColor = "#80a0c0"
    const glowColor = "#a0d0ff"
    setPixel(grid, 4, 0, glowColor)
    setPixel(grid, 7, 0, glowColor)
    setPixel(grid, 10, 0, glowColor)
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, crownColor)
    }
  } else if (hatVariant === 14) {
    // Echo Circlet (glowing band)
    const bandColor = "#606080"
    const gemColor = "#60ffff"
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, bandColor)
    }
    setPixel(grid, 6, 1, gemColor)
    setPixel(grid, 7, 1, gemColor)
    setPixel(grid, 6, 0, gemColor)
    setPixel(grid, 7, 0, gemColor)
  } else if (hatVariant === 15) {
    // Signal Crest (decorative headpiece)
    const crestColor = "#c0a060"
    const accentColor = "#ffe0a0"
    setPixel(grid, 6, 0, accentColor)
    setPixel(grid, 7, 0, accentColor)
    setPixel(grid, 5, 1, crestColor)
    setPixel(grid, 6, 1, crestColor)
    setPixel(grid, 7, 1, crestColor)
    setPixel(grid, 8, 1, crestColor)
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 2, crestColor)
    }
  } else if (hatVariant === 16) {
    // Void Helm (dark with purple glow)
    const helmColor = "#201830"
    const glowColor = "#8040c0"
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, helmColor)
      setPixel(grid, x, 1, helmColor)
      setPixel(grid, x, 2, helmColor)
    }
    setPixel(grid, 6, 0, glowColor)
    setPixel(grid, 7, 0, glowColor)
    setPixel(grid, 2, 2, glowColor)
    setPixel(grid, 11, 2, glowColor)
  } else if (hatVariant === 17) {
    // Rift Diadem (mystical tiara)
    const diademColor = "#6050a0"
    const crystalColor = "#c0a0ff"
    const glowColor = "#e0d0ff"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 1, diademColor)
    }
    setPixel(grid, 5, 0, crystalColor)
    setPixel(grid, 6, 0, glowColor)
    setPixel(grid, 7, 0, glowColor)
    setPixel(grid, 8, 0, crystalColor)
  } else if (hatVariant === 18) {
    // Primordial Antlers (legendary antlers)
    const antlerColor = "#8b6b4b"
    const tipColor = "#d0c0a0"
    // Left antler
    setPixel(grid, 2, 0, tipColor)
    setPixel(grid, 3, 0, antlerColor)
    setPixel(grid, 3, 1, antlerColor)
    setPixel(grid, 4, 1, antlerColor)
    setPixel(grid, 1, 1, tipColor)
    // Right antler
    setPixel(grid, 11, 0, tipColor)
    setPixel(grid, 10, 0, antlerColor)
    setPixel(grid, 10, 1, antlerColor)
    setPixel(grid, 9, 1, antlerColor)
    setPixel(grid, 12, 1, tipColor)
  } else if (hatVariant === 19) {
    // MYTHIC: Crown of the Relay Sea (ocean crown with waves)
    const deepBlue = "#1a4060"
    const waveBlue = "#40a0d0"
    const foamWhite = "#c0e8ff"
    const shimmer = "#80ffff"
    // Crown base
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, deepBlue)
    }
    // Wave spikes
    setPixel(grid, 4, 0, waveBlue)
    setPixel(grid, 5, 0, foamWhite)
    setPixel(grid, 7, 0, shimmer)
    setPixel(grid, 8, 0, foamWhite)
    setPixel(grid, 10, 0, waveBlue)
    // Droplets above
    setPixel(grid, 6, 0, shimmer)
  } else if (hatVariant === 20) {
    // MYTHIC: Shardheart Coronet (crystalline crown)
    const crystalPink = "#ff80c0"
    const crystalPurple = "#c060e0"
    const crystalGlow = "#ffa0e0"
    const shardCore = "#e0c0ff"
    // Base band
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, crystalPurple)
    }
    // Crystal spires
    setPixel(grid, 4, 0, crystalPink)
    setPixel(grid, 5, 0, crystalGlow)
    setPixel(grid, 6, 0, shardCore)
    setPixel(grid, 7, 0, crystalGlow)
    setPixel(grid, 8, 0, crystalPink)
    setPixel(grid, 9, 0, crystalGlow)
    // Floating shards
    setPixel(grid, 3, 0, crystalGlow)
    setPixel(grid, 10, 0, crystalGlow)
  } else if (hatVariant === 21) {
    // MYTHIC: Eternal Courier's Crest (golden time crown)
    const goldDark = "#a07020"
    const goldBright = "#ffd060"
    const goldGlow = "#ffe8a0"
    const amberCore = "#ffb040"
    // Crown base with trails
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, goldDark)
    }
    // Central crest
    setPixel(grid, 6, 0, goldGlow)
    setPixel(grid, 7, 0, goldGlow)
    setPixel(grid, 5, 0, goldBright)
    setPixel(grid, 8, 0, goldBright)
    // Trailing light
    setPixel(grid, 3, 0, amberCore)
    setPixel(grid, 10, 0, amberCore)
    setPixel(grid, 2, 1, goldGlow)
    setPixel(grid, 11, 1, goldGlow)
  } else if (hatVariant === 22) {
    // MYTHIC: Voidtouched Halo (dark halo with void energy)
    const voidBlack = "#0a0810"
    const voidPurple = "#6030a0"
    const voidGlow = "#a060ff"
    const voidBright = "#d0a0ff"
    // Dark halo ring
    setPixel(grid, 3, 0, voidPurple)
    setPixel(grid, 4, 0, voidGlow)
    setPixel(grid, 5, 0, voidBright)
    setPixel(grid, 6, 0, voidGlow)
    setPixel(grid, 7, 0, voidGlow)
    setPixel(grid, 8, 0, voidBright)
    setPixel(grid, 9, 0, voidGlow)
    setPixel(grid, 10, 0, voidPurple)
    // Void tendrils
    setPixel(grid, 2, 1, voidBlack)
    setPixel(grid, 11, 1, voidBlack)
    setPixel(grid, 1, 0, voidGlow)
    setPixel(grid, 12, 0, voidGlow)
  } else if (hatVariant === 23) {
    // MYTHIC: Primordial Echo Crown (ancient runic crown)
    const runeGlow = "#40ffb0"
    const runeDark = "#206050"
    const runeAncient = "#80ffd0"
    const runeCore = "#60ffc0"
    // Crown base
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, runeDark)
    }
    // Runic spires
    setPixel(grid, 4, 0, runeGlow)
    setPixel(grid, 5, 0, runeAncient)
    setPixel(grid, 6, 0, runeCore)
    setPixel(grid, 7, 0, runeCore)
    setPixel(grid, 8, 0, runeAncient)
    setPixel(grid, 9, 0, runeGlow)
    // Floating runes
    setPixel(grid, 2, 0, runeAncient)
    setPixel(grid, 11, 0, runeAncient)
  } else if (hatVariant === 24) {
    // Reed Hat (common) - woven conical hat with a wide brim.
    // Row 0 must carry real mass: at 2px the shape read as a hair fringe rather
    // than headwear in the live app (the existing Route Cap uses 10px on row 0).
    const reed = "#c9a86a"
    const reedMid = "#b8975a"
    const reedDark = "#8a6f3f"
    for (let x = 5; x <= 8; x++) setPixel(grid, x, 0, reedMid)
    setPixel(grid, 6, 0, reed)
    setPixel(grid, 7, 0, reed)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 1, reedMid)
    setPixel(grid, 5, 1, reed)
    setPixel(grid, 8, 1, reed)
    // Wide brim - the silhouette cue that makes this read as a hat
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 2, reedDark)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 2, reedMid)
  } else if (hatVariant === 25) {
    // Lantern Rig (uncommon) - headband with a side-mounted lamp
    const strap = "#3a3f4a"
    const metal = "#7b8290"
    const metalHi = "#aab2c0"
    const bulb = "#ffc861"
    const glow = "#fff4d0"
    // Strap spans the full head width so the rig reads as worn hardware
    for (let x = 3; x <= 10; x++) {
      setPixel(grid, x, 1, strap)
      setPixel(grid, x, 2, strap)
    }
    setPixel(grid, 3, 2, metal)
    setPixel(grid, 10, 2, metal)
    // Lamp housing sits ABOVE the strap and offset to one side. Previously the
    // warm lamp pixels overlapped the dark strap and averaged out to a grey
    // blob at small sizes; keeping the bulb clear of the strap preserves it.
    setPixel(grid, 5, 0, metal)
    setPixel(grid, 6, 0, metalHi)
    setPixel(grid, 7, 0, metal)
    setPixel(grid, 5, 1, metalHi)
    setPixel(grid, 6, 1, bulb)
    setPixel(grid, 7, 1, glow)
    setPixel(grid, 6, 2, glow)
    setPixel(grid, 7, 2, bulb)
  } else if (hatVariant === 26) {
    // Deepline Coil (rare) - copper line spool with hooks at the temples
    const copper = "#b0713a"
    const copperHi = "#e0a566"
    const line = "#cfc6b0"
    const hook = "#9aa5b0"
    // Spool crown widened on row 0 so the shape reads as a hat rather than hair
    for (let x = 5; x <= 8; x++) setPixel(grid, x, 0, copper)
    setPixel(grid, 6, 0, copperHi)
    setPixel(grid, 7, 0, copperHi)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 1, copper)
    setPixel(grid, 5, 1, copperHi)
    setPixel(grid, 8, 1, copperHi)
    // Wound line sits on row 1, keeping row 2 free so the forehead stays visible
    setPixel(grid, 6, 1, line)
    setPixel(grid, 7, 1, line)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 2, copper)
    setPixel(grid, 2, 2, hook)
    setPixel(grid, 11, 2, hook)
  } else if (hatVariant === 27) {
    // EPIC: Stormglass Crown - gapped spires for a jagged silhouette
    const glassDark = "#23324f"
    const glass = "#3f6ea8"
    const arc = "#a8dcff"
    const hot = "#ffffff"
    setPixel(grid, 3, 0, glass)
    setPixel(grid, 5, 0, arc)
    setPixel(grid, 7, 0, hot)
    setPixel(grid, 9, 0, arc)
    setPixel(grid, 10, 0, glass)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 1, glassDark)
    setPixel(grid, 5, 1, glass)
    setPixel(grid, 8, 1, glass)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 2, glass)
    setPixel(grid, 6, 2, hot)
    setPixel(grid, 7, 2, hot)
  } else if (hatVariant === 28) {
    // LEGENDARY: Kelpwarden Wreath - living kelp with amber floats
    const kelpDark = "#1f4a33"
    const kelp = "#327a4f"
    const kelpLight = "#5fb87a"
    const amber = "#e8a13c"
    const amberHi = "#ffd98a"
    setPixel(grid, 4, 0, kelp)
    setPixel(grid, 5, 0, kelpLight)
    setPixel(grid, 6, 0, kelpDark)
    setPixel(grid, 7, 0, kelpDark)
    setPixel(grid, 8, 0, kelpLight)
    setPixel(grid, 9, 0, kelp)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 1, kelp)
    setPixel(grid, 4, 1, kelpDark)
    setPixel(grid, 9, 1, kelpDark)
    setPixel(grid, 6, 1, kelpLight)
    setPixel(grid, 7, 1, kelpLight)
    for (let x = 4; x <= 9; x++) setPixel(grid, x, 2, kelpDark)
    setPixel(grid, 5, 2, kelp)
    setPixel(grid, 8, 2, kelp)
    setPixel(grid, 3, 2, amber)
    setPixel(grid, 10, 2, amber)
    setPixel(grid, 3, 3, amberHi)
    setPixel(grid, 10, 3, amberHi)
  } else if (hatVariant === 29) {
    // MYTHIC: Abyssal Diadem - widest silhouette, lumen points and gold inlay
    const abyss = "#0a1622"
    const voidBlue = "#16304a"
    const tide = "#2a6f96"
    const lumen = "#6fe0f0"
    const pearl = "#eafdff"
    const gold = "#d9c07a"
    setPixel(grid, 2, 0, lumen)
    setPixel(grid, 3, 0, tide)
    setPixel(grid, 5, 0, pearl)
    setPixel(grid, 6, 0, lumen)
    setPixel(grid, 7, 0, lumen)
    setPixel(grid, 8, 0, pearl)
    setPixel(grid, 10, 0, tide)
    setPixel(grid, 11, 0, lumen)
    for (let x = 2; x <= 11; x++) setPixel(grid, x, 1, voidBlue)
    setPixel(grid, 4, 1, tide)
    setPixel(grid, 9, 1, tide)
    setPixel(grid, 6, 1, gold)
    setPixel(grid, 7, 1, gold)
    for (let x = 3; x <= 10; x++) setPixel(grid, x, 2, abyss)
    setPixel(grid, 5, 2, lumen)
    setPixel(grid, 8, 2, lumen)
    setPixel(grid, 6, 2, gold)
    setPixel(grid, 7, 2, gold)
    setPixel(grid, 4, 3, tide)
    setPixel(grid, 9, 3, tide)
    setPixel(grid, 6, 3, gold)
    setPixel(grid, 7, 3, gold)
  }
  
  return grid
}

// Darken a hex color by a factor
function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  const newR = Math.floor(r * (1 - factor))
  const newG = Math.floor(g * (1 - factor))
  const newB = Math.floor(b * (1 - factor))
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
