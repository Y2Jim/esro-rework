"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

const LINES = [
  "recovering packet...",
  "resolving aspect...",
  "stabilizing index...",
]

export function ResultReveal() {
  const last = useEsroStore((s) => s.lastRecovered)
  const clear = useEsroStore((s) => s.clearLastRecovered)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!last) {
      setStep(0)
      return
    }
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 380)
    const t2 = setTimeout(() => setStep(2), 760)
    const t3 = setTimeout(() => setStep(3), 1140)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [last])

  return (
    <AnimatePresence>
      {last && (
        <motion.div
          key="reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex items-end justify-center bg-[color:var(--color-bg)]/80 backdrop-blur-sm"
          onClick={clear}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "pointer-events-auto mx-3 mb-4 w-[calc(100%-1.5rem)] rounded-md border p-3",
              "border-[color:color-mix(in_oklab,var(--color-violet)_45%,transparent)] bg-[color:var(--color-panel-2)]/95",
              last.rarity === "epic" &&
                "border-[color:color-mix(in_oklab,var(--color-violet-bright)_60%,transparent)] shadow-[0_0_30px_-5px_rgba(201,167,255,0.4)]",
              last.rarity === "legendary" &&
                "border-[color:color-mix(in_oklab,var(--color-prismatic)_50%,transparent)] shadow-[0_0_30px_-5px_rgba(243,213,138,0.45)]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
              <span>archive · reveal</span>
              <button
                type="button"
                onClick={clear}
                className="text-[color:var(--color-muted)] hover:text-[color:var(--color-lilac)]"
                aria-label="close"
              >
                dismiss
              </button>
            </div>

            <div className="mt-1.5 min-h-[82px]">
              <ul className="space-y-0.5 text-[10.5px] text-[color:var(--color-foreground)]/80">
                {LINES.slice(0, step).map((l, i) => (
                  <motion.li
                    key={l}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2"
                  >
                    <span className="text-[color:var(--color-violet)]">&gt;</span>
                    <span>{l}</span>
                  </motion.li>
                ))}
              </ul>

              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="mt-2.5 rounded-sm border border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/60 p-2.5 text-center"
                >
                  <div className="text-[9px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                    variant recovered
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[16px] font-medium",
                      last.rarity === "legendary"
                        ? "prismatic-text"
                        : "text-[color:var(--color-foreground)] text-glow",
                    )}
                  >
                    {last.label}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.25em]">
                    <span className="text-[color:var(--color-muted)]">
                      {last.type.replace("_", " ")}
                    </span>
                    <span className="text-[color:var(--color-muted-2)]">·</span>
                    <span
                      className={cn(
                        last.rarity === "legendary"
                          ? "prismatic-text"
                          : rarityColor[last.rarity],
                      )}
                    >
                      {rarityLabel[last.rarity]}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
