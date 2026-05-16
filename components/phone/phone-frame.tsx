"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

/**
 * A compact phone-shaped viewport. Width ~360, height ~720.
 * Scales down gracefully on very small screens.
 */
export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative z-10 flex items-center justify-center">
      {/* bezel */}
      <div
        className={cn(
          "relative h-[720px] w-[360px] rounded-[var(--radius-phone)]",
          "border border-[color:var(--color-border)]",
          "bg-gradient-to-b from-[#0d0818] to-[#050309]",
          "shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(168,123,255,0.08),inset_0_0_0_1px_rgba(168,123,255,0.05)]",
          className,
        )}
      >
        {/* screen */}
        <div className="absolute inset-[10px] overflow-hidden rounded-[calc(var(--radius-phone)-10px)] bg-[var(--color-bg)]">
          {/* notch */}
          <div
            aria-hidden
            className="absolute left-1/2 top-0 z-30 h-[18px] w-[118px] -translate-x-1/2 rounded-b-[14px] bg-black"
          />
          {/* inner bezel halo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(168,123,255,0.08), inset 0 0 40px rgba(168,123,255,0.04)",
            }}
          />
          
          {/* Theme effect layers - dedicated elements for each effect type */}
          {/* Background effects (behind HUD, z-0) */}
          {/* Epic/Legendary shimmer sweep - background layer */}
          <div aria-hidden className="theme-effect-shimmer-layer pointer-events-none absolute inset-0 z-0" />
          {/* Legendary scan lines - background layer */}
          <div aria-hidden className="theme-effect-scanlines pointer-events-none absolute inset-0 z-0" />
          {/* Mythic particles - background layer */}
          <div aria-hidden className="theme-effect-particles pointer-events-none absolute inset-0 z-0" />
          {/* Mythic halo - background layer */}
          <div aria-hidden className="theme-effect-halo pointer-events-none absolute inset-0 z-0" />
          
          {/* Overlay effects (above content but subtle, z-40) */}
          {/* Epic pulse corners */}
          <div aria-hidden className="theme-effect-corners pointer-events-none absolute inset-0 z-40" />
          {/* Legendary edge glow */}
          <div aria-hidden className="theme-effect-edge-glow pointer-events-none absolute inset-0 z-40" />
          
          {/* scanlines + vignette wrapper */}
          <div className="phone-screen scanlines vignette relative h-full w-full">
            {children}
          </div>
        </div>

        {/* side buttons */}
        <div
          aria-hidden
          className="absolute -left-[2px] top-[110px] h-[32px] w-[3px] rounded-l-sm bg-[color:var(--color-border)]"
        />
        <div
          aria-hidden
          className="absolute -left-[2px] top-[160px] h-[54px] w-[3px] rounded-l-sm bg-[color:var(--color-border)]"
        />
        <div
          aria-hidden
          className="absolute -right-[2px] top-[140px] h-[72px] w-[3px] rounded-r-sm bg-[color:var(--color-border)]"
        />
      </div>
    </div>
  )
}
