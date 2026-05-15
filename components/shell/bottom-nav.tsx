"use client"

import type { ScreenId } from "@/lib/types"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

const items: { id: ScreenId; label: string; icon: string; color: string; glow: string; bg: string; hover: string }[] = [
  { id: "terminal", label: "terminal", icon: "▣", color: "text-[color:var(--color-cyan)]", glow: "text-glow-cyan", bg: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "ops", label: "ops", icon: "◇", color: "text-[color:var(--color-amber)]", glow: "text-glow-amber", bg: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
  { id: "contracts", label: "contracts", icon: "◈", color: "text-[color:var(--color-green)]", glow: "text-glow-green", bg: "bg-[color:var(--color-green)]/15", hover: "hover-green" },
  { id: "social", label: "social", icon: "⬡", color: "text-[color:var(--color-violet-bright)]", glow: "text-glow-soft", bg: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
  { id: "profile", label: "profile", icon: "◉", color: "text-[color:var(--color-lilac)]", glow: "text-glow-soft", bg: "bg-[color:var(--color-lilac)]/15", hover: "hover-lilac" },
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
      <ul className="grid grid-cols-5 px-1 pb-3 pt-2">
        {items.map((it) => {
          const active = screen === it.id
          return (
            <li key={it.id} className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setScreen(it.id)}
                className={cn(
                  "group relative flex w-full flex-col items-center gap-0.5 rounded-md py-1.5 px-1 transition-all",
                  active
                    ? cn(it.color, it.bg)
                    : cn("text-[color:var(--color-muted)]", it.hover),
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "relative text-[14px] leading-none transition-all",
                    active && it.glow,
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
                    className={cn(
                      "absolute -top-[9px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full",
                      it.id === "terminal" && "bg-[color:var(--color-cyan)]",
                      it.id === "ops" && "bg-[color:var(--color-amber)]",
                      it.id === "contracts" && "bg-[color:var(--color-green)]",
                      it.id === "social" && "bg-[color:var(--color-violet-bright)]",
                      it.id === "profile" && "bg-[color:var(--color-lilac)]",
                    )}
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
