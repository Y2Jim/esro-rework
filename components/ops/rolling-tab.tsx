"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListGrid } from "@/components/ui/list-card"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/cn"

const rarityColors: Record<string, string> = {
  common: "text-[color:var(--color-muted)]",
  uncommon: "text-[color:var(--color-success)]",
  rare: "text-[color:var(--color-accent)]",
  epic: "text-[color:var(--color-accent-strong)]",
  legendary: "prismatic-text",
}

export function RollingTab() {
  const shards = useEsroStore((s) => s.shards)
  const recovery = useEsroStore((s) => s.recovery)
  const runRecovery = useEsroStore((s) => s.runRecovery)

  const canStandard = shards.relay_tokens >= 1
  const canFocused = shards.deep_signals >= 2

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
        <PanelHeader title="Signal Shards" />
        <PanelBody>
          <MetricGrid columns={3}>
            <MetricCard label="Relay" value={shards.relay_tokens} />
            <MetricCard label="Deep" value={shards.deep_signals} />
            <MetricCard label="Salvage" value={shards.signal_salvage} />
          </MetricGrid>
        </PanelBody>
      </Panel>

      {/* Recovery Options */}
      <Panel>
        <PanelHeader title="Packet Recovery" />
        <PanelBody>
          <div className="space-y-2">
            <ListCard
              onClick={canStandard ? () => runRecovery("standard") : undefined}
              className={cn(!canStandard && "opacity-50")}
            >
              <ListCardTitle>
                Standard Recovery
                <span className="esro-chip text-[8px]">1 Relay</span>
              </ListCardTitle>
              <ListCardMeta>
                <span>Common routing</span>
                <span>Normal odds</span>
              </ListCardMeta>
            </ListCard>

            <ListCard
              onClick={canFocused ? () => runRecovery("focused") : undefined}
              className={cn(!canFocused && "opacity-50")}
            >
              <ListCardTitle>
                Focused Recovery
                <span className="esro-chip text-[8px]">2 Deep</span>
              </ListCardTitle>
              <ListCardMeta>
                <span>Deep index pass</span>
                <span>Higher odds</span>
              </ListCardMeta>
            </ListCard>
          </div>
        </PanelBody>
      </Panel>

      {/* Recent Recoveries */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Recent Recoveries" />
        <PanelBody scroll>
          {recovery.length === 0 ? (
            <EmptyState message="No recovered packets yet" />
          ) : (
            <ListGrid>
              {recovery.slice(0, 10).map((item) => (
                <ListCard key={item.id} dashed>
                  <ListCardTitle>
                    <span className={rarityColors[item.rarity]}>
                      {item.label}
                    </span>
                    <span className="esro-chip text-[8px] capitalize">
                      {item.type.replace("_", " ")}
                    </span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span className="capitalize">{item.rarity}</span>
                  </ListCardMeta>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
