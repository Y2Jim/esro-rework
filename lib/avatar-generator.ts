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

// Layer variant counts
export const LAYER_VARIANTS: Record<AvatarLayerType, number> = {
  base: 3,
  skin: SKIN_COLORS.length,
  eyes: 6,
  mouth: 5,
  hair: 8,
  accessory: 6,
  hat: 7,
  flair: 4,
}

// Generate avatar config from seed
export function generateAvatarFromSeed(seed: string): AvatarConfig {
  const safeSeed = seed || "default"
  const rand = seededRandom(safeSeed)
  
  const layers: AvatarLayer[] = [
    { type: "base", variant: Math.floor(rand() * LAYER_VARIANTS.base) },
    { type: "skin", variant: Math.floor(rand() * LAYER_VARIANTS.skin) },
    { type: "eyes", variant: Math.floor(rand() * LAYER_VARIANTS.eyes), color: Math.floor(rand() * EYE_COLORS.length) },
    { type: "mouth", variant: Math.floor(rand() * LAYER_VARIANTS.mouth) },
    { type: "hair", variant: Math.floor(rand() * LAYER_VARIANTS.hair), color: Math.floor(rand() * HAIR_COLORS.length) },
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
  const mouthLayer = getLayer(config, "mouth")
  const hairLayer = getLayer(config, "hair")
  const accessoryLayer = getLayer(config, "accessory")
  const hatLayer = getLayer(config, "hat")
  
  const skinColor = SKIN_COLORS[skinLayer?.variant ?? 0]
  const skinShadow = darkenColor(skinColor, 0.15)
  const hairColor = HAIR_COLORS[hairLayer?.color ?? 0]
  const eyeColor = EYE_COLORS[eyesLayer?.color ?? 0]
  const eyeWhite = "#f0f0f0"
  const mouthColor = "#4a2a2a"
  const outlineColor = "#1a1a1a"
  
  const baseVariant = baseLayer?.variant ?? 0
  const eyesVariant = eyesLayer?.variant ?? 0
  const mouthVariant = mouthLayer?.variant ?? 0
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
    // Normal eyes - 2 wide with pupil
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
  } else if (eyesVariant === 1) {
    // Wide eyes - larger whites
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY, eyeWhite)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
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
    // Big eyes - 2x2
    setPixel(grid, leftEyeX, eyeY - 1, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY - 1, eyeWhite)
    setPixel(grid, leftEyeX, eyeY, eyeWhite)
    setPixel(grid, leftEyeX + 1, eyeY, eyeColor)
    setPixel(grid, rightEyeX, eyeY - 1, eyeWhite)
    setPixel(grid, rightEyeX + 1, eyeY - 1, eyeWhite)
    setPixel(grid, rightEyeX, eyeY, eyeColor)
    setPixel(grid, rightEyeX + 1, eyeY, eyeWhite)
  }
  
  // Draw mouth - clear shapes
  // Mouth variants: 0=neutral, 1=smile, 2=small, 3=open, 4=frown
  const mouthY = 8
  
  if (mouthVariant === 0) {
    // Neutral line
    setPixel(grid, 5, mouthY, mouthColor)
    setPixel(grid, 6, mouthY, mouthColor)
    setPixel(grid, 7, mouthY, mouthColor)
    setPixel(grid, 8, mouthY, mouthColor)
  } else if (mouthVariant === 1) {
    // Smile - curved up
    setPixel(grid, 5, mouthY, mouthColor)
    setPixel(grid, 6, mouthY + 1, mouthColor)
    setPixel(grid, 7, mouthY + 1, mouthColor)
    setPixel(grid, 8, mouthY, mouthColor)
  } else if (mouthVariant === 2) {
    // Small/pursed
    setPixel(grid, 6, mouthY, mouthColor)
    setPixel(grid, 7, mouthY, mouthColor)
  } else if (mouthVariant === 3) {
    // Open mouth
    setPixel(grid, 5, mouthY, mouthColor)
    setPixel(grid, 6, mouthY, "#2a1a1a")
    setPixel(grid, 7, mouthY, "#2a1a1a")
    setPixel(grid, 8, mouthY, mouthColor)
    setPixel(grid, 6, mouthY + 1, mouthColor)
    setPixel(grid, 7, mouthY + 1, mouthColor)
  } else {
    // Frown - curved down
    setPixel(grid, 5, mouthY + 1, mouthColor)
    setPixel(grid, 6, mouthY, mouthColor)
    setPixel(grid, 7, mouthY, mouthColor)
    setPixel(grid, 8, mouthY + 1, mouthColor)
  }
  
  // Draw hair
  // Hair variants: 0=none, 1=short, 2=spiky, 3=side part, 4=long, 5=mohawk, 6=bangs, 7=curly
  if (hairVariant === 1) {
    // Short hair - top coverage
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 3, 2, hairColor)
    setPixel(grid, 10, 2, hairColor)
  } else if (hairVariant === 2) {
    // Spiky hair
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 4, 1, hairColor)
    setPixel(grid, 6, 0, hairColor)
    setPixel(grid, 7, 1, hairColor)
    setPixel(grid, 9, 0, hairColor)
  } else if (hairVariant === 3) {
    // Side part
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 3, 3, hairColor)
    setPixel(grid, 3, 4, hairColor)
  } else if (hairVariant === 4) {
    // Long hair
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    for (let y = 2; y < 11; y++) {
      setPixel(grid, 2, y, hairColor)
      setPixel(grid, 11, y, hairColor)
    }
  } else if (hairVariant === 5) {
    // Mohawk
    setPixel(grid, 6, 0, hairColor)
    setPixel(grid, 7, 0, hairColor)
    setPixel(grid, 6, 1, hairColor)
    setPixel(grid, 7, 1, hairColor)
    setPixel(grid, 6, 2, hairColor)
    setPixel(grid, 7, 2, hairColor)
  } else if (hairVariant === 6) {
    // Bangs
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 1, hairColor)
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 4, 3, hairColor)
    setPixel(grid, 5, 3, hairColor)
    setPixel(grid, 6, 4, hairColor)
  } else if (hairVariant === 7) {
    // Curly/afro
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, hairColor)
      setPixel(grid, x, 1, hairColor)
    }
    for (let x = 3; x < 11; x++) {
      setPixel(grid, x, 2, hairColor)
    }
    setPixel(grid, 2, 2, hairColor)
    setPixel(grid, 11, 2, hairColor)
    setPixel(grid, 2, 3, hairColor)
    setPixel(grid, 11, 3, hairColor)
  }
  
  // Draw accessory
  // Variants: 0=none, 1=glasses, 2=eyepatch, 3=scar, 4=visor, 5=mask
  if (accVariant === 1) {
    // Glasses
    const glassColor = "#1a1a1a"
    const lensColor = "#8ab8d8"
    // Left lens
    setPixel(grid, 3, 5, glassColor)
    setPixel(grid, 4, 4, glassColor)
    setPixel(grid, 5, 4, glassColor)
    setPixel(grid, 6, 5, glassColor)
    setPixel(grid, 4, 5, lensColor)
    setPixel(grid, 5, 5, lensColor)
    // Bridge
    setPixel(grid, 6, 5, glassColor)
    setPixel(grid, 7, 5, glassColor)
    // Right lens
    setPixel(grid, 8, 4, glassColor)
    setPixel(grid, 9, 4, glassColor)
    setPixel(grid, 7, 5, glassColor)
    setPixel(grid, 10, 5, glassColor)
    setPixel(grid, 8, 5, lensColor)
    setPixel(grid, 9, 5, lensColor)
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
  } else if (accVariant === 5) {
    // Face mask
    const maskColor = "#404050"
    for (let x = 4; x < 10; x++) {
      setPixel(grid, x, 7, maskColor)
      setPixel(grid, x, 8, maskColor)
      setPixel(grid, x, 9, maskColor)
    }
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
    // Hood
    const hoodColor = "#505060"
    for (let x = 2; x < 12; x++) {
      setPixel(grid, x, 0, hoodColor)
      setPixel(grid, x, 1, hoodColor)
    }
    setPixel(grid, 1, 1, hoodColor)
    setPixel(grid, 12, 1, hoodColor)
    setPixel(grid, 1, 2, hoodColor)
    setPixel(grid, 12, 2, hoodColor)
    setPixel(grid, 1, 3, hoodColor)
    setPixel(grid, 12, 3, hoodColor)
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
