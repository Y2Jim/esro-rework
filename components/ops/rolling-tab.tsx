"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import { motion, AnimatePresence } from "framer-motion"

const rarityColors: Record<string, string> = {
  common: "text-[color:var(--color-muted)]",
  uncommon: "text-green-400",
  rare: "text-[color:var(--color-accent)]",
  epic: "text-[color:var(--color-accent-strong)]",
  legendary: "text-amber-400",
  mythic: "prismatic-text",
}

const rarityBorders: Record<string, string> = {
  common: "border-[color:var(--color-border)]",
  uncommon: "border-green-400/50",
  rare: "border-[color:var(--color-accent)]/50",
  epic: "border-[color:var(--color-accent-strong)]/50",
  legendary: "border-amber-400/50",
  mythic: "border-amber-300/70",
}

const rarityGlows: Record<string, string> = {
  common: "",
  uncommon: "shadow-[0_0_10px_rgba(74,222,128,0.3)]",
  rare: "shadow-[0_0_15px_rgba(168,123,255,0.4)]",
  epic: "shadow-[0_0_20px_rgba(187,129,255,0.5)]",
  legendary: "shadow-[0_0_25px_rgba(251,191,36,0.5)]",
  mythic: "shadow-[0_0_30px_rgba(251,191,36,0.6)]",
}

/** Fake items to cycle through during animation */
const ROLL_POOL = [
  { label: "Signal Fragment", rarity: "common" },
  { label: "Relay Shard", rarity: "common" },
  { label: "Data Core", rarity: "uncommon" },
  { label: "Echo Remnant", rarity: "uncommon" },
  { label: "Pulse Crystal", rarity: "rare" },
  { label: "Void Fragment", rarity: "rare" },
  { label: "Stellar Core", rarity: "epic" },
  { label: "Aether Shard", rarity: "epic" },
  { label: "Nova Fragment", rarity: "legendary" },
]

export function RollingTab() {
  const shards = useEsroStore((s) => s.shards)
  const recovery = useEsroStore((s) => s.recovery)
  const runRecovery = useEsroStore((s) => s.runRecovery)
  const lastRecovered = useEsroStore((s) => s.lastRecovered)
  const clearLastRecovered = useEsroStore((s) => s.clearLastRecovered)

  const [isRolling, setIsRolling] = useState(false)
  const [rollMode, setRollMode] = useState<"standard" | "focused" | null>(null)
  const [displayItems, setDisplayItems] = useState<typeof ROLL_POOL>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pendingResultRef = useRef<typeof lastRecovered>(null)

  const canStandard = shards.relay_tokens >= 1 && !isRolling
  const canFocused = shards.deep_signals >= 2 && !isRolling

  const startRoll = useCallback((mode: "standard" | "focused") => {
    setIsRolling(true)
    setRollMode(mode)
    setShowResult(false)
    
    // Shuffle pool for visual variety
    const shuffled = [...ROLL_POOL].sort(() => Math.random() - 0.5)
    setDisplayItems(shuffled)
    setCurrentIndex(0)
    
    // Run actual recovery to get result
    runRecovery(mode)
  }, [runRecovery])

  // Store result when it comes in
  useEffect(() => {
    if (lastRecovered && isRolling) {
      pendingResultRef.current = lastRecovered
      clearLastRecovered()
    }
  }, [lastRecovered, isRolling, clearLastRecovered])

  // Animation cycle
  useEffect(() => {
    if (!isRolling) return

    let speed = 60 // Start fast
    let cycles = 0
    const maxCycles = 18 + Math.floor(Math.random() * 6) // 18-24 cycles

    const tick = () => {
      cycles++
      setCurrentIndex(i => (i + 1) % displayItems.length)

      if (cycles >= maxCycles) {
        // Stop and show result
        setIsRolling(false)
        setShowResult(true)
        return
      }

      // Slow down progressively
      if (cycles > maxCycles - 8) {
        speed = Math.min(speed + 40, 300)
      } else if (cycles > maxCycles - 12) {
        speed = Math.min(speed + 20, 180)
      }

      rollIntervalRef.current = setTimeout(tick, speed)
    }

    rollIntervalRef.current = setTimeout(tick, speed)

    return () => {
      if (rollIntervalRef.current) clearTimeout(rollIntervalRef.current)
    }
  }, [isRolling, displayItems.length])

  const currentItem = displayItems[currentIndex] || ROLL_POOL[0]
  const finalResult = pendingResultRef.current

  return (
    <div className="space-y-4">
      {/* Resources inline */}
      <div className="flex gap-4 text-[11px]">
        <span className="text-[color:var(--color-muted)]">
          Relay <span className="text-[color:var(--color-text)]">{shards.relay_tokens}</span>
        </span>
        <span className="text-[color:var(--color-muted)]">
          Deep <span className="text-[color:var(--color-text)]">{shards.deep_signals}</span>
        </span>
      </div>

      {/* Rolling display */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {(isRolling || showResult) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              {/* Rolling container */}
              <div 
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 bg-[color:var(--color-panel)] p-4 transition-all duration-300",
                  isRolling 
                    ? "border-[color:var(--color-accent)]/30" 
                    : finalResult 
                      ? cn(rarityBorders[finalResult.rarity], rarityGlows[finalResult.rarity])
                      : "border-[color:var(--color-border)]"
                )}
              >
                {/* Scan line effect during roll */}
                {isRolling && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--color-accent)]/10 to-transparent"
                    animate={{ y: ["-100%", "100%"] }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Item display */}
                <div className="relative flex flex-col items-center py-4">
                  <AnimatePresence mode="popLayout">
                    {isRolling ? (
                      <motion.div
                        key={`roll-${currentIndex}`}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ duration: 0.05 }}
                        className="text-center"
                      >
                        <div className={cn("text-[14px] font-medium", rarityColors[currentItem.rarity])}>
                          {currentItem.label}
                        </div>
                        <div className="mt-1 text-[10px] capitalize text-[color:var(--color-muted)]">
                          {currentItem.rarity}
                        </div>
                      </motion.div>
                    ) : showResult && finalResult ? (
                      <motion.div
                        key="result"
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className="text-center"
                      >
                        <motion.div 
                          className={cn("text-[16px] font-bold", rarityColors[finalResult.rarity])}
                          animate={finalResult.rarity === "legendary" || finalResult.rarity === "mythic" 
                            ? { scale: [1, 1.05, 1] } 
                            : {}
                          }
                          transition={{ duration: 0.5, repeat: finalResult.rarity === "legendary" || finalResult.rarity === "mythic" ? 2 : 0 }}
                        >
                          {finalResult.label}
                        </motion.div>
                        <div className="mt-1 text-[11px] capitalize text-[color:var(--color-muted)]">
                          {finalResult.rarity}
                        </div>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 0.3, duration: 0.4 }}
                          className={cn(
                            "mx-auto mt-3 h-0.5 rounded-full",
                            finalResult.rarity === "legendary" || finalResult.rarity === "mythic"
                              ? "bg-amber-400"
                              : finalResult.rarity === "epic"
                                ? "bg-[color:var(--color-accent-strong)]"
                                : "bg-[color:var(--color-accent)]"
                          )}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Decorative corners */}
                <div className="absolute top-1 left-1 h-2 w-2 border-l border-t border-[color:var(--color-accent)]/30" />
                <div className="absolute top-1 right-1 h-2 w-2 border-r border-t border-[color:var(--color-accent)]/30" />
                <div className="absolute bottom-1 left-1 h-2 w-2 border-l border-b border-[color:var(--color-accent)]/30" />
                <div className="absolute bottom-1 right-1 h-2 w-2 border-r border-b border-[color:var(--color-accent)]/30" />
              </div>

              {/* Dismiss button */}
              {showResult && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => {
                    setShowResult(false)
                    pendingResultRef.current = null
                  }}
                  className="mt-2 w-full rounded border border-[color:var(--color-border)] py-1.5 text-[10px] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)]/50 hover:text-[color:var(--color-text)]"
                >
                  Continue
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recovery buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => startRoll("standard")}
          disabled={!canStandard}
          className={cn(
            "flex-1 rounded-lg border px-3 py-3 text-center transition-colors",
            canStandard
              ? "border-[color:var(--color-accent)]/50 bg-[color:var(--color-accent)]/10 hover:bg-[color:var(--color-accent)]/20"
              : "border-[color:var(--color-border)] opacity-50"
          )}
        >
          <div className="text-[11px] font-medium text-[color:var(--color-text)]">Standard</div>
          <div className="text-[9px] text-[color:var(--color-muted)]">1 Relay</div>
        </button>
        
        <button
          type="button"
          onClick={() => startRoll("focused")}
          disabled={!canFocused}
          className={cn(
            "flex-1 rounded-lg border px-3 py-3 text-center transition-colors",
            canFocused
              ? "border-[color:var(--color-accent-strong)]/50 bg-[color:var(--color-accent-strong)]/10 hover:bg-[color:var(--color-accent-strong)]/20"
              : "border-[color:var(--color-border)] opacity-50"
          )}
        >
          <div className="text-[11px] font-medium text-[color:var(--color-text)]">Focused</div>
          <div className="text-[9px] text-[color:var(--color-muted)]">2 Deep</div>
        </button>
      </div>

      {/* Recent */}
      <div>
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Recent
        </div>
        
        {recovery.length === 0 ? (
          <div className="text-[11px] text-[color:var(--color-muted)]">No recoveries yet</div>
        ) : (
          <div className="space-y-1">
            {recovery.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] px-3 py-2"
              >
                <span className={cn("text-[11px]", rarityColors[item.rarity])}>
                  {item.label}
                </span>
                <span className="text-[9px] capitalize text-[color:var(--color-muted)]">
                  {item.rarity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
