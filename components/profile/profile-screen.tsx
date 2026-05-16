"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor, rarityAnimation } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { TitleDisplay, TitleBadgeRow } from "@/components/ui/title-display"

import { FACTIONS } from "@/lib/game-data"
import type { RaceId } from "@/lib/types"

type ProfileTab = "summary" | "titles" | "cosmetics" | "settings" | "notifications"

const profileTabs: { id: ProfileTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "summary", label: "Summary", icon: "◉", color: "text-[color:var(--color-lilac)]", bgColor: "bg-[color:var(--color-lilac)]/15", hover: "hover-lilac" },
  { id: "titles", label: "Titles", icon: "◇", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
  { id: "cosmetics", label: "Cosmetics", icon: "✦", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
  { id: "settings", label: "Settings", icon: "⚙", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "notifications", label: "Alerts", icon: "◈", color: "text-[color:var(--color-danger)]", bgColor: "bg-[color:var(--color-danger)]/15", hover: "hover-danger" },
]

export function ProfileScreen() {
  const [tab, setTab] = useState<ProfileTab>("summary")
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)

  if (!profile) return null

  const unreadCount = profile.notifications?.filter(n => n.state === "unread").length || 0

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-2 py-1.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {profileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
              t.hover,
              tab === t.id
                ? cn(t.bgColor, t.color)
                : "text-[color:var(--color-muted)]"
            )}
          >
            <span className="text-[10px]">{t.icon}</span>
            {t.label}
            {t.id === "notifications" && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[color:var(--color-danger)] text-[7px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {tab === "summary" && <SummaryTab />}
        {tab === "titles" && <TitlesTab />}
        {tab === "cosmetics" && <CosmeticsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}

function SummaryTab() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const characterRace = useEsroStore((s) => s.characterRace)
  const characterCourier = useEsroStore((s) => s.characterCourier)

  const xpPercent = (profile.xp / profile.xpToNext) * 100

  return (
    <div className="space-y-4">
      {/* Identity with Avatar and Faction Badge */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <PixelAvatar config={identity.avatar} size="lg" />
          {/* Faction Badge Overlay */}
          {characterFaction && (
            <div 
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shadow-lg"
              style={{ 
                backgroundColor: characterFaction.color,
                color: "#000",
                boxShadow: `0 0 8px ${characterFaction.glow}`,
              }}
              title={characterFaction.name}
            >
              {characterFaction.emblem}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
          {identity.title && (
            <TitleDisplay 
              title={identity.title} 
              rarity={identity.titleRarity} 
              className="text-[11px]" 
            />
          )}
          {/* Race/Courier info */}
          {(characterRace || characterCourier) && (
            <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[color:var(--color-muted)]">
              {characterRace && <span style={{ color: characterRace.color }}>{characterRace.name}</span>}
              {characterRace && characterCourier && <span>/</span>}
              {characterCourier && <span style={{ color: characterCourier.color }}>{characterCourier.name}</span>}
            </div>
          )}
          <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
            {identity.established ? "Established identity" : "New arrival"}
          </div>
        </div>
      </div>

      {/* Level + XP */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-[color:var(--color-muted)]">Level {profile.level}</span>
          <span className="text-[10px] text-[color:var(--color-muted)]">{profile.xp}/{profile.xpToNext} XP</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
          <div
            className="h-full bg-[color:var(--color-accent)]"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* Faction Allegiance */}
      {characterFaction ? (
        <div 
          className="rounded-lg border p-3"
          style={{ 
            borderColor: `${characterFaction.color}40`,
            backgroundColor: characterFaction.colorVars.bg,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold"
              style={{ 
                backgroundColor: `${characterFaction.color}25`,
                color: characterFaction.color,
                boxShadow: `0 0 12px ${characterFaction.glow}`,
              }}
            >
              {characterFaction.emblem}
            </div>
            <div className="flex-1 min-w-0">
              <div 
                className="text-[12px] font-bold"
                style={{ color: characterFaction.color }}
              >
                {characterFaction.name}
              </div>
              <div className="text-[9px] text-[color:var(--color-muted)] italic">
                &quot;{characterFaction.motto}&quot;
              </div>
              {profile.faction && (
                <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
                  Rank {profile.faction.rank} - {profile.faction.standing}/{profile.faction.maxStanding} standing
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-3 text-center">
          <div className="text-[11px] text-[color:var(--color-muted)]">No faction allegiance</div>
          <div className="mt-1 text-[9px] text-[color:var(--color-muted-2)]">
            Reach Level 5 to join a faction
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-center">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">
            {profile.ownedTitles?.length || 0}
          </div>
          <div className="text-[9px] text-[color:var(--color-muted)]">Titles</div>
        </div>
        <div className="text-center">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">
            {profile.vanityItems?.filter(v => v.unlocked).length || 0}
          </div>
          <div className="text-[9px] text-[color:var(--color-muted)]">Cosmetics</div>
        </div>
        <div className="text-center">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">
            {profile.badges?.length || 0}
          </div>
          <div className="text-[9px] text-[color:var(--color-muted)]">Badges</div>
        </div>
      </div>
    </div>
  )
}

function TitlesTab() {
  const profile = useEsroStore((s) => s.profile)
  const setActiveTitle = useEsroStore((s) => s.setActiveTitle)

  const ownedTitles = profile.ownedTitles || []
  const equippedTitle = profile.title

  // Sort by rarity (highest first)
  const sortedTitles = [...ownedTitles].sort((a, b) => {
    const order = ["mythic", "legendary", "epic", "rare", "uncommon", "common"]
    return order.indexOf(a.rarity) - order.indexOf(b.rarity)
  })

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Owned Titles ({ownedTitles.length})
      </div>

      {ownedTitles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[11px] text-[color:var(--color-muted)]">No titles unlocked yet</div>
          <div className="mt-1 text-[9px] text-[color:var(--color-muted-2)]">
            Recover from archive or complete achievements
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTitles.map((title) => {
            const isEquipped = equippedTitle?.id === title.id
            return (
              <TitleBadgeRow
                key={title.id}
                title={title.label}
                rarity={title.rarity}
                source={title.source}
                isEquipped={isEquipped}
                onClick={() => setActiveTitle(title.id)}
              />
            )
          })}
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3">
        <div className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
          How to unlock titles
        </div>
        <ul className="mt-2 space-y-1 text-[10px] text-[color:var(--color-muted)]">
          <li>- Recover from archive fragments</li>
          <li>- Complete faction achievements</li>
          <li>- Reach expedition milestones</li>
          <li>- Special events and challenges</li>
        </ul>
      </div>
    </div>
  )
}

function CosmeticsTab() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  const equipVanity = useEsroStore((s) => s.equipVanity)
  const unequipVanity = useEsroStore((s) => s.unequipVanity)

  const vanityItems = profile.vanityItems || []
  const unlocked = vanityItems.filter(v => v.unlocked)
  const locked = vanityItems.filter(v => !v.unlocked)

  // Group by layer type
  const groupedItems = unlocked.reduce((acc, item) => {
    if (!acc[item.layerType]) acc[item.layerType] = []
    acc[item.layerType].push(item)
    return acc
  }, {} as Record<string, typeof unlocked>)

  const layerOrder = ["hair", "eyes", "mouth", "accessory", "hat", "flair"]

  // Get currently equipped items
  const equipped = vanityItems.filter(v => v.equipped)

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex flex-col items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-4">
        <PixelAvatar config={identity.avatar} size="lg" />
        <div className="mt-2 text-[11px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
        {equipped.length > 0 ? (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {equipped.map(e => (
              <span key={e.id} className={cn("rounded px-1.5 py-0.5 text-[8px]", rarityColor[e.rarity])}>
                {e.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">No cosmetics equipped</div>
        )}
      </div>

      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Cosmetics ({unlocked.length} unlocked)
      </div>

      {unlocked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[11px] text-[color:var(--color-muted)]">No cosmetics unlocked yet</div>
          <div className="mt-1 text-[9px] text-[color:var(--color-muted-2)]">
            Recover from archive to unlock cosmetics
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {layerOrder.map((layerType) => {
            const items = groupedItems[layerType]
            if (!items || items.length === 0) return null

            return (
              <div key={layerType}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {layerType}
                  </span>
                  <div className="h-px flex-1 bg-[color:var(--color-border-soft)]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => v.equipped ? unequipVanity(v.layerType) : equipVanity(v.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border p-2 text-left transition-all",
                        v.equipped
                          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                          : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={cn("text-[10px]", rarityColor[v.rarity])}>{v.label}</span>
                        {v.equipped && (
                          <span className="text-[8px] uppercase text-[color:var(--color-accent)]">worn</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {locked.length > 0 && (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3 text-center">
          <div className="text-[10px] text-[color:var(--color-muted)]">
            {locked.length} cosmetics locked
          </div>
          <div className="text-[9px] text-[color:var(--color-muted-2)]">
            Recover from archive to unlock
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const uiTheme = useEsroStore((s) => s.uiTheme)
  const setUiTheme = useEsroStore((s) => s.setUiTheme)
  const characterFaction = useEsroStore((s) => s.characterFaction)

  const themeOptions: { id: "default" | RaceId; label: string; color: string }[] = [
    { id: "default", label: "Default (Violet)", color: "#a45dff" },
    ...FACTIONS.map(f => ({ id: f.id, label: f.name, color: f.color }))
  ]

  return (
    <div className="space-y-4">
      {/* UI Theme */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          UI Theme
        </div>
        <div className="space-y-2">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setUiTheme(theme.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                uiTheme === theme.id
                  ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                  : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
              )}
            >
              <div 
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: theme.color, boxShadow: `0 0 8px ${theme.color}50` }}
              />
              <span className="flex-1 text-[11px] text-[color:var(--color-text)]">
                {theme.label}
              </span>
              {uiTheme === theme.id && (
                <span className="text-[8px] uppercase text-[color:var(--color-accent)]">active</span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[9px] text-[color:var(--color-muted)]">
          Choose your interface color scheme. Faction themes become available after joining a faction.
        </p>
      </div>

      {/* Current Faction */}
      {characterFaction && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Current Faction
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ 
                backgroundColor: `${characterFaction.color}20`,
                color: characterFaction.color,
              }}
            >
              {characterFaction.emblem}
            </div>
            <div>
              <div className="text-[12px] font-medium" style={{ color: characterFaction.color }}>
                {characterFaction.name}
              </div>
              <div className="text-[9px] text-[color:var(--color-muted)] italic">
                {characterFaction.motto}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Settings Placeholder */}
      <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          More Settings
        </div>
        <ul className="mt-2 space-y-1 text-[9px] text-[color:var(--color-muted)]">
          <li>- Sound preferences (coming soon)</li>
          <li>- Notification settings (coming soon)</li>
          <li>- Privacy options (coming soon)</li>
        </ul>
      </div>

      {/* Admin/Debug Section */}
      <div className="rounded-lg border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/5 p-3">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-danger)]">
          Admin / Debug
        </div>
        <p className="mb-3 text-[9px] text-[color:var(--color-muted)]">
          Testing options for development. These will be removed in production.
        </p>
        <div className="space-y-2">
          <AdminUnlockButton />
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const profile = useEsroStore((s) => s.profile)
  const openNotification = useEsroStore((s) => s.openNotification)
  const clearNotification = useEsroStore((s) => s.clearNotification)
  const clearAllNotifications = useEsroStore((s) => s.clearAllNotifications)

  const notifications = profile.notifications || []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Notifications ({notifications.filter(n => n.state === "unread").length} unread)
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={clearAllNotifications}
            className="text-[9px] text-[color:var(--color-danger)] transition-colors hover:text-[color:var(--color-danger-bright)]"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[11px] text-[color:var(--color-muted)]">No notifications</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg border px-3 py-2 transition-colors",
                n.state === "unread"
                  ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/5"
                  : "border-[color:var(--color-border)]"
              )}
            >
              {n.state === "unread" && (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
              )}
              <button
                type="button"
                onClick={() => openNotification(n)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="text-[11px] text-[color:var(--color-text)]">{n.title}</div>
                <div className="text-[10px] text-[color:var(--color-muted)]">{n.body}</div>
                {n.deeplink && (
                  <div className="mt-1 text-[9px] text-[color:var(--color-accent)]">
                    Tap to view
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => clearNotification(n.id)}
                className="shrink-0 p-1 text-[10px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-danger)]"
                title="Clear notification"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminUnlockButton() {
  const unlockAllCosmetics = useEsroStore((s) => s.unlockAllCosmetics)
  const unlockAllTitles = useEsroStore((s) => s.unlockAllTitles)
  const [unlocked, setUnlocked] = useState<{ cosmetics: boolean; titles: boolean }>({
    cosmetics: false,
    titles: false,
  })

  const handleUnlockCosmetics = () => {
    unlockAllCosmetics()
    setUnlocked((prev) => ({ ...prev, cosmetics: true }))
  }

  const handleUnlockTitles = () => {
    unlockAllTitles()
    setUnlocked((prev) => ({ ...prev, titles: true }))
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleUnlockCosmetics}
        disabled={unlocked.cosmetics}
        className={cn(
          "w-full rounded border px-3 py-2 text-[10px] transition-colors",
          unlocked.cosmetics
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20"
        )}
      >
        {unlocked.cosmetics ? "All Cosmetics Unlocked" : "Unlock All Cosmetics"}
      </button>
      <button
        type="button"
        onClick={handleUnlockTitles}
        disabled={unlocked.titles}
        className={cn(
          "w-full rounded border px-3 py-2 text-[10px] transition-colors",
          unlocked.titles
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20"
        )}
      >
        {unlocked.titles ? "All Titles Unlocked" : "Unlock All Titles"}
      </button>
    </div>
  )
}
