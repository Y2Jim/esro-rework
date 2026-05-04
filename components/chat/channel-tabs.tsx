"use client"

import { channels } from "@/lib/mock-data"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import type { ChannelId } from "@/lib/types"

const channelColor: Record<ChannelId, { active: string; dot: string; underline: string }> = {
  PUBLIC: {
    active: "text-[color:var(--color-foreground)]",
    dot: "bg-[color:var(--color-foreground)]",
    underline: "bg-[color:var(--color-foreground)]",
  },
  TRADE: {
    active: "text-[color:var(--color-amber)]",
    dot: "bg-[color:var(--color-amber)]",
    underline: "bg-[color:var(--color-amber)]",
  },
  HELP: {
    active: "text-[color:var(--color-cyan)]",
    dot: "bg-[color:var(--color-cyan)]",
    underline: "bg-[color:var(--color-cyan)]",
  },
  LORE: {
    active: "text-[color:var(--color-violet-bright)]",
    dot: "bg-[color:var(--color-violet-bright)]",
    underline: "bg-[color:var(--color-violet-bright)]",
  },
  UNDERCHAT: {
    active: "text-[color:var(--color-danger)]",
    dot: "bg-[color:var(--color-danger)]",
    underline: "bg-[color:var(--color-danger)]",
  },
  GAME: {
    active: "text-[color:var(--color-green)]",
    dot: "bg-[color:var(--color-green)]",
    underline: "bg-[color:var(--color-green)]",
  },
}

export function ChannelTabs() {
  const current = useEsroStore((s) => s.channel)
  const setChannel = useEsroStore((s) => s.setChannel)
  const unread = useEsroStore((s) => s.unread)

  return (
    <div className="relative z-10 border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 backdrop-blur">
      <div
        className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2 pt-2"
        role="tablist"
        aria-label="channels"
      >
        {channels.map((c) => {
          const active = current === c.id
          const hidden = c.restricted
          const u = unread[c.id] ?? 0
          const colors = channelColor[c.id]
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => setChannel(c.id)}
              className={cn(
                "relative shrink-0 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition-colors",
                active
                  ? colors.active
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-lilac)]",
              )}
            >
              {/* hidden channel subtle prefix */}
              <span className="inline-flex items-center gap-1">
                {hidden && (
                  <span
                    aria-hidden
                    className={cn(
                      "inline-block h-[5px] w-[5px] rounded-full",
                      active ? colors.dot : "bg-[color:var(--color-muted-2)]",
                    )}
                  />
                )}
                {c.label}
                {u > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex min-w-[14px] items-center justify-center rounded-sm px-1 text-[8.5px] leading-[12px]",
                      "border text-[color:var(--color-foreground)]",
                      "border-[color:var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-panel)_80%,transparent)]",
                    )}
                  >
                    {u}
                  </span>
                )}
              </span>
              {/* underline */}
              <span
                aria-hidden
                className={cn(
                  "absolute -bottom-[1px] left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full transition-all",
                  active ? `${colors.underline} opacity-100` : "opacity-0",
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
