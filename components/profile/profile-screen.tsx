"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor } from "@/lib/rarity"
import { cn } from "@/lib/cn"

export function ProfileScreen() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)

  if (!profile) return null

  const xpPercent = (profile.xp / profile.xpToNext) * 100

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
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

        {/* Vanity Items */}
        {profile.vanityItems && profile.vanityItems.length > 0 && (
          <VanitySection />
        )}

        {/* Notifications */}
        {profile.notifications && profile.notifications.length > 0 && (
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Notices ({profile.notifications.filter(n => n.state === "unread").length} new)
            </div>
            <div className="space-y-1">
              {profile.notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 rounded-lg border border-[color:var(--color-border)] px-3 py-2"
                >
                  {n.state === "unread" && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[color:var(--color-text)]">{n.title}</div>
                    <div className="text-[10px] text-[color:var(--color-muted)]">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VanitySection() {
  const profile = useEsroStore((s) => s.profile)
  const equipVanity = useEsroStore((s) => s.equipVanity)
  const unequipVanity = useEsroStore((s) => s.unequipVanity)
  
  const unlocked = profile.vanityItems.filter(v => v.unlocked)
  const locked = profile.vanityItems.filter(v => !v.unlocked)
  
  if (unlocked.length === 0) return null
  
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Cosmetics ({unlocked.length} unlocked)
      </div>
      <div className="grid grid-cols-2 gap-2">
        {unlocked.map((v) => (
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
            <span className="text-[8px] text-[color:var(--color-muted)]">{v.layerType}</span>
          </button>
        ))}
      </div>
      {locked.length > 0 && (
        <div className="mt-2 text-[9px] text-[color:var(--color-muted)]">
          {locked.length} more locked - recover from archive
        </div>
      )}
    </div>
  )
}
