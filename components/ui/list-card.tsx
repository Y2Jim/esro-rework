import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

interface ListCardProps {
  children: ReactNode
  className?: string
  focused?: boolean
  dashed?: boolean
  onClick?: () => void
}

export function ListCard({ children, className, focused, dashed, onClick }: ListCardProps) {
  const Component = onClick ? "button" : "div"
  
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "esro-list-card flex flex-col gap-1.5 text-left transition-all",
        focused && "is-focused",
        dashed && "border-dashed",
        onClick && "cursor-pointer hover:border-[color:var(--color-border-strong)]",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface ListCardTitleProps {
  children: ReactNode
  action?: ReactNode
}

export function ListCardTitle({ children, action }: ListCardTitleProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[14px] text-[color:var(--color-text)]">{children}</span>
      {action}
    </div>
  )
}

interface ListCardMetaProps {
  children: ReactNode
}

export function ListCardMeta({ children }: ListCardMetaProps) {
  return (
    <div className="flex items-center justify-between gap-2 text-[14px] text-[color:var(--color-muted)]">
      {children}
    </div>
  )
}

interface ListCardDescriptionProps {
  children: ReactNode
}

export function ListCardDescription({ children }: ListCardDescriptionProps) {
  return (
    <p className="text-[14px] leading-relaxed text-[color:var(--color-muted)]">
      {children}
    </p>
  )
}

interface ListGridProps {
  children: ReactNode
  columns?: 1 | 2
}

export function ListGrid({ children, columns = 1 }: ListGridProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2"
      )}
    >
      {children}
    </div>
  )
}
