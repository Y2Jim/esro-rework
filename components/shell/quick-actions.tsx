"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { QuickAction } from "@/lib/types"
import { cn } from "@/lib/cn"

export function QuickActions() {
  const quickActions = useEsroStore((s) => s.quickActions)
  const setScreen = useEsroStore((s) => s.setScreen)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)

  if (!quickActions || quickActions.length === 0) {
    return null
  }

  const handleAction = (action: QuickAction) => {
    setScreen(action.deeplink.screen)
    if (action.deeplink.tab) {
      setOpsTab(action.deeplink.tab)
    }
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {quickActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => handleAction(action)}
          className={cn(
            "esro-quick-card flex min-w-[140px] shrink-0 flex-col gap-1 text-left transition-all hover:border-[color:var(--color-border-strong)]",
            action.priority === "urgent" && "border-[color:var(--color-danger)]/50"
          )}
        >
          <span className="text-[11px] font-medium text-[color:var(--color-text)]">
            {action.label}
          </span>
          <span className="text-[10px] text-[color:var(--color-muted)]">
            {action.description}
          </span>
          {action.priority === "urgent" && (
            <span className="mt-1 text-[9px] uppercase tracking-wider text-[color:var(--color-danger)]">
              urgent
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
