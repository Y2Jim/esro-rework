"use client"

import { useEffect, useMemo, useRef } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { MessageRow } from "./message-row"

const PAGE_SIZE = 20

export function MessageLog() {
  const channel = useEsroStore((s) => s.channel)
  const all = useEsroStore((s) => s.messages)
  const pageOffset = useEsroStore((s) => s.pageOffset) ?? 0
  const logRef = useRef<HTMLDivElement>(null)
  const isLogChannel = channel === "LOG"

  const list = useMemo(() => {
    const filtered = all
      .filter((m) => m.channel === channel)
      .sort((a, b) => a.at - b.at)
    // show newest page when offset=0
    const end = Math.max(0, filtered.length - pageOffset * PAGE_SIZE)
    const start = Math.max(0, end - PAGE_SIZE * 2) // keep ~2 pages visible for context
    return filtered.slice(start, end)
  }, [all, channel, pageOffset])

  // auto-scroll to bottom when on newest page
  useEffect(() => {
    if (!logRef.current) return
    if (pageOffset === 0) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [list, pageOffset])

  return (
    <div
      ref={logRef}
      className="esro-scroll relative z-10 flex-1 overflow-y-auto bg-[color:var(--color-bg)]/40"
      role="log"
      aria-live="polite"
    >
      {list.length === 0 ? (
        <div className="px-4 py-6 text-center text-[13px] text-[color:var(--color-muted)]">
          channel quiet · no traffic
        </div>
      ) : (
        <div className="divide-y divide-[color:var(--color-border-soft)]/50 py-1.5">
          {list.map((m) => (
            <MessageRow key={m.id} msg={m} isLogChannel={isLogChannel} />
          ))}
        </div>
      )}

      {/* page marker */}
      {pageOffset > 0 && (
        <div className="sticky bottom-0 left-0 right-0 border-t border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/80 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-muted)] backdrop-blur">
          viewing history · page -{pageOffset}
        </div>
      )}
    </div>
  )
}
