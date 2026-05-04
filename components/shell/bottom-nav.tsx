"use client"

import type { ScreenId } from "@/lib/types"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

const items: { id: ScreenId; label: string; icon: string }[] = [
  { id: "chat", label: "chat", icon: "▤" },
  { id: "expedition", label: "exped.", icon: "◇" },
  { id: "skills", label: "skills", icon: "✦" },
  { id: "inventory", label: "inv.", icon: "▦" },
  { id: "party", label: "party", icon: "◈" },
  { id: "profile", label: "profile", icon: "◉" },
]

export function BottomNav() {
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)
  const profile = useEsroStore((s) => s.profile)
  const unreadNotifications = profile.notifications.filter((n) => n.state === "unread").length

  return (
    <nav
      className="relative z-20 border-t border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 backdrop-blur"
      aria-label="primary"
    >
      <div className="hr-dashed" />
      <ul className="grid grid-cols-6 px-1 pb-3 pt-2">
        {items.map((it) => {
          const active = screen === it.id
          return (
            <li key={it.id} className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setScreen(it.id)}
                className={cn(
                  "group relative flex w-full flex-col items-center gap-0.5 py-1 transition-colors",
                  active
                    ? "text-[color:var(--color-violet-bright)]"
                    : "text-[color:var(--color-muted)] hover:text-[color:var(--color-lilac)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "relative text-[14px] leading-none transition-all",
                    active && "text-glow",
                  )}
                >
                  {it.icon}
                  {it.id === "profile" && unreadNotifications > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-[color:var(--color-violet-bright)] px-0.5 text-[7px] font-semibold text-[color:var(--color-bg)]">
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </span>
                  )}
                </span>
                <span className="text-[8.5px] uppercase tracking-[0.18em]">
                  {it.label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-[9px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[color:var(--color-violet-bright)] text-glow"
                  />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
