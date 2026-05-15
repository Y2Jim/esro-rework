import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

interface PanelProps {
  children: ReactNode
  className?: string
  variant?: "default" | "soft" | "focused"
}

export function Panel({ children, className, variant = "default" }: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 overflow-hidden",
        variant === "default" && "esro-panel",
        variant === "soft" && "esro-panel-soft",
        variant === "focused" && "esro-panel esro-panel-focused",
        className
      )}
    >
      {children}
    </div>
  )
}

interface PanelHeaderProps {
  title: string
  action?: ReactNode
}

export function PanelHeader({ title, action }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 pt-2.5">
      <h3 className="text-[12px] font-medium tracking-[0.04em] text-[color:var(--color-text)]">
        {title}
      </h3>
      {action}
    </div>
  )
}

interface PanelBodyProps {
  children: ReactNode
  className?: string
  scroll?: boolean
}

export function PanelBody({ children, className, scroll = false }: PanelBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 px-2.5 pb-2.5",
        scroll && "overflow-y-auto",
        className
      )}
      style={scroll ? {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      } : undefined}
    >
      {children}
    </div>
  )
}
