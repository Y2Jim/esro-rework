"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { AdminTab } from "@/lib/types"
import { cn } from "@/lib/cn"
import { AdminDashboard } from "./admin-dashboard"
import { AdminEvents } from "./admin-events"
import { AdminContracts } from "./admin-contracts"
import { AdminExpeditions } from "./admin-expeditions"
import { AdminPlayers } from "./admin-players"
import { AdminBroadcast } from "./admin-broadcast"
import { AdminLogs } from "./admin-logs"
import { AdminDevTools } from "./admin-devtools"
import { ChevronLeft, Shield } from "lucide-react"

const tabs: { id: AdminTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "events", label: "Events", icon: "★" },
  { id: "contracts", label: "Contracts", icon: "◇" },
  { id: "expeditions", label: "Expeditions", icon: "▷" },
  { id: "players", label: "Players", icon: "◎" },
  { id: "broadcast", label: "Broadcast", icon: "◉" },
  { id: "logs", label: "Logs", icon: "≡" },
  { id: "devtools", label: "Dev Tools", icon: "⚙" },
]

export function AdminScreen() {
  const adminTab = useEsroStore((s) => s.adminTab)
  const setAdminTab = useEsroStore((s) => s.setAdminTab)
  const setScreen = useEsroStore((s) => s.setScreen)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-3 py-2">
        <button
          type="button"
          onClick={() => setScreen("profile")}
          className="flex items-center gap-1 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
        >
          <ChevronLeft className="h-3 w-3" />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#ff6b4a]" />
          <span className="font-mono text-[15px] font-bold uppercase tracking-wider text-[#ff6b4a]">
            Admin Panel
          </span>
        </div>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Inline sub-tabs */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-3 py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255, 107, 74, 0.4) transparent" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              adminTab === tab.id
                ? "bg-[#ff6b4a]/15 text-[#ff6b4a]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            )}
          >
            <span className="text-[15px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255, 107, 74, 0.4) transparent" }}>
        {adminTab === "dashboard" && <AdminDashboard />}
        {adminTab === "events" && <AdminEvents />}
        {adminTab === "contracts" && <AdminContracts />}
        {adminTab === "expeditions" && <AdminExpeditions />}
        {adminTab === "players" && <AdminPlayers />}
        {adminTab === "broadcast" && <AdminBroadcast />}
        {adminTab === "logs" && <AdminLogs />}
        {adminTab === "devtools" && <AdminDevTools />}
      </div>
    </div>
  )
}
