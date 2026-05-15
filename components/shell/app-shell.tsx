"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import type { ScreenId } from "@/lib/types"
import { cn } from "@/lib/cn"
import { TerminalScreen } from "@/components/terminal/terminal-screen"
import { OpsScreen } from "@/components/ops/ops-screen"
import { ContractsScreen } from "@/components/contracts/contracts-screen"
import { FactionScreen } from "@/components/faction/faction-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"

const navItems: { id: ScreenId; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "ops", label: "Ops" },
  { id: "contracts", label: "Contracts" },
  { id: "faction", label: "Faction" },
  { id: "profile", label: "Profile" },
]

export function AppShell() {
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)

  return (
    <div className="esro-app-bg relative flex h-full w-full flex-col">
      {/* Compact header bar with integrated nav */}
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-3 py-2">
        <h1 className="text-[14px] font-bold tracking-[0.1em] text-[color:var(--color-accent)]">
          ESRO
        </h1>
        
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={cn(
                "rounded px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
                screen === item.id
                  ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Screen Content - takes all remaining space */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(187, 129, 255, 0.4) transparent",
            }}
          >
            {screen === "terminal" && <TerminalScreen />}
            {screen === "ops" && <OpsScreen />}
            {screen === "contracts" && <ContractsScreen />}
            {screen === "faction" && <FactionScreen />}
            {screen === "profile" && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
