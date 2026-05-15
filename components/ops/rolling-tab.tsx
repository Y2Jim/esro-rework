"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

const rarityColors: Record<string, string> = {
  common: "text-[color:var(--color-muted)]",
  uncommon: "text-green-400",
  rare: "text-[color:var(--color-accent)]",
  epic: "text-[color:var(--color-accent-strong)]",
  legendary: "text-amber-400",
}

export function RollingTab() {
  const shards = useEsroStore((s) => s.shards)
  const recovery = useEsroStore((s) => s.recovery)
  const runRecovery = useEsroStore((s) => s.runRecovery)

  const canStandard = shards.relay_tokens >= 1
  const canFocused = shards.deep_signals >= 2

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
      </div>

      {/* Recovery buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => runRecovery("standard")}
          disabled={!canStandard}
          className={cn(
            "flex-1 rounded-lg border px-3 py-3 text-center transition-colors",
            canStandard
              ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 hover:bg-[color:var(--color-accent)]/20"
              : "border-[color:var(--color-border)] opacity-50"
          )}
        >
          <div className="text-[11px] font-medium text-[color:var(--color-text)]">Standard</div>
          <div className="text-[9px] text-[color:var(--color-muted)]">1 Relay</div>
        </button>
        
        <button
          type="button"
          onClick={() => runRecovery("focused")}
          disabled={!canFocused}
          className={cn(
            "flex-1 rounded-lg border px-3 py-3 text-center transition-colors",
            canFocused
              ? "border-[color:var(--color-accent-strong)]/50 bg-[color:var(--color-accent-strong)]/10 hover:bg-[color:var(--color-accent-strong)]/20"
              : "border-[color:var(--color-border)] opacity-50"
          )}
        >
          <div className="text-[11px] font-medium text-[color:var(--color-text)]">Focused</div>
          <div className="text-[9px] text-[color:var(--color-muted)]">2 Deep</div>
        </button>
      </div>

      {/* Recent */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Recent
        </div>
        
        {recovery.length === 0 ? (
          <div className="text-[11px] text-[color:var(--color-muted)]">No recoveries yet</div>
        ) : (
          <div className="space-y-1">
            {recovery.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2"
              >
                <span className={cn("text-[11px]", rarityColors[item.rarity])}>
                  {item.label}
                </span>
                <span className="text-[9px] capitalize text-[color:var(--color-muted)]">
                  {item.rarity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
