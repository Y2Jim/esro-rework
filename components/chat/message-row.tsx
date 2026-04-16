import type { ChatMessage } from "@/lib/types"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

function formatClock(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

export function MessageRow({ msg }: { msg: ChatMessage }) {
  if (msg.kind === "system") {
    return (
      <div className="flex items-baseline gap-2 px-3 py-0.5 text-[11px] leading-snug text-[color:var(--color-muted)]">
        <span className="shrink-0 text-[9px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        <span className="uppercase tracking-[0.22em] text-[color:color-mix(in_oklab,var(--color-violet)_70%,var(--color-muted))]">
          ::
        </span>
        <span className="italic">{msg.body}</span>
      </div>
    )
  }

  if (msg.kind === "whisper") {
    return (
      <div className="px-3 py-0.5 text-[11.5px] leading-snug">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[9px] tabular-nums text-[color:var(--color-muted-2)]">
            {formatClock(msg.at)}
          </span>
          <span className="text-[color:var(--color-danger)]">{msg.handle}</span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            whisper
          </span>
        </div>
        <div className="pl-[34px] text-[color:var(--color-danger)]/90">{msg.body}</div>
      </div>
    )
  }

  const titleClass =
    msg.titleRarity === "legendary"
      ? "prismatic-text"
      : msg.titleRarity
        ? rarityColor[msg.titleRarity]
        : "text-[color:var(--color-muted)]"

  return (
    <div className="px-3 py-0.5 text-[11.5px] leading-snug">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
        <span className="shrink-0 text-[9px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        <span className="font-medium text-[color:var(--color-foreground)] text-glow-soft">
          {msg.handle}
        </span>
        {msg.title && (
          <span
            className={cn(
              "rounded-sm border border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/60 px-1 py-[1px] text-[8.5px] uppercase tracking-[0.2em]",
              titleClass,
            )}
          >
            {msg.title}
          </span>
        )}
      </div>
      <div className="pl-[34px] text-[color:var(--color-foreground)]/90">
        {msg.body}
      </div>
    </div>
  )
}
