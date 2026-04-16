"use client"

import { channels } from "@/lib/mock-data"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

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
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={active}
              onClick={() => setChannel(c.id)}
              className={cn(
                "relative shrink-0 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition-colors",
                active
                  ? "text-[color:var(--color-foreground)]"
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
                      active
                        ? "bg-[color:var(--color-violet-bright)] text-glow"
                        : "bg-[color:var(--color-violet)]",
                    )}
                  />
                )}
                {c.label}
                {u > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 inline-flex min-w-[14px] items-center justify-center rounded-sm px-1 text-[8.5px] leading-[12px]",
                      "border text-[color:var(--color-foreground)]",
                      hidden
                        ? "border-[color:color-mix(in_oklab,var(--color-violet-bright)_50%,transparent)] bg-[color:color-mix(in_oklab,var(--color-violet)_20%,transparent)]"
                        : "border-[color:var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-violet)_15%,transparent)]",
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
                  active
                    ? "bg-[color:var(--color-violet-bright)] opacity-100 text-glow"
                    : "opacity-0",
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
