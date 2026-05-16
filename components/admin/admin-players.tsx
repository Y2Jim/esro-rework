"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { Ban, Volume2, VolumeX, AlertTriangle, CheckCircle } from "lucide-react"

export function AdminPlayers() {
  const playerRecords = useEsroStore((s) => s.playerRecords)
  const mutePlayer = useEsroStore((s) => s.mutePlayer)
  const unmutePlayer = useEsroStore((s) => s.unmutePlayer)
  const banPlayer = useEsroStore((s) => s.banPlayer)
  const unbanPlayer = useEsroStore((s) => s.unbanPlayer)
  const warnPlayer = useEsroStore((s) => s.warnPlayer)
  
  const [muteModal, setMuteModal] = useState<{ handle: string; duration: number } | null>(null)
  const [banModal, setBanModal] = useState<{ handle: string; reason: string } | null>(null)

  const handleMute = () => {
    if (muteModal) {
      mutePlayer(muteModal.handle, muteModal.duration)
      setMuteModal(null)
    }
  }

  const handleBan = () => {
    if (banModal && banModal.reason.trim()) {
      banPlayer(banModal.handle, banModal.reason.trim())
      setBanModal(null)
    }
  }

  const formatTimeRemaining = (until: number) => {
    const diff = until - Date.now()
    if (diff <= 0) return "Expired"
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m remaining`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m remaining`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Player Records ({playerRecords.length})
        </div>
        <div className="flex gap-2 text-[9px] text-[color:var(--color-muted)]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#60d060]" />
            Active
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ffb347]" />
            Muted
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#ff6b4a]" />
            Banned
          </span>
        </div>
      </div>

      {/* Mute Modal */}
      {muteModal && (
        <div className="rounded-lg border border-[#ffb347]/30 bg-[#ffb347]/5 p-3 space-y-3">
          <div className="text-[11px] text-[#ffb347]">Mute {muteModal.handle}</div>
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={muteModal.duration}
              onChange={(e) => setMuteModal({ ...muteModal, duration: parseInt(e.target.value) || 5 })}
              min={1}
              className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] focus:border-[#ffb347] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMuteModal(null)}
              className="rounded border border-[color:var(--color-border)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMute}
              className="rounded bg-[#ffb347] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black"
            >
              Mute Player
            </button>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3 space-y-3">
          <div className="text-[11px] text-[#ff6b4a]">Ban {banModal.handle}</div>
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Reason
            </label>
            <textarea
              value={banModal.reason}
              onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
              placeholder="Reason for ban..."
              rows={2}
              className="w-full resize-none rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBanModal(null)}
              className="rounded border border-[color:var(--color-border)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBan}
              disabled={!banModal.reason.trim()}
              className="rounded bg-[#ff6b4a] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-black disabled:opacity-50"
            >
              Ban Player
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      {playerRecords.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <p className="text-[11px] text-[color:var(--color-muted)]">No player records</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playerRecords.map((player) => (
            <div
              key={player.handle}
              className={cn(
                "rounded-lg border p-3",
                player.status === "active" && "border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50",
                player.status === "muted" && "border-[#ffb347]/30 bg-[#ffb347]/5",
                player.status === "banned" && "border-[#ff6b4a]/30 bg-[#ff6b4a]/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        player.status === "active" && "bg-[#60d060]",
                        player.status === "muted" && "bg-[#ffb347]",
                        player.status === "banned" && "bg-[#ff6b4a]"
                      )}
                    />
                    <span className="font-mono text-[12px] font-medium text-[color:var(--color-text)]">
                      {player.handle}
                    </span>
                    {player.warnings > 0 && (
                      <span className="flex items-center gap-0.5 rounded bg-[#ffb347]/20 px-1.5 py-0.5 text-[8px] text-[#ffb347]">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {player.warnings} warning{player.warnings > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {player.status === "muted" && player.mutedUntil && (
                    <p className="mt-1 text-[9px] text-[#ffb347]">
                      {formatTimeRemaining(player.mutedUntil)}
                    </p>
                  )}
                  {player.status === "banned" && player.bannedReason && (
                    <p className="mt-1 text-[9px] text-[#ff6b4a]">
                      Reason: {player.bannedReason}
                    </p>
                  )}
                  <p className="mt-1 text-[9px] text-[color:var(--color-muted)]">
                    Last seen: {new Date(player.lastSeen).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {player.status === "active" && (
                    <>
                      <button
                        type="button"
                        onClick={() => warnPlayer(player.handle)}
                        className="rounded p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[#ffb347]/20 hover:text-[#ffb347]"
                        title="Issue Warning"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMuteModal({ handle: player.handle, duration: 30 })}
                        className="rounded p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[#ffb347]/20 hover:text-[#ffb347]"
                        title="Mute Player"
                      >
                        <VolumeX className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBanModal({ handle: player.handle, reason: "" })}
                        className="rounded p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[#ff6b4a]/20 hover:text-[#ff6b4a]"
                        title="Ban Player"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {player.status === "muted" && (
                    <button
                      type="button"
                      onClick={() => unmutePlayer(player.handle)}
                      className="rounded p-1.5 text-[#60d060] transition-colors hover:bg-[#60d060]/20"
                      title="Unmute Player"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {player.status === "banned" && (
                    <button
                      type="button"
                      onClick={() => unbanPlayer(player.handle)}
                      className="rounded p-1.5 text-[#60d060] transition-colors hover:bg-[#60d060]/20"
                      title="Unban Player"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
