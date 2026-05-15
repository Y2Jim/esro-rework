"use client"

import { channels } from "@/lib/mock-data"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import type { ChannelId } from "@/lib/types"

const channelStyle: Record<ChannelId, { 
  text: string
  activeBg: string
  activeBorder: string
  inactiveBorder: string
  icon: string
}> = {
  PUBLIC: {
    text: "text-[color:var(--color-foreground)]",
    activeBg: "bg-[color:var(--color-foreground)]/10",
    activeBorder: "border-[color:var(--color-foreground)]/50",
    inactiveBorder: "border-[color:var(--color-border-soft)]",
    icon: "▣",
  },
  TRADE: {
    text: "text-[color:var(--color-amber)]",
    activeBg: "bg-[color:var(--color-amber)]/10",
    activeBorder: "border-[color:var(--color-amber)]/50",
    inactiveBorder: "border-[color:var(--color-amber-muted)]/30",
    icon: "◈",
  },
  HELP: {
    text: "text-[color:var(--color-cyan)]",
    activeBg: "bg-[color:var(--color-cyan)]/10",
    activeBorder: "border-[color:var(--color-cyan)]/50",
    inactiveBorder: "border-[color:var(--color-cyan-muted)]/30",
    icon: "?",
  },
  LOG: {
    text: "text-[color:var(--color-violet-bright)]",
    activeBg: "bg-[color:var(--color-violet)]/10",
    activeBorder: "border-[color:var(--color-violet)]/50",
    inactiveBorder: "border-[color:var(--color-violet)]/20",
    icon: "▤",
  },
  UNDERCHAT: {
    text: "text-[color:var(--color-danger)]",
    activeBg: "bg-[color:var(--color-danger)]/10",
    activeBorder: "border-[color:var(--color-danger)]/50",
    inactiveBorder: "border-[color:var(--color-danger-muted)]/30",
    icon: "◉",
  },
  GAME: {
    text: "text-[color:var(--color-green)]",
    activeBg: "bg-[color:var(--color-green)]/10",
    activeBorder: "border-[color:var(--color-green)]/50",
    inactiveBorder: "border-[color:var(--color-green-muted)]/30",
    icon: "✦",
  },
  FACTION: {
    text: "text-[color:var(--color-lilac)]",
    activeBg: "bg-[color:var(--color-lilac)]/10",
    activeBorder: "border-[color:var(--color-lilac)]/50",
    inactiveBorder: "border-[color:var(--color-lilac)]/20",
    icon: "◆",
  },
  PARTY: {
    text: "text-[color:var(--color-accent)]",
    activeBg: "bg-[color:var(--color-accent)]/10",
    activeBorder: "border-[color:var(--color-accent)]/50",
    inactiveBorder: "border-[color:var(--color-accent)]/20",
    icon: "◈",
  },
}

export function ChannelTabs() {
  const current = useEsroStore((s) => s.channel)
  const setChannel = useEsroStore((s) => s.setChannel)
  const unread = useEsroStore((s) => s.unread)

  return (
    <div className="relative z-10 border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 px-2 pb-1 pt-2 backdrop-blur">
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        role="tablist"
        aria-label="channels"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-violet) transparent",
        }}
      >
        {channels.map((c) => {
          const active = current === c.id
          const hidden = c.restricted
          const u = unread[c.id] ?? 0
          const style = channelStyle[c.id]
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => setChannel(c.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] transition-all",
                active
                  ? cn(style.text, style.activeBg, style.activeBorder)
                  : cn("text-[color:var(--color-muted)]", style.inactiveBorder, "hover:text-[color:var(--color-lilac)] hover:bg-[color:var(--color-panel)]/50"),
              )}
            >
              {/* icon */}
              <span
                aria-hidden
                className={cn(
                  "text-[11px] leading-none",
                  active ? style.text : "text-[color:var(--color-muted-2)]",
                )}
              >
                {style.icon}
              </span>
              
              {/* label */}
              <span>{c.label}</span>
              
              {/* hidden indicator */}
              {hidden && (
                <span
                  aria-hidden
                  className={cn(
                    "inline-block h-[5px] w-[5px] rounded-full",
                    active ? "bg-current" : "bg-[color:var(--color-muted-2)]",
                  )}
                />
              )}
              
              {/* unread badge */}
              {u > 0 && (
                <span
                  className={cn(
                    "inline-flex min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-medium leading-[14px]",
                    active
                      ? "bg-current/20 text-current"
                      : "bg-[color:var(--color-panel-2)] text-[color:var(--color-foreground)]",
                  )}
                >
                  {u}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
