"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { EsroLogo } from "@/components/brand/esro-logo"
import { getTitleClass } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { Package } from "lucide-react"

const screenLabel: Record<string, string> = {
  terminal: "relay · channels",
  ops: "operations",
  contracts: "contract board",
  faction: "faction hub",
  profile: "profile",
  inventory: "inventory",
  admin: "admin panel",
}

export function IdentityBar() {
  const identity = useEsroStore((s) => s.identity)
  const profile = useEsroStore((s) => s.profile)
  const screen = useEsroStore((s) => s.screen)
  const setScreen = useEsroStore((s) => s.setScreen)
  const inventory = useEsroStore((s) => s.inventory)

  // Use the equipped title from profile, fallback to identity
  const activeTitle = profile.title?.label || identity.title
  const activeRarity = profile.title?.rarity || identity.titleRarity
  const titleClass = getTitleClass(activeRarity)
  const itemCount = inventory.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="relative z-20 flex items-center justify-between gap-4 px-6 pb-3 pt-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <EsroLogo size={34} />
          <div
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--color-violet-bright)] text-glow"
          />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
            esro
          </div>
          <div className="text-[16px] font-medium text-[color:var(--color-foreground)]/90">
            {screenLabel[screen] ?? "relay"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Inventory button */}
        <button
          type="button"
          onClick={() => setScreen("inventory")}
          className={cn(
            "group relative flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-all",
            screen === "inventory"
              ? "border-[color:var(--color-amber)]/50 bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)]"
              : "border-[color:var(--color-border)] bg-[color:var(--color-panel)]/50 text-[color:var(--color-muted)] hover:border-[color:var(--color-amber)]/30 hover:text-[color:var(--color-amber)]/80"
          )}
        >
          <Package className="h-4 w-4" />
          <span className="text-[15px] font-medium uppercase tracking-wider">{itemCount}</span>
        </button>

        <div className="flex flex-col items-end leading-tight">
          <div className="text-[15px] font-semibold text-[color:var(--color-foreground)] text-glow-soft">
            {identity.handle}
          </div>
          <div
            className={cn(
              "text-[14px] font-medium uppercase tracking-[0.2em]",
              titleClass,
            )}
          >
            {activeTitle}
          </div>
        </div>
      </div>
    </div>
  )
}
