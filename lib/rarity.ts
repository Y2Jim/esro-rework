import type { Rarity } from "./types"

/**
 * In-world names for rarity tiers. We never surface the underlying
 * "common/uncommon/..." keys to the player.
 */
export const rarityLabel: Record<Rarity, string> = {
  common: "Faded",
  uncommon: "Recovered",
  rare: "Refined",
  epic: "Prismatic",
  legendary: "Singular",
}

export const rarityOrder: Rarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]

export const rarityColor: Record<Rarity, string> = {
  common: "text-[color:var(--color-muted)]",
  uncommon: "text-[color:var(--color-lilac)]",
  rare: "text-[color:var(--color-violet-bright)]",
  epic: "text-[color:var(--color-violet-bright)]",
  legendary: "text-[color:var(--color-prismatic)]",
}

export const rarityBorder: Record<Rarity, string> = {
  common: "border-[color:var(--color-border-soft)]",
  uncommon: "border-[color:var(--color-border)]",
  rare: "border-[color:color-mix(in_oklab,var(--color-violet)_55%,transparent)]",
  epic: "border-[color:color-mix(in_oklab,var(--color-violet)_70%,transparent)]",
  legendary:
    "border-[color:color-mix(in_oklab,var(--color-prismatic)_60%,transparent)]",
}
