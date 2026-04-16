"use client"

import { useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { channels } from "@/lib/mock-data"
import { cn } from "@/lib/cn"

export function ChatInput() {
  const [value, setValue] = useState("")
  const channel = useEsroStore((s) => s.channel)
  const send = useEsroStore((s) => s.sendMessage)
  const def = channels.find((c) => c.id === channel)
  const readOnly = def?.readOnly

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (readOnly) return
    if (!value.trim()) return
    send(value)
    setValue("")
  }

  return (
    <form
      onSubmit={submit}
      className="relative z-10 border-t border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/90 px-3 pb-3 pt-2"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border bg-[color:var(--color-panel)]/70 px-2.5 py-1.5",
          "border-[color:var(--color-border-soft)] focus-within:border-[color:color-mix(in_oklab,var(--color-violet)_55%,transparent)]",
          "focus-within:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-violet)_40%,transparent)]",
          readOnly && "opacity-60",
        )}
      >
        <span className="select-none text-[12px] text-[color:var(--color-violet-bright)]">
          &gt;
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 220))}
          placeholder={
            readOnly
              ? "read only · system channel"
              : def?.restricted
                ? "send to hidden relay..."
                : `send to ${def?.label}...`
          }
          disabled={readOnly}
          maxLength={220}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-muted-2)] outline-none"
          aria-label="chat input"
        />
        <span className="select-none text-[9px] uppercase tracking-[0.2em] text-[color:var(--color-muted-2)]">
          {value.length}/220
        </span>
        <button
          type="submit"
          disabled={readOnly || !value.trim()}
          className={cn(
            "rounded-sm border px-2 py-[3px] text-[9.5px] uppercase tracking-[0.25em] transition-all",
            "border-[color:var(--color-border)] text-[color:var(--color-lilac)]",
            "hover:border-[color:color-mix(in_oklab,var(--color-violet)_60%,transparent)] hover:text-[color:var(--color-foreground)] hover:text-glow",
            "disabled:opacity-30 disabled:hover:border-[color:var(--color-border)] disabled:hover:text-[color:var(--color-lilac)]",
          )}
        >
          send
        </button>
      </div>
      <div className="mt-1 px-0.5 text-[8.5px] uppercase tracking-[0.25em] text-[color:var(--color-muted-2)]">
        {def?.restricted
          ? "traffic not logged to registry"
          : "enter to send · 220 char limit"}
      </div>
    </form>
  )
}
