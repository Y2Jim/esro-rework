import type { RollableUITheme, Rarity } from "./types"

/**
 * Rollable UI Themes - Each theme is visually distinct with no color overlap.
 * Higher rarity themes have more visual effects and intensity.
 * 
 * Color families used (no overlap):
 * - Common: Warm gray (ash), Sepia brown (parchment)
 * - Uncommon: Forest green (moss), Steel blue (iron)
 * - Rare: Deep magenta (void), Burnt orange (rust)
 * - Epic: Electric violet (storm), Rose gold (bloom)
 * - Legendary: Cyan plasma (neon)
 * - Mythic: Ethereal white-gold (radiant)
 */

export const ROLLABLE_THEMES: RollableUITheme[] = [
  // ============ COMMON THEMES ============
  // Simple color changes, no special effects, intensity 1.0
  {
    id: "terminal_green",
    label: "Ash Terminal",
    description: "Muted gray-green tones of old relay monitors.",
    rarity: "common",
    colors: {
      accent: "#7a8a7a",
      accentBright: "#9aaa9a",
      background: "#0c0d0c",
      panel: "#141614",
    },
    intensity: 1.0,
    unlocked: false,
  },
  {
    id: "blood_moon",
    label: "Worn Parchment",
    description: "Faded sepia tones of weathered documents.",
    rarity: "common",
    colors: {
      accent: "#a08060",
      accentBright: "#c0a080",
      background: "#0e0c0a",
      panel: "#161410",
    },
    intensity: 1.0,
    unlocked: false,
  },

  // ============ UNCOMMON THEMES ============
  // Slightly more vibrant, intensity 1.2
  {
    id: "ocean_depths",
    label: "Deep Moss",
    description: "Rich forest greens from the overgrown sectors.",
    rarity: "uncommon",
    colors: {
      accent: "#408040",
      accentBright: "#60b060",
      background: "#080c08",
      panel: "#0c140c",
    },
    intensity: 1.2,
    unlocked: false,
  },
  {
    id: "golden_archive",
    label: "Cold Iron",
    description: "Heartless steel blue of salvaged machinery.",
    rarity: "uncommon",
    colors: {
      accent: "#6080a0",
      accentBright: "#80a0c0",
      background: "#08090c",
      panel: "#0c1014",
    },
    intensity: 1.2,
    unlocked: false,
  },

  // ============ RARE THEMES ============
  // More saturated colors, secondary accent, intensity 1.4
  {
    id: "void_static",
    label: "Void Bloom",
    description: "Deep magenta interference patterns from corrupted relays.",
    rarity: "rare",
    colors: {
      accent: "#a030a0",
      accentBright: "#d050d0",
      background: "#0c060c",
      panel: "#140a14",
      secondary: "#ff60ff",
    },
    intensity: 1.4,
    unlocked: false,
  },
  {
    id: "aurora_drift",
    label: "Rust Drift",
    description: "Burnt orange patina of decayed infrastructure.",
    rarity: "rare",
    colors: {
      accent: "#c06030",
      accentBright: "#e08050",
      background: "#0c0806",
      panel: "#140c08",
      secondary: "#ff9060",
    },
    intensity: 1.4,
    unlocked: false,
  },

  // ============ EPIC THEMES ============
  // Vivid colors, special effect class, intensity 1.6
  {
    id: "ember_core",
    label: "Storm Violet",
    description: "Electric violet crackling with unstable energy.",
    rarity: "epic",
    colors: {
      accent: "#8040e0",
      accentBright: "#a060ff",
      background: "#080610",
      panel: "#100a1c",
      secondary: "#c080ff",
    },
    intensity: 1.6,
    effectClass: "theme-effect-pulse",
    unlocked: false,
  },
  {
    id: "crystal_lattice",
    label: "Rose Bloom",
    description: "Warm rose-gold crystalline patterns.",
    rarity: "epic",
    colors: {
      accent: "#d07080",
      accentBright: "#f090a0",
      background: "#0c0808",
      panel: "#140c10",
      secondary: "#ffb0c0",
    },
    intensity: 1.6,
    effectClass: "theme-effect-shimmer",
    unlocked: false,
  },

  // ============ LEGENDARY THEME ============
  // Intense glow, border style, intensity 1.8
  {
    id: "neon_pulse",
    label: "Neon Plasma",
    description: "Brilliant cyan plasma surging through every element.",
    rarity: "legendary",
    colors: {
      accent: "#00d0ff",
      accentBright: "#40f0ff",
      background: "#040810",
      panel: "#081018",
      secondary: "#80ffff",
    },
    intensity: 1.8,
    effectClass: "theme-effect-glow",
    borderStyle: "glow",
    unlocked: false,
  },

  // ============ MYTHIC THEME (TRANSCENDENT TIER) ============
  // Maximum intensity, shimmer border, unique animation
  {
    id: "primordial_glow",
    label: "Radiant Aether",
    description: "Transcendent white-gold luminescence from the source signal.",
    rarity: "mythic",
    colors: {
      accent: "#f0e0a0",
      accentBright: "#fffff0",
      background: "#0a0a08",
      panel: "#121210",
      secondary: "#ffffd0",
    },
    intensity: 2.0,
    effectClass: "theme-effect-radiant",
    borderStyle: "shimmer",
    unlocked: false,
  },
]

export function getThemeById(id: string): RollableUITheme | undefined {
  return ROLLABLE_THEMES.find((t) => t.id === id)
}

export function getThemesByRarity(rarity: Rarity): RollableUITheme[] {
  return ROLLABLE_THEMES.filter((t) => t.rarity === rarity)
}
