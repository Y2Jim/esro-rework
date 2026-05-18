"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { EsroLogo } from "@/components/brand/esro-logo"
import { useEsroStore } from "@/store/use-esro-store"

const LINES = [
  "probing relay ports...",
  "handshake accepted · node 04",
  "restoring channel registry...",
  "identity lookup: routetender.07",
  "relay identity established",
  "linking archive index...",
  "ready.",
]

export function BootSplash() {
  const setBooted = useEsroStore((s) => s.setBooted)
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let mounted = true
    const delays = [380, 260, 300, 280, 260, 260, 220]
    let i = 0
    const tick = () => {
      if (!mounted) return
      setShown((n) => n + 1)
      i++
      if (i < LINES.length) {
        setTimeout(tick, delays[i] ?? 260)
      } else {
        setTimeout(() => {
          if (mounted) setBooted(true)
        }, 520)
      }
    }
    const start = setTimeout(tick, 420)
    return () => {
      mounted = false
      clearTimeout(start)
    }
  }, [setBooted])

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between px-6 pb-8 pt-16">
      {/* top status */}
      <div className="flex w-full items-center justify-between text-[13px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
        <span>esro · v0.1</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[5px] w-[5px] rounded-full bg-[color:var(--color-violet-bright)] text-glow" />
          link
        </span>
      </div>

      {/* center logo */}
      <div className="relative flex flex-col items-center gap-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative"
        >
          {/* soft halo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(168,123,255,0.35) 0%, transparent 60%)",
              filter: "blur(12px)",
            }}
          />
          <div className="flicker">
            <EsroLogo size={120} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-[22px] font-semibold tracking-[0.45em] text-[color:var(--color-foreground)] text-glow">
            ESRO
          </div>
          <div className="mt-1 text-[13px] uppercase tracking-[0.35em] text-[color:var(--color-muted)]">
            enchanted star realms online
          </div>
        </motion.div>
      </div>

      {/* boot lines */}
      <div className="w-full max-w-[280px]">
        <div className="mb-2 hr-dashed" />
        <ul className="space-y-1 font-mono text-[15px] leading-5 text-[color:var(--color-lilac)]">
          {LINES.map((line, i) => {
            const visible = i < shown
            const isLast = i === shown - 1 && shown < LINES.length
            if (!visible) return null
            return (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="flex gap-2"
              >
                <span className="text-[color:var(--color-violet)]">&gt;</span>
                <span className={isLast ? "text-[color:var(--color-foreground)]" : ""}>
                  {line}
                  {isLast && <span className="caret ml-1 bg-[color:var(--color-violet-bright)]" />}
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
