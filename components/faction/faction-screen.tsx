"use client"

import { useEffect, useState } from "react"
import { useEsroStore, type EsroState } from "@/store/use-esro-store"
import { PartyAvatar } from "@/components/avatar/pixel-avatar"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import {
  RANK_TIERS,
  FACTION_PERKS,
  getRankTitle,
  buildingUpgradeCost,
  craftingBonusesFrom,
} from "@/config/faction"

type FactionTab = "party" | "projects" | "rallies" | "buildings" | "perks" | "ranks" | "activity"

const factionTabs: { id: FactionTab; label: string; icon: string; color: string; bgColor: string }[] = [
  { id: "party", label: "Party", icon: "⋈", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15" },
  { id: "projects", label: "Projects", icon: "▤", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15" },
  { id: "rallies", label: "Rallies", icon: "⚡", color: "text-[color:var(--color-danger)]", bgColor: "bg-[color:var(--color-danger)]/15" },
  { id: "buildings", label: "Buildings", icon: "⚒", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15" },
  { id: "perks", label: "Perks", icon: "✦", color: "text-[color:var(--color-accent)]", bgColor: "bg-[color:var(--color-accent)]/15" },
  { id: "ranks", label: "Ranks", icon: "△", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15" },
  { id: "activity", label: "Activity", icon: "≋", color: "text-[color:var(--color-muted)]", bgColor: "bg-[color:var(--color-panel)]" },
]

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function timeUntil(ts: number): string {
  const s = Math.max(0, Math.floor((ts - Date.now()) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function FactionScreen() {
  const [tab, setTab] = useState<FactionTab>("party")
  const profile = useEsroStore((s) => s.profile)
  const faction = profile?.faction

  return (
    <div className="flex h-full flex-col">
      {/* Faction header */}
      {faction && (
        <div className="border-b border-[color:var(--color-border)] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium text-[color:var(--color-text)]">{faction.label}</div>
              <div className="text-[14px] text-[color:var(--color-muted)]">
                Rank {faction.rank} · {getRankTitle(faction.rank)}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-[13px]">
                <span className="text-[color:var(--color-amber)]">{profile.tokens} tokens</span>
                <span className="text-[color:var(--color-accent)]">
                  {faction.standing}/{faction.maxStanding}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                <div
                  className="h-full bg-[color:var(--color-accent)] transition-all"
                  style={{ width: `${Math.min(100, (faction.standing / faction.maxStanding) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-2 py-1.5" style={{ scrollbarWidth: "none" }}>
        {factionTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex flex-shrink-0 items-center gap-1 rounded px-2 py-1 text-[13px] uppercase tracking-wider transition-colors",
              tab === t.id ? cn(t.bgColor, t.color) : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]",
            )}
          >
            <span className="text-[13px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {tab === "party" && <PartyTab />}
        {tab === "projects" && <ProjectsTab />}
        {tab === "rallies" && <RalliesTab />}
        {tab === "buildings" && <BuildingsTab />}
        {tab === "perks" && <PerksTab currentRank={faction?.rank ?? 0} />}
        {tab === "ranks" && <RanksTab currentRank={faction?.rank ?? 0} />}
        {tab === "activity" && <ActivityTab />}
      </div>
    </div>
  )
}

/** Small toast-style status line shown under an action. */
function useFlash() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok })
    window.setTimeout(() => setMsg(null), 2600)
  }
  return { msg, flash }
}

// ============ PARTY ============

function PartyTab() {
  const party = useEsroStore((s) => s.party)
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  const invitePartyMember = useEsroStore((s) => s.invitePartyMember)
  const removePartyMember = useEsroStore((s) => s.removePartyMember)
  const setPartyMemberRole = useEsroStore((s) => s.setPartyMemberRole)
  const readyUpParty = useEsroStore((s) => s.readyUpParty)
  const { msg, flash } = useFlash()
  const maxSlots = 4

  const ROLES = ["Logistics", "Surveying", "Analysis", "Security", "Relay Tuning", "Scavenging"]

  const partyWithPlayer = party.map((m) => {
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
      <div className="flex items-center justify-between">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Party Members ({partyWithPlayer.length}/{maxSlots})
        </div>
        <button
          type="button"
          onClick={readyUpParty}
          className="rounded border border-[color:var(--color-success)]/50 px-2 py-1 text-[13px] text-[color:var(--color-success)] transition-colors hover:bg-[color:var(--color-success)]/10"
        >
          Ready Up
        </button>
      </div>

      <div className="space-y-2">
        {partyWithPlayer.map((m) => (
          <div key={m.slot} className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] px-3 py-2">
            <PartyAvatar config={m.avatar || generateAvatarFromSeed(m.handle)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[15px] text-[color:var(--color-text)]">{m.handle}</span>
                {m.leader && (
                  <span className="rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-accent)]">
                    Leader
                  </span>
                )}
              </div>
              {m.title && <div className={cn("text-[13px]", rarityColor[m.titleRarity || "common"])}>{m.title}</div>}
              <div className="mt-1 flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]">
                {m.leader ? (
                  <span>{m.role}</span>
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) => setPartyMemberRole(m.slot, e.target.value)}
                    className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-1.5 py-0.5 text-[12px] text-[color:var(--color-text)]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
                <span
                  className={cn(
                    m.status === "ready" && "text-[color:var(--color-success)]",
                    m.status === "deployed" && "text-[color:var(--color-cyan)]",
                    m.status === "idle" && "text-[color:var(--color-amber)]",
                    m.status === "offline" && "text-[color:var(--color-muted)]",
                  )}
                >
                  {m.status}
                </span>
              </div>
            </div>
            {!m.leader && (
              <button
                type="button"
                onClick={() => removePartyMember(m.slot)}
                className="flex-shrink-0 rounded border border-[color:var(--color-danger)]/40 px-2 py-1 text-[12px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/10"
              >
                Kick
              </button>
            )}
          </div>
        ))}

        {Array.from({ length: maxSlots - partyWithPlayer.length }).map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => {
              const res = invitePartyMember()
              flash(res.message, res.success)
            }}
            className="flex w-full items-center justify-center rounded-lg border border-dashed border-[color:var(--color-border-soft)] px-3 py-4 transition-colors hover:border-[color:var(--color-accent)]/50 hover:bg-[color:var(--color-accent)]/5"
          >
            <div className="text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">+ Invite a player</div>
              <div className="mt-0.5 text-[13px] text-[color:var(--color-muted-2)]">Fill this slot</div>
            </div>
          </button>
        ))}
      </div>

      {msg && (
        <div className={cn("text-center text-[13px]", msg.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]")}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

// ============ CONTRIBUTE CONTROL ============

function ContributeRow({
  presets,
  balance,
  onContribute,
  disabled,
  label = "Contribute",
}: {
  presets: number[]
  balance: number
  onContribute: (amount: number) => { success: boolean; message: string }
  disabled?: boolean
  label?: string
}) {
  const { msg, flash } = useFlash()
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {presets.map((amt) => (
          <button
            key={amt}
            type="button"
            disabled={disabled || balance < amt}
            onClick={() => {
              const res = onContribute(amt)
              flash(res.message, res.success)
            }}
            className={cn(
              "flex-1 rounded border px-2 py-1.5 text-[13px] transition-colors",
              disabled || balance < amt
                ? "cursor-not-allowed border-[color:var(--color-border-soft)] text-[color:var(--color-muted-2)]"
                : "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/20",
            )}
          >
            {label} {amt}
          </button>
        ))}
      </div>
      {msg && (
        <div className={cn("mt-1 text-[12px]", msg.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]")}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

// ============ PROJECTS ============

function ProjectsTab() {
  const projects = useEsroStore((s) => s.factionProjects)
  const tokens = useEsroStore((s) => s.profile.tokens)
  const contributeToProject = useEsroStore((s) => s.contributeToProject)

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Active Projects ({projects.filter((p) => !p.complete).length})
      </div>
      <div className="space-y-3">
        {projects.map((p) => {
          const pct = Math.min(100, (p.progress / p.goal) * 100)
          return (
            <div key={p.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[14px] font-medium text-[color:var(--color-text)]">{p.label}</div>
                {p.complete ? (
                  <span className="flex-shrink-0 rounded bg-[color:var(--color-success)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-success)]">
                    Complete
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-[13px] text-[color:var(--color-accent)]">{Math.floor(pct)}%</span>
                )}
              </div>
              <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">{p.description}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                <div
                  className={cn("h-full transition-all", p.complete ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-accent)]")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
                <span>
                  {p.progress}/{p.goal} collected
                </span>
                <span>{p.contributors} contributors</span>
              </div>
              {!p.complete && (
                <ContributeRow presets={[10, 50, 100]} balance={tokens} onContribute={(amt) => contributeToProject(p.id, amt)} />
              )}
            </div>
          )
        })}
      </div>
      <div className="text-center text-[12px] text-[color:var(--color-muted-2)]">
        Contributions spend tokens and earn faction standing.
      </div>
    </div>
  )
}

// ============ RALLIES ============

function RalliesTab() {
  const rallies = useEsroStore((s) => s.factionRallies)
  const tokens = useEsroStore((s) => s.profile.tokens)
  const joinRally = useEsroStore((s) => s.joinRally)
  const contributeToRally = useEsroStore((s) => s.contributeToRally)

  // Tick every second so countdowns stay live.
  const [, setNow] = useState(Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction Rallies</div>
      <div className="space-y-3">
        {rallies.map((r) => {
          const pct = Math.min(100, (r.progress / r.goal) * 100)
          const ended = Date.now() > r.endsAt
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border p-3",
                r.complete ? "border-[color:var(--color-success)]/50" : "border-[color:var(--color-danger)]/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] text-[color:var(--color-danger)]">{r.icon}</span>
                  <div className="text-[14px] font-medium text-[color:var(--color-text)]">{r.label}</div>
                </div>
                <span
                  className={cn(
                    "flex-shrink-0 text-[13px]",
                    r.complete ? "text-[color:var(--color-success)]" : ended ? "text-[color:var(--color-muted)]" : "text-[color:var(--color-amber)]",
                  )}
                >
                  {r.complete ? "Complete" : ended ? "Ended" : timeUntil(r.endsAt)}
                </span>
              </div>
              <div className="mt-1 text-[14px] text-[color:var(--color-muted)]">{r.description}</div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                <div
                  className={cn("h-full transition-all", r.complete ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-danger)]")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[13px] text-[color:var(--color-muted)]">
                <span>
                  {r.progress}/{r.goal}
                </span>
                <span>You: {r.contribution}</span>
              </div>

              {/* Reward line */}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[12px]">
                <span className="rounded bg-[color:var(--color-panel)]/60 px-1.5 py-0.5 text-[color:var(--color-amber)]">
                  +{r.reward.tokens} tokens
                </span>
                <span className="rounded bg-[color:var(--color-panel)]/60 px-1.5 py-0.5 text-[color:var(--color-accent)]">
                  +{r.reward.standing} standing
                </span>
                {r.reward.item && (
                  <span className="rounded bg-[color:var(--color-panel)]/60 px-1.5 py-0.5 text-[color:var(--color-cyan)]">
                    {r.reward.item}
                  </span>
                )}
              </div>

              {!r.complete && !ended && (
                <>
                  {!r.joined ? (
                    <button
                      type="button"
                      onClick={() => joinRally(r.id)}
                      className="mt-2 w-full rounded border border-[color:var(--color-danger)]/50 bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-[14px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/20"
                    >
                      Join Rally
                    </button>
                  ) : (
                    <ContributeRow presets={[25, 100, 250]} balance={tokens} onContribute={(amt) => contributeToRally(r.id, amt)} />
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ BUILDINGS ============

function BuildingsTab() {
  const buildings = useEsroStore((s) => s.factionBuildings)
  const inventory = useEsroStore((s) => s.inventory)
  const tokens = useEsroStore((s) => s.profile.tokens)
  const rank = useEsroStore((s) => s.profile.faction?.rank ?? 0)
  const upgradeBuilding = useEsroStore((s) => s.upgradeBuilding)
  const { msg, flash } = useFlash()

  const bonuses = craftingBonusesFrom(buildings)

  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction Buildings</div>

      {/* Active crafting bonuses summary */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/40 p-3">
        <div className="mb-2 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">Active Crafting Upgrades</div>
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          <BonusStat label="Craft speed" value={`-${Math.round(bonuses.speed * 100)}%`} />
          <BonusStat label="Bonus yield" value={`+${Math.round(bonuses.yield * 100)}%`} />
          <BonusStat label="Material cost" value={`-${Math.round(bonuses.cost * 100)}%`} />
          <BonusStat label="Standing gain" value={`+${Math.round(bonuses.standing * 100)}%`} />
        </div>
      </div>

      <div className="space-y-3">
        {buildings.map((b) => {
          const cost = buildingUpgradeCost(b)
          const maxed = b.level >= b.maxLevel
          const rankLocked = rank < b.requiredRank
          const hasTokens = tokens >= cost.tokens
          const hasMaterials = cost.materials.every((mat) => {
            const owned = inventory.find((i) => i.id === mat.itemId || i.label === mat.label)
            return owned && owned.qty >= mat.qty
          })
          const canUpgrade = !maxed && !rankLocked && hasTokens && hasMaterials

          return (
            <div key={b.id} className="rounded-lg border border-[color:var(--color-border)] p-3">
              <div className="flex items-start gap-3">
                <span className="text-[22px] text-[color:var(--color-cyan)]">{b.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-[color:var(--color-text)]">{b.label}</span>
                    <span className="flex-shrink-0 text-[13px] text-[color:var(--color-accent)]">
                      Lv.{b.level}/{b.maxLevel}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{b.description}</div>
                  {/* Level pips */}
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: b.maxLevel }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < b.level ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-border)]",
                        )}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 text-[13px] text-[color:var(--color-cyan)]">
                    {b.effectLabel} per level · now {effectNow(b)}
                  </div>
                </div>
              </div>

              {/* Upgrade controls */}
              {maxed ? (
                <div className="mt-2 rounded border border-[color:var(--color-success)]/40 py-1.5 text-center text-[13px] text-[color:var(--color-success)]">
                  Fully upgraded
                </div>
              ) : rankLocked ? (
                <div className="mt-2 rounded border border-[color:var(--color-border-soft)] py-1.5 text-center text-[13px] text-[color:var(--color-muted-2)]">
                  Requires Rank {b.requiredRank}
                </div>
              ) : (
                <div className="mt-2">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                    <span className="text-[color:var(--color-muted)]">Next level:</span>
                    <span className={cn("rounded px-1.5 py-0.5", hasTokens ? "bg-[color:var(--color-amber)]/15 text-[color:var(--color-amber)]" : "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]")}>
                      {cost.tokens} tokens
                    </span>
                    {cost.materials.map((mat) => {
                      const owned = inventory.find((i) => i.id === mat.itemId || i.label === mat.label)
                      const ok = owned && owned.qty >= mat.qty
                      return (
                        <span
                          key={mat.itemId}
                          className={cn("rounded px-1.5 py-0.5", ok ? "bg-[color:var(--color-panel)]/60 text-[color:var(--color-muted)]" : "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]")}
                        >
                          {mat.label} {owned?.qty ?? 0}/{mat.qty}
                        </span>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!canUpgrade}
                    onClick={() => {
                      const res = upgradeBuilding(b.id)
                      flash(res.message, res.success)
                    }}
                    className={cn(
                      "w-full rounded border px-3 py-1.5 text-[14px] transition-colors",
                      canUpgrade
                        ? "border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)] hover:bg-[color:var(--color-cyan)]/20"
                        : "cursor-not-allowed border-[color:var(--color-border-soft)] text-[color:var(--color-muted-2)]",
                    )}
                  >
                    Upgrade to Lv.{b.level + 1}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {msg && (
        <div className={cn("text-center text-[13px]", msg.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]")}>
          {msg.text}
        </div>
      )}
    </div>
  )
}

function BonusStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-[color:var(--color-bg)]/40 px-2 py-1">
      <span className="text-[color:var(--color-muted)]">{label}</span>
      <span className="text-[color:var(--color-text)]">{value}</span>
    </div>
  )
}

function effectNow(b: EsroState["factionBuildings"][number]): string {
  const total = Math.round(b.level * b.perLevel * 100)
  const sign = b.effect === "craft_speed" || b.effect === "cost_reduction" ? "-" : "+"
  return `${sign}${total}%`
}

// ============ PERKS ============

function PerksTab({ currentRank }: { currentRank: number }) {
  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Faction Perks ({FACTION_PERKS.filter((p) => currentRank >= p.requiredRank).length}/{FACTION_PERKS.length} active)
      </div>
      <div className="space-y-2">
        {FACTION_PERKS.map((p) => {
          const unlocked = currentRank >= p.requiredRank
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                unlocked ? "border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5" : "border-[color:var(--color-border-soft)] opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("text-[20px]", unlocked ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-muted-2)]")}>{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-[color:var(--color-text)]">{p.label}</span>
                    {unlocked ? (
                      <span className="flex-shrink-0 rounded bg-[color:var(--color-success)]/20 px-1.5 py-0.5 text-[12px] text-[color:var(--color-success)]">
                        Active
                      </span>
                    ) : (
                      <span className="flex-shrink-0 rounded bg-[color:var(--color-panel)]/60 px-1.5 py-0.5 text-[12px] text-[color:var(--color-muted)]">
                        Rank {p.requiredRank}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{p.description}</div>
                  <div className={cn("mt-1 text-[13px]", unlocked ? "text-[color:var(--color-accent)]" : "text-[color:var(--color-muted-2)]")}>
                    {p.effectLabel}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ RANKS ============

function RanksTab({ currentRank }: { currentRank: number }) {
  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction Ranks</div>
      <div className="space-y-2">
        {RANK_TIERS.map((r) => {
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
                    : "border-[color:var(--color-border-soft)] opacity-60",
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
                  <span key={i} className="rounded bg-[color:var(--color-panel)]/50 px-1.5 py-0.5 text-[13px] text-[color:var(--color-muted)]">
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

// ============ ACTIVITY ============

const activityColor: Record<string, string> = {
  contribution: "text-[color:var(--color-amber)]",
  rank_up: "text-[color:var(--color-accent)]",
  project_complete: "text-[color:var(--color-success)]",
  building: "text-[color:var(--color-cyan)]",
  rally: "text-[color:var(--color-danger)]",
  join: "text-[color:var(--color-green)]",
  perk: "text-[color:var(--color-accent)]",
}

const activityIcon: Record<string, string> = {
  contribution: "▤",
  rank_up: "△",
  project_complete: "✓",
  building: "⚒",
  rally: "⚡",
  join: "⋈",
  perk: "✦",
}

function ActivityTab() {
  const activity = useEsroStore((s) => s.factionActivity)
  return (
    <div className="space-y-4">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction Activity</div>
      {activity.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center text-[14px] text-[color:var(--color-muted)]">
          No recent activity
        </div>
      ) : (
        <div className="space-y-1.5">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] px-3 py-2">
              <span className={cn("text-[16px]", activityColor[a.kind])}>{activityIcon[a.kind]}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-[color:var(--color-text)]">
                  <span className={cn(activityColor[a.kind])}>{a.handle}</span> {a.text}
                  {a.amount ? <span className="text-[color:var(--color-muted)]"> (+{a.amount})</span> : null}
                </div>
              </div>
              <span className="flex-shrink-0 text-[12px] text-[color:var(--color-muted-2)]">{timeAgo(a.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
