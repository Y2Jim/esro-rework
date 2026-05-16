"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import type { ChannelId } from "@/lib/types"
import { cn } from "@/lib/cn"
import { Send, Radio } from "lucide-react"

const CHANNELS: { id: ChannelId; label: string }[] = [
  { id: "PUBLIC", label: "Public" },
  { id: "TRADE", label: "Trade" },
  { id: "HELP", label: "Help" },
  { id: "GAME", label: "Game" },
  { id: "FACTION", label: "Faction" },
]

export function AdminBroadcast() {
  const broadcastMessage = useEsroStore((s) => s.broadcastMessage)
  const adminLogs = useEsroStore((s) => s.adminLogs)
  
  const [message, setMessage] = useState("")
  const [channel, setChannel] = useState<ChannelId>("PUBLIC")
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!message.trim()) return
    broadcastMessage(message.trim(), channel)
    setMessage("")
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  const recentBroadcasts = adminLogs
    .filter((log) => log.action === "broadcast")
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-[#ff6b4a]" />
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
          System Broadcast
        </span>
      </div>

      {/* Broadcast Form */}
      <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3 space-y-3">
        <div>
          <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Target Channel
          </label>
          <div className="flex flex-wrap gap-1">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className={cn(
                  "rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
                  channel === ch.id
                    ? "bg-[#ff6b4a] text-black"
                    : "border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter system message..."
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 font-mono text-[11px] text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)]/50 focus:border-[#ff6b4a] focus:outline-none"
          />
          <div className="mt-1 text-right text-[9px] text-[color:var(--color-muted)]">
            {message.length}/500
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[9px] text-[color:var(--color-muted)]">
            Message will appear as SYSTEM in the selected channel
          </p>
          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors disabled:opacity-50",
              sent
                ? "bg-[#60d060] text-black"
                : "bg-[#ff6b4a] text-black hover:bg-[#ff6b4a]/90"
            )}
          >
            <Send className="h-3 w-3" />
            {sent ? "Sent!" : "Broadcast"}
          </button>
        </div>
      </div>

      {/* Recent Broadcasts */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Recent Broadcasts
        </div>
        {recentBroadcasts.length === 0 ? (
          <p className="text-[10px] text-[color:var(--color-muted)]">No broadcasts sent yet</p>
        ) : (
          <div className="space-y-2">
            {recentBroadcasts.map((log) => (
              <div
                key={log.id}
                className="rounded border border-[color:var(--color-border)]/50 bg-[color:var(--color-bg)]/50 px-2 py-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#ff6b4a]/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[#ff6b4a]">
                    {log.target}
                  </span>
                  <span className="text-[8px] text-[color:var(--color-muted)]">
                    {formatTimeAgo(log.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[color:var(--color-text)]">{log.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-lg border border-[color:var(--color-border)]/50 bg-[color:var(--color-panel)]/30 p-3">
        <div className="mb-1 text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">Tips</div>
        <ul className="space-y-1 text-[10px] text-[color:var(--color-muted)]">
          <li>- Use PUBLIC for server-wide announcements</li>
          <li>- Use GAME for gameplay updates and events</li>
          <li>- Keep messages concise and clear</li>
          <li>- Broadcasts are logged for accountability</li>
        </ul>
      </div>
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
