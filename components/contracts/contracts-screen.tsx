"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListCardDescription, ListGrid } from "@/components/ui/list-card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/cn"

const statusColors: Record<string, string> = {
  available: "text-[color:var(--color-success)]",
  active: "text-[color:var(--color-accent-strong)]",
  completed: "text-[color:var(--color-muted)]",
}

export function ContractsScreen() {
  const contracts = useEsroStore((s) => s.contracts)
  const acceptContract = useEsroStore((s) => s.acceptContract)

  const available = contracts.filter((c) => c.status === "available")
  const active = contracts.filter((c) => c.status === "active")

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Active Contracts */}
      {active.length > 0 && (
        <Panel variant="focused">
          <PanelHeader title="Active Contracts" />
          <PanelBody>
            <ListGrid>
              {active.map((contract) => (
                <ListCard key={contract.id}>
                  <ListCardTitle>
                    {contract.label}
                    <span className={cn("text-[9px] uppercase", statusColors[contract.status])}>
                      {contract.status}
                    </span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span>{contract.issuer}</span>
                    {contract.deadline && <span>Due: {contract.deadline}</span>}
                  </ListCardMeta>
                  <ListCardDescription>
                    {contract.description}
                  </ListCardDescription>
                  <div className="mt-1 text-[10px] text-[color:var(--color-accent-strong)]">
                    Reward: {contract.reward}
                  </div>
                </ListCard>
              ))}
            </ListGrid>
          </PanelBody>
        </Panel>
      )}

      {/* Contract Board */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Contract Board" />
        <PanelBody scroll>
          {available.length === 0 ? (
            <EmptyState message="No contracts available" />
          ) : (
            <ListGrid>
              {available.map((contract) => (
                <ListCard
                  key={contract.id}
                  onClick={() => acceptContract(contract.id)}
                >
                  <ListCardTitle>
                    {contract.label}
                    <span className={cn("text-[9px] uppercase", statusColors[contract.status])}>
                      {contract.status}
                    </span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span>{contract.issuer}</span>
                    {contract.deadline && <span>Due: {contract.deadline}</span>}
                  </ListCardMeta>
                  <ListCardDescription>
                    {contract.description}
                  </ListCardDescription>
                  <div className="mt-1 text-[10px] text-[color:var(--color-accent-strong)]">
                    Reward: {contract.reward}
                  </div>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
