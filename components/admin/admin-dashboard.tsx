"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { Shield, Users, Calendar, FileText, AlertTriangle } from "lucide-react"

export function AdminDashboard() {
  const events = useEsroStore((s) => s.events)
  const contracts = useEsroStore((s) => s.contracts)
  const expeditions = useEsroStore((s) => s.expeditions)
  const playerRecords = useEsroStore((s) => s.playerRecords)
  const adminLogs = useEsroStore((s) => s.adminLogs)
  const identity = useEsroStore((s) => s.identity)

  const activeEvents = events.filter((e) => e.active).length
  const mutedPlayers = playerRecords.filter((p) => p.status === "muted").length
  const bannedPlayers = playerRecords.filter((p) => p.status === "banned").length
  const recentLogs = adminLogs.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#ff6b4a]" />
          <span className="font-mono text-[15px] font-medium text-[#ff6b4a]">
            Admin Mode Active
          </span>
        </div>
        <p className="mt-1 text-[14px] text-[color:var(--color-muted)]">
          Logged in as {identity.handle}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Active Events"
          value={activeEvents}
          total={events.length}
          color="#5dd0ff"
        />
        <StatCard
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Contracts"
          value={contracts.length}
          color="#bb81ff"
        />
        <StatCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Players Tracked"
          value={playerRecords.length}
          color="#60d060"
        />
        <StatCard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Muted/Banned"
          value={mutedPlayers + bannedPlayers}
          color="#ff6b4a"
        />
      </div>

      {/* Quick Stats */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          System Overview
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="font-mono text-lg font-bold text-[color:var(--color-text)]">
              {expeditions.length}
            </div>
            <div className="text-[13px] text-[color:var(--color-muted)]">Expeditions</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-[color:var(--color-text)]">
              {contracts.filter((c) => c.status === "active").length}
            </div>
            <div className="text-[13px] text-[color:var(--color-muted)]">Active Contracts</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-[color:var(--color-text)]">
              {adminLogs.length}
            </div>
            <div className="text-[13px] text-[color:var(--color-muted)]">Admin Actions</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Recent Admin Activity
        </div>
        {recentLogs.length === 0 ? (
          <p className="text-[14px] text-[color:var(--color-muted)]">No recent activity</p>
        ) : (
          <div className="space-y-1.5">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded border border-[color:var(--color-border)]/50 bg-[color:var(--color-bg)]/50 px-2 py-1.5"
              >
                <div className="flex-1">
                  <span className="font-mono text-[14px] text-[#ff6b4a]">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  {log.target && (
                    <span className="ml-1 text-[14px] text-[color:var(--color-text)]">
                      {log.target}
                    </span>
                  )}
                  {log.details && (
                    <p className="text-[13px] text-[color:var(--color-muted)]">{log.details}</p>
                  )}
                </div>
                <span className="text-[12px] text-[color:var(--color-muted)]">
                  {formatTimeAgo(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total?: number
  color: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-2.5">
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[13px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 font-mono text-xl font-bold" style={{ color }}>
        {value}
        {total !== undefined && (
          <span className="text-sm text-[color:var(--color-muted)]">/{total}</span>
        )}
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
