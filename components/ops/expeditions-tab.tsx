"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListCardDescription, ListGrid } from "@/components/ui/list-card"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { EmptyState } from "@/components/ui/empty-state"

export function ExpeditionsTab() {
  const expeditions = useEsroStore((s) => s.expeditions)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const startExpedition = useEsroStore((s) => s.startExpedition)

  return (
    <div
      className="flex h-full flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Active Expedition */}
      {activeExpedition && (
        <Panel variant="focused">
          <PanelHeader title="Active Expedition" />
          <PanelBody>
            <div className="space-y-2">
              <div className="text-[12px] text-[color:var(--color-text)]">
                {activeExpedition.label}
              </div>
              
              {/* Progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-panel-soft)]">
                <div
                  className="h-full bg-[color:var(--color-accent)]"
                  style={{ width: `${activeExpedition.progress * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-[color:var(--color-muted)]">
                <span>{Math.round(activeExpedition.progress * 100)}%</span>
                <span>ETA: {Math.ceil(activeExpedition.etaSeconds / 60)}m</span>
              </div>
              
              {/* Log */}
              {activeExpedition.log.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-[color:var(--color-border-soft)] pt-2">
                  {activeExpedition.log.slice(-3).map((entry, i) => (
                    <div key={i} className="text-[10px] text-[color:var(--color-muted)]">
                      &gt; {entry}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Available Expeditions */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Available Expeditions" />
        <PanelBody scroll>
          {expeditions.length === 0 ? (
            <EmptyState message="No expeditions available" />
          ) : (
            <ListGrid>
              {expeditions.map((exp) => (
                <ListCard
                  key={exp.id}
                  onClick={() => startExpedition(exp.id)}
                >
                  <ListCardTitle>
                    {exp.label}
                    <span className="esro-chip text-[8px]">{exp.risk}</span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span>{Math.round(exp.duration / 60)}m</span>
                    <span>{exp.tags.join(" / ")}</span>
                  </ListCardMeta>
                  <ListCardDescription>
                    Rewards: {exp.rewards.xp} XP, {exp.rewards.tokens} tokens
                  </ListCardDescription>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}
