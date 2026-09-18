import type { InventoryItem } from "@/lib/types"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

export function ItemDetail({ item }: { item: InventoryItem }) {
  const isUnknown = !item.identified
  return (
    <article className="rounded-md border border-[color:var(--color-amber-muted)]/40 bg-[color:var(--color-panel-2)]/70 p-2.5">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h4 className="text-[15px] text-[color:var(--color-amber)] text-glow-amber">
            {isUnknown ? "unstable imprint" : item.label}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 text-[13px] uppercase tracking-[0.22em]">
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
        <span className="text-[14px] tabular-nums text-[color:var(--color-lilac)]">
          x{item.qty}
        </span>
      </header>

      <div className="my-2 hr-dashed" />

      {!isUnknown && item.image ? (
        <div className="mb-2 flex justify-center rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/40 p-3">
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.label}
            className="h-24 w-24 object-contain [image-rendering:pixelated]"
          />
        </div>
      ) : null}

      <p className="text-[15px] leading-relaxed text-[color:var(--color-foreground)]/85">
        {isUnknown
          ? "aspect unresolved · signal irregular · reconstruct at archive to stabilize"
          : item.description}
      </p>

      {!isUnknown && (item.isVariant || item.craftingUse || item.obtainMethod === "fishing_only") ? (
        <dl className="mt-2 space-y-1 text-[13px] leading-relaxed">
          {item.isVariant ? (
            <div className="flex items-center gap-2">
              <dt className="uppercase tracking-[0.22em] text-[color:var(--color-muted)]">variant</dt>
              <dd className="text-[color:var(--color-cyan)]">rare catch</dd>
            </div>
          ) : null}
          {item.craftingUse ? (
            <div className="flex gap-2">
              <dt className="shrink-0 uppercase tracking-[0.22em] text-[color:var(--color-muted)]">use</dt>
              <dd className="text-[color:var(--color-foreground)]/75">{item.craftingUse}</dd>
            </div>
          ) : null}
          {item.obtainMethod === "fishing_only" ? (
            <div className="flex items-center gap-2">
              <dt className="uppercase tracking-[0.22em] text-[color:var(--color-muted)]">source</dt>
              <dd className="text-[color:var(--color-foreground)]/75">fishing only</dd>
            </div>
          ) : null}
          {typeof item.sellValue === "number" && item.sellValue > 0 ? (
            <div className="flex items-center gap-2">
              <dt className="uppercase tracking-[0.22em] text-[color:var(--color-muted)]">value</dt>
              <dd className="text-[color:var(--color-amber)]">{item.sellValue}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          className="flex-1 rounded-sm border border-[color:var(--color-amber-muted)]/50 bg-[color:var(--color-amber)]/10 px-2 py-1 text-[13px] uppercase tracking-[0.22em] text-[color:var(--color-amber)] transition-colors hover:text-glow-amber hover:border-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20"
        >
          {isUnknown ? "reconstruct" : "use"}
        </button>
        <button
          type="button"
          className="flex-1 rounded-sm border border-[color:var(--color-border-soft)] px-2 py-1 text-[13px] uppercase tracking-[0.22em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-border)] hover:text-[color:var(--color-lilac)]"
        >
          trade
        </button>
      </div>
    </article>
  )
}
