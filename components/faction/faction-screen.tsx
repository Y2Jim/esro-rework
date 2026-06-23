"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PartyAvatar } from "@/components/avatar/pixel-avatar"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

type FactionTab = "party" | "projects" | "ranks"

const factionTabs: { id: FactionTab; label: string; icon: string; color: string; bgColor: string }[] = [
  { id: "party", label: "Party", icon: "⋈", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15" },
  { id: "projects", label: "Projects", icon: "▤", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15" },
  { id: "ranks", label: "Ranks", icon: "△", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15" },
]

export function FactionScreen() {
  const [tab, setTab] = useState<FactionTab>("party")
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  const party = useEsroStore((s) => s.party)
  const factionProjects = useEsroStore((s) => s.factionProjects)

  const faction = profile?.faction

  return (
    <div className="flex h-full flex-col">
      {/* Faction header */}
      {faction && (
        <div className="border-b border-[color:var(--color-border)] px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-medium text-[color:var(--color-text)]">{faction.label}</div>
              <div className="text-[14px] text-[color:var(--color-muted)]">Rank {faction.rank} - {getRankTitle(faction.rank)}</div>
            </div>
            <div className="text-right">
              <div className="text-[15px] text-[color:var(--color-accent)]">{faction.standing}/{faction.maxStanding}</div>
              <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                <div
                  className="h-full bg-[color:var(--color-accent)]"
                  style={{ width: `${(faction.standing / faction.maxStanding) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[color:var(--color-border)] px-2 py-1.5">
        {factionTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              tab === t.id
                ? cn(t.bgColor, t.color)
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            )}
          >
            <span className="text-[14px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {tab === "party" && <PartyTab party={party} profile={profile} identity={identity} />}
        {tab === "projects" && <ProjectsTab projects={factionProjects} />}
        {tab === "ranks" && <RanksTab currentRank={faction?.rank || 0} />}
      </div>
    </div>
  )
}

function getRankTitle(rank: number): string {
  const titles = ["Initiate", "Member", "Trusted", "Veteran", "Elite", "Officer", "Commander"]
  return titles[Math.min(rank, titles.length - 1)]
}

function PartyTab({ 
  party, 
  profile, 
  identity 
}: { 
  party: ReturnType<typeof useEsroStore>["party"]
  profile: ReturnType<typeof useEsroStore>["profile"]
  identity: ReturnType<typeof useEsroStore>["identity"]
}) {
  const maxSlots = 4
  
  // Update the player's own party entry with current profile data
  const partyWithUpdatedPlayer = party.map((m) => {
    if (m.leader || m.handle === identity.handle) {
      return {
        ...m,
        handle: profile.handle || identity.handle,
        title: profile.title?.label || m.title,
        titleRarity: profile.title?.rarity || m.titleRarity,
        avatar: identity.avatar,
      }
    }
    return m
  })

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Party Members ({partyWithUpdatedPlayer.length}/{maxSlots})
      </div>

      <div className="space-y-2">
        {partyWithUpdatedPlayer.map((m) => (
          <div
            key={m.slot}
            className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] px-3 py-2"
          >
            <PartyAvatar config={m.avatar || generateAvatarFromSeed(m.handle)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-[color:var(--color-text)]">{m.handle}</span>
                {m.leader && (
                  <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-accent)]">
                    Leader
                  </span>
                )}
              </div>
              {m.title && (
                <div className={cn("text-[13px]", rarityColor[m.titleRarity || "common"])}>{m.title}</div>
              )}
              <div className="flex items-center gap-3 text-[13px] text-[color:var(--color-muted)]">
                <span>{m.role}</span>
                <span className={cn(
                  m.status === "ready" && "text-[color:var(--color-success)]",
                  m.status === "deployed" && "text-[color:var(--color-cyan)]",
                  m.status === "idle" && "text-[color:var(--color-amber)]",
                  m.status === "offline" && "text-[color:var(--color-muted)]"
                )}>
                  {m.status}
                </span>
                {m.contribution && (
                  <span>{m.contribution} XP</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxSlots - partyWithUpdatedPlayer.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center justify-center rounded-lg border border-dashed border-[color:var(--color-border-soft)] px-3 py-4"
          >
            <div className="text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">Empty Slot</div>
              <div className="mt-0.5 text-[13px] text-[color:var(--color-muted-2)]">Invite a player</div>
            </div>
          </div>
        ))}
      </div>

      {/* Party actions */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">Party Actions</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded border border-[color:var(--color-border)] px-3 py-1.5 text-[14px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
          >
            Invite Player
          </button>
          <button
            type="button"
            className="rounded border border-[color:var(--color-border)] px-3 py-1.5 text-[14px] text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
          >
            Party Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectsTab({ projects }: { projects: ReturnType<typeof useEsroStore>["factionProjects"] }) {
  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Active Projects ({projects.length})
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No active projects</div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const pct = (p.progress / p.goal) * 100
            return (
              <div
                key={p.id}
                className="rounded-lg border border-[color:var(--color-border)] p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="text-[14px] font-medium text-[color:var(--color-text)]">{p.label}</div>
                  <span className="text-[13px] text-[color:var(--color-accent)]">{Math.floor(pct)}%</span>
                </div>
                <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">{p.description}</div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                  <div
                    className="h-full bg-[color:var(--color-accent)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
                  <span>{p.progress}/{p.goal} collected</span>
                  <span>{p.contributors} contributors</span>
                </div>

                <button
                  type="button"
                  className="mt-2 w-full rounded border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/20"
                >
                  Contribute
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RanksTab({ currentRank }: { currentRank: number }) {
  const ranks = [
    { rank: 0, title: "Initiate", standing: 0, rewards: ["Basic access", "Chat participation"] },
    { rank: 1, title: "Member", standing: 100, rewards: ["Route Tender title", "Faction chat"] },
    { rank: 2, title: "Trusted", standing: 300, rewards: ["Signal Keeper title", "Project voting"] },
    { rank: 3, title: "Veteran", standing: 600, rewards: ["Waystone Keeper title", "Priority contracts"] },
    { rank: 4, title: "Elite", standing: 1000, rewards: ["Elite Waykeeper title", "Rare schematics"] },
    { rank: 5, title: "Officer", standing: 1500, rewards: ["Officer insignia", "Lead expeditions"] },
    { rank: 6, title: "Commander", standing: 2500, rewards: ["Legendary title", "Faction leadership"] },
  ]

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Faction Ranks
      </div>

      <div className="space-y-2">
        {ranks.map((r) => {
          const isUnlocked = currentRank >= r.rank
          const isCurrent = currentRank === r.rank

          return (
            <div
              key={r.rank}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                isCurrent
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                  : isUnlocked
                    ? "border-[color:var(--color-border)]"
                    : "border-[color:var(--color-border-soft)] opacity-60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[color:var(--color-text)]">
                    Rank {r.rank}: {r.title}
                  </span>
                  {isCurrent && (
                    <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-accent)]">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-[14px] text-[color:var(--color-muted)]">{r.standing} standing</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.rewards.map((reward, i) => (
                  <span
                    key={i}
                    className="rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[13px] text-[color:var(--color-muted)]"
                  >
                    {reward}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
