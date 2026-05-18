interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="esro-empty">
      <span className="text-[15px]">{message}</span>
    </div>
  )
}
