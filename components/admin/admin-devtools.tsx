"use client"

import { useState, useMemo } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { ROLLABLE_THEMES } from "@/lib/rollable-themes"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { Wrench } from "lucide-react"

export function AdminDevTools() {
  const unlockAllCosmetics = useEsroStore((s) => s.unlockAllCosmetics)
  const unlockAllTitles = useEsroStore((s) => s.unlockAllTitles)
  const simulateExpedition = useEsroStore((s) => s.simulateExpedition)
  const completeActiveExpedition = useEsroStore((s) => s.completeActiveExpedition)
  const activeExpedition = useEsroStore((s) => s.activeExpedition)
  const addMaterials = useEsroStore((s) => s.addMaterials)
  const injectTestChatMessages = useEsroStore((s) => s.injectTestChatMessages)
  const setScreen = useEsroStore((s) => s.setScreen)
  const unlockTheme = useEsroStore((s) => s.unlockTheme)
  const identity = useEsroStore((s) => s.identity)
  const logAdminAction = useEsroStore((s) => s.logAdminAction)
  const setHandle = useEsroStore((s) => s.setHandle)
  
  const [unlocked, setUnlocked] = useState<{ cosmetics: boolean; titles: boolean; materials: boolean; chat: boolean; themes: boolean }>({
    cosmetics: false,
    titles: false,
    materials: false,
    chat: false,
    themes: false,
  })
  
  const [newHandle, setNewHandle] = useState(identity.handle.replace("@", ""))
  
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
            onClick={completeActiveExpedition}
            className="w-full rounded border border-[#60d060]/50 bg-[#60d060]/10 px-3 py-2 text-[14px] text-[#60d060] transition-colors hover:bg-[#60d060]/20"
          >
            Complete Active Expedition
          </button>
        )}
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
