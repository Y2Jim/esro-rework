import type { ChatMessage } from "@/lib/types"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

function formatClock(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

const logTypeStyles: Record<string, { tag: string; color: string }> = {
  expedition: { tag: "text-[color:var(--color-cyan)]", color: "text-[color:var(--color-cyan)]/80" },
  party: { tag: "text-[color:var(--color-green)]", color: "text-[color:var(--color-green)]/80" },
  skill: { tag: "text-[color:var(--color-violet-bright)]", color: "text-[color:var(--color-violet-bright)]/80" },
  recovery: { tag: "text-[color:var(--color-amber)]", color: "text-[color:var(--color-amber)]/80" },
  system: { tag: "text-[color:var(--color-muted)]", color: "text-[color:var(--color-foreground)]/70" },
}

function parseLogType(body: string): { type: string; content: string } {
  const match = body.match(/^\[(\w+)\]\s*(.*)$/)
  if (match) {
    return { type: match[1].toLowerCase(), content: match[2] }
  }
  return { type: "system", content: body }
}

export function MessageRow({ msg, isLogChannel }: { msg: ChatMessage; isLogChannel?: boolean }) {
  // Special LOG channel rendering
  if (isLogChannel && msg.kind === "system") {
    const { type, content } = parseLogType(msg.body)
    const style = logTypeStyles[type] || logTypeStyles.system
    return (
      <div className="flex items-start gap-2 px-3 py-1.5 text-[11px] leading-snug">
        <span className="shrink-0 text-[9px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        <span className={cn("shrink-0 text-[9px] uppercase tracking-[0.2em] font-medium", style.tag)}>
          [{type}]
        </span>
        <span className={style.color}>{content}</span>
      </div>
    )
  }

  if (msg.kind === "system") {
    return (
      <div className="flex items-baseline gap-2 px-3 py-0.5 text-[11px] leading-snug text-[color:var(--color-cyan-muted)]">
        <span className="shrink-0 text-[9px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        <span className="uppercase tracking-[0.22em] text-[color:var(--color-cyan)]">
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
