"use client"

import { useEsroStore } from "@/store/use-esro-store"

export function CraftingTab() {
  const inventory = useEsroStore((s) => s.inventory)
  const shards = useEsroStore((s) => s.shards)

  const materials = inventory.filter((i) => i.aspect === "supply" || i.aspect === "salvage")

  return (
    <div className="space-y-4">
      {/* Resources inline */}
      <div className="flex gap-4 text-[11px]">
        <span className="text-[color:var(--color-muted)]">
          Relay <span className="text-[color:var(--color-text)]">{shards.relay_tokens}</span>
        </span>
        <span className="text-[color:var(--color-muted)]">
          Deep <span className="text-[color:var(--color-text)]">{shards.deep_signals}</span>
        </span>
        <span className="text-[color:var(--color-muted)]">
          Salvage <span className="text-[color:var(--color-text)]">{shards.signal_salvage}</span>
        </span>
      </div>

      {/* Materials */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Materials
        </div>
        
        {materials.length === 0 ? (
          <div className="text-[11px] text-[color:var(--color-muted)]">No materials</div>
        ) : (
          <div className="space-y-1">
            {materials.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2"
              >
                <span className="text-[11px] text-[color:var(--color-text)]">{item.label}</span>
                <span className="text-[10px] text-[color:var(--color-muted)]">x{item.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 text-center text-[10px] text-[color:var(--color-muted)]">
        Crafting recipes coming soon
      </div>
    </div>
  )
}
