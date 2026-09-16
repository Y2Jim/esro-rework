"use client"

import { useEffect, useState } from "react"
import { useEsroStore, type EsroState } from "@/store/use-esro-store"
import { PartyAvatar, PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { cn } from "@/lib/cn"
import { FACTIONS, FACTION_UNLOCK_LEVEL } from "@/lib/game-data"
import { FactionSelection } from "@/components/onboarding/faction-selection"
import {
  RANK_TIERS,
  FACTION_PERKS,
  buildingUpgradeCost,
  buildingEffectDescription,
  formatRelativeTime,
} from "@/config/faction"
import {
  getFactionHqNode,
  getFactionById,
  getControlledNodeIds,
  getNodeById,
  getRegionById,
  isContestedNode,
  MAP_NODES,
} from "@/lib/world-map"
import type { SocialTab, RaceId } from "@/lib/types"
import { SubTabBar, type SubTabItem } from "@/components/shell/sub-tab-bar"
import { PlayerProfileModal } from "@/components/social/player-profile-modal"

const socialTabs: (SubTabItem & { id: SocialTab })[] = [
  { id: "party", label: "Party", icon: "⋈", accentClass: "text-[color:var(--color-cyan)]", activeBgClass: "bg-[color:var(--color-cyan)]/15", hoverClass: "hover-cyan", accentBar: "var(--color-cyan)" },
  { id: "faction", label: "Faction", icon: "⬡", accentClass: "text-[color:var(--color-violet-bright)]", activeBgClass: "bg-[color:var(--color-violet-bright)]/15", hoverClass: "hover-violet", accentBar: "var(--color-violet-bright)" },
  { id: "friends", label: "Friends", icon: "◇", accentClass: "text-[color:var(--color-green)]", activeBgClass: "bg-[color:var(--color-green)]/15", hoverClass: "hover-green", accentBar: "var(--color-green)" },
  { id: "trade", label: "Trade", icon: "⇄", accentClass: "text-[color:var(--color-amber)]", activeBgClass: "bg-[color:var(--color-amber)]/15", hoverClass: "hover-amber", accentBar: "var(--color-amber)" },
]

export function SocialScreen() {
  const [tab, setTab] = useState<SocialTab>("party")
  const factionViewRequest = useEsroStore((s) => s.factionViewRequest)
  const profile = useEsroStore((s) => s.profile)
  const party = useEsroStore((s) => s.party)
  const factionProjects = useEsroStore((s) => s.factionProjects)
  const friends = useEsroStore((s) => s.friends)
  const tradeOffers = useEsroStore((s) => s.tradeOffers)

  const faction = profile?.faction

  // A deep link into a faction sub-view (e.g. from the world map) opens the Faction tab.
  useEffect(() => {
    if (factionViewRequest) setTab("faction")
  }, [factionViewRequest])

  return (
    <div className="flex h-full flex-col">
      {/* Social sub-tabs */}
      <SubTabBar
        ariaLabel="social sections"
        items={socialTabs}
        activeId={tab}
        onSelect={(id) => setTab(id as SocialTab)}
      />

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {tab === "party" && <PartyTab party={party} />}
        {tab === "faction" && <FactionTab faction={faction} projects={factionProjects} />}
        {tab === "friends" && <FriendsTab friends={friends} />}
        {tab === "trade" && <TradeTab offers={tradeOffers} />}
      </div>

      {/* Shared player-profile viewer, opened from party or friends lists */}
      <PlayerProfileModal />
    </div>
  )
}

// ============ PARTY TAB ============
const PARTY_ROLE_OPTIONS = ["Logistics", "Surveying", "Analysis", "Security", "Relay Tuning", "Scavenging"]

function PartyTab({ party }: { party: EsroState["party"] }) {
  const maxSlots = 4
  const invitePartyMember = useEsroStore((s) => s.invitePartyMember)
  const removePartyMember = useEsroStore((s) => s.removePartyMember)
  const setPartyMemberRole = useEsroStore((s) => s.setPartyMemberRole)
  const readyUpParty = useEsroStore((s) => s.readyUpParty)
  const viewPlayer = useEsroStore((s) => s.viewPlayer)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const handleInvite = () => {
    const res = invitePartyMember()
    setFlash(res.message)
    window.setTimeout(() => setFlash(null), 2200)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Party Members ({party.length}/{maxSlots})
        </div>
        {settingsOpen && (
          <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-accent)]">
            Managing
          </span>
        )}
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
                <button
                  type="button"
                  onClick={() =>
                    viewPlayer({
                      handle: m.handle,
                      title: m.title,
                      titleRarity: m.titleRarity,
                      avatar: m.avatar || generateAvatarFromSeed(m.handle),
                      status: m.status,
                      role: m.role,
                      contribution: m.contribution,
                      expeditionsCompleted: m.expeditionsCompleted,
                      leader: m.leader,
                      source: "party",
                    })
                  }
                  className="truncate text-left text-[15px] text-[color:var(--color-text)] transition-colors hover:text-[color:var(--color-accent)]"
                  title="View Profile"
                >
                  {m.handle}
                </button>
                {m.leader && (
                  <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-accent)]">
                    Leader
                  </span>
                )}
              </div>
              {m.title && (
                <TitleDisplay title={m.title} rarity={m.titleRarity || "common"} variant="inline" className="text-[13px]" />
              )}
              <div className="flex items-center gap-3 text-[13px] text-[color:var(--color-muted)]">
                {settingsOpen && !m.leader ? (
                  <select
                    value={m.role}
                    onChange={(e) => setPartyMemberRole(m.slot, e.target.value)}
                    className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-1 py-0.5 text-[12px] text-[color:var(--color-text)]"
                  >
                    {PARTY_ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <span>{m.role}</span>
                )}
                <span className={cn(
                  m.status === "ready" && "text-[color:var(--color-success)]",
                  m.status === "deployed" && "text-[color:var(--color-cyan)]",
                  m.status === "idle" && "text-[color:var(--color-amber)]",
                  m.status === "offline" && "text-[color:var(--color-muted)]"
                )}>
                  {m.status}
                </span>
                {m.contribution ? <span>{m.contribution} XP</span> : null}
              </div>
            </div>
            {settingsOpen && !m.leader && (
              <button
                type="button"
                onClick={() => removePartyMember(m.slot)}
                className="shrink-0 rounded border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/10 px-2 py-1 text-[12px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/20"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxSlots - party.length }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={handleInvite}
            className="flex w-full items-center justify-center rounded-lg border border-dashed border-[color:var(--color-border-soft)] px-3 py-4 transition-colors hover:border-[color:var(--color-cyan)]/50 hover:bg-[color:var(--color-cyan)]/5"
          >
            <div className="text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">Empty Slot</div>
              <div className="mt-0.5 text-[13px] text-[color:var(--color-muted-2)]">Tap to invite a player</div>
            </div>
          </button>
        ))}
      </div>

      {flash && (
        <div className="text-[13px] text-[color:var(--color-cyan)]">{flash}</div>
      )}

      {/* Party actions */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">Party Actions</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleInvite}
            disabled={party.length >= maxSlots}
            className="rounded border border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-cyan)] transition-colors hover:bg-[color:var(--color-cyan)]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Invite Player
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "rounded border px-3 py-1.5 text-[14px] transition-colors",
              settingsOpen
                ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/10"
            )}
          >
            {settingsOpen ? "Done" : "Party Settings"}
          </button>
        </div>
        <button
          type="button"
          onClick={readyUpParty}
          className="mt-2 w-full rounded border border-[color:var(--color-success)]/50 bg-[color:var(--color-success)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-success)] transition-colors hover:bg-[color:var(--color-success)]/20"
        >
          Ready Up
        </button>
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
  const [subTab, setSubTab] = useState<
    "overview" | "territories" | "projects" | "buildings" | "rallies" | "ranks" | "activity"
  >("overview")
  const [showFactionSelection, setShowFactionSelection] = useState(false)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const profile = useEsroStore((s) => s.profile)
  const setFaction = useEsroStore((s) => s.setFaction)
  const factionViewRequest = useEsroStore((s) => s.factionViewRequest)
  const requestFactionView = useEsroStore((s) => s.requestFactionView)

  // Consume a deep-link request (e.g. "Manage Base" from the world map).
  useEffect(() => {
    if (factionViewRequest) {
      setSubTab(factionViewRequest)
      requestFactionView(null)
    }
  }, [factionViewRequest, requestFactionView])

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
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {(["overview", "territories", "projects", "buildings", "rallies", "ranks", "activity"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={cn(
              "shrink-0 rounded px-2 py-1 text-[13px] uppercase tracking-wider transition-colors",
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
      {subTab === "territories" && <FactionTerritories accent={characterFaction.color} factionId={characterFaction.id} />}
      {subTab === "projects" && <FactionProjects projects={projects} accent={characterFaction.color} />}
      {subTab === "buildings" && <FactionBuildings accent={characterFaction.color} rank={faction?.rank || 0} />}
      {subTab === "rallies" && <FactionRallies accent={characterFaction.color} />}
      {subTab === "ranks" && <FactionRanks currentRank={faction?.rank || 0} />}
      {subTab === "activity" && <FactionActivityFeed accent={characterFaction.color} />}
    </div>
  )
}

function FactionTerritories({ accent, factionId }: { accent: string; factionId: RaceId }) {
  const nodeControl = useEsroStore((s) => s.nodeControl)
  const setScreen = useEsroStore((s) => s.setScreen)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)
  const setMapFocus = useEsroStore((s) => s.setMapFocus)

  // Every node this faction currently controls, split into the home base and
  // frontline territory captured through warfare.
  const controlledIds = getControlledNodeIds(nodeControl, factionId)
  const controlled = controlledIds
    .map((id) => getNodeById(id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))

  const hqNodes = controlled.filter((n) => n.kind === "faction_hq")
  const frontline = controlled.filter((n) => n.kind !== "faction_hq")

  // Contested nodes still up for grabs or held by a rival — shown as targets.
  const contestedTotal = MAP_NODES.filter(isContestedNode)
  const heldContested = contestedTotal.filter((n) => nodeControl[n.id] === factionId)
  const openTargets = contestedTotal.filter((n) => nodeControl[n.id] !== factionId)

  const viewOnMap = (id: string) => {
    setMapFocus(id)
    setOpsTab("map")
    setScreen("ops")
  }

  const regionName = (regionId: string) => getRegionById(regionId)?.label ?? regionId

  return (
    <div className="space-y-3">
      <div className="text-[13px] text-[color:var(--color-muted)]">
        Every location your faction holds. Capture contested ground on the map to expand your border outward from the home base.
      </div>

      {/* Holdings summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[24px] font-bold leading-none" style={{ color: accent }}>
            {controlled.length}
          </div>
          <div className="mt-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Locations held
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="text-[24px] font-bold leading-none" style={{ color: accent }}>
            {heldContested.length}
            <span className="text-[14px] text-[color:var(--color-muted)]">/{contestedTotal.length}</span>
          </div>
          <div className="mt-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Frontlines won
          </div>
        </div>
      </div>

      {/* Home base */}
      {hqNodes.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => viewOnMap(n.id)}
          className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
          style={{ borderColor: `${accent}55`, backgroundColor: `${accent}12` }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[16px]"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            ⬡
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-[color:var(--color-text)]">{n.label}</div>
            <div className="text-[12px] text-[color:var(--color-muted)]">
              {regionName(n.regionId)} · Home Base
            </div>
          </div>
          <span className="shrink-0 text-[12px] uppercase tracking-wider" style={{ color: accent }}>
            View
          </span>
        </button>
      ))}

      {/* Captured frontline territory */}
      <div>
        <div className="mb-1.5 mt-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Captured Territory
        </div>
        {frontline.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3 text-[13px] text-[color:var(--color-muted)]">
            No frontline territory captured yet. Deploy to a contested site on the map to claim your first.
          </div>
        ) : (
          <div className="space-y-2">
            {frontline.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => viewOnMap(n.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-[color:var(--color-border)] p-3 text-left transition-colors hover:border-[color:var(--color-border-soft)]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-panel)] text-[16px]">
                  ⚑
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-[color:var(--color-text)]">{n.label}</div>
                  <div className="text-[12px] text-[color:var(--color-muted)]">
                    {regionName(n.regionId)}
                    {n.kind === "contested" ? " · Frontline" : ""}
                  </div>
                </div>
                <span className="shrink-0 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                  View
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Open frontlines to conquer */}
      {openTargets.length > 0 && (
        <div>
          <div className="mb-1.5 mt-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Open Frontlines
          </div>
          <div className="space-y-2">
            {openTargets.map((n) => {
              const holder = nodeControl[n.id]
              const holderFaction = holder ? getFactionById(holder) : undefined
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => viewOnMap(n.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3 text-left transition-colors hover:border-[color:var(--color-border)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-panel)] text-[16px] text-[color:var(--color-muted)]">
                    ⚔
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-[color:var(--color-text)]">{n.label}</div>
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      {regionName(n.regionId)} ·{" "}
                      {holderFaction ? (
                        <span style={{ color: holderFaction.color }}>Held by {holderFaction.name}</span>
                      ) : (
                        "Uncontested (feral)"
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Target
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
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

function FactionProjects({
  projects,
  accent,
}: {
  projects: EsroState["factionProjects"]
  accent: string
}) {
  const tokens = useEsroStore((s) => s.profile.tokens)
  const contributeToProject = useEsroStore((s) => s.contributeToProject)
  const [flash, setFlash] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const handleContribute = (id: string, amount: number) => {
    const res = contributeToProject(id, amount)
    setFlash({ id, msg: res.message, ok: res.success })
    window.setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 2200)
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
        <div className="text-[15px] text-[color:var(--color-muted)]">No active projects</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[13px] text-[color:var(--color-muted)]">
        <span>Spend tokens to advance faction projects</span>
        <span className="text-[color:var(--color-amber)]">{tokens} tokens</span>
      </div>
      {projects.map((p) => {
        const pct = (p.progress / p.goal) * 100
        const done = p.complete || p.progress >= p.goal
        const amounts = [10, 25, 50]
        return (
          <div key={p.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[14px] font-medium text-[color:var(--color-text)]">
                {p.label}
                {done && (
                  <span className="rounded bg-[color:var(--color-success)]/15 px-1.5 py-0.5 text-[12px] text-[color:var(--color-success)]">
                    Complete
                  </span>
                )}
              </div>
              <span className="text-[13px]" style={{ color: accent }}>{Math.floor(pct)}%</span>
            </div>
            <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">{p.description}</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent }} />
            </div>
            <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
              <span>{p.progress}/{p.goal} collected</span>
              <span>{p.contributors} contributors</span>
            </div>
            {!done && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={tokens < amt}
                    onClick={() => handleContribute(p.id, amt)}
                    className="rounded border px-2 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: `${accent}80`, backgroundColor: `${accent}18`, color: accent }}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            )}
            {flash?.id === p.id && (
              <div
                className="mt-2 text-[13px]"
                style={{ color: flash.ok ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {flash.msg}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ BUILDINGS ============
function FactionBuildings({ accent, rank }: { accent: string; rank: number }) {
  const buildings = useEsroStore((s) => s.factionBuildings)
  const tokens = useEsroStore((s) => s.profile.tokens)
  const inventory = useEsroStore((s) => s.inventory)
  const upgradeBuilding = useEsroStore((s) => s.upgradeBuilding)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const profileFactionId = useEsroStore((s) => s.profile.faction?.id)
  const factionBases = useEsroStore((s) => s.factionBases)
  const recoverBases = useEsroStore((s) => s.recoverBases)
  const setScreen = useEsroStore((s) => s.setScreen)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)
  const setMapFocus = useEsroStore((s) => s.setMapFocus)
  const [flash, setFlash] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  // Prefer the canonical selection; profile.faction.id may hold a legacy label.
  const hqNode =
    getFactionHqNode(characterFaction?.id) ??
    getFactionHqNode(profileFactionId as RaceId | undefined)

  // Surface the player's own base health so rival raids are visible here.
  const playerFactionId = (characterFaction?.id ?? profileFactionId) as RaceId | undefined
  const base = playerFactionId ? factionBases[playerFactionId] : undefined
  const now = Date.now()
  const disabledIds = new Set(
    (base?.buildings ?? [])
      .filter((b) => b.disabledUntil && b.disabledUntil > now)
      .map((b) => b.id),
  )
  const integrityPct = base ? Math.round((base.integrity / base.maxIntegrity) * 100) : 100

  // Tick recovery whenever this panel is opened.
  useEffect(() => {
    recoverBases()
  }, [recoverBases])

  const handleViewOnMap = () => {
    if (hqNode) setMapFocus(hqNode.id)
    setOpsTab("map")
    setScreen("ops")
  }

  const handleUpgrade = (id: string) => {
    const res = upgradeBuilding(id)
    setFlash({ id, msg: res.message, ok: res.success })
    window.setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 2400)
  }

  const ownedQty = (m: { itemId: string; label: string }) =>
    inventory.find((i) => i.id === m.itemId || i.label === m.label)?.qty ?? 0

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] text-[color:var(--color-muted)]">
          Upgrade shared structures to boost your crafting bench faction-wide.
        </div>
        {hqNode && (
          <button
            type="button"
            onClick={handleViewOnMap}
            className="shrink-0 rounded border px-2 py-1 text-[12px] uppercase tracking-wider transition-colors"
            style={{
              borderColor: `${accent}66`,
              backgroundColor: `${accent}14`,
              color: accent,
            }}
          >
            View on Map
          </button>
        )}
      </div>

      {/* Base integrity — reflects rival raids on your HQ */}
      {base && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Base Integrity
            </span>
            <span
              className="text-[13px]"
              style={{
                color:
                  integrityPct >= 66
                    ? "var(--color-success)"
                    : integrityPct >= 33
                      ? "var(--color-amber)"
                      : "var(--color-danger)",
              }}
            >
              {integrityPct}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-panel)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${integrityPct}%`,
                backgroundColor:
                  integrityPct >= 66
                    ? "var(--color-success)"
                    : integrityPct >= 33
                      ? "var(--color-amber)"
                      : "var(--color-danger)",
              }}
            />
          </div>
          {disabledIds.size > 0 ? (
            <div className="mt-2 text-[12px] text-[color:var(--color-danger)]">
              {disabledIds.size} structure{disabledIds.size > 1 ? "s" : ""} knocked offline by raiders — recovering over time.
            </div>
          ) : integrityPct < 100 ? (
            <div className="mt-2 text-[12px] text-[color:var(--color-muted)]">
              Damaged by a recent raid. Integrity regenerates over time.
            </div>
          ) : (
            <div className="mt-2 text-[12px] text-[color:var(--color-muted)]">
              All structures operational.
            </div>
          )}
        </div>
      )}
      {buildings.map((b) => {
        const maxed = b.level >= b.maxLevel
        const rankLocked = rank < b.requiredRank
        const cost = buildingUpgradeCost(b)
        const canAfford =
          tokens >= cost.tokens && cost.materials.every((m) => ownedQty(m) >= m.qty)
        return (
          <div key={b.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[18px]"
                style={{ backgroundColor: `${accent}18`, color: accent }}
              >
                {b.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[color:var(--color-text)]">{b.label}</span>
                  <span className="text-[13px] text-[color:var(--color-muted)]">
                    Lv.{b.level}/{b.maxLevel}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{b.description}</div>
                <div className="mt-1 text-[13px]" style={{ color: accent }}>
                  {b.level > 0 ? buildingEffectDescription(b) : `Effect: ${b.effectLabel} per level`}
                </div>
              </div>
            </div>

            {maxed ? (
              <div className="mt-2 rounded bg-[color:var(--color-success)]/10 px-2 py-1.5 text-center text-[13px] text-[color:var(--color-success)]">
                Fully upgraded
              </div>
            ) : rankLocked ? (
              <div className="mt-2 rounded bg-[color:var(--color-panel)]/50 px-2 py-1.5 text-center text-[13px] text-[color:var(--color-muted)]">
                Unlocks at Rank {b.requiredRank}
              </div>
            ) : (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
                  <span className={cn(tokens >= cost.tokens ? "text-[color:var(--color-amber)]" : "text-[color:var(--color-danger)]")}>
                    {cost.tokens} tokens
                  </span>
                  {cost.materials.map((m) => (
                    <span
                      key={m.itemId}
                      className={cn(ownedQty(m) >= m.qty ? "text-[color:var(--color-muted)]" : "text-[color:var(--color-danger)]")}
                    >
                      {m.label} {ownedQty(m)}/{m.qty}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleUpgrade(b.id)}
                  className="mt-2 w-full rounded border px-3 py-1.5 text-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: `${accent}80`, backgroundColor: `${accent}18`, color: accent }}
                >
                  {b.level === 0 ? "Build" : "Upgrade"}
                </button>
              </>
            )}
            {flash?.id === b.id && (
              <div
                className="mt-2 text-[13px]"
                style={{ color: flash.ok ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {flash.msg}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ RALLIES ============
function FactionRallies({ accent }: { accent: string }) {
  const rallies = useEsroStore((s) => s.factionRallies)
  const tokens = useEsroStore((s) => s.profile.tokens)
  const joinRally = useEsroStore((s) => s.joinRally)
  const contributeToRally = useEsroStore((s) => s.contributeToRally)
  const [flash, setFlash] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const handleContribute = (id: string, amount: number) => {
    const res = contributeToRally(id, amount)
    setFlash({ id, msg: res.message, ok: res.success })
    window.setTimeout(() => setFlash((f) => (f?.id === id ? null : f)), 2400)
  }

  if (rallies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
        <div className="text-[15px] text-[color:var(--color-muted)]">No active rallies</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[13px] text-[color:var(--color-muted)]">
        <span>Time-limited faction events with shared rewards</span>
        <span className="text-[color:var(--color-amber)]">{tokens} tokens</span>
      </div>
      {rallies.map((r) => {
        const pct = (r.progress / r.goal) * 100
        const done = r.complete || r.progress >= r.goal
        const ended = Date.now() > r.endsAt
        const hoursLeft = Math.max(0, Math.round((r.endsAt - Date.now()) / 3600000))
        const amounts = [25, 50, 100]
        return (
          <div key={r.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[18px]"
                style={{ backgroundColor: `${accent}18`, color: accent }}
              >
                {r.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[color:var(--color-text)]">{r.label}</span>
                  <span className="text-[13px] text-[color:var(--color-muted)]">
                    {done ? "Complete" : ended ? "Ended" : `${hoursLeft}h left`}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{r.description}</div>
              </div>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent }} />
            </div>
            <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
              <span>{r.progress}/{r.goal}</span>
              <span>Your share: {r.contribution}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1 text-[12px]">
              <span className="rounded bg-[color:var(--color-amber)]/15 px-1.5 py-0.5 text-[color:var(--color-amber)]">
                +{r.reward.tokens} tokens
              </span>
              <span className="rounded px-1.5 py-0.5" style={{ backgroundColor: `${accent}15`, color: accent }}>
                +{r.reward.standing} standing
              </span>
              {r.reward.item && (
                <span className="rounded bg-[color:var(--color-cyan)]/15 px-1.5 py-0.5 text-[color:var(--color-cyan)]">
                  {r.reward.item}
                </span>
              )}
            </div>

            {done ? (
              <div className="mt-2 rounded bg-[color:var(--color-success)]/10 px-2 py-1.5 text-center text-[13px] text-[color:var(--color-success)]">
                Rally complete — rewards claimed
              </div>
            ) : ended ? (
              <div className="mt-2 rounded bg-[color:var(--color-panel)]/50 px-2 py-1.5 text-center text-[13px] text-[color:var(--color-muted)]">
                This rally has ended
              </div>
            ) : !r.joined ? (
              <button
                type="button"
                onClick={() => joinRally(r.id)}
                className="mt-2 w-full rounded border px-3 py-1.5 text-[14px] transition-colors"
                style={{ borderColor: `${accent}80`, backgroundColor: `${accent}18`, color: accent }}
              >
                Join Rally
              </button>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={tokens < amt}
                    onClick={() => handleContribute(r.id, amt)}
                    className="rounded border px-2 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: `${accent}80`, backgroundColor: `${accent}18`, color: accent }}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            )}
            {flash?.id === r.id && (
              <div
                className="mt-2 text-[13px]"
                style={{ color: flash.ok ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {flash.msg}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============ ACTIVITY FEED ============
function FactionActivityFeed({ accent }: { accent: string }) {
  const activity = useEsroStore((s) => s.factionActivity)

  const kindIcon: Record<string, string> = {
    contribution: "◈",
    rank_up: "▲",
    project_complete: "✔",
    building: "⚒",
    rally: "⚡",
    join: "＋",
    perk: "✦",
  }

  if (activity.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
        <div className="text-[15px] text-[color:var(--color-muted)]">No recent activity</div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-[13px] text-[color:var(--color-muted)]">Recent faction activity</div>
      {activity.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-2 rounded-lg border border-[color:var(--color-border)] px-3 py-2"
        >
          <span className="mt-0.5 text-[14px]" style={{ color: accent }}>
            {kindIcon[a.kind] ?? "·"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-[color:var(--color-text)]">
              <span style={{ color: accent }}>{a.handle}</span>{" "}
              <span className="text-[color:var(--color-muted)]">{a.text}</span>
              {a.amount ? <span className="text-[color:var(--color-muted)]"> ({a.amount})</span> : null}
            </div>
            <div className="text-[12px] text-[color:var(--color-muted-2)]">{formatRelativeTime(a.at)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FactionRanks({ currentRank }: { currentRank: number }) {
  const ranks = RANK_TIERS

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

      {/* Rank Perks */}
      <div className="space-y-2">
        <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-accent)]">
          Rank Perks
        </div>
        {FACTION_PERKS.map((perk) => {
          const unlocked = currentRank >= perk.requiredRank
          return (
            <div
              key={perk.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                unlocked
                  ? "border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5"
                  : "border-[color:var(--color-border-soft)] opacity-55"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 text-[16px]",
                  unlocked ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-muted)]"
                )}
              >
                {perk.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[color:var(--color-text)]">{perk.label}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[12px]",
                      unlocked
                        ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
                        : "bg-[color:var(--color-panel)]/50 text-[color:var(--color-muted)]"
                    )}
                  >
                    {unlocked ? "Active" : `Rank ${perk.requiredRank}`}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{perk.description}</div>
                <div className="mt-1 text-[13px] text-[color:var(--color-accent)]">{perk.effectLabel}</div>
              </div>
            </div>
          )
        })}
      </div>

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
  return RANK_TIERS[Math.min(Math.max(rank, 0), RANK_TIERS.length - 1)].title
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
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const removeFriend = useEsroStore((s) => s.removeFriend)
  const viewPlayer = useEsroStore((s) => s.viewPlayer)
  const inviteFriendToParty = useEsroStore((s) => s.inviteFriendToParty)
  const setScreen = useEsroStore((s) => s.setScreen)
  const openConversation = useEsroStore((s) => s.openConversation)

  const friendAvatar = friend.avatar || generateAvatarFromSeed(friend.handle)

  const handleInvite = () => {
    const res = inviteFriendToParty(friend)
    setFlash({ ok: res.success, message: res.message })
    window.setTimeout(() => setFlash(null), 2600)
  }

  const handleMessage = () => {
    openConversation(friend.handle)
    setScreen("messages")
  }

  const openProfile = () =>
    viewPlayer({
      handle: friend.handle,
      title: friend.title,
      titleRarity: friend.titleRarity,
      avatar: friendAvatar,
      faction: friend.faction,
      status: friend.status,
      note: friend.note,
      lastSeen: friend.lastSeen,
      source: "friend",
    })
  
  return (
    <div className="rounded-lg border border-[color:var(--color-border)]">
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={openProfile}
          className="flex min-w-0 flex-1 items-center gap-3 rounded text-left transition-colors hover:opacity-80"
          title="View Profile"
        >
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
              <TitleDisplay title={friend.title} rarity={friend.titleRarity || "common"} variant="inline" className="text-[13px]" />
            )}
            {friend.faction && (
              <div className="text-[13px] text-[color:var(--color-muted)]">{friend.faction}</div>
            )}
          </div>
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={openProfile}
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
            title="View Profile"
          >
            ◎
          </button>
          <button
            type="button"
            onClick={handleInvite}
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-cyan)]/50 hover:bg-[color:var(--color-cyan)]/10 hover:text-[color:var(--color-cyan)]"
            title="Invite to Party"
          >
            ⋈
          </button>
          <button
            type="button"
            onClick={handleMessage}
            className="rounded border border-[color:var(--color-border)] p-1.5 text-[14px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
            title="Message"
          >
            ◇
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

      {/* Invite result — surfaces the party-full / already-in-party message */}
      {flash && (
        <div
          className={cn(
            "border-t px-3 py-2 text-[13px]",
            flash.ok
              ? "border-[color:var(--color-border)] text-[color:var(--color-cyan)]"
              : "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 text-[color:var(--color-danger)]",
          )}
        >
          {flash.message}
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
