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
        tone="amber"
      />
      <PullRow
        title="focused reconstruction"
        detail="deeper index pass · higher refined odds"
        cost="2 resonance"
        canPull={shards.resonance >= 2}
        onPull={() => run("focused")}
        tone="cyan"
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
  tone: "amber" | "cyan"
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-[color:var(--color-panel)]/50 p-2.5",
        tone === "cyan"
          ? "border-[color:var(--color-cyan-muted)]/40"
          : "border-[color:var(--color-amber-muted)]/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h4 className={cn(
            "truncate text-[12px]",
            tone === "cyan" ? "text-[color:var(--color-cyan)]" : "text-[color:var(--color-amber)]"
          )}>
            {title}
          </h4>
          <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--color-foreground)]/70">
            {detail}
          </p>
        </div>
        <span className={cn(
          "shrink-0 text-[11px] uppercase tracking-[0.22em]",
          tone === "cyan" ? "text-[color:var(--color-cyan-muted)]" : "text-[color:var(--color-amber-muted)]"
        )}>
          cost · {cost}
        </span>
      </div>
      <button
        type="button"
        onClick={onPull}
        disabled={!canPull}
        className={cn(
          "mt-2 w-full rounded-sm border px-2 py-1.5 text-[12px] uppercase tracking-[0.28em] transition-all",
          tone === "cyan"
            ? "border-[color:var(--color-cyan-muted)]/50 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)] hover:text-glow-cyan hover:border-[color:var(--color-cyan)] hover:bg-[color:var(--color-cyan)]/20"
            : "border-[color:var(--color-amber-muted)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] hover:text-glow-amber hover:border-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20",
          !canPull &&
            "cursor-not-allowed opacity-40 hover:bg-transparent hover:border-[color:var(--color-border-soft)]",
        )}
      >
        {canPull ? "reconstruct packet" : "insufficient shards"}
      </button>
    </div>
  )
}
