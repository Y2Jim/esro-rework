"use client"

import { useMemo } from "react"
import type { AvatarConfig } from "@/lib/types"
import { renderAvatarPixels, getLayer } from "@/lib/avatar-generator"
import { cn } from "@/lib/cn"

interface PixelAvatarProps {
  config: AvatarConfig
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  showFlair?: boolean
}

const sizeMap = {
  xs: 24,  // 24px - for chat
  sm: 32,  // 32px - for party list
  md: 56,  // 56px - for profile
  lg: 84,  // 84px - for profile expanded
}

const pixelSizeMap = {
  xs: 2,
  sm: 2,
  md: 4,
  lg: 6,
}

export function PixelAvatar({ config, size = "md", className, showFlair = true }: PixelAvatarProps) {
  const pixels = useMemo(() => renderAvatarPixels(config), [config])
  const flairLayer = getLayer(config, "flair")
  
  const containerSize = sizeMap[size]
  const pixelSize = pixelSizeMap[size]
  const gridSize = 14
  
  const flairVariant = flairLayer?.variant ?? 0
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-sm",
        flairVariant === 1 && showFlair && "shadow-[0_0_8px_2px_rgba(168,85,247,0.4)]", // glow
        flairVariant === 2 && showFlair && "animate-pulse", // static
        className
      )}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: "var(--color-panel)",
      }}
    >
      {/* Pixel grid */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
        }}
      >
        {pixels.flat().map((color, i) => (
          <div
            key={i}
            style={{
              backgroundColor: color === "transparent" ? "transparent" : color,
            }}
          />
        ))}
      </div>
      
      {/* Sparkle flair overlay */}
      {flairVariant === 3 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-white/80"
            style={{ top: "20%", left: "80%" }}
          />
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-white/60"
            style={{ top: "70%", left: "15%", animationDelay: "0.3s" }}
          />
        </div>
      )}
      
      {/* Subtle border */}
      <div className="pointer-events-none absolute inset-0 rounded-sm border border-[color:var(--color-border)]" />
    </div>
  )
}

// Mini version for inline use (chat messages)
export function MiniAvatar({ config, className }: { config: AvatarConfig; className?: string }) {
  return <PixelAvatar config={config} size="xs" className={className} showFlair={false} />
}

// Party list version
export function PartyAvatar({ config, className }: { config: AvatarConfig; className?: string }) {
  return <PixelAvatar config={config} size="sm" className={className} />
}
