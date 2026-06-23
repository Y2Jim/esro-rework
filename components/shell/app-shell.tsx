"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { StatusBar } from "./status-bar"
import { IdentityBar } from "./identity-bar"
import { BottomNav } from "./bottom-nav"
import { Watermark } from "./watermark"
import { ChatScreen } from "@/components/chat/chat-screen"
import { OpsScreen } from "@/components/ops/ops-screen"
import { ContractsScreen } from "@/components/contracts/contracts-screen"
import { SocialScreen } from "@/components/social/social-screen"
import { ProfileScreen } from "@/components/profile/profile-screen"
import { AdminScreen } from "@/components/admin/admin-screen"
import { InventoryScreen } from "@/components/inventory/inventory-screen"

export function AppShell() {
  const screen = useEsroStore((s) => s.screen)

  return (
    <div className="relative flex h-full w-full flex-col bg-[color:var(--color-bg)]">
      <Watermark />

      <StatusBar />
      <IdentityBar />

      <div className="hr-dashed mx-6" />

      {/* screen content */}
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
              scrollbarColor: "rgba(168, 123, 255, 0.4) transparent",
            }}
          >
            {screen === "terminal" && <ChatScreen />}
            {screen === "ops" && <OpsScreen />}
            {screen === "contracts" && <ContractsScreen />}
            {screen === "social" && <SocialScreen />}
            {screen === "profile" && <ProfileScreen />}
            {screen === "admin" && <AdminScreen />}
            {screen === "inventory" && <InventoryScreen />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  )
}
