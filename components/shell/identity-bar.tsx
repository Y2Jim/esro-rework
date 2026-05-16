"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { EsroLogo } from "@/components/brand/esro-logo"
import { getTitleClass } from "@/lib/rarity"
import { cn } from "@/lib/cn"

const screenLabel: Record<string, string> = {
  terminal: "relay · channels",
  ops: "operations",
  contracts: "contract board",
  faction: "faction hub",
  profile: "profile",
}

export function IdentityBar() {
  const identity = useEsroStore((s) => s.identity)
  const screen = useEsroStore((s) => s.screen)

  const titleClass = getTitleClass(identity.titleRarity)

  return (
    <div className="relative z-20 flex items-center justify-between gap-3 px-4 pb-3 pt-1">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <EsroLogo size={26} />
          <div
            aria-hidden
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[color:var(--color-violet-bright)] text-glow"
          />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
            esro
          </div>
          <div className="text-[11px] text-[color:var(--color-foreground)]/90">
            {screenLabel[screen] ?? "relay"}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end leading-tight">
        <div className="text-[12px] font-medium text-[color:var(--color-foreground)] text-glow-soft">
          {identity.handle}
        </div>
        <div
          className={cn(
            "text-[9px] uppercase tracking-[0.25em]",
            titleClass,
          )}
        >
          {identity.title}
        </div>
      </div>
    </div>
  )
}
