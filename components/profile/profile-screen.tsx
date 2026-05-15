"use client"

import { useEsroStore } from "@/store/use-esro-store"

export function ProfileScreen() {
  const profile = useEsroStore((s) => s.profile)
  const identity = useEsroStore((s) => s.identity)

  if (!profile) return null

  const xpPercent = (profile.xp / profile.xpToNext) * 100

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(187, 129, 255, 0.4) transparent" }}>
      <div className="space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--color-accent)]/20 text-[16px] font-bold text-[color:var(--color-accent)]">
            {identity.handle[0].toUpperCase()}
          </div>
          <div>
            <div className="text-[14px] font-medium text-[color:var(--color-text)]">{identity.handle}</div>
            {identity.title && (
              <div className="text-[10px] text-[color:var(--color-accent)]">{identity.title}</div>
            )}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[14px] font-medium text-[color:var(--color-text)]">{profile.stats.expeditions}</div>
            <div className="text-[9px] text-[color:var(--color-muted)]">Expeditions</div>
          </div>
          <div>
            <div className="text-[14px] font-medium text-[color:var(--color-text)]">{profile.stats.contracts}</div>
            <div className="text-[9px] text-[color:var(--color-muted)]">Contracts</div>
          </div>
          <div>
            <div className="text-[14px] font-medium text-[color:var(--color-text)]">{profile.stats.recovered}</div>
            <div className="text-[9px] text-[color:var(--color-muted)]">Recovered</div>
          </div>
        </div>

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
