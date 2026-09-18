"use client"

import { cn } from "@/lib/cn"

export type SubTabItem = {
  id: string
  label: string
  icon: string
  /** text color class for the active item */
  accentClass?: string
  /** background tint class applied to the active item */
  activeBgClass?: string
  /** hover helper class (e.g. hover-cyan) */
  hoverClass?: string
  /** raw color for the active underline */
  accentBar?: string
  /** numeric badge (unread counts). 0/undefined hides it */
  badge?: number
  /** small dot indicator (e.g. restricted channel) */
  dot?: boolean
  dotClass?: string
  disabled?: boolean
}

/**
 * A horizontal, scrollable tab bar for a screen's own sub-sections. It sits at
 * the top of the screen body so the app keeps a single vertical nav column and
 * sub-section labels never overlay the content beneath them.
 */
export function SubTabBar({
  items,
  activeId,
  onSelect,
  ariaLabel,
  className,
}: {
  items: SubTabItem[]
  activeId: string
  onSelect: (id: string) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/70 px-2 py-1.5 backdrop-blur",
        className,
      )}
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
    >
      {items.map((it) => {
        const active = it.id === activeId
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return
              onSelect(it.id)
            }}
            title={it.label}
            className={cn(
              "group relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium uppercase tracking-[0.05em] transition-all",
              it.hoverClass,
              active
                ? cn(it.accentClass, it.activeBgClass)
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
              it.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <span className="relative shrink-0 text-[15px] leading-none">
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
            <span className="whitespace-nowrap">{it.label}</span>
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full"
                style={{ background: it.accentBar ?? "currentColor" }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
