"use client"

import { useEffect, useState } from "react"

export function StatusBar() {
  const [time, setTime] = useState("--:--")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => setTime(formatTime(new Date()))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative z-20 flex items-center justify-between px-6 pb-1 pt-5 text-[14px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
      <span className="font-medium">{time}</span>
      <span className="flex items-center gap-3">
        <span>relay</span>
        <span className="flex items-center gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="inline-block h-[6px] w-[2px]"
              style={{
                height: 3 + i * 2,
                background:
                  i < 3
                    ? "var(--color-violet-bright)"
                    : "color-mix(in oklab, var(--color-muted) 60%, transparent)",
              }}
            />
          ))}
        </span>
        <span className="text-[color:var(--color-violet-bright)] text-glow">●</span>
      </span>
    </div>
  )
}

function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}
