interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="esro-empty">
      <span className="text-[11px]">{message}</span>
    </div>
  )
}
