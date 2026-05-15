"use client"

import { X } from "lucide-react"

interface AppHeaderProps {
  status?: "linked" | "offline"
  onClose?: () => void
}

export function AppHeader({ status = "linked", onClose }: AppHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Enchanted Star Realms Online
        </p>
        <h1 className="text-[18px] font-bold tracking-[0.08em] text-[color:var(--color-text)]">
          ESRO
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="esro-chip esro-chip-status">
          {status}
        </span>
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="esro-button flex h-7 w-7 items-center justify-center p-0"
            aria-label="Close app"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </header>
  )
}
