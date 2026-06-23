"use client"

import { useEffect } from "react"
import { PhoneFrame } from "./phone-frame"
import { BootSplash } from "@/components/boot/boot-splash"
import { AppShell } from "@/components/shell/app-shell"
import { CharacterCreation } from "@/components/onboarding/character-creation"
import { ThemeProvider } from "@/components/theme-provider"
import { useEsroStore } from "@/store/use-esro-store"
import { AnimatePresence, motion } from "framer-motion"

/**
 * The stage is the dark page background that hosts the phone.
 * This keeps the prototype visually honest — ESRO is never fullscreen,
 * it lives inside a phone viewport.
 */
export function PhoneStage() {
  const booted = useEsroStore((s) => s.booted)
  const characterCreated = useEsroStore((s) => s.characterCreated)
  const setCharacterData = useEsroStore((s) => s.setCharacterData)

  // a tiny page-level ambient effect
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <ThemeProvider>
      <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[var(--color-bg)]">
        {/* stage ambient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 40%, rgba(168,123,255,0.09) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pixel-grid pointer-events-none absolute inset-0 opacity-40"
        />

        <PhoneFrame>
          <AnimatePresence mode="wait" initial={false}>
            {!booted ? (
              <motion.div
                key="boot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
              >
                <BootSplash />
              </motion.div>
            ) : !characterCreated ? (
              <motion.div
                key="character-creation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <CharacterCreation
                  onComplete={(data) => {
                    setCharacterData(data.race, data.courier, data.handle, data.starterSkills, data.avatar)
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <AppShell />
              </motion.div>
            )}
          </AnimatePresence>
        </PhoneFrame>

        {/* tiny footer caption, easy to remove when ported */}
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-0 -translate-x-1/2 text-[13px] uppercase tracking-[0.3em] text-[color:var(--color-muted-2)]">
          esro prototype · phone viewport
        </p>
      </main>
    </ThemeProvider>
  )
}
