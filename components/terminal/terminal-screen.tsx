"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { MessageList } from "./message-list"
import { ComposeInput } from "./compose-input"

export function TerminalScreen() {
  const channel = useEsroStore((s) => s.channel)
  const setChannel = useEsroStore((s) => s.setChannel)
  const channels = useEsroStore((s) => s.channels)
  const unread = useEsroStore((s) => s.unread)
  
  const currentChannel = channels.find((c) => c.id === channel)
  const isReadOnly = currentChannel?.readOnly ?? false

  return (
    <div className="flex h-full flex-col">
      {/* Inline channel tabs */}
      <div className="flex gap-1 border-b border-[color:var(--color-border)] px-3 py-2">
        {channels.map((c) => {
          const isActive = channel === c.id
          const u = unread[c.id] ?? 0
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setChannel(c.id)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-[12px] uppercase tracking-wider transition-colors",
                isActive
                  ? "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              )}
            >
              {c.label}
              {u > 0 && (
                <span className="rounded-full bg-[color:var(--color-accent)]/30 px-1.5 text-[10px] text-[color:var(--color-accent)]">
                  {u}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        <MessageList />
      </div>
      
      {/* Compose */}
      <ComposeInput readOnly={isReadOnly} />
    </div>
  )
}
