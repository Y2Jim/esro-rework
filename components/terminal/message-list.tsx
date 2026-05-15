"use client"

import { useEffect, useRef } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { MessageRow } from "./message-row"
import { EmptyState } from "@/components/ui/empty-state"

export function MessageList() {
  const channel = useEsroStore((s) => s.channel)
  const messages = useEsroStore((s) => s.messages)
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = messages.filter((m) => m.channel === channel)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filtered.length])

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <EmptyState message="No messages in this channel" />
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-1.5 overflow-y-auto p-2"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(187, 129, 255, 0.58) rgba(18, 11, 28, 0.92)",
      }}
    >
      {filtered.map((msg) => (
        <MessageRow key={msg.id} msg={msg} />
      ))}
    </div>
  )
}
