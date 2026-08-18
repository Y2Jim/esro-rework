import type { Rarity } from "./types"

/**
 * In-world names for rarity tiers. We never surface the underlying
 * "common/uncommon/..." keys to the player.
 */
export const rarityLabel: Record<Rarity, string> = {
  common: "Faded",
  uncommon: "Recovered",
  rare: "Refined",
  epic: "Legendary",
  legendary: "Iridescent",
  mythic: "Transcendent",
  admin: "Overseer",
}

export const rarityOrder: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "admin",
]

/** Base text colors for each rarity */
export const rarityColor: Record<Rarity, string> = {
  common: "text-[color:var(--color-rarity-common)]",
  uncommon: "text-[color:var(--color-rarity-uncommon)]",
  rare: "text-[color:var(--color-rarity-rare)]",
  epic: "text-[color:var(--color-rarity-epic)]",
  legendary: "text-[color:var(--color-rarity-legendary)]",
  mythic: "text-[color:var(--color-rarity-mythic)]",
  admin: "text-[color:var(--color-rarity-admin)]",
}

/** Border colors for rarity-themed containers */
export const rarityBorder: Record<Rarity, string> = {
  common: "border-[color:var(--color-rarity-common)]/30",
  uncommon: "border-[color:var(--color-rarity-uncommon)]/40",
  rare: "border-[color:var(--color-rarity-rare)]/50",
  epic: "border-[color:var(--color-rarity-epic)]/50",
  legendary: "border-[color:var(--color-rarity-legendary)]/60",
  mythic: "border-[color:var(--color-rarity-mythic)]/70",
  admin: "border-[color:var(--color-rarity-admin)]/80",
}

/** Background colors for rarity-themed containers */
export const rarityBg: Record<Rarity, string> = {
  common: "bg-[color:var(--color-rarity-common)]/5",
  uncommon: "bg-[color:var(--color-rarity-uncommon)]/8",
  rare: "bg-[color:var(--color-rarity-rare)]/10",
  epic: "bg-[color:var(--color-rarity-epic)]/10",
  legendary: "bg-[color:var(--color-rarity-legendary)]/12",
  mythic: "bg-[color:var(--color-rarity-mythic)]/15",
  admin: "bg-[color:var(--color-rarity-admin)]/18",
}

/** Glow/shadow effects for each rarity */
export const rarityGlow: Record<Rarity, string> = {
  common: "",
  uncommon: "drop-shadow-[0_0_3px_var(--color-rarity-uncommon)]",
  rare: "drop-shadow-[0_0_4px_var(--color-rarity-rare)]",
  epic: "drop-shadow-[0_0_6px_var(--color-rarity-epic)]",
  legendary: "drop-shadow-[0_0_8px_var(--color-rarity-legendary)]",
  mythic: "drop-shadow-[0_0_10px_var(--color-rarity-mythic)]",
  admin: "drop-shadow-[0_0_12px_var(--color-rarity-admin)]",
}

/** Animation classes for legendary/mythic/admin titles */
export const rarityAnimation: Record<Rarity, string> = {
  common: "",
  uncommon: "",
  rare: "",
  epic: "",
  legendary: "title-legendary",
  mythic: "title-mythic",
  admin: "title-admin",
}

/**
 * Transcendent titles that each own a bespoke animation, keyed by label.
 *
 * These classes paint the text with a gradient (`background-clip: text` plus a
 * transparent color), so a rarity color class must NOT be applied alongside them
 * or it overrides the gradient and the animation renders as flat text.
 */
export const TRANSCENDENT_TITLE_ANIMATIONS: Record<string, string> = {
  "Myth of the Relay Sea": "title-relay-sea",
  "Shardheart Ascendant": "title-shardheart",
  "Eternal Courier": "title-eternal-courier",
  "Voidtouched Oracle": "title-voidtouched",
  "Primordial Flame": "title-primordial-flame",
  "Astral Wayfarer": "title-silence-stars",
  "Dreamer Unchained": "title-dreamer-unchained",
  "Ashen Sovereign": "title-ashen-sovereign",
}

/**
 * Resolve the animation + color classes for a title.
 *
 * This is the single source of truth for title appearance. Every surface that
 * renders a title (identity bar, chat, profile list, social) must use it so the
 * same title never looks different in two places.
 */
export function getTitleStyle(
  title: string | undefined,
  rarity: Rarity | undefined,
): { animClass: string; colorClass: string } {
  if (!rarity) return { animClass: "", colorClass: "text-[color:var(--color-muted)]" }
  // Admin outranks a bespoke animation.
  if (rarity === "admin") {
    return { animClass: rarityAnimation[rarity], colorClass: "" }
  }
  // A bespoke gradient supplies its own color, so send no color class with it.
  if (rarity === "mythic" && title && TRANSCENDENT_TITLE_ANIMATIONS[title]) {
    return { animClass: TRANSCENDENT_TITLE_ANIMATIONS[title], colorClass: "" }
  }
  const anim = rarityAnimation[rarity]
  // legendary/mythic gradients also self-color; the plainer tiers need the color.
  return { animClass: anim, colorClass: anim ? "" : rarityColor[rarity] }
}

/**
 * Combined title class - color + animation.
 *
 * Rarity-only, so it cannot resolve the bespoke transcendent animations. Prefer
 * `getTitleStyle` when the title label is available.
 */
export function getTitleClass(rarity: Rarity): string {
  const anim = rarityAnimation[rarity]
  // Admin, legendary, mythic use animation class which sets its own color
  if (anim) return anim
  return rarityColor[rarity]
}

/** Get all styling for a title badge */
export function getTitleBadgeClasses(rarity: Rarity): string {
  const classes = [
    rarityColor[rarity],
    rarityBorder[rarity],
    rarityBg[rarity],
  ]
  
  if (rarity === "legendary" || rarity === "mythic") {
    classes.push(rarityAnimation[rarity])
  }
  
  return classes.filter(Boolean).join(" ")
}
