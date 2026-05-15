"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { ListCard, ListCardTitle, ListCardMeta, ListCardDescription, ListGrid } from "@/components/ui/list-card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/cn"

export function SkillsTab() {
  const skills = useEsroStore((s) => s.skills)
  const loadout = useEsroStore((s) => s.loadout)
  const toggleLoadout = useEsroStore((s) => s.toggleLoadout)

  const equippedSkills = skills.filter((s) => loadout.includes(s.id))
  const availableSkills = skills.filter((s) => !loadout.includes(s.id) && !s.locked)

  return (
    <div
      className="flex h-full flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Loadout */}
      <Panel variant="focused">
        <PanelHeader title="Active Loadout" />
        <PanelBody>
          {equippedSkills.length === 0 ? (
            <div className="text-[10px] text-[color:var(--color-muted)]">
              No skills equipped
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {equippedSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleLoadout(skill.id)}
                  className="esro-metric flex flex-col items-center gap-1 text-center transition-all hover:border-[color:var(--color-border-strong)]"
                >
                  <span className="text-[10px] text-[color:var(--color-text)]">
                    {skill.label.slice(0, 8)}
                  </span>
                  <span className="text-[9px] text-[color:var(--color-muted)]">
                    Lv {skill.level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* All Skills */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Skills" />
        <PanelBody scroll>
          {availableSkills.length === 0 ? (
            <EmptyState message="All skills equipped or locked" />
          ) : (
            <ListGrid columns={2}>
              {availableSkills.map((skill) => (
                <ListCard
                  key={skill.id}
                  onClick={() => toggleLoadout(skill.id)}
                >
                  <ListCardTitle>
                    {skill.label}
                  </ListCardTitle>
                  <ListCardMeta>
                    <span>Lv {skill.level}/{skill.maxLevel}</span>
                    {skill.variant && <span className="esro-chip text-[8px]">{skill.variant}</span>}
                  </ListCardMeta>
                  <ListCardDescription>
                    {skill.summary}
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
