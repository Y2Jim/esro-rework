"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListCardDescription, ListGrid } from "@/components/ui/list-card"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { EmptyState } from "@/components/ui/empty-state"

export function CraftingTab() {
  const inventory = useEsroStore((s) => s.inventory)
  const shards = useEsroStore((s) => s.shards)

  const materials = inventory.filter((i) => i.aspect === "supply" || i.aspect === "salvage")

  return (
    <div
      className="flex h-full flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Resources */}
      <Panel>
        <PanelHeader title="Resources" />
        <PanelBody>
          <MetricGrid columns={3}>
            <MetricCard label="Relay Tokens" value={shards.relay_tokens} />
            <MetricCard label="Deep Signals" value={shards.deep_signals} />
            <MetricCard label="Salvage" value={shards.signal_salvage} />
          </MetricGrid>
        </PanelBody>
      </Panel>

      {/* Materials */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Materials" />
        <PanelBody scroll>
          {materials.length === 0 ? (
            <EmptyState message="No crafting materials" />
          ) : (
            <ListGrid columns={2}>
              {materials.map((item) => (
                <ListCard key={item.id}>
                  <ListCardTitle>
                    {item.label}
                    <span className="text-[9px] text-[color:var(--color-muted)]">
                      x{item.qty}
                    </span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span className="capitalize">{item.rarity}</span>
                    <span className="capitalize">{item.aspect}</span>
                  </ListCardMeta>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>

      {/* Crafting hint */}
      <div className="text-center text-[10px] text-[color:var(--color-muted)]">
        Crafting recipes coming soon
      </div>
    </div>
  )
}
