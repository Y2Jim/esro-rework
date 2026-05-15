"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"

export function ContractsScreen() {
  const contracts = useEsroStore((s) => s.contracts)
  const acceptContract = useEsroStore((s) => s.acceptContract)
  const cancelContract = useEsroStore((s) => s.cancelContract)

  const available = contracts.filter((c) => c.status === "available")
  const active = contracts.filter((c) => c.status === "active")

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
      <div className="space-y-4">
        {/* Active */}
        {active.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-accent)]">
              Active ({active.length})
            </div>
            
            <div className="space-y-2">
              {active.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/5 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-medium text-[color:var(--color-text)]">{c.label}</div>
                    {c.deadline && (
                      <span className="shrink-0 text-[9px] text-[color:var(--color-danger)]">
                        {c.deadline}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">{c.issuer}</div>
                  <div className="mt-2 text-[11px] text-[color:var(--color-text)]/80">{c.description}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-[10px] text-[color:var(--color-accent)]">{c.reward}</div>
                    <button
                      type="button"
                      onClick={() => cancelContract(c.id)}
                      className="rounded border border-[color:var(--color-danger)]/40 px-2 py-0.5 text-[9px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/10"
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
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Available
          </div>
          
          {available.length === 0 ? (
            <div className="text-[11px] text-[color:var(--color-muted)]">No contracts</div>
          ) : (
            <div className="space-y-2">
              {available.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => acceptContract(c.id)}
                  className="w-full rounded-lg border border-[color:var(--color-border)] p-3 text-left transition-colors hover:border-[color:var(--color-accent)]/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12px] font-medium text-[color:var(--color-text)]">{c.label}</div>
                    {c.deadline && (
                      <span className="shrink-0 text-[9px] text-[color:var(--color-muted)]">
                        {c.deadline}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">{c.issuer}</div>
                  <div className="mt-2 text-[11px] text-[color:var(--color-text)]/70">{c.description}</div>
                  <div className="mt-2 text-[10px] text-[color:var(--color-accent)]">{c.reward}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
