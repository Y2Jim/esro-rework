"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { StatusBar } from "./status-bar"
import { IdentityBar } from "./identity-bar"
import { BottomNav } from "./bottom-nav"
import { Watermark } from "./watermark"
import { ChatScreen } from "@/components/chat/chat-screen"
import { ExpeditionScreen } from "@/components/expedition/expedition-screen"
import { SkillsScreen } from "@/components/skills/skills-screen"
import { InventoryScreen } from "@/components/inventory/inventory-screen"
import { PartyScreen } from "@/components/party/party-screen"
import { ArchiveScreen } from "@/components/archive/archive-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"

export function AppShell() {
  const screen = useEsroStore((s) => s.screen)

  return (
    <div className="relative flex h-full w-full flex-col">
      <Watermark />

      {/* top */}
      <StatusBar />
      <IdentityBar />

      {/* screen body */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex flex-col"
          >
            {screen === "chat" && <ChatScreen />}
            {screen === "expedition" && <ExpeditionScreen />}
            {screen === "skills" && <SkillsScreen />}
            {screen === "inventory" && <InventoryScreen />}
            {screen === "party" && <PartyScreen />}
            {screen === "archive" && <ArchiveScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* bottom nav */}
      <BottomNav />
    </div>
  )
}
