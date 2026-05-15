"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { OpsTab } from "@/lib/types"
import { cn } from "@/lib/cn"
import { ExpeditionsTab } from "./expeditions-tab"
import { SkillsTab } from "./skills-tab"
import { CraftingTab } from "./crafting-tab"
import { RollingTab } from "./rolling-tab"

const tabs: { id: OpsTab; label: string }[] = [
  { id: "expeditions", label: "Expeditions" },
  { id: "skills", label: "Skills" },
  { id: "crafting", label: "Crafting" },
  { id: "rolling", label: "Rolling" },
]

export function OpsScreen() {
  const opsTab = useEsroStore((s) => s.opsTab)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)

  return (
    <div className="flex h-full flex-col">
      {/* Inline sub-tabs */}
      <div className="flex gap-1 border-b border-[color:var(--color-border)] px-3 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOpsTab(tab.id)}
            className={cn(
              "rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
              opsTab === tab.id
                ? "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
            )}
          >
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
