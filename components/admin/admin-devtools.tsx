"use client"

import { useState, useMemo } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { ROLLABLE_THEMES } from "@/lib/rollable-themes"
import { SKILL_MECHANICS, STAT_UNLOCKS, type SkillUnlockId } from "@/lib/skill-effects"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { Wrench } from "lucide-react"

/**
 * Every tier breakpoint in the registry as a togglable list, keyed by unlock id.
 * Several unlocks are granted by more than one skill (either route opens the
 * content), so those are merged into one row listing each path.
 * Fishing is surfaced first since it is the most common thing to test.
 */
const UNLOCK_OVERRIDES = (() => {
  const byUnlock = new Map<
    SkillUnlockId,
    {
      unlock: SkillUnlockId
      label: string
      detail: string
      skills: string[]
      skillName: string
      level: number
    }
  >()
  for (const mech of SKILL_MECHANICS) {
    for (const bp of mech.breakpoints) {
      const existing = byUnlock.get(bp.unlock)
      if (existing) {
        existing.skills.push(`${mech.name} Lv.${bp.level}`)
        continue
      }
      byUnlock.set(bp.unlock, {
        unlock: bp.unlock,
        label: bp.label,
        detail: bp.detail,
        skills: [`${mech.name} Lv.${bp.level}`],
        // Kept separate from the display strings so sorting compares the skill
        // name and the numeric level rather than "Lv.10" vs "Lv.5" as text.
        skillName: mech.name,
        level: bp.level,
      })
    }
  }
  // Stat-threshold gates (e.g. fishing entry needs Luck 15) live outside the
  // skill registry, so merge them in or they would drop off this list entirely.
  for (const gate of STAT_UNLOCKS) {
    const requirement = `${gate.stat.toUpperCase()} ${gate.value}`
    const existing = byUnlock.get(gate.unlock)
    if (existing) {
      existing.skills.push(requirement)
      continue
    }
    byUnlock.set(gate.unlock, {
      unlock: gate.unlock,
      label: gate.label,
      detail: gate.detail,
      skills: [requirement],
      skillName: requirement,
      level: gate.value,
    })
  }
  return [...byUnlock.values()].sort((a, b) => {
    const aFish = a.unlock.startsWith("fishing")
    const bFish = b.unlock.startsWith("fishing")
    if (aFish !== bFish) return aFish ? -1 : 1
    return a.skillName.localeCompare(b.skillName) || a.level - b.level
  })
})()

export function AdminDevTools() {
  const unlockAllCosmetics = useEsroStore((s) => s.unlockAllCosmetics)
  const unlockAllTitles = useEsroStore((s) => s.unlockAllTitles)
  const devUnlockAllMounts = useEsroStore((s) => s.devUnlockAllMounts)
  const simulateExpedition = useEsroStore((s) => s.simulateExpedition)
  const completeActiveExpedition = useEsroStore((s) => s.completeActiveExpedition)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const addMaterials = useEsroStore((s) => s.addMaterials)
  const injectTestChatMessages = useEsroStore((s) => s.injectTestChatMessages)
  const addNotification = useEsroStore((s) => s.addNotification)
  const setProfileTab = useEsroStore((s) => s.setProfileTab)
  const setScreen = useEsroStore((s) => s.setScreen)
  const unlockTheme = useEsroStore((s) => s.unlockTheme)
  const identity = useEsroStore((s) => s.identity)
  const logAdminAction = useEsroStore((s) => s.logAdminAction)
  const setHandle = useEsroStore((s) => s.setHandle)
  const debugUnlocks = useEsroStore((s) => s.debugUnlocks)
  const toggleDebugUnlock = useEsroStore((s) => s.toggleDebugUnlock)
  const clearDebugUnlocks = useEsroStore((s) => s.clearDebugUnlocks)
  const hasSkillUnlock = useEsroStore((s) => s.hasSkillUnlock)
  const devSetLevelXp = useEsroStore((s) => s.devSetLevelXp)
  const profile = useEsroStore((s) => s.profile)
  
  const [unlocked, setUnlocked] = useState<{ cosmetics: boolean; titles: boolean; materials: boolean; chat: boolean; themes: boolean; mounts: boolean }>({
    cosmetics: false,
    titles: false,
    materials: false,
    chat: false,
    themes: false,
    mounts: false,
  })
  
  const [newHandle, setNewHandle] = useState(identity.handle.replace("@", ""))

  const [levelInput, setLevelInput] = useState(String(profile.level))
  const [xpInput, setXpInput] = useState(String(profile.xp))
  
  const [previewFlair, setPreviewFlair] = useState(0)
  const flairNames = [
    "None", "Pulse Glow", "Static Aura", "Sparkle", "Soft Glow", "Dust Motes", 
    "Signal Flicker", "Route Trails", "Echo Ripples", "Data Stream", "Void Shimmer", 
    "Prismatic Aura", "Celestial Flame",
    "Relay Sea Aura", "Shardheart Radiance", "Eternal Courier's Light", "Voidtouched Presence", "Primordial Resonance"
  ]
  const isMythicFlair = previewFlair >= 13
  
  const previewAvatar = useMemo(() => ({
    ...identity.avatar,
    layers: identity.avatar.layers.map(l => 
      l.type === "flair" ? { ...l, variant: previewFlair } : l
    )
  }), [identity.avatar, previewFlair])

  const handleUnlockCosmetics = () => {
    unlockAllCosmetics()
    setUnlocked((prev) => ({ ...prev, cosmetics: true }))
    logAdminAction("unlock_cosmetics", undefined, "Unlocked all cosmetic items")
  }

  const handleUnlockTitles = () => {
    unlockAllTitles()
    setUnlocked((prev) => ({ ...prev, titles: true }))
    logAdminAction("unlock_titles", undefined, "Unlocked all titles")
  }

  const handleUnlockThemes = () => {
    ROLLABLE_THEMES.forEach(t => unlockTheme(t.id))
    setUnlocked((prev) => ({ ...prev, themes: true }))
  }

  const handleUnlockMounts = () => {
    devUnlockAllMounts()
    setUnlocked((prev) => ({ ...prev, mounts: true }))
  }

  const handleAddMaterials = () => {
    addMaterials()
    setUnlocked((prev) => ({ ...prev, materials: true }))
    logAdminAction("add_materials", undefined, "Added crafting materials to inventory")
  }

  const handleInjectChat = () => {
    injectTestChatMessages()
    setUnlocked((prev) => ({ ...prev, chat: true }))
    setScreen("terminal")
  }

  const fireTestNotification = (priority: "low" | "normal" | "high") => {
    const copy = {
      low: { title: "Routine Sync", body: "Relay logs archived. No action needed." },
      normal: { title: "Contract Available", body: "A new courier contract is open for bidding." },
      high: { title: "Priority Alert", body: "Anomaly surge detected near your last route. Respond now." },
    }[priority]
    addNotification({ ...copy, priority })
    // Send the tester to where the notification lands so it can be inspected.
    setScreen("profile")
    setProfileTab("notifications")
    logAdminAction("broadcast", undefined, `Fired ${priority} test notification`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-[#ff6b4a]" />
        <span className="text-[15px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Developer Tools
        </span>
      </div>

      {/* Username Change */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Change Username
        </div>
        <div className="flex gap-2">
          <div className="flex flex-1 items-center rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2">
            <span className="text-[15px] text-[color:var(--color-muted)]">@</span>
            <input
              type="text"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              maxLength={20}
              className="flex-1 bg-transparent px-1 py-1.5 text-[15px] text-[color:var(--color-text)] outline-none"
              placeholder="new_username"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (newHandle.trim()) {
                setHandle(newHandle.trim())
                logAdminAction("edit_player", identity.handle, `Changed username to @${newHandle.trim()}`)
              }
            }}
            disabled={!newHandle.trim() || `@${newHandle}` === identity.handle}
            className={cn(
              "rounded border px-3 py-1.5 text-[14px] transition-colors",
              !newHandle.trim() || `@${newHandle}` === identity.handle
                ? "border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-muted)]"
                : "border-[#5dd0ff]/50 bg-[#5dd0ff]/10 text-[#5dd0ff] hover:bg-[#5dd0ff]/20"
            )}
          >
            Apply
          </button>
        </div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Admin override - no restrictions on username changes
        </p>
      </div>

      {/* Level & EXP */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Level &amp; EXP
          </span>
          <span className="text-[13px] text-[color:var(--color-muted)]">
            {"Now: Lv."}{profile.level} · {profile.xp}/{profile.xpToNext} XP
          </span>
        </div>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Level
            </span>
            <input
              type="number"
              min={1}
              value={levelInput}
              onChange={(e) => setLevelInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1.5 text-[15px] text-[color:var(--color-text)] outline-none focus:border-[#5dd0ff]/50"
              placeholder="1"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              EXP into level
            </span>
            <input
              type="number"
              min={0}
              value={xpInput}
              onChange={(e) => setXpInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1.5 text-[15px] text-[color:var(--color-text)] outline-none focus:border-[#5dd0ff]/50"
              placeholder="0"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            const lvl = Math.max(1, parseInt(levelInput || "1", 10))
            const xp = Math.max(0, parseInt(xpInput || "0", 10))
            devSetLevelXp(lvl, xp)
          }}
          className="w-full rounded border border-[#5dd0ff]/50 bg-[#5dd0ff]/10 px-3 py-2 text-[14px] text-[#5dd0ff] transition-colors hover:bg-[#5dd0ff]/20"
        >
          Apply Level &amp; EXP
        </button>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Sets your exact level and XP into that level. Grants the matching unspent stat-point pool and re-checks level-gated unlocks.
        </p>
      </div>

      {/* Unlock Buttons */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Unlock All
        </div>
        
        <button
          type="button"
          onClick={handleUnlockCosmetics}
          disabled={unlocked.cosmetics}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.cosmetics
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#ffb347]/50 bg-[#ffb347]/10 text-[#ffb347] hover:bg-[#ffb347]/20"
          )}
        >
          {unlocked.cosmetics ? "All Cosmetics Unlocked" : "Unlock All Cosmetics"}
        </button>
        
        <button
          type="button"
          onClick={handleUnlockTitles}
          disabled={unlocked.titles}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.titles
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#ffb347]/50 bg-[#ffb347]/10 text-[#ffb347] hover:bg-[#ffb347]/20"
          )}
        >
          {unlocked.titles ? "All Titles Unlocked" : "Unlock All Titles"}
        </button>
        
        <button
          type="button"
          onClick={handleUnlockThemes}
          disabled={unlocked.themes}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.themes
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#5dd0ff]/50 bg-[#5dd0ff]/10 text-[#5dd0ff] hover:bg-[#5dd0ff]/20"
          )}
        >
          {unlocked.themes ? "All UI Themes Unlocked" : "Unlock All UI Themes"}
        </button>

        <button
          type="button"
          onClick={handleUnlockMounts}
          disabled={unlocked.mounts}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.mounts
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060] hover:bg-[#60d060]/20"
          )}
        >
          {unlocked.mounts ? "All Mounts Tamed" : "Tame All Mounts"}
        </button>
      </div>

      {/* Chat Testing */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Chat Testing
        </div>
        <button
          type="button"
          onClick={handleInjectChat}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.chat
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#bb81ff]/50 bg-[#bb81ff]/10 text-[#bb81ff] hover:bg-[#bb81ff]/20"
          )}
        >
          {unlocked.chat ? "Test Messages Sent" : "Inject Title Test Messages"}
        </button>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Adds messages with all rarity titles to PUBLIC channel
        </p>
      </div>

      {/* Notification Testing */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Notification Testing
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fireTestNotification("low")}
            className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-3 py-2 text-[14px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-text)]/40 hover:text-[color:var(--color-text)]"
          >
            Low
          </button>
          <button
            type="button"
            onClick={() => fireTestNotification("normal")}
            className="rounded border border-[#5dd0ff]/50 bg-[#5dd0ff]/10 px-3 py-2 text-[14px] text-[#5dd0ff] transition-colors hover:bg-[#5dd0ff]/20"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => fireTestNotification("high")}
            className="rounded border border-[#ff6b4a]/50 bg-[#ff6b4a]/10 px-3 py-2 text-[14px] text-[#ff6b4a] transition-colors hover:bg-[#ff6b4a]/20"
          >
            High
          </button>
        </div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Fires a test notification and jumps to the Notifications tab to inspect it.
        </p>
      </div>

      {/* Crafting Testing */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Crafting Testing
        </div>
        <button
          type="button"
          onClick={handleAddMaterials}
          disabled={unlocked.materials}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.materials
              ? "border-[#60d060]/50 bg-[#60d060]/10 text-[#60d060]"
              : "border-[#ffb347]/50 bg-[#ffb347]/10 text-[#ffb347] hover:bg-[#ffb347]/20"
          )}
        >
          {unlocked.materials ? "Materials Added" : "Add Crafting Materials"}
        </button>
      </div>

      {/* Expedition Testing */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Expedition Testing
        </div>
        <button
          type="button"
          onClick={() => simulateExpedition()}
          disabled={!!activeExpedition}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            activeExpedition
              ? "border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-muted)]"
              : "border-[#5dd0ff]/50 bg-[#5dd0ff]/10 text-[#5dd0ff] hover:bg-[#5dd0ff]/20"
          )}
        >
          {activeExpedition ? "Expedition In Progress" : "Start Test Expedition"}
        </button>
        {activeExpedition && (
          <button
            type="button"
            onClick={() => completeActiveExpedition(1)}
            className="w-full rounded border border-[#60d060]/50 bg-[#60d060]/10 px-3 py-2 text-[14px] text-[#60d060] transition-colors hover:bg-[#60d060]/20"
          >
            Complete Active Expedition
          </button>
        )}
      </div>

      {/* Content Unlock Overrides */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Force Content Unlocks
          </div>
          {debugUnlocks.length > 0 && (
            <button
              type="button"
              onClick={clearDebugUnlocks}
              className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-0.5 text-[13px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
            >
              Clear All
            </button>
          )}
        </div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Bypasses the skill level requirement so gated content can be tested directly.
        </p>
        <div className="space-y-1.5">
          {UNLOCK_OVERRIDES.map((entry) => {
            const forced = debugUnlocks.includes(entry.unlock)
            const earned = !forced && hasSkillUnlock(entry.unlock)
            return (
              <button
                key={entry.unlock}
                type="button"
                onClick={() => toggleDebugUnlock(entry.unlock)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded border px-3 py-2 text-left transition-colors",
                  forced
                    ? "border-[#60d060]/50 bg-[#60d060]/10"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-panel)] hover:border-[#5dd0ff]/50"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[color:var(--color-text)]">
                    {entry.label}
                  </span>
                  <span className="block truncate text-[12px] text-[color:var(--color-muted)]">
                    {entry.skills.join(" or ")} — {entry.detail}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[12px] uppercase tracking-wider",
                    forced
                      ? "text-[#60d060]"
                      : earned
                        ? "text-[#5dd0ff]"
                        : "text-[color:var(--color-muted)]"
                  )}
                >
                  {forced ? "Forced" : earned ? "Earned" : "Locked"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Flair Preview */}
      <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-3">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Flair Preview
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3">
            <PixelAvatar config={previewAvatar} size="md" showFlair={true} />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[14px]",
                isMythicFlair ? "title-mythic font-medium" : "text-[color:var(--color-text)]"
              )}>
                {flairNames[previewFlair]}
              </span>
              {previewFlair > 0 && (
                <span className="text-[13px] text-[color:var(--color-muted)]">({previewFlair})</span>
              )}
              {isMythicFlair && (
                <span className="rounded bg-[#ff6b9d]/20 px-1 py-0.5 text-[12px] text-[#ff6b9d]">
                  MYTHIC
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewFlair((prev) => (prev > 0 ? prev - 1 : 17))}
                className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-0.5 text-[14px] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/20"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPreviewFlair((prev) => (prev < 17 ? prev + 1 : 0))}
                className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-0.5 text-[14px] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/20"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
