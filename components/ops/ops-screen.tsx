"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { OpsTab } from "@/lib/types"
import { cn } from "@/lib/cn"
import { ExpeditionsTab } from "./expeditions-tab"
import { SkillsTab } from "./skills-tab"
import { CraftingTab } from "./crafting-tab"
import { RollingTab } from "./rolling-tab"

const tabs: { id: OpsTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "expeditions", label: "Expeditions", icon: "▷", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "skills", label: "Skills", icon: "◆", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15", hover: "hover-green" },
  { id: "crafting", label: "Crafting", icon: "⬢", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
  { id: "rolling", label: "Rolling", icon: "⬡", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
]

export function OpsScreen() {
  const opsTab = useEsroStore((s) => s.opsTab)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)

  return (
    <div className="flex h-full flex-col">
      {/* Inline sub-tabs */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-3 py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOpsTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              tab.hover,
              opsTab === tab.id
                ? cn(tab.bgColor, tab.color)
                : "text-[color:var(--color-muted)]"
            )}
          >
            <span className="text-[15px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {opsTab === "expeditions" && <ExpeditionsTab />}
        {opsTab === "skills" && <SkillsTab />}
        {opsTab === "crafting" && <CraftingTab />}
        {opsTab === "rolling" && <RollingTab />}
      </div>
    </div>
  )
}
