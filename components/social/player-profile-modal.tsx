"use client"

import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { cn } from "@/lib/cn"
import { X, MessageSquare, UserPlus, UserMinus, Users, UserRound } from "lucide-react"

const STATUS_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
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
 * Shared modal for inspecting another player, opened from friends or party
 * lists via the store's `viewPlayer` action. Renders nothing when no player is
 * selected.
 */
export function PlayerProfileModal() {
  const player = useEsroStore((s) => s.viewedPlayer)
  const close = useEsroStore((s) => s.closePlayerProfile)
  const removeFriend = useEsroStore((s) => s.removeFriend)
  const openProfilePage = useEsroStore((s) => s.openPlayerProfilePage)
  const inviteFriendToParty = useEsroStore((s) => s.inviteFriendToParty)
  const [inviteFlash, setInviteFlash] = useState<{ ok: boolean; message: string } | null>(null)

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!player) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [player, close])

  if (!player) return null

  const avatar = player.avatar || generateAvatarFromSeed(player.handle)
  const status = player.status ? STATUS_META[player.status] : undefined

  const stats: { label: string; value: string | number }[] = []
  if (player.role) stats.push({ label: "Role", value: player.role })
  if (typeof player.contribution === "number") stats.push({ label: "Party XP", value: player.contribution })
  if (typeof player.expeditionsCompleted === "number")
    stats.push({ label: "Expeditions", value: player.expeditionsCompleted })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${player.handle}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close profile"
        onClick={close}
        className="absolute inset-0 bg-[color:var(--color-bg)]/80 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-panel)] shadow-2xl">
        {/* Header band */}
        <div className="relative flex items-start gap-4 border-b border-[color:var(--color-border)] bg-gradient-to-b from-[color:var(--color-accent)]/10 to-transparent p-4">
          <div className="relative shrink-0">
            <PixelAvatar config={avatar} size="lg" showFlair />
            {status && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[color:var(--color-panel)]",
                  status.dot,
                )}
                title={status.label}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[17px] font-semibold text-[color:var(--color-text)]">
                {player.handle}
              </h2>
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
                className="text-[13px]"
              />
            )}

            {status && (
              <div className={cn("mt-1 text-[13px] uppercase tracking-wider", status.text)}>
                {status.label}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {player.faction && (
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2">
              <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">Faction</span>
              <span className="text-[14px] text-[color:var(--color-text)]">{player.faction}</span>
            </div>
          )}

          {stats.length > 0 && (
            <div
              className={cn(
                "grid gap-2",
                stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3",
              )}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-[color:var(--color-border)] p-2.5 text-center"
                >
                  <div className="text-[18px] font-bold leading-none text-[color:var(--color-accent)]">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {player.note && (
            <div className="rounded-lg border border-[color:var(--color-border)] p-3">
              <div className="mb-1 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">Note</div>
              <div className="text-[13px] text-[color:var(--color-text)]">{player.note}</div>
            </div>
          )}

          {player.lastSeen && player.status === "offline" && (
            <div className="text-[12px] text-[color:var(--color-muted)]">
              Last seen {formatDate(player.lastSeen)}
            </div>
          )}

          {/* Primary CTA — open the full read-only profile page for this player. */}
          <button
            type="button"
            onClick={() => openProfilePage(player)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/15 px-3 py-2 text-[13px] font-semibold uppercase tracking-wider text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/25"
          >
            <UserRound className="h-4 w-4" />
            View Profile
          </button>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-3 py-2 text-[13px] font-medium text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/20"
            >
              <MessageSquare className="h-4 w-4" />
              Message
            </button>
            {player.source === "friend" ? (
              <button
                type="button"
                onClick={() => {
                  const res = inviteFriendToParty({
                    handle: player.handle,
                    title: player.title,
                    titleRarity: player.titleRarity,
                    avatar,
                    status: "online",
                  })
                  setInviteFlash({ ok: res.success, message: res.message })
                  window.setTimeout(() => setInviteFlash(null), 2600)
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-[13px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
              >
                <Users className="h-4 w-4" />
                Invite
              </button>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-[13px] font-medium text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent)]/10"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </button>
            )}
          </div>

          {inviteFlash && (
            <div
              className={cn(
                "rounded-lg border px-3 py-2 text-[13px]",
                inviteFlash.ok
                  ? "border-[color:var(--color-cyan)]/40 bg-[color:var(--color-cyan)]/5 text-[color:var(--color-cyan)]"
                  : "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 text-[color:var(--color-danger)]",
              )}
            >
              {inviteFlash.message}
            </div>
          )}

          {player.source === "friend" && (
            <button
              type="button"
              onClick={() => removeFriend(player.handle)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 px-3 py-2 text-[13px] text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-danger)]/15"
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
