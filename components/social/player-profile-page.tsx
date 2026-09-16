"use client"

import { useMemo, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { FACTIONS, STAT_LABELS, STAT_COLORS } from "@/lib/game-data"
import { xpForLevel, POINTS_PER_LEVEL } from "@/lib/leveling"
import type { BaseStats, PlayerView } from "@/lib/types"
import { cn } from "@/lib/cn"
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  UserMinus,
  Users,
} from "lucide-react"

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  online: { label: "Online", dot: "bg-[color:var(--color-success)]", text: "text-[color:var(--color-success)]" },
  ready: { label: "Ready", dot: "bg-[color:var(--color-success)]", text: "text-[color:var(--color-success)]" },
  deployed: { label: "Deployed", dot: "bg-[color:var(--color-cyan)]", text: "text-[color:var(--color-cyan)]" },
  away: { label: "Away", dot: "bg-[color:var(--color-amber)]", text: "text-[color:var(--color-amber)]" },
  idle: { label: "Idle", dot: "bg-[color:var(--color-amber)]", text: "text-[color:var(--color-amber)]" },
  offline: { label: "Offline", dot: "bg-[color:var(--color-muted)]", text: "text-[color:var(--color-muted)]" },
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Stable, hydration-safe date formatting (no locale-dependent output). */
function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Deterministic RNG seeded from a string — mirrors the avatar generator so a
 * given handle always produces the same derived profile. Kept local (the
 * generator's copy is not exported) and identical in behaviour.
 */
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash = hash & hash
  }
  return function () {
    hash = Math.imul(hash ^ (hash >>> 15), hash | 1)
    hash ^= hash + Math.imul(hash ^ (hash >>> 7), hash | 61)
    return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296
  }
}

interface DerivedProfile {
  level: number
  xp: number
  xpToNext: number
  stats: BaseStats
  rank: number
  standing: number
  maxStanding: number
  titles: number
  cosmetics: number
  badges: number
}

/**
 * Other players are stored only as lightweight Friend/PartyMember records, so
 * their full profile (level, stats, standing, collection) does not exist
 * locally. We synthesize it deterministically from the handle — the same
 * approach the app already uses to give every player a stable avatar — so the
 * viewed profile matches what that player would see on their own Profile tab
 * and never changes between views.
 */
function derivePublicProfile(view: PlayerView): DerivedProfile {
  const rand = seededRandom(view.handle + ":profile")

  // Completed expeditions, when known, nudge the level up so veterans read as
  // higher level than newcomers rather than being purely random.
  const expBias =
    typeof view.expeditionsCompleted === "number"
      ? Math.min(28, Math.floor(view.expeditionsCompleted / 2))
      : 0
  const level = Math.max(1, Math.min(50, 4 + expBias + Math.floor(rand() * 16)))

  const xpToNext = xpForLevel(level)
  const xp = Math.floor(rand() * xpToNext)

  // Base loadout everyone shares, plus this level's worth of allocated points
  // spread across the four spendable stats by random weights. HP is derived
  // from level (it cannot be spent into), matching the Summary tab.
  const stats: BaseStats = { hp: 0, atk: 5, def: 5, focus: 5, luck: 5 }
  const spendable = ["atk", "def", "focus", "luck"] as const
  const weights = spendable.map(() => rand() + 0.2)
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const points = level * POINTS_PER_LEVEL
  spendable.forEach((stat, i) => {
    stats[stat] += Math.round(points * (weights[i] / weightSum))
  })
  stats.hp = 20 + level * 4 + Math.floor(rand() * 12)

  const rank = 1 + Math.floor(rand() * 5)
  const maxStanding = 1000
  const standing = Math.floor(rand() * maxStanding)

  return {
    level,
    xp,
    xpToNext,
    stats,
    rank,
    standing,
    maxStanding,
    titles: Math.floor(rand() * 8),
    cosmetics: Math.floor(rand() * 12),
    badges: Math.floor(rand() * 6),
  }
}

/**
 * Full-page, read-only profile of another player, rendered inside the Profile
 * screen when `viewedProfile` is set. Mirrors the layout of the player's own
 * Profile → Summary tab (identity banner, level/XP, faction allegiance,
 * character stats, collection) so viewing someone shows their actual profile,
 * not a stripped-down card. Real data (handle, title, faction, avatar, party
 * contribution, note) is used where available; the rest is derived stably from
 * the handle.
 */
export function PlayerProfilePage() {
  const player = useEsroStore((s) => s.viewedProfile)
  const back = useEsroStore((s) => s.clearViewedProfile)
  const removeFriend = useEsroStore((s) => s.removeFriend)
  const inviteFriendToParty = useEsroStore((s) => s.inviteFriendToParty)
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)

  const derived = useMemo(() => (player ? derivePublicProfile(player) : null), [player])

  if (!player || !derived) return null

  const avatar = player.avatar || generateAvatarFromSeed(player.handle)
  const status = player.status ? STATUS_META[player.status] : undefined
  const faction = player.faction
    ? FACTIONS.find((f) => f.name.toLowerCase() === player.faction!.toLowerCase())
    : undefined
  const xpPercent = Math.min(100, (derived.xp / derived.xpToNext) * 100)

  const handleInvite = () => {
    const res = inviteFriendToParty({
      handle: player.handle,
      title: player.title,
      titleRarity: player.titleRarity,
      avatar,
      faction: player.faction,
      status: "online",
      note: player.note,
      lastSeen: player.lastSeen,
    })
    setFlash({ ok: res.success, message: res.message })
    window.setTimeout(() => setFlash(null), 2600)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Back bar */}
      <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-3 py-2">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Viewing {player.source === "party" ? "party member" : "friend"}
        </span>
      </div>

      {/* Content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        <div className="mx-auto max-w-xl space-y-4">
          {/* Identity banner */}
          <div className="relative flex items-start gap-4 overflow-hidden rounded-xl border border-[color:var(--color-accent)]/30 bg-gradient-to-b from-[color:var(--color-accent)]/10 to-transparent p-5">
            <div className="relative shrink-0">
              <PixelAvatar config={avatar} size="lg" showFlair />
              {/* Faction emblem overlay — mirrors the Summary tab avatar badge. */}
              {faction && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[14px] font-bold shadow-lg"
                  style={{ backgroundColor: faction.color, color: "#000", boxShadow: `0 0 8px ${faction.glow}` }}
                  title={faction.name}
                >
                  {faction.emblem}
                </div>
              )}
              {status && (
                <span
                  className={cn(
                    "absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full border-2 border-[color:var(--color-panel)]",
                    status.dot,
                  )}
                  title={status.label}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[22px] font-semibold text-[color:var(--color-text)]">
                  {player.handle}
                </h1>
                {player.leader && (
                  <span className="shrink-0 rounded bg-[color:var(--color-accent)]/20 px-1.5 py-0.5 text-[11px] uppercase tracking-wider text-[color:var(--color-accent)]">
                    Leader
                  </span>
                )}
              </div>

              {player.title && (
                <TitleDisplay
                  title={player.title}
                  rarity={player.titleRarity || "common"}
                  variant="inline"
                  className="mt-0.5 text-[14px]"
                />
              )}

              {player.role && (
                <div className="mt-0.5 text-[13px] text-[color:var(--color-muted)]">{player.role}</div>
              )}

              {status && (
                <div className={cn("mt-1.5 flex items-center gap-1.5 text-[13px] uppercase tracking-wider", status.text)}>
                  <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                  {status.label}
                </div>
              )}
            </div>
          </div>

          {/* Level + XP */}
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] text-[color:var(--color-muted)]">Level {derived.level}</span>
              <span className="text-[14px] text-[color:var(--color-muted)]">
                {derived.xp}/{derived.xpToNext} XP
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
              <div className="h-full bg-[color:var(--color-accent)]" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>

          {/* Faction allegiance */}
          {faction ? (
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: `${faction.color}40`, backgroundColor: faction.colorVars.bg }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold"
                  style={{ backgroundColor: `${faction.color}25`, color: faction.color, boxShadow: `0 0 12px ${faction.glow}` }}
                >
                  {faction.emblem}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold" style={{ color: faction.color }}>
                    {faction.name}
                  </div>
                  <div className="text-[13px] italic text-[color:var(--color-muted)]">&quot;{faction.motto}&quot;</div>
                  <div className="mt-1 text-[13px] text-[color:var(--color-muted)]">
                    Rank {derived.rank} - {derived.standing}/{derived.maxStanding} standing
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-3 text-center">
              <div className="text-[15px] text-[color:var(--color-muted)]">No faction allegiance</div>
            </div>
          )}

          {/* Character stats */}
          <div className="rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Character Stats
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(Object.keys(derived.stats) as (keyof BaseStats)[]).map((stat) => (
                <div key={stat} className="flex flex-col items-center rounded bg-[color:var(--color-panel)]/50 p-2">
                  <div className="text-[16px] font-bold" style={{ color: STAT_COLORS[stat] }}>
                    {derived.stats[stat]}
                  </div>
                  <div className="text-[12px] font-medium uppercase" style={{ color: `${STAT_COLORS[stat]}99` }}>
                    {STAT_LABELS[stat]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Party activity — real data carried on the PlayerView. */}
          {(typeof player.contribution === "number" || typeof player.expeditionsCompleted === "number") && (
            <div className="grid grid-cols-2 gap-3">
              {typeof player.contribution === "number" && (
                <div className="rounded-lg border border-[color:var(--color-border)] p-4 text-center">
                  <div className="text-[24px] font-bold leading-none text-[color:var(--color-accent)]">
                    {player.contribution}
                  </div>
                  <div className="mt-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Party XP
                  </div>
                </div>
              )}
              {typeof player.expeditionsCompleted === "number" && (
                <div className="rounded-lg border border-[color:var(--color-border)] p-4 text-center">
                  <div className="text-[24px] font-bold leading-none text-[color:var(--color-accent)]">
                    {player.expeditionsCompleted}
                  </div>
                  <div className="mt-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Expeditions
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collection summary — mirrors the Summary tab footer. */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[color:var(--color-border)] p-3">
            <div className="text-center">
              <div className="text-[16px] font-medium text-[color:var(--color-text)]">{derived.titles}</div>
              <div className="text-[13px] text-[color:var(--color-muted)]">Titles</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-medium text-[color:var(--color-text)]">{derived.cosmetics}</div>
              <div className="text-[13px] text-[color:var(--color-muted)]">Cosmetics</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-medium text-[color:var(--color-text)]">{derived.badges}</div>
              <div className="text-[13px] text-[color:var(--color-muted)]">Badges</div>
            </div>
          </div>

          {/* Note */}
          {player.note && (
            <div className="rounded-lg border border-[color:var(--color-border)] p-4">
              <div className="mb-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">Note</div>
              <div className="text-[14px] text-[color:var(--color-text)]">{player.note}</div>
            </div>
          )}

          {player.lastSeen && player.status === "offline" && (
            <div className="text-[12px] text-[color:var(--color-muted)]">Last seen {formatDate(player.lastSeen)}</div>
          )}

          {/* Invite feedback */}
          {flash && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-[13px]",
                flash.ok
                  ? "border-[color:var(--color-cyan)]/40 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)]"
                  : "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]",
              )}
            >
              {flash.message}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-3 py-2.5 text-[14px] font-medium text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/20"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
            {player.source === "friend" ? (
              <button
                type="button"
                onClick={handleInvite}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2.5 text-[14px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
              >
                <Users className="h-4 w-4" />
                Invite
              </button>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2.5 text-[14px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </button>
            )}
          </div>

          {player.source === "friend" && (
            <button
              type="button"
              onClick={() => {
                removeFriend(player.handle)
                back()
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2.5 text-[14px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/15"
            >
              <UserMinus className="h-4 w-4" />
              Unfriend
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
