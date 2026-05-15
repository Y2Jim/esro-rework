"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { AppHeader } from "./app-header"
import { TopNav } from "./top-nav"
import { QuickActions } from "./quick-actions"
import { TerminalScreen } from "@/components/terminal/terminal-screen"
import { OpsScreen } from "@/components/ops/ops-screen"
import { ContractsScreen } from "@/components/contracts/contracts-screen"
import { FactionScreen } from "@/components/faction/faction-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"

export function AppShell() {
  const screen = useEsroStore((s) => s.screen)

  return (
    <div className="esro-app-bg relative flex h-full w-full flex-col gap-2 p-3">
      {/* Header */}
      <AppHeader status="linked" />

      {/* Quick Actions */}
      <QuickActions />

      {/* Top Navigation */}
      <TopNav />

      {/* Screen Content */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex flex-col"
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
