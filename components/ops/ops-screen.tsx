"use client"

import { useEsroStore } from "@/store/use-esro-store"
import type { OpsTab } from "@/lib/types"
import { SubTabBar, type SubTabItem } from "@/components/shell/sub-tab-bar"
import { MapTab } from "./map-tab"
import { ExpeditionsTab } from "./expeditions-tab"
import { SkillsTab } from "./skills-tab"
import { CraftingTab } from "./crafting-tab"
import { FishingTab } from "./fishing-tab"
import { RollingTab } from "./rolling-tab"
import { ActiveExpeditionView } from "@/components/expedition/active-expedition-view"
import { TerritoryBattleView } from "@/components/territory/territory-battle-view"

const tabs: (SubTabItem & { id: OpsTab })[] = [
  { id: "map", label: "Map", icon: "◈", accentClass: "text-[color:var(--color-accent)]", activeBgClass: "bg-[color:var(--color-accent)]/15", hoverClass: "hover-violet", accentBar: "var(--color-accent)" },
  { id: "expeditions", label: "Expeditions", icon: "▷", accentClass: "text-[color:var(--color-cyan)]", activeBgClass: "bg-[color:var(--color-cyan)]/15", hoverClass: "hover-cyan", accentBar: "var(--color-cyan)" },
  { id: "skills", label: "Skills", icon: "◆", accentClass: "text-[color:var(--color-green)]", activeBgClass: "bg-[color:var(--color-green)]/15", hoverClass: "hover-green", accentBar: "var(--color-green)" },
  { id: "crafting", label: "Crafting", icon: "⬢", accentClass: "text-[color:var(--color-amber)]", activeBgClass: "bg-[color:var(--color-amber)]/15", hoverClass: "hover-amber", accentBar: "var(--color-amber)" },
  { id: "fishing", label: "Fishing", icon: "≈", accentClass: "text-[color:var(--color-cyan)]", activeBgClass: "bg-[color:var(--color-cyan)]/15", hoverClass: "hover-cyan", accentBar: "var(--color-cyan)" },
  { id: "rolling", label: "Rolling", icon: "⬡", accentClass: "text-[color:var(--color-violet-bright)]", activeBgClass: "bg-[color:var(--color-violet-bright)]/15", hoverClass: "hover-violet", accentBar: "var(--color-violet-bright)" },
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
      {/* Contextual sub-tabs */}
      <SubTabBar
        ariaLabel="ops sections"
        items={visibleTabs}
        activeId={effectiveTab}
        onSelect={(id) => setOpsTab(id as OpsTab)}
      />

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
