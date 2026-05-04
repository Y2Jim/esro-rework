"use client"

import { motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { rarityColor, rarityLabel } from "@/lib/rarity"

export function ProfileScreen() {
  const profile = useEsroStore((s) => s.profile)
  const profileTab = useEsroStore((s) => s.profileTab)
  const setProfileTab = useEsroStore((s) => s.setProfileTab)
  const setActiveTitle = useEsroStore((s) => s.setActiveTitle)
  const openNotification = useEsroStore((s) => s.openNotification)

  const unreadCount = profile.notifications.filter((n) => n.state === "unread").length

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-3 pb-3 pt-2 scrollbar-thin">
      {/* Header */}
      <header>
        <h2 className="text-sm font-semibold tracking-wide text-[color:var(--color-foreground)]">
          Profile
        </h2>
        <p className="text-[10px] text-[color:var(--color-muted)]">
          Identity, progression, and relay notices.
        </p>
      </header>

      {/* Tab row */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setProfileTab("summary")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors",
            profileTab === "summary"
              ? "border-[color:var(--color-violet-bright)] bg-[color:var(--color-violet-bright)]/15 text-[color:var(--color-violet-bright)]"
              : "border-[color:var(--color-border-soft)] text-[color:var(--color-muted)] hover:border-[color:var(--color-lilac)] hover:text-[color:var(--color-lilac)]"
          )}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => setProfileTab("notifications")}
          className={cn(
            "relative rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors",
            profileTab === "notifications"
              ? "border-[color:var(--color-violet-bright)] bg-[color:var(--color-violet-bright)]/15 text-[color:var(--color-violet-bright)]"
              : "border-[color:var(--color-border-soft)] text-[color:var(--color-muted)] hover:border-[color:var(--color-lilac)] hover:text-[color:var(--color-lilac)]"
          )}
        >
          Notices
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-violet-bright)]/25 px-1 text-[9px] text-[color:var(--color-violet-bright)]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {profileTab === "summary" ? (
        <SummaryTab
          profile={profile}
          setActiveTitle={setActiveTitle}
        />
      ) : (
        <NotificationsTab
          notifications={profile.notifications}
          openNotification={openNotification}
        />
      )}
    </div>
  )
}

function SummaryTab({
  profile,
  setActiveTitle,
}: {
  profile: ReturnType<typeof useEsroStore.getState>["profile"]
  setActiveTitle: (id: string) => void
}) {
  const xpPercent = Math.round((profile.xp / profile.xpToNext) * 100)
  const standingPercent = profile.faction
    ? Math.round((profile.faction.standing / profile.faction.maxStanding) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {/* Identity metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Handle" value={profile.handle} />
        <MetricCard
          label="Title"
          value={profile.title?.label || "Relay Initiate"}
          valueClass={profile.title ? rarityColor[profile.title.rarity] : undefined}
        />
        <MetricCard
          label="Faction"
          value={profile.faction?.label || "Unaligned"}
          subValue={profile.faction ? `Rank ${profile.faction.rank}` : undefined}
        />
        <MetricCard
          label="Level"
          value={String(profile.level)}
          subValue={`${profile.xp} / ${profile.xpToNext} XP`}
        />
      </div>

      {/* XP bar */}
      <div className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="text-[color:var(--color-muted)]">Experience</span>
          <span className="text-[color:var(--color-foreground)]">{xpPercent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border-soft)]">
          <motion.div
            className="h-full rounded-full bg-[color:var(--color-violet-bright)]"
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Faction standing */}
      {profile.faction && (
        <div className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)] p-3">
          <div className="mb-2 flex items-center justify-between text-[10px]">
            <span className="text-[color:var(--color-muted)]">
              {profile.faction.label} Standing
            </span>
            <span className="text-[color:var(--color-foreground)]">
              {profile.faction.standing} / {profile.faction.maxStanding}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border-soft)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--color-lilac)]"
              initial={{ width: 0 }}
              animate={{ width: `${standingPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Owned titles */}
      <section>
        <h3 className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Owned Titles
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {profile.ownedTitles.map((title) => (
            <div
              key={title.id}
              className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)] p-2.5"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className={cn("text-[11px] font-medium", rarityColor[title.rarity])}>
                  {title.label}
                </span>
                <button
                  type="button"
                  onClick={() => !title.equipped && setActiveTitle(title.id)}
                  disabled={title.equipped}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider transition-colors",
                    title.equipped
                      ? "border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/10 text-[color:var(--color-violet-bright)]"
                      : "border-[color:var(--color-border-soft)] text-[color:var(--color-muted)] hover:border-[color:var(--color-lilac)] hover:text-[color:var(--color-lilac)]"
                  )}
                >
                  {title.equipped ? "Active" : "Equip"}
                </button>
              </div>
              <span className="text-[9px] text-[color:var(--color-muted)]">
                {rarityLabel[title.rarity]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Badges */}
      <section>
        <h3 className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Badges
        </h3>
        {profile.badges.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-4 text-center text-[10px] text-[color:var(--color-muted)]">
            No badges unlocked yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)] p-2.5"
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[color:var(--color-foreground)]">
                    {badge.label}
                  </span>
                  <span className="rounded-full border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    Badge
                  </span>
                </div>
                <p className="text-[9px] leading-relaxed text-[color:var(--color-muted)]">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}

function NotificationsTab({
  notifications,
  openNotification,
}: {
  notifications: ReturnType<typeof useEsroStore.getState>["profile"]["notifications"]
  openNotification: (n: (typeof notifications)[number]) => void
}) {
  const unreadCount = notifications.filter((n) => n.state === "unread").length
  const recentCount = notifications.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Unread" value={String(unreadCount)} />
        <MetricCard label="Recent" value={String(recentCount)} />
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[color:var(--color-border-soft)] p-6 text-center text-[10px] text-[color:var(--color-muted)]">
          No relay notices yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                notification.state === "unread"
                  ? "border-[color:var(--color-violet-bright)]/40 bg-[color:var(--color-violet-bright)]/5"
                  : "border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)]"
              )}
            >
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    notification.state === "unread"
                      ? "text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-muted)]"
                  )}
                >
                  {notification.title}
                </span>
                {notification.deeplink && (
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="rounded-full border border-[color:var(--color-violet-bright)]/50 bg-[color:var(--color-violet-bright)]/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[color:var(--color-violet-bright)] transition-colors hover:bg-[color:var(--color-violet-bright)]/20"
                  >
                    Open
                  </button>
                )}
              </div>
              <p className="mb-2 text-[10px] leading-relaxed text-[color:var(--color-muted)]">
                {notification.body}
              </p>
              <div className="flex items-center gap-3 text-[9px] text-[color:var(--color-muted)]">
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 uppercase tracking-wider",
                    notification.priority === "high"
                      ? "border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]"
                      : notification.priority === "normal"
                      ? "border-[color:var(--color-cyan)]/30 text-[color:var(--color-cyan-muted)]"
                      : "border-[color:var(--color-border-soft)] text-[color:var(--color-muted)]"
                  )}
                >
                  {notification.priority}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 uppercase tracking-wider",
                    notification.state === "unread"
                      ? "border-[color:var(--color-lilac)]/30 text-[color:var(--color-lilac)]"
                      : "border-[color:var(--color-border-soft)]"
                  )}
                >
                  {notification.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function MetricCard({
  label,
  value,
  subValue,
  valueClass,
}: {
  label: string
  value: string
  subValue?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg-soft)] p-2.5">
      <div className="mb-1 text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div
        className={cn(
          "truncate text-[12px] font-medium",
          valueClass || "text-[color:var(--color-foreground)]"
        )}
      >
        {value}
      </div>
      {subValue && (
        <div className="mt-0.5 text-[9px] text-[color:var(--color-muted)]">{subValue}</div>
      )}
    </div>
  )
}
