"use client"

import { useState } from "react"
import { useEsroStore, type EsroState } from "@/store/use-esro-store"
import { PartyAvatar, PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { getTitleClass } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { FACTIONS, FACTION_UNLOCK_LEVEL } from "@/lib/game-data"
import { FactionSelection } from "@/components/onboarding/faction-selection"
import type { SocialTab, RaceId } from "@/lib/types"

const socialTabs: { id: SocialTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "party", label: "Party", icon: "⋈", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "faction", label: "Faction", icon: "⬡", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
  { id: "friends", label: "Friends", icon: "◇", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15", hover: "hover-green" },
  { id: "trade", label: "Trade", icon: "⇄", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
]

export function SocialScreen() {
  const [tab, setTab] = useState<SocialTab>("party")
  const profile = useEsroStore((s) => s.profile)
  const party = useEsroStore((s) => s.party)
  const factionProjects = useEsroStore((s) => s.factionProjects)
  const friends = useEsroStore((s) => s.friends)
  const tradeOffers = useEsroStore((s) => s.tradeOffers)

  const faction = profile?.faction

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-2 py-1.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {socialTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              t.hover,
              tab === t.id
                ? cn(t.bgColor, t.color)
                : "text-[color:var(--color-muted)]"
            )}
          >
            <span className="text-[14px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {tab === "party" && <PartyTab party={party} />}
        {tab === "faction" && <FactionTab faction={faction} projects={factionProjects} />}
        {tab === "friends" && <FriendsTab friends={friends} />}
        {tab === "trade" && <TradeTab offers={tradeOffers} />}
      </div>
    </div>
  )
}

// ============ PARTY TAB ============
function PartyTab({ party }: { party: EsroState["party"] }) {
  const maxSlots = 4

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Party Members ({party.length}/{maxSlots})
      </div>

      <div className="space-y-2">
        {party.map((m) => (
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
                <div className={cn("text-[13px]", getTitleClass(m.titleRarity || "common"))}>{m.title}</div>
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
                {m.contribution && <span>{m.contribution} XP</span>}
              </div>
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxSlots - party.length }).map((_, i) => (
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
            className="rounded border border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-cyan)] transition-colors hover:bg-[color:var(--color-cyan)]/20"
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

// ============ FACTION TAB ============
function FactionTab({ 
  faction, 
  projects 
}: { 
  faction: EsroState["profile"]["faction"]
  projects: EsroState["factionProjects"] 
}) {
  const [subTab, setSubTab] = useState<"overview" | "projects" | "ranks">("overview")
  const [showFactionSelection, setShowFactionSelection] = useState(false)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const profile = useEsroStore((s) => s.profile)
  const setFaction = useEsroStore((s) => s.setFaction)
  
  const playerLevel = profile?.level || 1
  const isLocked = playerLevel < FACTION_UNLOCK_LEVEL

  // Show faction selection overlay
  if (showFactionSelection) {
    return (
      <FactionSelection
        playerLevel={playerLevel}
        currentFaction={characterFaction}
        onComplete={(factionId: RaceId) => {
          setFaction(factionId)
          setShowFactionSelection(false)
        }}
        onCancel={() => setShowFactionSelection(false)}
      />
    )
  }

  // No faction joined yet
  if (!characterFaction) {
    return (
      <div className="space-y-4">
        {/* Faction preview grid */}
        <div className="grid grid-cols-2 gap-3">
          {FACTIONS.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border p-3 text-center"
              style={{
                borderColor: isLocked ? "rgba(255,255,255,0.1)" : `${f.color}30`,
                backgroundColor: isLocked ? "rgba(15,16,22,0.5)" : f.colorVars.bg,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <div 
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold"
                style={{ 
                  backgroundColor: `${f.color}20`,
                  color: isLocked ? "#666" : f.color,
                }}
              >
                {f.emblem}
              </div>
              <div 
                className="mt-2 text-[15px] font-medium"
                style={{ color: isLocked ? "#888" : f.color }}
              >
                {f.name}
              </div>
            </div>
          ))}
        </div>

        {isLocked ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
            <div className="text-[14px] text-amber-400 font-medium">
              Factions unlock at Level {FACTION_UNLOCK_LEVEL}
            </div>
            <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">
              Current level: {playerLevel}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div
                className="h-full bg-amber-500/60"
                style={{ width: `${(playerLevel / FACTION_UNLOCK_LEVEL) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFactionSelection(true)}
            className="w-full rounded-lg border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 px-4 py-3 text-[14px] font-medium text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/20"
          >
            Choose Your Faction
          </button>
        )}

        <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3">
          <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Faction Benefits
          </div>
          <ul className="mt-2 space-y-1 text-[13px] text-[color:var(--color-muted)]">
            <li>- Themed UI colors and emblem badge</li>
            <li>- Bonus rewards on aligned expeditions</li>
            <li>- Access to faction-exclusive projects</li>
            <li>- Unique faction ranks and titles</li>
          </ul>
        </div>
      </div>
    )
  }

  // Has faction - show full faction view
  return (
    <div className="space-y-4">
      {/* Faction header with emblem */}
      <div 
        className="rounded-lg border p-4"
        style={{
          borderColor: `${characterFaction.color}40`,
          backgroundColor: characterFaction.colorVars.bg,
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold"
            style={{ 
              backgroundColor: `${characterFaction.color}25`,
              color: characterFaction.color,
              boxShadow: `0 0 20px ${characterFaction.glow}`,
            }}
          >
            {characterFaction.emblem}
          </div>
          <div className="flex-1">
            <div 
              className="text-[16px] font-bold"
              style={{ color: characterFaction.color }}
            >
              {characterFaction.name}
            </div>
            <div className="text-[13px] text-[color:var(--color-muted)] italic">
              &quot;{characterFaction.motto}&quot;
            </div>
            {faction && (
              <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">
                Rank {faction.rank} - {getRankTitle(faction.rank)}
              </div>
            )}
          </div>
        </div>
        {faction && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[color:var(--color-muted)]">Standing Progress</span>
              <span style={{ color: characterFaction.color }}>
                {faction.standing}/{faction.maxStanding}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.1)]">
              <div
                className="h-full transition-all"
                style={{ 
                  width: `${(faction.standing / faction.maxStanding) * 100}%`,
                  backgroundColor: characterFaction.color,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {(["overview", "projects", "ranks"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={cn(
              "rounded px-2 py-1 text-[13px] uppercase tracking-wider transition-colors",
              subTab === t
                ? "text-[color:var(--color-accent)]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            )}
            style={subTab === t ? { 
              backgroundColor: `${characterFaction.color}15`,
              color: characterFaction.color,
            } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "overview" && <FactionOverviewNew factionData={characterFaction} faction={faction} />}
      {subTab === "projects" && <FactionProjects projects={projects} />}
      {subTab === "ranks" && <FactionRanks currentRank={faction?.rank || 0} />}
    </div>
  )
}

function FactionOverviewNew({ 
  factionData, 
  faction 
}: { 
  factionData: NonNullable<EsroState["characterFaction"]>
  faction: EsroState["profile"]["faction"]
}) {
  return (
    <div className="space-y-3">
      {/* Faction Lore */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Faction Lore
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {factionData.lore}
        </p>
      </div>

      {/* Stats */}
      {faction && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Your Stats</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[18px] font-medium" style={{ color: factionData.color }}>
                {faction.rank}
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)]">Current Rank</div>
            </div>
            <div>
              <div className="text-[18px] font-medium text-[color:var(--color-text)]">
                {faction.standing}
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)]">Standing</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Rank */}
      {faction && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Next Rank</div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-[color:var(--color-text)]">{getRankTitle(faction.rank + 1)}</span>
              <span className="text-[color:var(--color-muted)]">{faction.standing}/{faction.maxStanding}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div
                className="h-full transition-all"
                style={{ 
                  width: `${(faction.standing / faction.maxStanding) * 100}%`,
                  backgroundColor: factionData.color,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Faction Doctrines (from Lua config) */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Faction Bonuses
        </div>
        <ul className="mt-2 space-y-1 text-[13px] text-[color:var(--color-muted)]">
          <li className="flex items-center gap-2">
            <span style={{ color: factionData.color }}>+</span>
            Bonus rewards on faction-aligned expeditions
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: factionData.color }}>+</span>
            Hidden attunement growth from matched skills
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: factionData.color }}>+</span>
            Faction-specific drop bias on routes
          </li>
        </ul>
      </div>
    </div>
  )
}

function FactionOverview({ faction }: { faction: NonNullable<EsroState["profile"]["faction"]> }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Stats</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[18px] font-medium text-[color:var(--color-text)]">{faction.rank}</div>
            <div className="text-[13px] text-[color:var(--color-muted)]">Current Rank</div>
          </div>
          <div>
            <div className="text-[18px] font-medium text-[color:var(--color-text)]">{faction.standing}</div>
            <div className="text-[13px] text-[color:var(--color-muted)]">Standing</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Next Rank</div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-[color:var(--color-text)]">{getRankTitle(faction.rank + 1)}</span>
            <span className="text-[color:var(--color-muted)]">{faction.standing}/{faction.maxStanding}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <div
              className="h-full bg-[color:var(--color-violet-bright)]"
              style={{ width: `${(faction.standing / faction.maxStanding) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FactionProjects({ projects }: { projects: EsroState["factionProjects"] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
        <div className="text-[15px] text-[color:var(--color-muted)]">No active projects</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const pct = (p.progress / p.goal) * 100
        return (
          <div key={p.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="flex items-start justify-between">
              <div className="text-[14px] font-medium text-[color:var(--color-text)]">{p.label}</div>
              <span className="text-[13px] text-[color:var(--color-violet-bright)]">{Math.floor(pct)}%</span>
            </div>
            <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">{p.description}</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div className="h-full bg-[color:var(--color-violet-bright)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
              <span>{p.progress}/{p.goal} collected</span>
              <span>{p.contributors} contributors</span>
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded border border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-violet-bright)] transition-colors hover:bg-[color:var(--color-violet-bright)]/20"
            >
              Contribute
            </button>
          </div>
        )
      })}
    </div>
  )
}

function FactionRanks({ currentRank }: { currentRank: number }) {
  const ranks = [
    { rank: 0, title: "Initiate", standing: 0, tier: "recruit", rewards: ["Basic access", "Faction chat"] },
    { rank: 1, title: "Member", standing: 100, tier: "recruit", rewards: ["Route Tender title", "Public projects"] },
    { rank: 2, title: "Trusted", standing: 250, tier: "recruit", rewards: ["Signal Keeper title", "Project voting"] },
    { rank: 3, title: "Pathfinder", standing: 500, tier: "core", rewards: ["Priority contracts", "Faction expeditions"] },
    { rank: 4, title: "Veteran", standing: 800, tier: "core", rewards: ["Waystone Keeper title", "Faction armory access"] },
    { rank: 5, title: "Elite", standing: 1200, tier: "core", rewards: ["Elite Waykeeper title", "Rare schematics"] },
    { rank: 6, title: "Vanguard", standing: 1800, tier: "officer", rewards: ["Faction Wars participant", "Lead skirmishes"] },
    { rank: 7, title: "Officer", standing: 2500, tier: "officer", rewards: ["Officer insignia", "Territory defense"] },
    { rank: 8, title: "Captain", standing: 3500, tier: "officer", rewards: ["Captain title", "Coordinate war efforts"] },
    { rank: 9, title: "Commander", standing: 5000, tier: "leadership", rewards: ["Legendary title", "Faction council seat"] },
    { rank: 10, title: "Warlord", standing: 7500, tier: "leadership", rewards: ["Warlord title", "Declare faction wars"] },
    { rank: 11, title: "Archon", standing: 10000, tier: "leadership", rewards: ["Archon title", "Shape faction destiny"] },
  ]

  const tierColors: Record<string, { border: string; bg: string; text: string }> = {
    recruit: { border: "border-[color:var(--color-muted)]", bg: "bg-[color:var(--color-muted)]/10", text: "text-[color:var(--color-muted)]" },
    core: { border: "border-[color:var(--color-cyan)]", bg: "bg-[color:var(--color-cyan)]/10", text: "text-[color:var(--color-cyan)]" },
    officer: { border: "border-[color:var(--color-amber)]", bg: "bg-[color:var(--color-amber)]/10", text: "text-[color:var(--color-amber)]" },
    leadership: { border: "border-[color:var(--color-violet-bright)]", bg: "bg-[color:var(--color-violet-bright)]/10", text: "text-[color:var(--color-violet-bright)]" },
  }

  const tierLabels: Record<string, string> = {
    recruit: "Recruit Tier",
    core: "Core Tier",
    officer: "Officer Tier",
    leadership: "Leadership Tier",
  }

  // Group ranks by tier
  const groupedRanks = ranks.reduce((acc, r) => {
    if (!acc[r.tier]) acc[r.tier] = []
    acc[r.tier].push(r)
    return acc
  }, {} as Record<string, typeof ranks>)

  return (
    <div className="space-y-4">
      {Object.entries(groupedRanks).map(([tier, tierRanks]) => {
        const colors = tierColors[tier]
        return (
          <div key={tier} className="space-y-2">
            <div className={cn("text-[13px] uppercase tracking-wider", colors.text)}>
              {tierLabels[tier]}
            </div>
            {tierRanks.map((r) => {
              const isUnlocked = currentRank >= r.rank
              const isCurrent = currentRank === r.rank
              return (
                <div
                  key={r.rank}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    isCurrent
                      ? cn(colors.border, colors.bg)
                      : isUnlocked
                        ? "border-[color:var(--color-border)]"
                        : "border-[color:var(--color-border-soft)] opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-[color:var(--color-text)]">
                        {r.rank}. {r.title}
                      </span>
                      {isCurrent && (
                        <span className={cn("rounded px-1.5 py-0.5 text-[12px]", colors.bg, colors.text)}>
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-[color:var(--color-muted)]">{r.standing}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.rewards.map((reward, i) => (
                      <span key={i} className="rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[12px] text-[color:var(--color-muted)]">
                        {reward}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Faction Wars info */}
      <div className="rounded-lg border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/5 p-3">
        <div className="text-[14px] font-medium text-[color:var(--color-danger)]">Faction Wars</div>
        <div className="mt-1 text-[13px] text-[color:var(--color-muted)]">
          Reach Vanguard rank to participate in faction v faction conflicts. Higher ranks unlock leadership roles in coordinating war efforts, defending territories, and declaring wars against rival factions.
        </div>
      </div>
    </div>
  )
}

function getRankTitle(rank: number): string {
  const titles = ["Initiate", "Member", "Trusted", "Veteran", "Elite", "Officer", "Commander"]
  return titles[Math.min(rank, titles.length - 1)]
}

// ============ FRIENDS TAB ============
function FriendsTab({ friends }: { friends: EsroState["friends"] }) {
  const online = friends.filter(f => f.status === "online")
  const away = friends.filter(f => f.status === "away")
  const offline = friends.filter(f => f.status === "offline")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Friends ({friends.length})
        </div>
        <button
          type="button"
          className="rounded border border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 px-2 py-1 text-[13px] text-[color:var(--color-green)] transition-colors hover:bg-[color:var(--color-green)]/20"
        >
          Add Friend
        </button>
      </div>

      {friends.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No friends yet</div>
          <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">Add players to see them here</div>
        </div>
      ) : (
        <div className="space-y-4">
          {online.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-success)]">
                Online ({online.length})
              </div>
              {online.map(f => <FriendRow key={f.handle} friend={f} />)}
            </div>
          )}
          {away.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-amber)]">
                Away ({away.length})
              </div>
              {away.map(f => <FriendRow key={f.handle} friend={f} />)}
            </div>
          )}
          {offline.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Offline ({offline.length})
              </div>
              {offline.map(f => <FriendRow key={f.handle} friend={f} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FriendRow({ friend }: { friend: EsroState["friends"][0] }) {
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const removeFriend = useEsroStore((s) => s.removeFriend)
  
  const friendAvatar = friend.avatar || generateAvatarFromSeed(friend.handle)
  
  return (
    <div className="rounded-lg border border-[color:var(--color-border)]">
      <div className="flex items-center gap-3 px-3 py-2">
        <PartyAvatar config={friendAvatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-[color:var(--color-text)]">{friend.handle}</span>
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              friend.status === "online" && "bg-[color:var(--color-success)]",
              friend.status === "away" && "bg-[color:var(--color-amber)]",
              friend.status === "offline" && "bg-[color:var(--color-muted)]"
            )} />
          </div>
{friend.title && (
                <div className={cn("text-[13px]", getTitleClass(friend.titleRarity || "common"))}>{friend.title}</div>
              )}
          {friend.faction && (
            <div className="text-[13px] text-[color:var(--color-muted)]">{friend.faction}</div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShowProfile(!showProfile)}
            className={cn(
              "rounded border p-1.5 text-[14px] transition-colors",
              showProfile
                ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
            )}
            title="View Profile"
          >
            ◎
          </button>
          <button
            type="button"
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
            title="Message"
          >
            ◇
          </button>
          <button
            type="button"
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
            title="Invite to party"
          >
            ⋈
          </button>
          <button
            type="button"
            onClick={() => setShowUnfriendConfirm(true)}
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-danger)]/50 hover:bg-[color:var(--color-danger)]/10 hover:text-[color:var(--color-danger)]"
            title="Unfriend"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Profile view */}
      {showProfile && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-panel)]/30 p-3">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <PixelAvatar config={friendAvatar} size="lg" showFlair={true} />
              <div className={cn(
                "text-[12px] uppercase tracking-wider",
                friend.status === "online" && "text-[color:var(--color-success)]",
                friend.status === "away" && "text-[color:var(--color-amber)]",
                friend.status === "offline" && "text-[color:var(--color-muted)]"
              )}>
                {friend.status}
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-[14px] font-medium text-[color:var(--color-text)]">{friend.handle}</div>
                {friend.title && (
                  <TitleDisplay title={friend.title} rarity={friend.titleRarity || "common"} variant="inline" className="text-[14px]" />
                )}
              </div>
              
              {friend.faction && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[color:var(--color-muted)]">Faction:</span>
                  <span className="text-[13px] text-[color:var(--color-text)]">{friend.faction}</span>
                </div>
              )}
              
              {friend.lastSeen && friend.status === "offline" && (
                <div className="text-[13px] text-[color:var(--color-muted)]">
                  Last seen: {new Date(friend.lastSeen).toLocaleDateString()}
                </div>
              )}
              
              {friend.note && (
                <div className="rounded bg-[color:var(--color-bg)]/50 p-2">
                  <div className="mb-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">Note</div>
                  <div className="text-[13px] text-[color:var(--color-text)]">{friend.note}</div>
                </div>
              )}
              
              {/* Quick actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="rounded border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/10 px-2 py-1 text-[13px] text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/20"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[13px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10"
                >
                  Invite to Party
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Unfriend confirmation */}
      {showUnfriendConfirm && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-danger)]/5 px-3 py-2">
          <div className="mb-2 text-[14px] text-[color:var(--color-text)]">
            Remove {friend.handle} from friends?
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                removeFriend(friend.handle)
              }}
              className="flex-1 rounded border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/15 px-2 py-1 text-[13px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/25"
            >
              Unfriend
            </button>
            <button
              type="button"
              onClick={() => setShowUnfriendConfirm(false)}
              className="flex-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[13px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ TRADE TAB ============
function TradeTab({ offers }: { offers: EsroState["tradeOffers"] }) {
  const [subTab, setSubTab] = useState<"offers" | "history">("offers")
  const incoming = offers.filter(o => o.status === "pending" && o.toHandle === "@you")
  const outgoing = offers.filter(o => o.status === "pending" && o.fromHandle === "@you")
  const completed = offers.filter(o => o.status === "completed")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["offers", "history"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubTab(t)}
              className={cn(
                "rounded px-2 py-1 text-[13px] uppercase tracking-wider transition-colors",
                subTab === t
                  ? "bg-[color:var(--color-amber)]/15 text-[color:var(--color-amber)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="rounded border border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 px-2 py-1 text-[13px] text-[color:var(--color-amber)] transition-colors hover:bg-[color:var(--color-amber)]/20"
        >
          New Trade
        </button>
      </div>

      {subTab === "offers" && (
        <>
          {incoming.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-amber)]">
                Incoming ({incoming.length})
              </div>
              {incoming.map(o => <TradeOfferRow key={o.id} offer={o} type="incoming" />)}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="space-y-2">
              <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-cyan)]">
                Outgoing ({outgoing.length})
              </div>
              {outgoing.map(o => <TradeOfferRow key={o.id} offer={o} type="outgoing" />)}
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">No pending trades</div>
              <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">Start a trade with another player</div>
            </div>
          )}

          {/* Trade tips */}
          <div className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">Trade Tips</div>
            <ul className="mt-2 space-y-1 text-[13px] text-[color:var(--color-muted)]">
              <li>- Trades expire after 2 hours</li>
              <li>- Both parties must confirm for completion</li>
              <li>- Check rarity before accepting</li>
            </ul>
          </div>
        </>
      )}

      {subTab === "history" && (
        <div className="space-y-2">
          {completed.length > 0 ? (
            completed.map(o => (
              <div key={o.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PartyAvatar config={generateAvatarFromSeed(o.fromHandle === "@you" ? o.toHandle : o.fromHandle)} />
                    <div>
                      <div className="text-[15px] text-[color:var(--color-text)]">
                        {o.fromHandle === "@you" ? o.toHandle : o.fromHandle}
                      </div>
                      <div className="text-[13px] text-[color:var(--color-success)]">Completed</div>
                    </div>
                  </div>
                  <div className="text-[13px] text-[color:var(--color-muted)]">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">No trade history</div>
              <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">Completed trades will appear here</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TradeItemDisplay({ item }: { item: { itemId: string; label: string; qty: number; rarity?: string } }) {
  const rarityColors: Record<string, string> = {
    common: "var(--color-muted)",
    uncommon: "var(--color-cyan)",
    rare: "var(--color-violet-bright)",
    epic: "var(--color-amber)",
    legendary: "#f1d38a",
    mythic: "#ff6090",
  }
  const color = rarityColors[item.rarity || "common"] || "var(--color-text)"
  
  return (
    <div className="flex items-center gap-1 text-[13px]">
      <span className="text-[color:var(--color-muted)]">x{item.qty}</span>
      <span style={{ color }}>{item.label}</span>
    </div>
  )
}

function TradeOfferRow({ offer, type }: { offer: EsroState["tradeOffers"][0]; type: "incoming" | "outgoing" }) {
  const inventory = useEsroStore((s) => s.inventory)
  const [showCounterOffer, setShowCounterOffer] = useState(false)
  const [counterTokensOffered, setCounterTokensOffered] = useState(offer.toTokens)
  const [counterTokensRequested, setCounterTokensRequested] = useState(offer.fromTokens)
  const [counterItemsOffered, setCounterItemsOffered] = useState<typeof offer.toItems>([...offer.toItems])
  const [counterItemsRequested, setCounterItemsRequested] = useState<typeof offer.fromItems>([...offer.fromItems])
  const [counterMessage, setCounterMessage] = useState("")
  
  const timeLeft = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000 / 60))
  const otherHandle = type === "incoming" ? offer.fromHandle : offer.toHandle

  const handleSendCounter = () => {
    // In production this would send the counter-offer to the server
    console.log("[v0] Sending counter-offer:", {
      originalOfferId: offer.id,
      counterItemsOffered,
      counterItemsRequested,
      counterTokensOffered,
      counterTokensRequested,
      counterMessage,
    })
    setShowCounterOffer(false)
  }

  const adjustItemQty = (
    items: typeof offer.fromItems,
    setItems: React.Dispatch<React.SetStateAction<typeof offer.fromItems>>,
    itemId: string,
    delta: number
  ) => {
    setItems(prev => 
      prev.map(item => 
        item.itemId === itemId 
          ? { ...item, qty: Math.max(0, item.qty + delta) }
          : item
      ).filter(item => item.qty > 0)
    )
  }

  const addItemToCounter = (
    items: typeof offer.fromItems,
    setItems: React.Dispatch<React.SetStateAction<typeof offer.fromItems>>,
    invItem: typeof inventory[0]
  ) => {
    const existing = items.find(i => i.itemId === invItem.id)
    if (existing) {
      adjustItemQty(items, setItems, invItem.id, 1)
    } else {
      setItems(prev => [...prev, { 
        itemId: invItem.id, 
        label: invItem.label, 
        qty: 1, 
        rarity: invItem.rarity 
      }])
    }
  }

  return (
    <div className={cn(
      "rounded-lg border p-3",
      type === "incoming" ? "border-[color:var(--color-amber)]/30" : "border-[color:var(--color-cyan)]/30"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <PartyAvatar config={generateAvatarFromSeed(otherHandle)} />
          <div>
            <div className="text-[15px] text-[color:var(--color-text)]">{otherHandle}</div>
            <div className="text-[13px] text-[color:var(--color-muted)]">
              {type === "incoming" ? "Offering" : "Requesting"}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-[color:var(--color-muted)]">{timeLeft}m left</div>
        </div>
      </div>

      {/* Trade details */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded bg-[color:var(--color-panel)]/50 p-2">
          <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            {type === "incoming" ? "They offer" : "You offer"}
          </div>
          <div className="mt-1 space-y-0.5">
            {offer.fromItems.map((item, i) => (
              <TradeItemDisplay key={i} item={item} />
            ))}
            {offer.fromTokens > 0 && (
              <div className="text-[13px] text-[color:var(--color-amber)]">+{offer.fromTokens} tokens</div>
            )}
            {offer.fromItems.length === 0 && offer.fromTokens === 0 && (
              <div className="text-[13px] text-[color:var(--color-muted)]">Nothing</div>
            )}
          </div>
        </div>
        <div className="rounded bg-[color:var(--color-panel)]/50 p-2">
          <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            {type === "incoming" ? "For your" : "For their"}
          </div>
          <div className="mt-1 space-y-0.5">
            {offer.toItems.map((item, i) => (
              <TradeItemDisplay key={i} item={item} />
            ))}
            {offer.toTokens > 0 && (
              <div className="text-[13px] text-[color:var(--color-amber)]">+{offer.toTokens} tokens</div>
            )}
            {offer.toItems.length === 0 && offer.toTokens === 0 && (
              <div className="text-[13px] text-[color:var(--color-muted)]">Nothing</div>
            )}
          </div>
        </div>
      </div>

      {offer.message && (
        <div className="mt-2 rounded bg-[color:var(--color-panel)]/30 px-2 py-1.5 text-[13px] text-[color:var(--color-muted)] italic">
          &quot;{offer.message}&quot;
        </div>
      )}

      {/* Counter-offer panel */}
      {showCounterOffer && type === "incoming" && (
        <div className="mt-3 space-y-3 rounded-lg border border-[color:var(--color-violet-bright)]/30 bg-[color:var(--color-violet-bright)]/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-medium text-[color:var(--color-violet-bright)]">
              Counter-Offer
            </div>
            <button
              type="button"
              onClick={() => setShowCounterOffer(false)}
              className="text-[14px] text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            >
              Cancel
            </button>
          </div>
          
          {/* Counter items - What you offer */}
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)] mb-1">
              Your Items
            </div>
            <div className="rounded bg-[color:var(--color-panel)]/50 p-2 space-y-1">
              {counterItemsOffered.length > 0 ? (
                counterItemsOffered.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between">
                    <TradeItemDisplay item={item} />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustItemQty(counterItemsOffered, setCounterItemsOffered, item.itemId, -1)}
                        className="h-4 w-4 rounded bg-[color:var(--color-danger)]/20 text-[12px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/30"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustItemQty(counterItemsOffered, setCounterItemsOffered, item.itemId, 1)}
                        className="h-4 w-4 rounded bg-[color:var(--color-green)]/20 text-[12px] text-[color:var(--color-green)] hover:bg-[color:var(--color-green)]/30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[13px] text-[color:var(--color-muted)]">No items</div>
              )}
              
              {/* Add from inventory */}
              {inventory.length > 0 && (
                <div className="pt-1 border-t border-[color:var(--color-border)]">
                  <div className="text-[12px] text-[color:var(--color-muted)] mb-1">Add from inventory:</div>
                  <div className="flex flex-wrap gap-1">
                    {inventory.slice(0, 6).map((invItem) => (
                      <button
                        key={invItem.id}
                        type="button"
                        onClick={() => addItemToCounter(counterItemsOffered, setCounterItemsOffered, invItem)}
                        className="rounded bg-[color:var(--color-panel)] px-1.5 py-0.5 text-[12px] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/20"
                      >
                        {invItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Counter items - What you request */}
          <div>
            <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)] mb-1">
              Request Items
            </div>
            <div className="rounded bg-[color:var(--color-panel)]/50 p-2 space-y-1">
              {counterItemsRequested.length > 0 ? (
                counterItemsRequested.map((item) => (
                  <div key={item.itemId} className="flex items-center justify-between">
                    <TradeItemDisplay item={item} />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustItemQty(counterItemsRequested, setCounterItemsRequested, item.itemId, -1)}
                        className="h-4 w-4 rounded bg-[color:var(--color-danger)]/20 text-[12px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/30"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustItemQty(counterItemsRequested, setCounterItemsRequested, item.itemId, 1)}
                        className="h-4 w-4 rounded bg-[color:var(--color-green)]/20 text-[12px] text-[color:var(--color-green)] hover:bg-[color:var(--color-green)]/30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[13px] text-[color:var(--color-muted)]">No items requested</div>
              )}
            </div>
          </div>
          
          {/* Adjust tokens */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                You Offer (Tokens)
              </label>
              <input
                type="number"
                min={0}
                value={counterTokensOffered}
                onChange={(e) => setCounterTokensOffered(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[15px] text-[color:var(--color-text)] focus:border-[color:var(--color-violet-bright)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Request (Tokens)
              </label>
              <input
                type="number"
                min={0}
                value={counterTokensRequested}
                onChange={(e) => setCounterTokensRequested(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[15px] text-[color:var(--color-text)] focus:border-[color:var(--color-violet-bright)] focus:outline-none"
              />
            </div>
          </div>
          
          {/* Counter message */}
          <div>
            <label className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Message (optional)
            </label>
            <input
              type="text"
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Add a note..."
              maxLength={100}
              className="mt-1 w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[14px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted-2)] focus:border-[color:var(--color-violet-bright)] focus:outline-none"
            />
          </div>
          
          <button
            type="button"
            onClick={handleSendCounter}
            className="w-full rounded border border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/15 px-3 py-1.5 text-[14px] font-medium text-[color:var(--color-violet-bright)] transition-colors hover:bg-[color:var(--color-violet-bright)]/25"
          >
            Send Counter-Offer
          </button>
        </div>
      )}

      {type === "incoming" && !showCounterOffer && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded border border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-green)] transition-colors hover:bg-[color:var(--color-green)]/20"
            >
              Accept
            </button>
            <button
              type="button"
              className="rounded border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/20"
            >
              Decline
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowCounterOffer(true)}
            className="w-full rounded border border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-violet-bright)] transition-colors hover:bg-[color:var(--color-violet-bright)]/20"
          >
            Counter-Offer
          </button>
        </div>
      )}

      {type === "outgoing" && (
        <div className="mt-2">
          <button
            type="button"
            className="w-full rounded border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/20"
          >
            Cancel Trade
          </button>
        </div>
      )}
    </div>
  )
}
