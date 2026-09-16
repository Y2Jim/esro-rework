"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
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
 * Full-page, read-only profile of another player, rendered inside the Profile
 * screen when `viewedProfile` is set. Built from the same lightweight
 * `PlayerView` the quick-look modal uses, so it never depends on the local
 * player's private profile data.
 */
export function PlayerProfilePage() {
  const player = useEsroStore((s) => s.viewedProfile)
  const back = useEsroStore((s) => s.clearViewedProfile)
  const removeFriend = useEsroStore((s) => s.removeFriend)

  if (!player) return null

  const avatar = player.avatar || generateAvatarFromSeed(player.handle)
  const status = player.status ? STATUS_META[player.status] : undefined

  const stats: { label: string; value: string | number }[] = []
  if (player.role) stats.push({ label: "Role", value: player.role })
  if (typeof player.contribution === "number") stats.push({ label: "Party XP", value: player.contribution })
  if (typeof player.expeditionsCompleted === "number")
    stats.push({ label: "Expeditions", value: player.expeditionsCompleted })

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
              {status && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[color:var(--color-panel)]",
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

              {status && (
                <div className={cn("mt-1.5 flex items-center gap-1.5 text-[13px] uppercase tracking-wider", status.text)}>
                  <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                  {status.label}
                </div>
              )}
            </div>
          </div>

          {/* Faction */}
          {player.faction && (
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-4 py-3">
              <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction</span>
              <span className="text-[15px] text-[color:var(--color-text)]">{player.faction}</span>
            </div>
          )}

          {/* Stats */}
          {stats.length > 0 && (
            <div
              className={cn(
                "grid gap-3",
                stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
              )}
            >
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-[color:var(--color-border)] p-4 text-center">
                  <div className="text-[24px] font-bold leading-none text-[color:var(--color-accent)]">{s.value}</div>
                  <div className="mt-1.5 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

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
