import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

export function ScreenSection({
  title,
  right,
  children,
  className,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("px-5 py-3", className)}>
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
          {title}
        </h3>
        {right}
      </header>
      {children}
    </section>
  )
}

export function ScreenScroll({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "esro-scroll relative z-10 flex-1 overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  )
}
