"use client"

import { motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel"
import { MetricCard, MetricGrid } from "@/components/ui/metric-card"
import { ListCard, ListCardTitle, ListCardMeta, ListGrid } from "@/components/ui/list-card"
import { cn } from "@/lib/cn"

const rarityColor: Record<string, string> = {
  common: "text-[color:var(--color-muted)]",
  uncommon: "text-[color:var(--color-success)]",
  rare: "text-[color:var(--color-accent)]",
  epic: "text-[color:var(--color-accent-strong)]",
  legendary: "prismatic-text",
}

export function ProfileScreen() {
  const profile = useEsroStore((s) => s.profile)
  const profileTab = useEsroStore((s) => s.profileTab)
  const setProfileTab = useEsroStore((s) => s.setProfileTab)
  const setActiveTitle = useEsroStore((s) => s.setActiveTitle)
  const openNotification = useEsroStore((s) => s.openNotification)

  const unreadCount = profile.notifications.filter((n) => n.state === "unread").length

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {/* Tab row */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setProfileTab("summary")}
          className={cn(
            "esro-button text-[10px]",
            profileTab === "summary" && "esro-button-active"
          )}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => setProfileTab("notifications")}
          className={cn(
            "esro-button flex items-center gap-1.5 text-[10px]",
            profileTab === "notifications" && "esro-button-active"
          )}
        >
          Notices
          {unreadCount > 0 && (
            <span className="esro-badge text-[8px]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {profileTab === "summary" ? (
        <SummaryTab profile={profile} setActiveTitle={setActiveTitle} />
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
      className="flex flex-col gap-2"
    >
      {/* Identity metrics */}
      <Panel>
        <PanelHeader title="Identity" />
        <PanelBody>
          <MetricGrid>
            <MetricCard label="Handle" value={profile.handle} />
            <MetricCard
              label="Title"
              value={profile.title?.label || "None"}
              valueClass={profile.title ? rarityColor[profile.title.rarity] : undefined}
            />
            <MetricCard label="Level" value={String(profile.level)} />
            <MetricCard label="XP" value={`${profile.xp}/${profile.xpToNext}`} />
          </MetricGrid>

          {/* XP bar */}
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-panel-soft)]">
              <motion.div
                className="h-full bg-[color:var(--color-accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </PanelBody>
      </Panel>

      {/* Faction */}
      {profile.faction && (
        <Panel>
          <PanelHeader title={profile.faction.label} />
          <PanelBody>
            <MetricGrid>
              <MetricCard label="Rank" value={String(profile.faction.rank)} />
              <MetricCard
                label="Standing"
                value={`${profile.faction.standing}/${profile.faction.maxStanding}`}
              />
            </MetricGrid>
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-panel-soft)]">
                <motion.div
                  className="h-full bg-[color:var(--color-accent-strong)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${standingPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Owned Titles */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Titles" />
        <PanelBody scroll>
          <ListGrid columns={2}>
            {profile.ownedTitles.map((title) => (
              <ListCard
                key={title.id}
                focused={title.equipped}
                onClick={() => !title.equipped && setActiveTitle(title.id)}
              >
                <ListCardTitle>
                  <span className={rarityColor[title.rarity]}>{title.label}</span>
                  {title.equipped && (
                    <span className="esro-chip text-[8px]">Equipped</span>
                  )}
                </ListCardTitle>
                <ListCardMeta>
                  <span className="capitalize">{title.rarity}</span>
                  {!title.equipped && <span>Tap to equip</span>}
                </ListCardMeta>
              </ListCard>
            ))}
          </ListGrid>
        </PanelBody>
      </Panel>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <Panel>
          <PanelHeader title="Badges" />
          <PanelBody>
            <ListGrid columns={2}>
              {profile.badges.map((badge) => (
                <ListCard key={badge.id}>
                  <ListCardTitle>{badge.label}</ListCardTitle>
                  <ListCardMeta>
                    <span className="text-[9px]">{badge.description}</span>
                  </ListCardMeta>
                </ListCard>
              ))}
            </ListGrid>
          </PanelBody>
        </Panel>
      )}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      {/* Summary */}
      <Panel>
        <PanelBody>
          <MetricGrid>
            <MetricCard label="Unread" value={String(unreadCount)} />
            <MetricCard label="Total" value={String(notifications.length)} />
          </MetricGrid>
        </PanelBody>
      </Panel>

      {/* List */}
      <Panel className="min-h-0 flex-1">
        <PanelHeader title="Notices" />
        <PanelBody scroll>
          {notifications.length === 0 ? (
            <div className="esro-empty">No notices</div>
          ) : (
            <ListGrid>
              {notifications.map((notification) => (
                <ListCard
                  key={notification.id}
                  focused={notification.state === "unread"}
                  onClick={notification.deeplink ? () => openNotification(notification) : undefined}
                >
                  <ListCardTitle>
                    {notification.title}
                    <span
                      className={cn(
                        "esro-chip text-[8px]",
                        notification.priority === "high" && "text-[color:var(--color-danger)]"
                      )}
                    >
                      {notification.priority}
                    </span>
                  </ListCardTitle>
                  <ListCardMeta>
                    <span className="text-[9px] leading-relaxed">
                      {notification.body}
                    </span>
                  </ListCardMeta>
                </ListCard>
              ))}
            </ListGrid>
          )}
        </PanelBody>
      </Panel>
    </motion.div>
  )
}
