"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

export function RecoveryPanel() {
  const shards = useEsroStore((s) => s.shards)
  const run = useEsroStore((s) => s.runRecovery)

  return (
    <div className="flex flex-col gap-1.5">
      <PullRow
        title="standard reconstruction"
        detail="restore one unstable packet · common routing"
        cost="1 relay"
        canPull={shards.relay_tokens >= 1}
        onPull={() => run("standard")}
        tone="violet"
      />
      <PullRow
        title="focused reconstruction"
        detail="deeper index pass · higher refined odds"
        cost="2 deep"
        canPull={shards.deep_signals >= 2}
        onPull={() => run("focused")}
        tone="prismatic"
      />
    </div>
  )
}

function PullRow({
  title,
  detail,
  cost,
  canPull,
  onPull,
  tone,
}: {
  title: string
  detail: string
  cost: string
  canPull: boolean
  onPull: () => void
  tone: "violet" | "prismatic"
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-[color:var(--color-panel)]/50 p-2.5",
        tone === "prismatic"
          ? "border-[color:color-mix(in_oklab,var(--color-prismatic)_25%,var(--color-border))]"
          : "border-[color:var(--color-border-soft)]",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-[12px] text-[color:var(--color-foreground)]">
            {title}
          </h4>
          <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--color-foreground)]/70">
            {detail}
          </p>
        </div>
        <span className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          cost · {cost}
        </span>
      </div>
      <button
        type="button"
        onClick={onPull}
        disabled={!canPull}
        className={cn(
          "mt-2 w-full rounded-sm border px-2 py-1.5 text-[10px] uppercase tracking-[0.28em] transition-all",
          tone === "prismatic"
            ? "border-[color:color-mix(in_oklab,var(--color-prismatic)_45%,transparent)] text-[color:var(--color-prismatic)] hover:text-glow"
            : "border-[color:color-mix(in_oklab,var(--color-violet)_50%,transparent)] text-[color:var(--color-violet-bright)] hover:text-glow",
          !canPull &&
            "cursor-not-allowed opacity-40 hover:text-[color:var(--color-muted)]",
        )}
      >
        {canPull ? "reconstruct packet" : "insufficient shards"}
      </button>
    </div>
  )
}
