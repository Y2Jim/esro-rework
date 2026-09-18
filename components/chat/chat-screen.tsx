"use client"

import { ChannelTabs } from "./channel-tabs"
import { MessageLog } from "./message-log"
import { ChatInput } from "./chat-input"
import { PageControls } from "./page-controls"
import { useEsroStore } from "@/store/use-esro-store"
import { channels } from "@/lib/mock-data"

export function ChatScreen() {
  const channel = useEsroStore((s) => s.channel)
  const current = channels.find((c) => c.id === channel)
  const restricted = current?.restricted
  const readOnly = current?.readOnly

  return (
    <div className="relative flex h-full w-full flex-col">
      <ChannelTabs />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* channel header strip */}
        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/70 px-3 py-1.5">
          <div className="flex items-center gap-2 text-[13px] uppercase tracking-[0.22em]">
            <span
              className={
                restricted
                  ? "text-[color:var(--color-violet-bright)] text-glow"
                  : "text-[color:var(--color-muted)]"
              }
            >
              {restricted ? "hidden" : readOnly ? "system" : "live"}
            </span>
            <span className="text-[color:var(--color-muted-2)]">·</span>
            <span className="text-[color:var(--color-lilac)]">
              {current?.description}
            </span>
          </div>
          <PageControls />
        </div>

        <MessageLog />

        <ChatInput />
      </div>
    </div>
  )
}
