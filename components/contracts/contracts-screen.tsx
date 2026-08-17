"use client"

import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { formatResetIn, msUntilNextDay } from "@/lib/contract-rotation"
import type { ContractType } from "@/lib/types"
import { Zap, Users, Calendar, RotateCcw } from "lucide-react"

type ContractFilter = "all" | ContractType

const FILTER_TABS: { id: ContractFilter; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "All" },
  { id: "neutral", label: "Open", icon: <Zap className="h-3 w-3" /> },
  { id: "faction", label: "Faction", icon: <Users className="h-3 w-3" /> },
  { id: "event", label: "Event", icon: <Calendar className="h-3 w-3" /> },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-400 bg-green-400/10 border-green-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  hard: "text-red-400 bg-red-400/10 border-red-400/30",
}

const TYPE_COLORS: Record<ContractType, string> = {
  neutral: "border-l-cyan-400",
  faction: "border-l-[color:var(--color-accent)]",
  event: "border-l-amber-400",
}

export function ContractsScreen() {
  const [filter, setFilter] = useState<ContractFilter>("all")
  const contracts = useEsroStore((s) => s.contracts)
  const acceptContract = useEsroStore((s) => s.acceptContract)
  const cancelContract = useEsroStore((s) => s.cancelContract)
  const rotateContractsIfStale = useEsroStore((s) => s.rotateContractsIfStale)

  const [resetIn, setResetIn] = useState(() => msUntilNextDay())

  // Ticks the countdown and rolls the board over when it reaches midnight while
  // the screen is open. Also catches a stale board on mount, e.g. after the tab
  // has been left open past midnight.
  useEffect(() => {
    rotateContractsIfStale()
    const timer = setInterval(() => {
      const remaining = msUntilNextDay()
      setResetIn(remaining)
      if (remaining <= 1000) rotateContractsIfStale()
    }, 30_000)
    return () => clearInterval(timer)
  }, [rotateContractsIfStale])

  const filteredContracts = contracts.filter((c) => {
    if (filter === "all") return true
    return c.type === filter
  })

  const available = filteredContracts.filter((c) => c.status === "available")
  const active = filteredContracts.filter((c) => c.status === "active")

  return (
    <div className="flex h-full flex-col">
      {/* Filter tabs */}
      <div className="shrink-0 border-b border-[color:var(--color-border)] px-3 py-2">
        <div className="mb-2 flex items-center gap-1.5 text-[13px] text-[color:var(--color-muted)]">
          <RotateCcw className="h-3 w-3" />
          <span>New contracts in {formatResetIn(resetIn)}</span>
        </div>
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[14px] font-medium transition-colors",
                filter === tab.id
                  ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contract list */}
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        <div className="space-y-4">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-accent)]">
                Active ({active.length})
              </div>
              
              <div className="space-y-2">
                {active.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-lg border border-[color:var(--color-accent)]/30 border-l-2 bg-[color:var(--color-accent)]/5 p-3",
                      TYPE_COLORS[c.type]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium text-[color:var(--color-text)]">{c.label}</div>
                        {c.difficulty && (
                          <span className={cn("rounded border px-1 py-0.5 text-[12px] uppercase", DIFFICULTY_COLORS[c.difficulty])}>
                            {c.difficulty}
                          </span>
                        )}
                      </div>
                      {c.deadline && (
                        <span className="shrink-0 text-[13px] text-[color:var(--color-danger)]">
                          {c.deadline}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[14px] text-[color:var(--color-muted)]">
                      <span>{c.issuer}</span>
                      <span className="opacity-50">|</span>
                      <span className="capitalize">{c.type}</span>
                    </div>
                    <div className="mt-2 text-[15px] text-[color:var(--color-text)]/80">{c.description}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-[14px] text-[color:var(--color-accent)]">{c.reward}</div>
                      <button
                        type="button"
                        onClick={() => cancelContract(c.id)}
                        className="rounded border border-[color:var(--color-danger)]/40 px-2 py-0.5 text-[13px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available */}
          <div>
            <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Available ({available.length})
            </div>
            
            {available.length === 0 ? (
              <div className="rounded-lg border border-[color:var(--color-border)] border-dashed p-4 text-center text-[15px] text-[color:var(--color-muted)]">
                No {filter === "all" ? "" : filter} contracts available
              </div>
            ) : (
              <div className="space-y-2">
                {available.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => acceptContract(c.id)}
                    className={cn(
                      "w-full rounded-lg border border-[color:var(--color-border)] border-l-2 p-3 text-left transition-colors hover:border-[color:var(--color-accent)]/50 hover:bg-[color:var(--color-accent)]/5",
                      TYPE_COLORS[c.type]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-[14px] font-medium text-[color:var(--color-text)]">{c.label}</div>
                        {c.difficulty && (
                          <span className={cn("rounded border px-1 py-0.5 text-[12px] uppercase", DIFFICULTY_COLORS[c.difficulty])}>
                            {c.difficulty}
                          </span>
                        )}
                      </div>
                      {c.deadline && (
                        <span className="shrink-0 text-[13px] text-[color:var(--color-muted)]">
                          {c.deadline}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[14px] text-[color:var(--color-muted)]">
                      <span>{c.issuer}</span>
                      <span className="opacity-50">|</span>
                      <span className="capitalize">{c.type}</span>
                    </div>
                    <div className="mt-2 text-[15px] text-[color:var(--color-text)]/70">{c.description}</div>
                    <div className="mt-2 text-[14px] text-[color:var(--color-accent)]">{c.reward}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
