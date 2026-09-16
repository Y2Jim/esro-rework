"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { OpsTab } from "@/lib/types"
import { cn } from "@/lib/cn"
import { MapTab } from "./map-tab"
import { ExpeditionsTab } from "./expeditions-tab"
import { SkillsTab } from "./skills-tab"
import { CraftingTab } from "./crafting-tab"
import { FishingTab } from "./fishing-tab"
import { RollingTab } from "./rolling-tab"
import { ActiveExpeditionView } from "@/components/expedition/active-expedition-view"
import { TerritoryBattleView } from "@/components/territory/territory-battle-view"

const tabs: { id: OpsTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "map", label: "Map", icon: "◈", color: "text-[color:var(--color-accent)]", bgColor: "bg-[color:var(--color-accent)]/15", hover: "hover-violet" },
  { id: "expeditions", label: "Expeditions", icon: "▷", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "skills", label: "Skills", icon: "◆", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15", hover: "hover-green" },
  { id: "crafting", label: "Crafting", icon: "⬢", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
  { id: "fishing", label: "Fishing", icon: "≈", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "rolling", label: "Rolling", icon: "⬡", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
]

export function OpsScreen() {
  const opsTab = useEsroStore((s) => s.opsTab)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const activeBattle = useEsroStore((s) => s.activeBattle)
  // Fishing only exists once its skill gate (Luck 15 -> "fishing_basic") is met.
  const canFish = useEsroStore((s) => s.hasSkillUnlock("fishing_basic"))

  // Hide the Fishing tab until its skill unlock is earned.
  const visibleTabs = tabs.filter((tab) => tab.id !== "fishing" || canFish)

  // If the player was parked on Fishing and then lost the unlock (e.g. a dev
  // reset), fall back to Map so the content area never renders a hidden tab.
  const effectiveTab = opsTab === "fishing" && !canFish ? "map" : opsTab

  // A territory battle (claim resolution or base assault) takes over everything.
  if (activeBattle) {
    return <TerritoryBattleView />
  }

  // An active expedition takes over the entire Ops screen.
  if (activeExpedition) {
    return <ActiveExpeditionView />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Inline sub-tabs */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-3 py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOpsTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              tab.hover,
              effectiveTab === tab.id
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
        {effectiveTab === "map" && <MapTab />}
        {effectiveTab === "expeditions" && <ExpeditionsTab />}
        {effectiveTab === "skills" && <SkillsTab />}
        {effectiveTab === "crafting" && <CraftingTab />}
        {effectiveTab === "fishing" && canFish && <FishingTab />}
        {effectiveTab === "rolling" && <RollingTab />}
      </div>
    </div>
  )
}
