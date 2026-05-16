"use client"

import type { InventoryItem } from "@/lib/types"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

const aspectLabel: Record<InventoryItem["aspect"], string> = {
  relay: "relay",
  archive: "archive",
  supply: "supply",
  salvage: "salvage",
  cosmetic: "cosmetic",
  unknown: "unstable",
}

export function ItemRow({
  item,
  active,
  onSelect,
}: {
  item: InventoryItem
  active: boolean
  onSelect: () => void
}) {
  const isUnknown = !item.identified
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border px-2 py-1.5 text-left transition-all",
        active
          ? "border-[color:var(--color-amber-muted)]/60 bg-[color:var(--color-amber)]/5"
          : "border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/50 hover:border-[color:var(--color-border)]",
      )}
    >
      {/* rarity pip */}
      <div
        aria-hidden
        className={cn(
          "h-7 w-7 shrink-0 rounded-sm border text-center text-[13px] leading-[26px]",
          isUnknown
            ? "border-[color:var(--color-danger)]/50 text-[color:var(--color-danger)]"
            : "border-[color:var(--color-border)]",
          rarityColor[item.rarity],
        )}
      >
        {isUnknown ? "?" : "◆"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4
            className={cn(
              "truncate text-[12px]",
              isUnknown
                ? "text-[color:var(--color-foreground)]/80 italic"
                : "text-[color:var(--color-foreground)]",
            )}
          >
            {isUnknown ? "unstable imprint" : item.label}
          </h4>
          <span className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            x{item.qty}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]">
          <span className="text-[color:var(--color-muted)]">
            {aspectLabel[item.aspect]}
          </span>
          <span className="text-[color:var(--color-muted-2)]">·</span>
          <span className={rarityColor[item.rarity]}>
            {rarityLabel[item.rarity]}
          </span>
        </div>
      </div>
    </button>
  )
}
