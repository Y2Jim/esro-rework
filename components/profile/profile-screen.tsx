"use client"

import { useState, useMemo } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { rarityColor, rarityAnimation, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { TitleDisplay, TitleBadgeRow } from "@/components/ui/title-display"
import { StatAllocation } from "@/components/profile/stat-allocation"
import { KnownRituals } from "@/components/profile/known-rituals"
import { BestiaryTab } from "@/components/profile/bestiary-tab"
import { TrophyCase } from "@/components/profile/trophy-case"

import { FACTIONS, STAT_LABELS, STAT_COLORS } from "@/lib/game-data"
import { getCreature, packContribution, creatureSprite } from "@/lib/bestiary"
import { Shield } from "lucide-react"
import type { BaseStats } from "@/lib/types"
import { ROLLABLE_THEMES } from "@/lib/rollable-themes"
import type { RaceId, Rarity, VanityItem } from "@/lib/types"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/**
 * Formats a creation timestamp as e.g. "9 Mar 2026".
 *
 * Deliberately hand-rolled instead of using toLocaleDateString: the locale
 * formatter resolves differently on the server than in the browser, which turns
 * this into a hydration mismatch on first paint.
 */
function formatCreatedAt(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

type ProfileTab = "summary" | "titles" | "bestiary" | "cosmetics" | "settings" | "notifications"

const profileTabs: { id: ProfileTab; label: string; icon: string; color: string; bgColor: string; hover: string }[] = [
  { id: "summary", label: "Summary", icon: "◉", color: "text-[color:var(--color-lilac)]", bgColor: "bg-[color:var(--color-lilac)]/15", hover: "hover-lilac" },
  { id: "titles", label: "Titles", icon: "◇", color: "text-[color:var(--color-amber)]", bgColor: "bg-[color:var(--color-amber)]/15", hover: "hover-amber" },
  { id: "bestiary", label: "Bestiary", icon: "❖", color: "text-[color:var(--color-green)]", bgColor: "bg-[color:var(--color-green)]/15", hover: "hover-green" },
  { id: "cosmetics", label: "Cosmetics", icon: "✦", color: "text-[color:var(--color-violet-bright)]", bgColor: "bg-[color:var(--color-violet-bright)]/15", hover: "hover-violet" },
  { id: "settings", label: "Settings", icon: "⚙", color: "text-[color:var(--color-cyan)]", bgColor: "bg-[color:var(--color-cyan)]/15", hover: "hover-cyan" },
  { id: "notifications", label: "Alerts", icon: "◈", color: "text-[color:var(--color-danger)]", bgColor: "bg-[color:var(--color-danger)]/15", hover: "hover-danger" },
]

export function ProfileScreen() {
  const [tab, setTab] = useState<ProfileTab>("summary")
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  // The Bestiary is the taming payoff, so it stays hidden until "Pack Beasts".
  const canTame = useEsroStore((s) => s.hasSkillUnlock("pack_beasts"))

  if (!profile) return null

  const unreadCount = profile.notifications?.filter(n => n.state === "unread").length || 0

  // Drop the Bestiary tab until taming is unlocked. If the player was viewing it
  // and lost the unlock, fall back to Summary so no hidden tab renders.
  const visibleProfileTabs = profileTabs.filter((t) => t.id !== "bestiary" || canTame)
  const effectiveTab = tab === "bestiary" && !canTame ? "summary" : tab

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div 
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] px-2 py-1.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}
      >
        {visibleProfileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[14px] uppercase tracking-wider transition-colors",
              t.hover,
              effectiveTab === t.id
                ? cn(t.bgColor, t.color)
                : "text-[color:var(--color-muted)]"
            )}
          >
            <span className="text-[14px]">{t.icon}</span>
            {t.label}
            {t.id === "notifications" && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[color:var(--color-danger)] text-[13px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
        {effectiveTab === "summary" && <SummaryTab />}
        {effectiveTab === "titles" && <TitlesTab />}
        {effectiveTab === "bestiary" && canTame && <BestiaryTab />}
        {effectiveTab === "cosmetics" && <CosmeticsTab />}
        {effectiveTab === "settings" && <SettingsTab />}
        {effectiveTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  )
}

function ActiveMountCard() {
  const profile = useEsroStore((s) => s.profile)
  const setActiveMount = useEsroStore((s) => s.setActiveMount)

  const tamed = profile.tamedBeasts ?? []
  // Nothing tamed yet: keep the profile clean rather than showing an empty shell.
  if (tamed.length === 0) return null

  const mount = getCreature(profile.activeMount ?? "")
  const carry = mount ? packContribution(mount).carry : 0

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Active Mount
        </span>
        {mount && (
          <span className="text-[13px] text-[color:var(--color-green)]">+{carry} carry</span>
        )}
      </div>
      {mount ? (
        <div className="flex items-center gap-3">
          <img
            src={creatureSprite(mount.id) || "/placeholder.svg"}
            alt={mount.name}
            className="h-10 w-10 shrink-0"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-medium text-[color:var(--color-text)]">
              {mount.name}
            </div>
            <div className="truncate text-[13px] text-[color:var(--color-muted)]">
              {mount.habitat}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveMount(null)}
            className="shrink-0 rounded border border-[color:var(--color-border)] px-2 py-1 text-[13px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
          >
            Dismount
          </button>
        </div>
      ) : (
        <div className="text-[14px] text-[color:var(--color-muted)]">
          Travelling unmounted —{" "}
          <span className="text-[color:var(--color-muted-2)]">
            equip a beast from the Bestiary tab.
          </span>
        </div>
      )}
    </div>
  )
}

function SummaryTab() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const characterRace = useEsroStore((s) => s.characterRace)
  const characterCourier = useEsroStore((s) => s.characterCourier)
  const getPlayerStats = useEsroStore((s) => s.getPlayerStats)

  const xpPercent = (profile.xp / profile.xpToNext) * 100
  const playerStats = getPlayerStats()

  return (
    <div className="space-y-4">
      {/* Identity with Avatar and Faction Badge */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <PixelAvatar config={identity.avatar} size="lg" />
          {/* Faction Badge Overlay */}
          {characterFaction && (
            <div 
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[14px] font-bold shadow-lg"
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
          <div className="text-[16px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
          {profile.title && (
            <TitleDisplay 
              title={profile.title.label} 
              rarity={profile.title.rarity} 
              className="text-[15px]" 
            />
          )}
          {/* Race/Courier info */}
          {(characterRace || characterCourier) && (
            <div className="mt-0.5 flex items-center gap-1 text-[13px] text-[color:var(--color-muted)]">
              {characterRace && <span style={{ color: characterRace.color }}>{characterRace.name}</span>}
              {characterRace && characterCourier && <span>/</span>}
              {characterCourier && <span style={{ color: characterCourier.color }}>{characterCourier.name}</span>}
            </div>
          )}
          <div className="mt-1 text-[13px] text-[color:var(--color-muted)]">
            {identity.established ? "Established identity" : "New arrival"}
          </div>
          {/* Own line rather than an inline separator: the profile renders in a
              narrow phone frame, where a "·" delimiter wraps and strands the dot
              at the end of the previous line. */}
          {profile.createdAt !== null && (
            <div className="text-[13px] text-[color:var(--color-muted)]">
              Courier since{" "}
              <time dateTime={new Date(profile.createdAt).toISOString()}>
                {formatCreatedAt(profile.createdAt)}
              </time>
            </div>
          )}
        </div>
      </div>

      {/* Level + XP */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] text-[color:var(--color-muted)]">Level {profile.level}</span>
          <span className="text-[14px] text-[color:var(--color-muted)]">{profile.xp}/{profile.xpToNext} XP</span>
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
                className="text-[14px] font-bold"
                style={{ color: characterFaction.color }}
              >
                {characterFaction.name}
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)] italic">
                &quot;{characterFaction.motto}&quot;
              </div>
              {profile.faction && (
                <div className="mt-1 text-[13px] text-[color:var(--color-muted)]">
                  Rank {profile.faction.rank} - {profile.faction.standing}/{profile.faction.maxStanding} standing
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-3 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No faction allegiance</div>
          <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">
            Reach Level 5 to join a faction
          </div>
        </div>
      )}

      {/* Character Stats — HP shown here since it cannot be spent into. */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Character Stats
        </div>
        <div className="grid grid-cols-5 gap-1">
          {(Object.keys(playerStats) as (keyof BaseStats)[]).map((stat) => (
            <div 
              key={stat} 
              className="flex flex-col items-center rounded bg-[color:var(--color-panel)]/50 p-2"
            >
              <div 
                className="text-[16px] font-bold"
                style={{ color: STAT_COLORS[stat] }}
              >
                {playerStats[stat]}
              </div>
              <div 
                className="text-[12px] font-medium uppercase"
                style={{ color: `${STAT_COLORS[stat]}99` }}
              >
                {STAT_LABELS[stat]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active mount — mirrors the pack selector in the Bestiary tab so the
          equipped beast and its carry bonus are visible at a glance here too. */}
      <ActiveMountCard />

      {/* Level-up point spending + the sub-stats those points feed. */}
      <StatAllocation />

      {/* Known rituals (Focus) */}
      <KnownRituals />

      {/* Personal bests, derived from the fishing log, route records and bestiary. */}
      <TrophyCase />

      {/* Collection summary */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="text-center">
          <div className="text-[16px] font-medium text-[color:var(--color-text)]">
            {profile.ownedTitles?.length || 0}
          </div>
          <div className="text-[13px] text-[color:var(--color-muted)]">Titles</div>
        </div>
        <div className="text-center">
          <div className="text-[16px] font-medium text-[color:var(--color-text)]">
            {profile.vanityItems?.filter(v => v.unlocked).length || 0}
          </div>
          <div className="text-[13px] text-[color:var(--color-muted)]">Cosmetics</div>
        </div>
        <div className="text-center">
          <div className="text-[16px] font-medium text-[color:var(--color-text)]">
            {profile.badges?.length || 0}
          </div>
          <div className="text-[13px] text-[color:var(--color-muted)]">Badges</div>
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
    const order = ["admin", "mythic", "legendary", "epic", "rare", "uncommon", "common"]
    return order.indexOf(a.rarity) - order.indexOf(b.rarity)
  })

  return (
    <div className="space-y-3">
      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Owned Titles ({ownedTitles.length})
      </div>

      {ownedTitles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No titles unlocked yet</div>
          <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">
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
        <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          How to unlock titles
        </div>
        <ul className="mt-2 space-y-1 text-[14px] text-[color:var(--color-muted)]">
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

  const layerOrder = ["hair", "eyes", "accessory", "hat", "flair"]

  // Get current avatar layer variants for hair/eyes
  const currentHairVariant = identity.avatar.layers.find(l => l.type === "hair")?.variant ?? 0
  const currentEyesVariant = identity.avatar.layers.find(l => l.type === "eyes")?.variant ?? 0

  // Determine if a vanity item is "active" (either equipped flag or matching current avatar variant for hair/eyes)
  const isItemActive = (item: VanityItem): boolean => {
    if (item.layerType === "hair") {
      return item.variant === currentHairVariant
    }
    if (item.layerType === "eyes") {
      return item.variant === currentEyesVariant
    }
    return item.equipped
  }

  // Get currently equipped items
  const equipped = vanityItems.filter(v => isItemActive(v))

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex flex-col items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 p-4">
        <PixelAvatar config={identity.avatar} size="lg" />
        <div className="mt-2 text-[15px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
        {equipped.length > 0 ? (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {equipped.map(e => (
              <span key={e.id} className={cn("rounded px-1.5 py-0.5 text-[12px]", rarityColor[e.rarity])}>
                {e.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[13px] text-[color:var(--color-muted)]">No cosmetics equipped</div>
        )}
      </div>

      <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
        Cosmetics ({unlocked.length} unlocked)
      </div>

      {unlocked.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No cosmetics unlocked yet</div>
          <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">
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
                  <span className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {layerType}
                  </span>
                  <div className="h-px flex-1 bg-[color:var(--color-border-soft)]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((v) => {
                    const isActive = isItemActive(v)
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => isActive ? unequipVanity(v.layerType) : equipVanity(v.id)}
                        className={cn(
                          "flex flex-col items-start rounded-lg border p-2 text-left transition-all",
                          isActive
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10"
                            : "border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50"
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className={cn("text-[14px]", rarityColor[v.rarity])}>{v.label}</span>
                          {isActive && (
                            <span className="text-[12px] uppercase text-[color:var(--color-accent)]">active</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {locked.length > 0 && (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3 text-center">
          <div className="text-[14px] text-[color:var(--color-muted)]">
            {locked.length} cosmetics locked
          </div>
          <div className="text-[13px] text-[color:var(--color-muted-2)]">
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
  const unlockedThemes = useEsroStore((s) => s.unlockedThemes)

  // Build available theme options: default + faction (if selected) + unlocked rollable themes
  const baseThemes: { id: string; label: string; color: string; rarity?: Rarity }[] = [
    { id: "default", label: "Default (Violet)", color: "#a45dff" },
  ]
  
  // Add faction theme if player has chosen a faction
  if (characterFaction) {
    baseThemes.push({
      id: characterFaction.id,
      label: `${characterFaction.name} Theme`,
      color: characterFaction.color,
    })
  }

  // Add unlocked rollable themes
  const unlockedRollableThemes = ROLLABLE_THEMES.filter(t => unlockedThemes.includes(t.id))

  return (
    <div className="space-y-4">
      {/* UI Theme - Base Themes */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="mb-3 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          UI Theme
        </div>
        <div className="space-y-2">
          {baseThemes.map((theme) => (
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
              <span className="flex-1 text-[15px] text-[color:var(--color-text)]">
                {theme.label}
              </span>
              {uiTheme === theme.id && (
                <span className="text-[12px] uppercase text-[color:var(--color-accent)]">active</span>
              )}
            </button>
          ))}
        </div>
        {!characterFaction && (
          <p className="mt-3 text-[13px] text-[color:var(--color-muted)]">
            Join a faction to unlock its unique color scheme.
          </p>
        )}
      </div>
      
      {/* Rollable Themes Section */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Collected Themes
          </span>
          <span className="text-[13px] text-[color:var(--color-muted)]">
            {unlockedRollableThemes.length}/{ROLLABLE_THEMES.length}
          </span>
        </div>
        
        {unlockedRollableThemes.length === 0 ? (
          <div className="rounded border border-dashed border-[color:var(--color-border-soft)] p-3 text-center">
            <div className="text-[14px] text-[color:var(--color-muted)]">No themes collected yet</div>
            <div className="mt-1 text-[13px] text-[color:var(--color-muted-2)]">
              Themes can be found through expeditions and archive fragments
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {unlockedRollableThemes.map((theme) => {
              const hasEffects = theme.effectClass || theme.borderStyle
              const intensityLabel = theme.intensity >= 2.0 ? "Maximum" : 
                theme.intensity >= 1.8 ? "High" : 
                theme.intensity >= 1.6 ? "Enhanced" : 
                theme.intensity >= 1.4 ? "Moderate" : 
                theme.intensity > 1.0 ? "Slight" : "Standard"
              
              return (
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
                  {/* Color swatch with intensity-based glow */}
                  <div 
                    className="h-5 w-5 rounded-full shrink-0"
                    style={{ 
                      backgroundColor: theme.colors.accent, 
                      boxShadow: `0 0 ${4 * theme.intensity}px ${theme.colors.accent}, 0 0 ${8 * theme.intensity}px ${theme.colors.accent}50`,
                      border: theme.colors.secondary ? `1px solid ${theme.colors.secondary}` : undefined
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    {/* Category badge */}
                    <div className="mb-1">
                      <span className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-[12px] font-mono uppercase tracking-wider",
                        theme.rarity === "mythic" ? "bg-[#f0e0a0]/20 text-[#f0e0a0] border border-[#f0e0a0]/30" :
                        theme.rarity === "legendary" ? "bg-[#00d0ff]/20 text-[#00d0ff] border border-[#00d0ff]/30" :
                        theme.rarity === "epic" ? "bg-[#a060ff]/20 text-[#a060ff] border border-[#a060ff]/30" :
                        theme.rarity === "rare" ? "bg-[#c06030]/20 text-[#c06030] border border-[#c06030]/30" :
                        theme.rarity === "uncommon" ? "bg-[#60b060]/20 text-[#60b060] border border-[#60b060]/30" :
                        "bg-[#9aaa9a]/20 text-[#9aaa9a] border border-[#9aaa9a]/30"
                      )}>
                        {rarityLabel[theme.rarity] || theme.rarity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[15px] font-medium", rarityColor[theme.rarity])}>
                        {theme.label}
                      </span>
                    </div>
                    <div className="text-[13px] text-[color:var(--color-muted)] leading-relaxed">
                      {theme.description}
                    </div>
                    {/* Effects indicators for higher rarity themes */}
                    {(hasEffects || theme.intensity > 1.0) && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="text-[12px] px-1 py-0.5 rounded bg-[color:var(--color-panel)] text-[color:var(--color-muted)]">
                          {intensityLabel} Glow
                        </span>
                        {theme.effectClass && (
                          <span className={cn(
                            "text-[12px] px-1 py-0.5 rounded",
                            theme.effectClass === "theme-effect-radiant" ? "bg-[color:var(--color-rarity-mythic)]/20 text-[color:var(--color-rarity-mythic)]" :
                            theme.effectClass === "theme-effect-glow" ? "bg-[color:var(--color-rarity-legendary)]/20 text-[color:var(--color-rarity-legendary)]" :
                            "bg-[color:var(--color-rarity-epic)]/20 text-[color:var(--color-rarity-epic)]"
                          )}>
                            {theme.effectClass === "theme-effect-radiant" ? "Radiant Aura" :
                             theme.effectClass === "theme-effect-glow" ? "Plasma Glow" :
                             theme.effectClass === "theme-effect-shimmer" ? "Shimmer" : "Pulse"}
                          </span>
                        )}
                        {theme.borderStyle && theme.borderStyle !== "solid" && (
                          <span className="text-[12px] px-1 py-0.5 rounded bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
                            {theme.borderStyle === "shimmer" ? "Ethereal Borders" : "Glowing Borders"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {uiTheme === theme.id && (
                    <span className="text-[12px] uppercase text-[color:var(--color-accent)] shrink-0">active</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Current Faction */}
      {characterFaction && (
        <div className="rounded-lg border border-[color:var(--color-border)] p-3">
          <div className="mb-2 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
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
              <div className="text-[14px] font-medium" style={{ color: characterFaction.color }}>
                {characterFaction.name}
              </div>
              <div className="text-[13px] text-[color:var(--color-muted)] italic">
                {characterFaction.motto}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Settings Placeholder */}
      <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-3">
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          More Settings
        </div>
        <ul className="mt-2 space-y-1 text-[13px] text-[color:var(--color-muted)]">
          <li>- Sound preferences (coming soon)</li>
          <li>- Notification settings (coming soon)</li>
          <li>- Privacy options (coming soon)</li>
        </ul>
      </div>

      {/* Admin Panel Access */}
      <AdminPanelButton />
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
        <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Notifications ({notifications.filter(n => n.state === "unread").length} unread)
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={clearAllNotifications}
            className="text-[13px] text-[color:var(--color-danger)] transition-colors hover:text-[color:var(--color-danger-bright)]"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border)] p-4 text-center">
          <div className="text-[15px] text-[color:var(--color-muted)]">No notifications</div>
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
                <div className="text-[15px] text-[color:var(--color-text)]">{n.title}</div>
                <div className="text-[14px] text-[color:var(--color-muted)]">{n.body}</div>
                {n.deeplink && (
                  <div className="mt-1 text-[13px] text-[color:var(--color-accent)]">
                    Tap to view
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => clearNotification(n.id)}
                className="shrink-0 p-1 text-[14px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-danger)]"
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

// All available titles for preview - matches unlockAllTitles in store
const ALL_TITLES: { id: string; label: string; rarity: Rarity }[] = [
  // Common
  { id: "route_tender", label: "Route Tender", rarity: "common" },
  { id: "faded_echo", label: "Faded Echo", rarity: "common" },
  // Uncommon
  { id: "signal_keeper", label: "Signal Keeper", rarity: "uncommon" },
  { id: "route_finder", label: "Route Finder", rarity: "uncommon" },
  // Rare
  { id: "archive_listener", label: "Archive Listener", rarity: "rare" },
  { id: "waystone_keeper", label: "Waystone Keeper", rarity: "rare" },
  { id: "drift_walker", label: "Drift Walker", rarity: "rare" },
  // Epic
  { id: "relay_warden", label: "Relay Warden", rarity: "epic" },
  { id: "depth_touched", label: "Depth Touched", rarity: "epic" },
  { id: "void_speaker", label: "Void Speaker", rarity: "epic" },
  // Legendary
  { id: "deep_pull_regent", label: "Deep Pull Regent", rarity: "legendary" },
  { id: "primordial_echo", label: "Primordial Echo", rarity: "legendary" },
  { id: "the_returned", label: "The Returned", rarity: "legendary" },
  { id: "gloam_signal_regent", label: "Gloam Signal Regent", rarity: "legendary" },
  // Mythic (Transcendent) - each has unique animation
  { id: "myth_relay_sea", label: "Myth of the Relay Sea", rarity: "mythic" },
  { id: "shardheart_ascendant", label: "Shardheart Ascendant", rarity: "mythic" },
  { id: "eternal_courier", label: "Eternal Courier", rarity: "mythic" },
  { id: "voidtouched_oracle", label: "Voidtouched Oracle", rarity: "mythic" },
  { id: "primordial_flame", label: "Primordial Flame", rarity: "mythic" },
  { id: "silence_between_stars", label: "Astral Wayfarer", rarity: "mythic" },
  { id: "dreamer_unchained", label: "Dreamer Unchained", rarity: "mythic" },
  { id: "ashen_sovereign", label: "Ashen Sovereign", rarity: "mythic" },
  // Admin - exclusive red title
  { id: "system_overseer", label: "System Overseer", rarity: "admin" },
]

function TitlePreviewSelector() {
  const [previewIndex, setPreviewIndex] = useState(0)
  const setActiveTitle = useEsroStore((s) => s.setActiveTitle)
  const profile = useEsroStore((s) => s.profile)
  const unlockAllTitles = useEsroStore((s) => s.unlockAllTitles)
  
  const currentTitle = ALL_TITLES[previewIndex]
  const isEquipped = profile.title?.label === currentTitle.label
  
  const handleEquip = () => {
    // Make sure titles are unlocked first
    unlockAllTitles()
    // Find the title by label in owned titles and equip it
    const ownedTitle = profile.ownedTitles.find(t => t.label === currentTitle.label)
    if (ownedTitle) {
      setActiveTitle(ownedTitle.id)
    }
  }
  
  return (
    <div className="space-y-2">
      {/* Title display */}
      <div className="rounded bg-[color:var(--color-panel)]/50 p-3 text-center">
        <div className="mb-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
          {rarityLabel[currentTitle.rarity] || currentTitle.rarity}
        </div>
        <TitleDisplay 
          title={currentTitle.label} 
          rarity={currentTitle.rarity} 
          variant="inline"
          className="text-[16px] font-medium"
        />
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : ALL_TITLES.length - 1))}
          className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[14px] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/20"
        >
          Prev
        </button>
        <span className="flex-1 text-center text-[13px] text-[color:var(--color-muted)]">
          {previewIndex + 1} / {ALL_TITLES.length}
        </span>
        <button
          type="button"
          onClick={() => setPreviewIndex((prev) => (prev < ALL_TITLES.length - 1 ? prev + 1 : 0))}
          className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1 text-[14px] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)]/20"
        >
          Next
        </button>
      </div>
      
      {/* Equip button */}
      <button
        type="button"
        onClick={handleEquip}
        disabled={isEquipped}
        className={cn(
          "w-full rounded border px-3 py-1.5 text-[14px] transition-colors",
          isEquipped
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/20"
        )}
      >
        {isEquipped ? "Equipped" : "Equip This Title"}
      </button>
    </div>
  )
}

function AdminPanelButton() {
  const setScreen = useEsroStore((s) => s.setScreen)
  const isAdmin = useEsroStore((s) => s.isAdmin)
  const setAdminMode = useEsroStore((s) => s.setAdminMode)

  const handleOpenAdmin = () => {
    setAdminMode(true)
    setScreen("admin")
  }

  return (
    <div className="rounded-lg border border-[#ff6b4a]/30 bg-[#ff6b4a]/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-3.5 w-3.5 text-[#ff6b4a]" />
        <span className="text-[14px] uppercase tracking-wider text-[#ff6b4a]">
          Admin Panel
        </span>
      </div>
      <p className="mb-3 text-[13px] text-[color:var(--color-muted)]">
        Access administrative tools for managing events, contracts, players, and system settings.
      </p>
      <button
        type="button"
        onClick={handleOpenAdmin}
        className="w-full rounded border border-[#ff6b4a]/50 bg-[#ff6b4a]/10 px-3 py-2 text-[14px] font-medium uppercase tracking-wider text-[#ff6b4a] transition-colors hover:bg-[#ff6b4a]/20"
      >
        Open Admin Panel
      </button>
      {isAdmin && (
        <p className="mt-2 text-center text-[12px] text-[#ff6b4a]">Admin mode active</p>
      )}
    </div>
  )
}

// Legacy admin button - kept for reference but replaced by AdminPanelButton
function AdminUnlockButton() {
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
  
  const [unlocked, setUnlocked] = useState<{ cosmetics: boolean; titles: boolean; materials: boolean; chat: boolean; themes: boolean }>({
    cosmetics: false,
    titles: false,
    materials: false,
    chat: false,
    themes: false,
  })
  
  const [previewFlair, setPreviewFlair] = useState(0)
  const flairNames = [
    "None", "Pulse Glow", "Static Aura", "Sparkle", "Soft Glow", "Dust Motes", 
    "Signal Flicker", "Route Trails", "Echo Ripples", "Data Stream", "Void Shimmer", 
    "Prismatic Aura", "Celestial Flame",
    // Mythic flairs (13-17)
    "Relay Sea Aura", "Shardheart Radiance", "Eternal Courier's Light", "Voidtouched Presence", "Primordial Resonance"
  ]
  const isMythicFlair = previewFlair >= 13
  
  // Create preview avatar with current flair
  const previewAvatar = useMemo(() => ({
    ...identity.avatar,
    layers: identity.avatar.layers.map(l => 
      l.type === "flair" ? { ...l, variant: previewFlair } : l
    )
  }), [identity.avatar, previewFlair])

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
          "w-full rounded border px-3 py-2 text-[14px] transition-colors",
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
          "w-full rounded border px-3 py-2 text-[14px] transition-colors",
          unlocked.titles
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20"
        )}
      >
        {unlocked.titles ? "All Titles Unlocked" : "Unlock All Titles"}
      </button>
      <button
        type="button"
        onClick={() => {
          ROLLABLE_THEMES.forEach(t => unlockTheme(t.id))
          setUnlocked((prev) => ({ ...prev, themes: true }))
        }}
        disabled={unlocked.themes}
        className={cn(
          "w-full rounded border px-3 py-2 text-[14px] transition-colors",
          unlocked.themes
            ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
            : "border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 text-[color:var(--color-cyan)] hover:bg-[color:var(--color-cyan)]/20"
        )}
      >
        {unlocked.themes ? "All UI Themes Unlocked" : "Unlock All UI Themes"}
      </button>
      
      {/* Title preview and equip */}
      <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
        <div className="mb-1.5 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Title Preview &amp; Equip
        </div>
        <TitlePreviewSelector />
      </div>
      
      {/* Flair preview */}
      <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
        <div className="mb-1.5 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
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
                <span className="rounded bg-[color:var(--color-mythic)]/20 px-1 py-0.5 text-[12px] text-[color:var(--color-mythic)]">
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
      
      {/* Chat title testing */}
      <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
        <div className="mb-1.5 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Chat Testing
        </div>
        <button
          type="button"
          onClick={() => {
            injectTestChatMessages()
            setUnlocked((prev) => ({ ...prev, chat: true }))
            setScreen("terminal")
          }}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.chat
              ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
              : "border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/10 text-[color:var(--color-violet-bright)] hover:bg-[color:var(--color-violet-bright)]/20"
          )}
        >
          {unlocked.chat ? "Test Messages Sent" : "Inject Title Test Messages"}
        </button>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Adds messages with all rarity titles to PUBLIC channel
        </p>
      </div>
      
      {/* Crafting materials */}
      <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
        <div className="mb-1.5 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Crafting Testing
        </div>
        <button
          type="button"
          onClick={() => {
            addMaterials()
            setUnlocked((prev) => ({ ...prev, materials: true }))
          }}
          disabled={unlocked.materials}
          className={cn(
            "w-full rounded border px-3 py-2 text-[14px] transition-colors",
            unlocked.materials
              ? "border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 text-[color:var(--color-green)]"
              : "border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] hover:bg-[color:var(--color-amber)]/20"
          )}
        >
          {unlocked.materials ? "Materials Added" : "Add Crafting Materials"}
        </button>
      </div>
      
      {/* Expedition simulation */}
      <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
        <div className="mb-1.5 text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Expedition Testing
        </div>
        {!activeExpedition ? (
          <button
            type="button"
            onClick={() => simulateExpedition()}
            className="w-full rounded border border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/10 px-3 py-2 text-[14px] text-[color:var(--color-cyan)] transition-colors hover:bg-[color:var(--color-cyan)]/20"
          >
            Start Test Expedition
          </button>
        ) : (
          <div className="space-y-2">
            <div className="rounded bg-[color:var(--color-cyan)]/10 px-2 py-1.5 text-[13px] text-[color:var(--color-cyan)]">
              Active: {activeExpedition.label} ({Math.round(activeExpedition.progress * 100)}%)
            </div>
            <button
              type="button"
              onClick={() => completeActiveExpedition(1)}
              className="w-full rounded border border-[color:var(--color-green)]/50 bg-[color:var(--color-green)]/10 px-3 py-2 text-[14px] text-[color:var(--color-green)] transition-colors hover:bg-[color:var(--color-green)]/20"
            >
              Complete Expedition (Get Loot)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
