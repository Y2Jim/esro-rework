import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/cn"

function formatTime(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

interface MessageRowProps {
  msg: ChatMessage
}

export function MessageRow({ msg }: MessageRowProps) {
  if (msg.kind === "system") {
    return (
      <div className="esro-message py-2">
        <div className="flex items-start gap-2">
          <span className="text-[12px] text-[color:var(--color-muted)]">
            {formatTime(msg.at)}
          </span>
          <span className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
            {msg.body}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="esro-message">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[13px] font-medium",
            msg.kind === "whisper" 
              ? "text-[color:var(--color-danger)]" 
              : "text-[color:var(--color-accent-strong)]"
          )}>
            {msg.handle}
          </span>
          {msg.title && (
            <span className="esro-chip text-[10px]">
              {msg.title}
            </span>
          )}
          {msg.kind === "whisper" && (
            <span className="text-[11px] uppercase text-[color:var(--color-danger)]">
              whisper
            </span>
          )}
        </div>
        <span className="text-[12px] text-[color:var(--color-muted)]">
          {formatTime(msg.at)}
        </span>
      </div>
      <div className="text-[13px] leading-relaxed text-[color:var(--color-text)]">
        {msg.body}
      </div>
    </div>
  )
}
