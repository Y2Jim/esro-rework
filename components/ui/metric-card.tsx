import { cn } from "@/lib/cn"

interface MetricCardProps {
  label: string
  value: string | number
  valueClass?: string
}

export function MetricCard({ label, value, valueClass }: MetricCardProps) {
  return (
    <div className="esro-metric">
      <div className="mb-1.5 text-[12px] text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={cn("text-[13px] text-[color:var(--color-text)]", valueClass)}>
        {value}
      </div>
    </div>
  )
}

interface MetricGridProps {
  children: React.ReactNode
  columns?: 2 | 3
}

export function MetricGrid({ children, columns = 2 }: MetricGridProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3"
      )}
    >
      {children}
    </div>
  )
}
