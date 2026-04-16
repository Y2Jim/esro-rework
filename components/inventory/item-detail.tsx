import type { InventoryItem } from "@/lib/types"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

export function ItemDetail({ item }: { item: InventoryItem }) {
  const isUnknown = !item.identified
  return (
    <article className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-panel-2)]/70 p-2.5">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h4 className="text-[13px] text-[color:var(--color-foreground)] text-glow-soft">
            {isUnknown ? "unstable imprint" : item.label}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em]">
            <span className="text-[color:var(--color-muted)]">
              {isUnknown ? "unstable" : item.aspect}
            </span>
            <span className="text-[color:var(--color-muted-2)]">·</span>
            <span
              className={cn(
                item.rarity === "legendary"
                  ? "prismatic-text"
                  : rarityColor[item.rarity],
              )}
            >
              {rarityLabel[item.rarity]}
            </span>
          </div>
        </div>
        <span className="text-[10px] tabular-nums text-[color:var(--color-lilac)]">
          x{item.qty}
        </span>
      </header>

      <div className="my-2 hr-dashed" />

      <p className="text-[11px] leading-relaxed text-[color:var(--color-foreground)]/85">
        {isUnknown
          ? "aspect unresolved · signal irregular · reconstruct at archive to stabilize"
          : item.description}
      </p>

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          className="flex-1 rounded-sm border border-[color:var(--color-border)] px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-lilac)] transition-colors hover:border-[color:color-mix(in_oklab,var(--color-violet)_55%,transparent)] hover:text-[color:var(--color-foreground)]"
        >
          {isUnknown ? "reconstruct" : "use"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-sm border border-[color:var(--color-border-soft)] px-2 py-1 text-[9.5px] uppercase tracking-[0.22em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)]"
        >
          trade
        </button>
      </div>
    </article>
  )
}
