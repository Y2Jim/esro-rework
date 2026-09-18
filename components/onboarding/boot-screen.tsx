"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BOOT_HEADER, BOOT_BODY } from "@/lib/game-data"

interface BootScreenProps {
  onComplete: () => void
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<"header" | "body" | "ready">("header")
  const [displayedBody, setDisplayedBody] = useState("")
  const [bodyIndex, setBodyIndex] = useState(0)

  // Typewriter effect for header then body
  useEffect(() => {
    if (phase === "header") {
      const timer = setTimeout(() => setPhase("body"), 800)
      return () => clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== "body") return
    if (bodyIndex < BOOT_BODY.length) {
      const speed = BOOT_BODY[bodyIndex] === "\n" ? 150 : 30
      const timer = setTimeout(() => {
        setDisplayedBody(prev => prev + BOOT_BODY[bodyIndex])
        setBodyIndex(i => i + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => setPhase("ready"), 600)
      return () => clearTimeout(timer)
    }
  }, [phase, bodyIndex])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0b0f] p-6">
      <div className="w-full max-w-md">
        {/* Scanline effect */}
        <div 
          className="pointer-events-none fixed inset-0"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(168, 123, 255, 0.02) 2px, rgba(168, 123, 255, 0.02) 4px)",
            zIndex: 100,
          }}
        />

        {/* Terminal frame */}
        <div className="rounded-lg border border-[rgba(168,123,255,0.2)] bg-[rgba(15,16,22,0.95)] p-6 shadow-[0_0_40px_rgba(168,123,255,0.1)]">
          {/* Header */}
          <AnimatePresence mode="wait">
            {(phase === "header" || phase === "body" || phase === "ready") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)] mb-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
                  <span>RELAY BOOT SEQUENCE</span>
                </div>
                <h1 className="font-mono text-2xl font-bold tracking-wider text-[color:var(--color-accent)]">
                  {BOOT_HEADER}
                  <span className="animate-pulse">_</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          <AnimatePresence mode="wait">
            {(phase === "body" || phase === "ready") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-sm leading-relaxed text-[color:var(--color-text-secondary)] whitespace-pre-wrap min-h-[120px]"
              >
                {displayedBody}
                {phase === "body" && (
                  <span className="animate-pulse text-[color:var(--color-accent)]">|</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue prompt */}
          <AnimatePresence mode="wait">
            {phase === "ready" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <button
                  onClick={onComplete}
                  className="group w-full rounded-md border border-[color:var(--color-accent)] bg-[rgba(168,123,255,0.1)] px-4 py-3 text-center font-mono text-sm font-medium text-[color:var(--color-accent)] transition-all hover:bg-[rgba(168,123,255,0.2)] hover:shadow-[0_0_20px_rgba(168,123,255,0.2)]"
                >
                  <span className="mr-2">[</span>
                  INITIALIZE HANDSET
                  <span className="ml-2">]</span>
                </button>
                <p className="mt-4 text-center text-xs text-[color:var(--color-text-muted)]">
                  Press to begin operator induction
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative lines */}
        <div className="mt-4 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="h-0.5 w-8 bg-[rgba(168,123,255,0.3)]"
            />
          ))}
        </div>

        {/* Studio credit */}
        <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-text-muted)]">
          a gumware studios production
        </p>
      </div>
    </div>
  )
}
