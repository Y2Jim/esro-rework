"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { ScreenId } from "@/lib/types"
import { cn } from "@/lib/cn"

const navItems: { id: ScreenId; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "ops", label: "Ops" },
  { id: "contracts", label: "Contracts" },
  { id: "faction", label: "Faction" },
  { id: "profile", label: "Profile" },
]

export function TopNav() {
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)
  const profile = useEsroStore((s) => s.profile)
  
  const unreadNotifications = profile?.notifications?.filter((n) => n.state === "unread").length ?? 0

  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {navItems.map((item) => {
        const isActive = screen === item.id
        const showBadge = item.id === "profile" && unreadNotifications > 0
        
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setScreen(item.id)}
            className={cn(
              "esro-button flex shrink-0 items-center gap-1.5 whitespace-nowrap",
              isActive && "esro-button-active"
            )}
          >
            {item.label}
            {showBadge && (
              <span className="esro-badge ml-1">
                {unreadNotifications}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
