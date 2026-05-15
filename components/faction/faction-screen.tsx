"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListCardDescription, ListGrid } from "@/components/ui/list-card"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { EmptyState } from "@/components/ui/empty-state"

export function FactionScreen() {
  const profile = useEsroStore((s) => s.profile)
  const party = useEsroStore((s) => s.party)
  const factionProjects = useEsroStore((s) => s.factionProjects)

  const faction = profile?.faction

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Faction Info */}
      {faction && (
        <Panel variant="focused">
          <PanelHeader title={faction.label} />
          <PanelBody>
            <MetricGrid columns={3}>
              <MetricCard label="Rank" value={faction.rank} />
              <MetricCard label="Standing" value={`${faction.standing}/${faction.maxStanding}`} />
              <MetricCard label="Members" value={party.length} />
            </MetricGrid>
            
            {/* Standing bar */}
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-panel-soft)]">
                <div
                  className="h-full bg-[color:var(--color-accent)]"
                  style={{ width: `${(faction.standing / faction.maxStanding) * 100}%` }}
                />
              </div>
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Party */}
      <Panel>
        <PanelHeader title="Party Members" />
        <PanelBody>
          {party.length === 0 ? (
            <div className="text-[10px] text-[color:var(--color-muted)]">
              No party members
            </div>
          ) : (
            <ListGrid columns={2}>
              {party.map((member) => (
                <ListCard key={member.slot}>
                  <ListCardTitle>
                    {member.handle}
                    {member.leader && (
                      <span className="esro-chip text-[8px]">Leader</span>
                    )}
                  </ListCardTitle>
                  <ListCardMeta>
                    <span>{member.role}</span>
                    <span className="capitalize">{member.status}</span>
                  </ListCardMeta>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>

      {/* Faction Projects */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Faction Projects" />
        <PanelBody scroll>
          {factionProjects.length === 0 ? (
            <EmptyState message="No active faction projects" />
          ) : (
            <ListGrid>
              {factionProjects.map((project) => (
                <ListCard key={project.id}>
                  <ListCardTitle>
                    {project.label}
                  </ListCardTitle>
                  <ListCardDescription>
                    {project.description}
                  </ListCardDescription>
                  
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-panel-soft)]">
                      <div
                        className="h-full bg-[color:var(--color-accent)]"
                        style={{ width: `${(project.progress / project.goal) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] text-[color:var(--color-muted)]">
                      <span>{project.progress}/{project.goal}</span>
                      <span>{project.contributors} contributors</span>
                    </div>
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
