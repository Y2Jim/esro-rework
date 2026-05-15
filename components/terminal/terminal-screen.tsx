"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { ChannelTabs } from "./channel-tabs"
import { MessageList } from "./message-list"
import { ComposeInput } from "./compose-input"

export function TerminalScreen() {
  const channel = useEsroStore((s) => s.channel)
  const channels = useEsroStore((s) => s.channels)
  
  const currentChannel = channels.find((c) => c.id === channel)
  const isReadOnly = currentChannel?.readOnly ?? false

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <ChannelTabs />
      
      <div className="esro-panel flex min-h-0 flex-1 flex-col">
        <MessageList />
      </div>
      
      <ComposeInput readOnly={isReadOnly} />
    </div>
  )
}
