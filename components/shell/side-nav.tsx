"use client"

import type { ScreenId } from "@/lib/types"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { useNavRail } from "./nav-rail-context"

type NavItem = {
  id: ScreenId
  label: string
  icon: string
  accentClass: string
  glowClass: string
  activeBgClass: string
  hoverClass: string
  accentBar: string
}

// The single left column is split into two named groups. CHAT holds the
// social/comms surfaces; GAME holds the play + character surfaces.
const CHAT_ITEMS: NavItem[] = [
  { id: "terminal", label: "terminal", icon: "⌘", accentClass: "text-[color:var(--color-cyan)]", glowClass: "text-glow-cyan", activeBgClass: "bg-[color:var(--color-cyan)]/15", hoverClass: "hover-cyan", accentBar: "var(--color-cyan)" },
  { id: "social", label: "social", icon: "⬡", accentClass: "text-[color:var(--color-violet-bright)]", glowClass: "text-glow-soft", activeBgClass: "bg-[color:var(--color-violet-bright)]/15", hoverClass: "hover-violet", accentBar: "var(--color-violet-bright)" },
]

const GAME_ITEMS: NavItem[] = [
  { id: "ops", label: "ops", icon: "↯", accentClass: "text-[color:var(--color-amber)]", glowClass: "text-glow-amber", activeBgClass: "bg-[color:var(--color-amber)]/15", hoverClass: "hover-amber", accentBar: "var(--color-amber)" },
  { id: "contracts", label: "contracts", icon: "★", accentClass: "text-[color:var(--color-green)]", glowClass: "text-glow-green", activeBgClass: "bg-[color:var(--color-green)]/15", hoverClass: "hover-green", accentBar: "var(--color-green)" },
  { id: "profile", label: "profile", icon: "●", accentClass: "text-[color:var(--color-lilac)]", glowClass: "text-glow-soft", activeBgClass: "bg-[color:var(--color-lilac)]/15", hoverClass: "hover-lilac", accentBar: "var(--color-lilac)" },
]

/**
 * The app's single primary navigation column. Collapsed to an icon-only rail by
 * default; the toggle expands it in place to reveal group headings + labels.
 * It's a normal flex child (not an overlay), so expanding pushes the content
 * instead of covering it — labels can never overlap the screen body.
 */
export function SideNav() {
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)
  const profile = useEsroStore((s) => s.profile)
  const { expanded, toggle } = useNavRail()

  const unread = profile.notifications.filter((n) => n.state === "unread").length

  const renderItem = (it: NavItem) => {
    const active = it.id === screen
    const badge = it.id === "profile" ? unread : 0
    return (
      <li key={it.id}>
        <button
          type="button"
          onClick={() => setScreen(it.id)}
          title={it.label}
          aria-label={it.label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex h-10 w-full items-center gap-3 rounded-md px-[15px] transition-all",
            it.hoverClass,
            active
              ? cn(it.accentClass, it.activeBgClass)
              : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
          )}
        >
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
              style={{ background: it.accentBar }}
            />
          )}
          <span className={cn("relative shrink-0 text-[16px] leading-none", active && it.glowClass)}>
            {it.icon}
            {badge > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[color:var(--color-violet-bright)] px-0.5 text-[10px] font-semibold text-[color:var(--color-bg)]">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.05em] transition-all duration-200",
              expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0",
            )}
          >
            {it.label}
          </span>
        </button>
      </li>
    )
  }

  return (
    <nav
      aria-label="primary navigation"
      className={cn(
        "relative z-30 flex shrink-0 flex-col gap-2 border-r border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 py-2 backdrop-blur transition-[width] duration-200",
        expanded ? "w-[196px]" : "w-[56px]",
      )}
    >
      {/* Menu toggle — accent-tinted + bordered so it reads as the obvious control */}
      <button
        type="button"
        onClick={toggle}
        title={expanded ? "collapse menu" : "expand menu"}
        aria-label={expanded ? "collapse menu" : "expand menu"}
        aria-expanded={expanded}
        className="mx-2 flex h-9 items-center gap-3 rounded-md border border-[color:var(--color-violet-bright)]/40 px-[13px] text-[color:var(--color-violet-bright)] transition-all hover:border-[color:var(--color-violet-bright)]/70 hover:bg-[color:var(--color-violet-bright)]/10"
      >
        <span className="shrink-0 text-[16px] leading-none">{expanded ? "‹" : "≡"}</span>
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.15em] transition-all duration-200",
            expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0",
          )}
        >
          menu
        </span>
      </button>

      {/* CHAT group */}
      <div className="flex flex-col gap-1">
        <GroupLabel expanded={expanded} label="chat" />
        <ul className="flex flex-col gap-1 px-2">{CHAT_ITEMS.map(renderItem)}</ul>
      </div>

      {/* Divider keeps the two groups visually distinct even when collapsed */}
      <div className="mx-3 h-px shrink-0 bg-[color:var(--color-border-soft)]" />

      {/* GAME group */}
      <div className="flex flex-col gap-1">
        <GroupLabel expanded={expanded} label="game" />
        <ul className="flex flex-col gap-1 px-2">{GAME_ITEMS.map(renderItem)}</ul>
      </div>
    </nav>
  )
}

function GroupLabel({ expanded, label }: { expanded: boolean; label: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-2)] transition-all duration-200",
        expanded ? "h-4 opacity-100" : "h-0 opacity-0",
      )}
    >
      {label}
    </div>
  )
}
