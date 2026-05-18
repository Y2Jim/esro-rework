"use client"

import { cn } from "@/lib/cn"
import type { Rarity } from "@/lib/types"
import { rarityColor, rarityBorder, rarityBg, rarityAnimation, rarityLabel } from "@/lib/rarity"

/** Map specific transcendent titles to their unique animation classes */
const TRANSCENDENT_TITLE_ANIMATIONS: Record<string, string> = {
  "Myth of the Relay Sea": "title-relay-sea",
  "Shardheart Ascendant": "title-shardheart",
  "Eternal Courier": "title-eternal-courier",
  "Voidtouched Oracle": "title-voidtouched",
  "Primordial Flame": "title-primordial-flame",
  "Silence Between Stars": "title-silence-stars",
  "Dreamer Unchained": "title-dreamer-unchained",
  "Ashen Sovereign": "title-ashen-sovereign",
}

function getAnimationClass(title: string, rarity: Rarity): string {
  // Admin titles always use admin animation
  if (rarity === "admin") {
    return rarityAnimation[rarity]
  }
  // Check for unique transcendent animations first
  if (rarity === "mythic" && TRANSCENDENT_TITLE_ANIMATIONS[title]) {
    return TRANSCENDENT_TITLE_ANIMATIONS[title]
  }
  // Fall back to standard rarity animation
  return rarityAnimation[rarity]
}

interface TitleDisplayProps {
  title: string
  rarity: Rarity
  /** Display as inline text or badge */
  variant?: "inline" | "badge" | "badge-sm"
  /** Show rarity label */
  showRarityLabel?: boolean
  className?: string
}

/**
 * Displays a title with rarity-appropriate coloring and animations.
 * Legendary and Mythic titles have unique animated effects.
 * Transcendent (mythic) titles each have their own unique animation.
 */
export function TitleDisplay({
  title,
  rarity,
  variant = "inline",
  showRarityLabel = false,
  className,
}: TitleDisplayProps) {
  const animClass = getAnimationClass(title, rarity)
  // For mythic with unique animation, don't apply colorClass (animation handles colors)
  const hasUniqueAnim = rarity === "mythic" && TRANSCENDENT_TITLE_ANIMATIONS[title]
  const colorClass = hasUniqueAnim ? "" : rarityColor[rarity]
  const borderClass = rarityBorder[rarity]
  const bgClass = rarityBg[rarity]

  if (variant === "inline") {
    return (
      <span className={cn(colorClass, animClass, className)}>
        {title}
      </span>
    )
  }

  const isSmall = variant === "badge-sm"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border font-medium uppercase tracking-[0.12em]",
        isSmall ? "px-1 py-[1px] text-[12px]" : "px-1.5 py-[2px] text-[13px]",
        colorClass,
        borderClass,
        bgClass,
        animClass,
        className,
      )}
    >
      {title}
      {showRarityLabel && (
        <span className="opacity-60 text-[11px] lowercase">
          ({rarityLabel[rarity]})
        </span>
      )}
    </span>
  )
}

interface TitleBadgeRowProps {
  title: string
  rarity: Rarity
  source?: string
  isEquipped?: boolean
  onClick?: () => void
  className?: string
}

/**
 * A full-width title row for lists (like in Titles tab)
 */
export function TitleBadgeRow({
  title,
  rarity,
  source,
  isEquipped,
  onClick,
  className,
}: TitleBadgeRowProps) {
  const animClass = getAnimationClass(title, rarity)
  const hasUniqueAnim = rarity === "mythic" && TRANSCENDENT_TITLE_ANIMATIONS[title]
  const colorClass = hasUniqueAnim ? "" : rarityColor[rarity]
  const borderClass = rarityBorder[rarity]
  const bgClass = rarityBg[rarity]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
        isEquipped
          ? cn(borderClass, bgClass, "ring-1 ring-[color:var(--color-accent)]/30")
          : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className={cn("text-[14px] font-medium", colorClass, animClass)}>
          {title}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={cn("text-[12px] uppercase tracking-wider", colorClass, "opacity-70")}>
            {rarityLabel[rarity]}
          </span>
          {source && (
            <>
              <span className="text-[color:var(--color-muted-2)]">-</span>
              <span className="text-[13px] text-[color:var(--color-muted)]">
                {source}
              </span>
            </>
          )}
        </div>
      </div>
      {isEquipped && (
        <span className="shrink-0 rounded bg-[color:var(--color-accent)]/20 px-2 py-0.5 text-[12px] uppercase text-[color:var(--color-accent)]">
          active
        </span>
      )}
    </button>
  )
}
