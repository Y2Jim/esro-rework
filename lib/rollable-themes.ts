import type { RollableUITheme, Rarity } from "./types"

export const ROLLABLE_THEMES: RollableUITheme[] = [
  // Common Themes (2)
  {
    id: "terminal_green",
    label: "Terminal Green",
    description: "Classic retro terminal aesthetic with phosphor green glow.",
    rarity: "common",
    colors: {
      accent: "#30d060",
      accentBright: "#50ff80",
      background: "#0a100a",
      panel: "#101810",
    },
    unlocked: false,
  },
  {
    id: "blood_moon",
    label: "Blood Moon",
    description: "Deep crimson tones inspired by the red eclipse.",
    rarity: "common",
    colors: {
      accent: "#c04040",
      accentBright: "#ff5050",
      background: "#100808",
      panel: "#180a0a",
    },
    unlocked: false,
  },

  // Uncommon Themes (2)
  {
    id: "ocean_depths",
    label: "Ocean Depths",
    description: "Calm blue-green hues from the abyssal trenches.",
    rarity: "uncommon",
    colors: {
      accent: "#2090a0",
      accentBright: "#40c8e0",
      background: "#080c10",
      panel: "#0a1018",
    },
    unlocked: false,
  },
  {
    id: "golden_archive",
    label: "Golden Archive",
    description: "Warm amber tones of ancient recorded knowledge.",
    rarity: "uncommon",
    colors: {
      accent: "#c09030",
      accentBright: "#f0c050",
      background: "#100c08",
      panel: "#181208",
    },
    unlocked: false,
  },

  // Rare Themes (2)
  {
    id: "void_static",
    label: "Void Static",
    description: "Unsettling purple interference from beyond the signal.",
    rarity: "rare",
    colors: {
      accent: "#8050a0",
      accentBright: "#b080e0",
      background: "#0a0810",
      panel: "#100a18",
    },
    unlocked: false,
  },
  {
    id: "aurora_drift",
    label: "Aurora Drift",
    description: "Shifting cyan-magenta gradients of the northern lights.",
    rarity: "rare",
    colors: {
      accent: "#40a0b0",
      accentBright: "#60d0e8",
      background: "#08080c",
      panel: "#0c1014",
    },
    unlocked: false,
  },

  // Epic Themes (2)
  {
    id: "ember_core",
    label: "Ember Core",
    description: "Molten orange radiating from deep within the earth.",
    rarity: "epic",
    colors: {
      accent: "#e07020",
      accentBright: "#ff9040",
      background: "#100804",
      panel: "#181008",
    },
    unlocked: false,
  },
  {
    id: "crystal_lattice",
    label: "Crystal Lattice",
    description: "Prismatic pink-white crystalline structure patterns.",
    rarity: "epic",
    colors: {
      accent: "#d060a0",
      accentBright: "#ff90d0",
      background: "#0c0810",
      panel: "#140c18",
    },
    unlocked: false,
  },

  // Legendary Theme (1)
  {
    id: "neon_pulse",
    label: "Neon Pulse",
    description: "Cyberpunk-inspired electric blue with vivid contrast.",
    rarity: "legendary",
    colors: {
      accent: "#00c8ff",
      accentBright: "#40e8ff",
      background: "#040810",
      panel: "#081018",
    },
    unlocked: false,
  },

  // Mythic Theme (1)
  {
    id: "primordial_glow",
    label: "Primordial Glow",
    description: "Ancient emerald luminescence from before the relay age.",
    rarity: "mythic",
    colors: {
      accent: "#30e0a0",
      accentBright: "#60ffcc",
      background: "#040c0a",
      panel: "#081410",
    },
    unlocked: false,
  },
]

export function getThemeById(id: string): RollableUITheme | undefined {
  return ROLLABLE_THEMES.find((t) => t.id === id)
}

export function getThemesByRarity(rarity: Rarity): RollableUITheme[] {
  return ROLLABLE_THEMES.filter((t) => t.rarity === rarity)
}
