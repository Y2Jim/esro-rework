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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {/* Tab row */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOpsTab(tab.id)}
            className={cn(
              "esro-button shrink-0 whitespace-nowrap text-[10px]",
              opsTab === tab.id && "esro-button-active"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1">
        {opsTab === "expeditions" && <ExpeditionsTab />}
        {opsTab === "skills" && <SkillsTab />}
        {opsTab === "crafting" && <CraftingTab />}
        {opsTab === "rolling" && <RollingTab />}
      </div>
    </div>
  )
}
