"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { PartyAvatar } from "@/components/avatar/pixel-avatar"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"

export function FactionScreen() {
  const profile = useEsroStore((s) => s.profile)
  const party = useEsroStore((s) => s.party)
  const factionProjects = useEsroStore((s) => s.factionProjects)

  const faction = profile?.faction

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
      <div className="space-y-4">
        {/* Faction header */}
        {faction && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium text-[color:var(--color-text)]">{faction.label}</div>
              <div className="text-[10px] text-[color:var(--color-muted)]">Rank {faction.rank}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[color:var(--color-accent)]">{faction.standing}/{faction.maxStanding}</div>
              <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                <div
                  className="h-full bg-[color:var(--color-accent)]"
                  style={{ width: `${(faction.standing / faction.maxStanding) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Party */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Party ({party.length})
          </div>
          
          {party.length === 0 ? (
            <div className="text-[11px] text-[color:var(--color-muted)]">No party members</div>
          ) : (
            <div className="space-y-2">
              {party.map((m) => (
                <div
                  key={m.slot}
                  className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] px-3 py-2"
                >
                  <PartyAvatar config={m.avatar || generateAvatarFromSeed(m.handle)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[color:var(--color-text)]">{m.handle}</span>
                      {m.leader && (
                        <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[8px] text-[color:var(--color-accent)]">
                          Leader
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="text-[color:var(--color-muted)]">{m.role}</span>
                      <span className="text-[color:var(--color-accent)]">{m.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Faction Projects
          </div>
          
          {factionProjects.length === 0 ? (
            <div className="text-[11px] text-[color:var(--color-muted)]">No active projects</div>
          ) : (
            <div className="space-y-2">
              {factionProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-[color:var(--color-border)] p-3"
                >
                  <div className="text-[12px] font-medium text-[color:var(--color-text)]">{p.label}</div>
                  <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">{p.description}</div>
                  
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                    <div
                      className="h-full bg-[color:var(--color-accent)]"
                      style={{ width: `${(p.progress / p.goal) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-[color:var(--color-muted)]">
                    <span>{p.progress}/{p.goal}</span>
                    <span>{p.contributors} contributing</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
