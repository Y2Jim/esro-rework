"use client"

import { useState, type FormEvent } from "react"
import { useEsroStore } from "@/store/use-esro-store"

interface ComposeInputProps {
  readOnly?: boolean
}

export function ComposeInput({ readOnly }: ComposeInputProps) {
  const [value, setValue] = useState("")
  const channel = useEsroStore((s) => s.channel)
  const sendMessage = useEsroStore((s) => s.sendMessage)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim() || readOnly) return
    sendMessage(channel, value.trim())
    setValue("")
  }

  if (readOnly) {
    return (
      <div className="esro-input flex items-center justify-center text-[12px] text-[color:var(--color-muted)]">
        This channel is read-only
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        className="esro-input flex-1"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="esro-button esro-button-primary disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )
}
