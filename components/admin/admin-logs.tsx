"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { ClipboardList } from "lucide-react"

const ACTION_COLORS: Record<string, string> = {
  mute_player: "text-[#ffb347]",
  unmute_player: "text-[#60d060]",
  ban_player: "text-[#ff6b4a]",
  unban_player: "text-[#60d060]",
  warn_player: "text-[#ffb347]",
  create_event: "text-[#5dd0ff]",
  delete_event: "text-[#ff6b4a]",
  toggle_event: "text-[#bb81ff]",
  create_contract: "text-[#5dd0ff]",
  delete_contract: "text-[#ff6b4a]",
  create_expedition: "text-[#5dd0ff]",
  delete_expedition: "text-[#ff6b4a]",
  broadcast: "text-[#ff6b4a]",
  add_materials: "text-[#60d060]",
  unlock_cosmetics: "text-[#bb81ff]",
  unlock_titles: "text-[#f3d58a]",
}

export function AdminLogs() {
  const adminLogs = useEsroStore((s) => s.adminLogs)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-[#ff6b4a]" />
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Admin Activity Log ({adminLogs.length})
        </span>
      </div>

      {/* Logs List */}
      {adminLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-6 text-center">
          <p className="text-[11px] text-[color:var(--color-muted)]">No admin actions logged yet</p>
          <p className="mt-1 text-[9px] text-[color:var(--color-muted)]/70">
            Actions will appear here as you use admin tools
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {adminLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 px-3 py-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-[10px] font-medium uppercase",
                        ACTION_COLORS[log.action] || "text-[color:var(--color-text)]"
                      )}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {log.target && (
                      <span className="text-[10px] text-[color:var(--color-text)]">
                        {log.target}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                      {log.details}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-[color:var(--color-muted)]">
                    {formatTimeAgo(log.timestamp)}
                  </div>
                  <div className="text-[8px] text-[color:var(--color-muted)]/70">
                    {log.adminHandle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {adminLogs.length > 0 && (
        <div className="rounded-lg border border-[color:var(--color-border)]/50 bg-[color:var(--color-panel)]/30 p-3">
          <p className="text-[9px] text-[color:var(--color-muted)]">
            Showing last {Math.min(adminLogs.length, 100)} actions. Logs are kept for accountability and can be reviewed by system administrators.
          </p>
        </div>
      )}
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
