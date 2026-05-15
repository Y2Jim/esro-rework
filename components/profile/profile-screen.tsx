"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

type ProfileTab = "summary" | "titles" | "cosmetics" | "notifications"

const profileTabs: { id: ProfileTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "summary", label: "Summary", icon: "◉", color: "text-[color:var(--color-lilac)]", bgColor: "bg-[color:var(--color-lilac)]/15", hover: "hover:text-[color:var(--color-lilac)] hover:bg-[color:var(--color-lilac)]/10" },
  { id: "titles", label: "Titles", icon: "◇", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover:text-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/10" },
  { id: "cosmetics", label: "Cosmetics", icon: "✦", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover:text-[color:var(--color-violet-bright)] hover:bg-[color:var(--color-violet-bright)]/10" },
  { id: "notifications", label: "Alerts", icon: "◈", color: "text-[color:var(--color-danger)]", bgColor: "bg-[color:var(--color-danger)]/15", hover: "hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10" },
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
      <div className="flex gap-1 border-b border-[color:var(--color-border)] px-2 py-1.5">
        {profileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
              tab === t.id
                ? cn(t.bgColor, t.color)
                : cn("text-[color:var(--color-muted)]", t.hover)
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
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}

function SummaryTab() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)

  const xpPercent = (profile.xp / profile.xpToNext) * 100

  return (
    <div className="space-y-4">
      {/* Identity with Avatar */}
      <div className="flex items-center gap-4">
        <PixelAvatar config={identity.avatar} size="lg" />
        <div className="flex-1">
          <div className="text-[14px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
          {identity.title && (
            <div className={cn("text-[11px]", rarityColor[identity.titleRarity])}>{identity.title}</div>
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

      {/* Faction */}
      {profile.faction && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-[color:var(--color-muted)]">{profile.faction.label}</span>
            <span className="text-[10px] text-[color:var(--color-accent)]">Rank {profile.faction.rank}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <div
              className="h-full bg-[color:var(--color-accent)]/60"
              style={{ width: `${(profile.faction.standing / profile.faction.maxStanding) * 100}%` }}
            />
          </div>
          <div className="mt-1 text-[9px] text-[color:var(--color-muted)]">
            {profile.faction.standing}/{profile.faction.maxStanding} standing
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
          {ownedTitles.map((title) => {
            const isEquipped = equippedTitle?.id === title.id
            return (
              <button
                key={title.id}
                type="button"
                onClick={() => setActiveTitle(title.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
                  isEquipped
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                    : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                )}
              >
                <div>
                  <div className={cn("text-[12px] font-medium", rarityColor[title.rarity])}>
                    {title.label}
                  </div>
                  {title.source && (
                    <div className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">
                      {title.source}
                    </div>
                  )}
                </div>
                {isEquipped && (
                  <span className="rounded bg-[color:var(--color-accent)]/20 px-2 py-0.5 text-[8px] uppercase text-[color:var(--color-accent)]">
                    active
                  </span>
                )}
              </button>
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

function NotificationsTab() {
  const profile = useEsroStore((s) => s.profile)
  const openNotification = useEsroStore((s) => s.openNotification)

  const notifications = profile.notifications || []

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Notifications ({notifications.filter(n => n.state === "unread").length} unread)
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[11px] text-[color:var(--color-muted)]">No notifications</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                n.state === "unread"
                  ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/5"
                  : "border-[color:var(--color-border)]"
              )}
            >
              {n.state === "unread" && (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-[color:var(--color-text)]">{n.title}</div>
                <div className="text-[10px] text-[color:var(--color-muted)]">{n.body}</div>
                {n.deeplink && (
                  <div className="mt-1 text-[9px] text-[color:var(--color-accent)]">
                    Tap to view
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
