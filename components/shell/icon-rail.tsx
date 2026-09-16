"use client"

import { cn } from "@/lib/cn"
import { useNavRail } from "./nav-rail-context"

export type IconRailItem = {
  id: string
  label: string
  icon: string
  /** text color class for the icon (active + accent bar) */
  accentClass?: string
  /** background tint class applied to the active item */
  activeBgClass?: string
  /** hover helper class (e.g. hover-cyan) */
  hoverClass?: string
  /** glow class applied to the active icon */
  glowClass?: string
  /** raw color for the 2px left accent bar */
  accentBar?: string
  /** numeric badge (unread counts). 0/undefined hides it */
  badge?: number
  /** small dot indicator (e.g. restricted channel) */
  dot?: boolean
  dotClass?: string
  disabled?: boolean
}

/**
 * A vertical, icon-first navigation rail. Icon-only by default; tapping the
 * rail's own toggle reveals labels as an overlay (content never resizes).
 * Expansion is accordion-scoped across rails via NavRailContext, so only one
 * rail is ever open at a time in the narrow phone frame.
 */
export function IconRail({
  railId,
  items,
  activeId,
  onSelect,
  ariaLabel,
  className,
}: {
  railId: string
  items: IconRailItem[]
  activeId: string
  onSelect: (id: string) => void
  ariaLabel: string
  className?: string
}) {
  const { isExpanded, toggleRail, collapseAll } = useNavRail()
  const expanded = isExpanded(railId)

  return (
    // Fixed-width placeholder keeps the rail's footprint constant so the center
    // content never resizes. The rail itself overlays on top when expanded.
    <div className="relative w-[52px] shrink-0">
      <nav
        aria-label={ariaLabel}
        className={cn(
          "absolute inset-y-0 left-0 flex flex-col items-stretch gap-1 py-2 transition-[width] duration-200",
          expanded ? "w-[168px] shadow-[6px_0_24px_-4px_rgba(0,0,0,0.7)]" : "w-[52px]",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => toggleRail(railId)}
          title={expanded ? "collapse labels" : "expand labels"}
          aria-label={expanded ? "collapse labels" : "expand labels"}
          aria-expanded={expanded}
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[color:var(--color-muted)] transition-all hover:bg-[color:var(--color-panel)] hover:text-[color:var(--color-fg)]"
        >
          <span className="text-[16px] leading-none">{expanded ? "‹" : "≡"}</span>
        </button>
        <ul className="flex flex-col gap-1">
          {items.map((it) => {
            const active = it.id === activeId
            return (
              <li key={it.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (it.disabled) return
                    onSelect(it.id)
                    collapseAll()
                  }}
                  disabled={it.disabled}
                  title={it.label}
                  aria-label={it.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-10 w-full items-center gap-3 rounded-md px-[13px] transition-all",
                    it.hoverClass,
                    active
                      ? cn(it.accentClass, it.activeBgClass)
                      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
                    it.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  {/* left accent bar for the active item */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: it.accentBar ?? "currentColor" }}
                    />
                  )}
                  <span className={cn("relative shrink-0 text-[16px] leading-none", active && it.glowClass)}>
                    {it.icon}
                    {typeof it.badge === "number" && it.badge > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[color:var(--color-violet-bright)] px-0.5 text-[10px] font-semibold text-[color:var(--color-bg)]">
                        {it.badge > 9 ? "9+" : it.badge}
                      </span>
                    )}
                    {it.dot && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full",
                          it.dotClass ?? "bg-[color:var(--color-muted)]",
                        )}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.05em] transition-all duration-200",
                      expanded ? "max-w-[110px] opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    {it.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
