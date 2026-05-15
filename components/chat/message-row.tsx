import type { ChatMessage } from "@/lib/types"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

function formatClock(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

const logTypeStyles: Record<string, { tag: string; content: string }> = {
  expedition: { tag: "text-[color:var(--color-cyan)]", content: "text-[color:var(--color-foreground)]" },
  party: { tag: "text-[color:var(--color-green)]", content: "text-[color:var(--color-foreground)]" },
  skill: { tag: "text-[color:var(--color-violet-bright)]", content: "text-[color:var(--color-foreground)]" },
  recovery: { tag: "text-[color:var(--color-amber)]", content: "text-[color:var(--color-foreground)]" },
  system: { tag: "text-[color:var(--color-muted)]", content: "text-[color:var(--color-foreground)]/85" },
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
      <div className="flex items-start gap-2.5 px-3 py-2 text-[12px] leading-relaxed">
        <span className="shrink-0 pt-0.5 text-[10px] tabular-nums text-[color:var(--color-muted)]">
          {formatClock(msg.at)}
        </span>
        <span className={cn("shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.15em] font-semibold", style.tag)}>
          {type}
        </span>
        <span className={cn("flex-1", style.content)}>{content}</span>
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
      <div className="px-3 py-1.5 text-[12px] leading-relaxed">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[10px] tabular-nums text-[color:var(--color-muted)]">
            {formatClock(msg.at)}
          </span>
          <span className="font-semibold text-[color:var(--color-danger)]">{msg.handle}</span>
          <span className="rounded-sm border border-[color:var(--color-danger-muted)]/40 bg-[color:var(--color-danger)]/10 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-[color:var(--color-danger-muted)]">
            whisper
          </span>
        </div>
        <div className="mt-0.5 pl-[42px] text-[color:var(--color-foreground)]/85">{msg.body}</div>
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
    <div className="px-3 py-1.5 text-[12px] leading-relaxed">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="shrink-0 text-[10px] tabular-nums text-[color:var(--color-muted)]">
          {formatClock(msg.at)}
        </span>
        <span className="font-medium text-[color:var(--color-lilac)]">
          {msg.handle}
        </span>
        {msg.title && (
          <span
            className={cn(
              "rounded-sm border border-[color:var(--color-border)] bg-[color:var(--color-panel-2)]/80 px-1.5 py-[2px] text-[9px] uppercase tracking-[0.15em] font-medium",
              titleClass,
            )}
          >
            {msg.title}
          </span>
        )}
      </div>
      <div className="mt-0.5 pl-[42px] text-[color:var(--color-foreground)]/85">
        {msg.body}
      </div>
    </div>
  )
}
