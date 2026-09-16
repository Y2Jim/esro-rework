"use client"

import type { ScreenId } from "@/lib/types"
import { useEsroStore } from "@/store/use-esro-store"
import { IconRail, type IconRailItem } from "./icon-rail"

const items: (IconRailItem & { id: ScreenId })[] = [
  { id: "terminal", label: "terminal", icon: "⌘", accentClass: "text-[color:var(--color-cyan)]", glowClass: "text-glow-cyan", activeBgClass: "bg-[color:var(--color-cyan)]/15", hoverClass: "hover-cyan", accentBar: "var(--color-cyan)" },
  { id: "ops", label: "ops", icon: "↯", accentClass: "text-[color:var(--color-amber)]", glowClass: "text-glow-amber", activeBgClass: "bg-[color:var(--color-amber)]/15", hoverClass: "hover-amber", accentBar: "var(--color-amber)" },
  { id: "contracts", label: "contracts", icon: "★", accentClass: "text-[color:var(--color-green)]", glowClass: "text-glow-green", activeBgClass: "bg-[color:var(--color-green)]/15", hoverClass: "hover-green", accentBar: "var(--color-green)" },
  { id: "social", label: "social", icon: "⬡", accentClass: "text-[color:var(--color-violet-bright)]", glowClass: "text-glow-soft", activeBgClass: "bg-[color:var(--color-violet-bright)]/15", hoverClass: "hover-violet", accentBar: "var(--color-violet-bright)" },
  { id: "profile", label: "profile", icon: "●", accentClass: "text-[color:var(--color-lilac)]", glowClass: "text-glow-soft", activeBgClass: "bg-[color:var(--color-lilac)]/15", hoverClass: "hover-lilac", accentBar: "var(--color-lilac)" },
]

export function NavRail() {
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)
  const profile = useEsroStore((s) => s.profile)

  const unreadNotifications = profile.notifications.filter((n) => n.state === "unread").length

  const railItems: IconRailItem[] = items.map((it) =>
    it.id === "profile" ? { ...it, badge: unreadNotifications } : it,
  )

  return (
    <div className="relative z-30 flex shrink-0 flex-col border-r border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 backdrop-blur">
      <IconRail
        railId="global"
        ariaLabel="primary"
        items={railItems}
        activeId={screen}
        onSelect={(id) => setScreen(id as ScreenId)}
      />
    </div>
  )
}
