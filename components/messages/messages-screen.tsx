"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { TitleDisplay } from "@/components/ui/title-display"
import type { DirectMessage, Friend } from "@/lib/types"
import { cn } from "@/lib/cn"

/** Compact relative timestamp for inbox rows and message meta. */
function relTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return "now"
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  return `${day}d`
}

interface Thread {
  handle: string
  friend?: Friend
  messages: DirectMessage[]
  last: DirectMessage
  unread: number
}

export function MessagesScreen() {
  const directMessages = useEsroStore((s) => s.directMessages)
  const friends = useEsroStore((s) => s.friends)
  const active = useEsroStore((s) => s.activeConversation)
  const setActive = useEsroStore((s) => s.setActiveConversation)
  const send = useEsroStore((s) => s.sendDirectMessage)
  const viewPlayer = useEsroStore((s) => s.viewPlayer)

  // Group messages into per-handle threads, newest activity first.
  const threads = useMemo<Thread[]>(() => {
    const byHandle = new Map<string, DirectMessage[]>()
    for (const m of directMessages) {
      const arr = byHandle.get(m.withHandle) ?? []
      arr.push(m)
      byHandle.set(m.withHandle, arr)
    }
    const out: Thread[] = []
    for (const [handle, msgs] of byHandle) {
      const sorted = [...msgs].sort((a, b) => a.at - b.at)
      out.push({
        handle,
        friend: friends.find((f) => f.handle === handle),
        messages: sorted,
        last: sorted[sorted.length - 1],
        unread: sorted.filter((m) => m.direction === "in" && !m.read).length,
      })
    }
    return out.sort((a, b) => b.last.at - a.last.at)
  }, [directMessages, friends])

  const activeThread = active ? threads.find((t) => t.handle === active) ?? null : null

  if (activeThread) {
    return (
      <ConversationView
        thread={activeThread}
        onBack={() => setActive(null)}
        onSend={(body) => send(activeThread.handle, body)}
        onViewProfile={() => {
          const f = activeThread.friend
          viewPlayer({
            handle: activeThread.handle,
            title: f?.title,
            titleRarity: f?.titleRarity,
            avatar: f?.avatar || generateAvatarFromSeed(activeThread.handle),
            faction: f?.faction,
            status: f?.status,
            note: f?.note,
            lastSeen: f?.lastSeen,
            source: f ? "friend" : "party",
          })
        }}
      />
    )
  }

  return <InboxList threads={threads} onOpen={(h) => setActive(h)} />
}

function InboxList({ threads, onOpen }: { threads: Thread[]; onOpen: (handle: string) => void }) {
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <div>
          <h1 className="text-[15px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text)]">
            Messages
          </h1>
          <p className="text-[12px] text-[color:var(--color-muted)]">Private channels</p>
        </div>
        {totalUnread > 0 && (
          <span className="rounded-full bg-[color:var(--color-cyan)]/15 px-2 py-0.5 text-[12px] font-semibold text-[color:var(--color-cyan)]">
            {totalUnread} unread
          </span>
        )}
      </header>

      {threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 text-center">
          <p className="text-[15px] text-[color:var(--color-muted)]">No conversations yet</p>
          <p className="text-[13px] text-[color:var(--color-muted)]/70">
            Open a player&apos;s profile and tap Message to start one.
          </p>
        </div>
      ) : (
        <ul className="esro-scroll flex-1 divide-y divide-[color:var(--color-border-soft)]/50 overflow-y-auto">
          {threads.map((t) => {
            const avatar = t.friend?.avatar || generateAvatarFromSeed(t.handle)
            return (
              <li key={t.handle}>
                <button
                  type="button"
                  onClick={() => onOpen(t.handle)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--color-accent)]/5"
                >
                  <div className="relative shrink-0">
                    <PixelAvatar config={avatar} size="sm" showFlair={false} />
                    {t.unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-cyan)] px-1 text-[10px] font-bold text-[color:var(--color-bg)]">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-[14px]",
                          t.unread > 0
                            ? "font-semibold text-[color:var(--color-text)]"
                            : "text-[color:var(--color-text)]",
                        )}
                      >
                        {t.handle}
                      </span>
                      <span className="shrink-0 text-[11px] text-[color:var(--color-muted)]">
                        {relTime(t.last.at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {t.last.direction === "out" && (
                        <span className="text-[12px] text-[color:var(--color-muted)]/70">You:</span>
                      )}
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          t.unread > 0
                            ? "text-[color:var(--color-text)]/90"
                            : "text-[color:var(--color-muted)]",
                        )}
                      >
                        {t.last.body}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ConversationView({
  thread,
  onBack,
  onSend,
  onViewProfile,
}: {
  thread: Thread
  onBack: () => void
  onSend: (body: string) => void
  onViewProfile: () => void
}) {
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const avatar = thread.friend?.avatar || generateAvatarFromSeed(thread.handle)

  // Keep the view pinned to the newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [thread.messages.length])

  const submit = () => {
    if (!draft.trim()) return
    onSend(draft)
    setDraft("")
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to messages"
          className="shrink-0 rounded-md p-1.5 text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-accent)]/10 hover:text-[color:var(--color-text)]"
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={onViewProfile}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded text-left transition-opacity hover:opacity-80"
          title="View profile"
        >
          <PixelAvatar config={avatar} size="sm" showFlair={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[14px] text-[color:var(--color-text)]">{thread.handle}</span>
              {thread.friend?.status && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    thread.friend.status === "online" && "bg-[color:var(--color-success)]",
                    thread.friend.status === "away" && "bg-[color:var(--color-amber)]",
                    thread.friend.status === "offline" && "bg-[color:var(--color-muted)]",
                  )}
                />
              )}
            </div>
            {thread.friend?.title ? (
              <TitleDisplay
                title={thread.friend.title}
                rarity={thread.friend.titleRarity || "common"}
                variant="inline"
                className="text-[12px]"
              />
            ) : thread.friend?.faction ? (
              <div className="text-[12px] text-[color:var(--color-muted)]">{thread.friend.faction}</div>
            ) : null}
          </div>
        </button>
      </header>

      <div ref={scrollRef} className="esro-scroll flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex flex-col", m.direction === "out" ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[78%] rounded-lg px-3 py-2 text-[14px] leading-relaxed",
                m.direction === "out"
                  ? "bg-[color:var(--color-cyan)]/15 text-[color:var(--color-text)]"
                  : "border border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-text)]",
              )}
            >
              {m.body}
            </div>
            <span className="mt-0.5 px-1 text-[11px] text-[color:var(--color-muted)]">{relTime(m.at)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t border-[color:var(--color-border)] px-3 py-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          placeholder={`Message ${thread.handle}`}
          className="max-h-28 min-h-[38px] flex-1 resize-none rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[14px] text-[color:var(--color-text)] outline-none placeholder:text-[color:var(--color-muted)]/60 focus:border-[color:var(--color-cyan)]/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="shrink-0 rounded-lg border border-[color:var(--color-cyan)]/50 bg-[color:var(--color-cyan)]/15 px-4 py-2 text-[13px] font-semibold uppercase tracking-wider text-[color:var(--color-cyan)] transition-colors hover:bg-[color:var(--color-cyan)]/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  )
}
