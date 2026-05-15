"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

export function ChannelTabs() {
  const channels = useEsroStore((s) => s.channels)
  const current = useEsroStore((s) => s.channel)
  const setChannel = useEsroStore((s) => s.setChannel)
  const unread = useEsroStore((s) => s.unread)

  return (
    <div
      className="grid grid-cols-3 gap-1.5"
    >
      {channels.map((c) => {
        const isActive = current === c.id
        const unreadCount = unread[c.id] ?? 0
        
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            className={cn(
              "esro-button flex items-center justify-center gap-1 text-[10px]",
              isActive && "esro-button-active"
            )}
          >
            {c.label}
            {unreadCount > 0 && (
              <span className="esro-badge text-[8px]">
                {unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
