"use client"

import { ScreenScroll, ScreenSection } from "@/components/ui/screen-section"
import { useEsroStore } from "@/store/use-esro-store"
import { RecoveryPanel } from "./recovery-panel"
import { ResultReveal } from "./result-reveal"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

function formatAgo(ts: number) {
  const delta = Date.now() - ts
  const h = Math.floor(delta / 3_600_000)
  if (h < 1) {
    const m = Math.max(1, Math.floor(delta / 60_000))
    return `${m}m ago`
  }
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function ArchiveScreen() {
  const shards = useEsroStore((s) => s.shards)
  const recovery = useEsroStore((s) => s.recovery)

  return (
    <>
      <ScreenScroll className="pb-3">
        {/* shards */}
        <ScreenSection title="signal shards">
          <div className="grid grid-cols-3 gap-1.5">
            <ShardTile label="relay" value={shards.relay_tokens} tone="lilac" />
            <ShardTile
              label="deep"
              value={shards.deep_signals}
              tone="violet"
            />
            <ShardTile
              label="salvage"
              value={shards.signal_salvage}
              tone="muted"
            />
          </div>
        </ScreenSection>

        {/* recovery controls */}
        <ScreenSection title="archive recovery">
          <RecoveryPanel />
        </ScreenSection>

        {/* recent */}
        <ScreenSection
          title="recent recovered"
          right={
            <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
              last {recovery.length}
            </span>
          }
        >
          <ul className="flex flex-col gap-1">
            {recovery.length === 0 && (
              <li className="rounded-md border border-dashed border-[color:var(--color-border-soft)] px-2.5 py-2 text-[10.5px] text-[color:var(--color-muted)]">
                no packets reconstructed yet
              </li>
            )}
            {recovery.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/40 px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-[11.5px]",
                      r.rarity === "legendary"
                        ? "prismatic-text font-medium"
                        : "text-[color:var(--color-foreground)]",
                    )}
                  >
                    {r.label}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em]">
                    <span className="text-[color:var(--color-muted)]">
                      {r.type.replace("_", " ")}
                    </span>
                    <span className="text-[color:var(--color-muted-2)]">·</span>
                    <span className={rarityColor[r.rarity]}>
                      {rarityLabel[r.rarity]}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted-2)]">
                  {formatAgo(r.recoveredAt)}
                </span>
              </li>
            ))}
          </ul>
        </ScreenSection>
      </ScreenScroll>

      <ResultReveal />
    </>
  )
}

function ShardTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "lilac" | "violet" | "muted"
}) {
  const toneClass =
    tone === "violet"
      ? "text-[color:var(--color-violet-bright)] text-glow"
      : tone === "lilac"
        ? "text-[color:var(--color-lilac)]"
        : "text-[color:var(--color-muted)]"
  return (
    <div className="rounded-md border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/50 px-2 py-1.5 text-center">
      <div className={cn("text-[15px] tabular-nums", toneClass)}>{value}</div>
      <div className="text-[8.5px] uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
        {label}
      </div>
    </div>
  )
}
