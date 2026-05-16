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
  
  // Flair CSS classes based on variant
  const flairClass = showFlair ? {
    1: "shadow-[0_0_8px_2px_rgba(168,85,247,0.4)]", // Pulse Glow - purple
    2: "animate-pulse", // Static Aura
    3: "", // Sparkle - handled separately
    4: "shadow-[0_0_6px_1px_rgba(255,255,255,0.2)]", // Soft Glow - white
    5: "shadow-[0_0_4px_1px_rgba(200,180,140,0.3)]", // Dust Motes - tan
    6: "animate-pulse shadow-[0_0_6px_2px_rgba(100,180,255,0.3)]", // Signal Flicker - blue pulse
    7: "shadow-[0_0_8px_3px_rgba(100,200,180,0.25)]", // Route Trails - teal
    8: "shadow-[0_0_6px_2px_rgba(80,120,200,0.4)]", // Echo Ripples - blue
    9: "shadow-[0_0_10px_3px_rgba(60,200,255,0.35)]", // Data Stream - cyan
    10: "shadow-[0_0_12px_4px_rgba(100,50,150,0.5)]", // Void Shimmer - purple
    11: "shadow-[0_0_10px_3px_rgba(255,100,150,0.3)] shadow-[0_0_20px_6px_rgba(100,150,255,0.2)]", // Prismatic Aura
    12: "shadow-[0_0_12px_4px_rgba(255,180,80,0.5)]", // Celestial Flame - orange
  }[flairVariant] || "" : ""
  
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-sm",
        flairClass,
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
      
      {/* Dust Motes overlay */}
      {flairVariant === 5 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-0.5 w-0.5 animate-pulse rounded-full bg-amber-200/60"
            style={{ top: "30%", left: "75%", animationDelay: "0s" }}
          />
          <div
            className="absolute h-0.5 w-0.5 animate-pulse rounded-full bg-amber-200/40"
            style={{ top: "60%", left: "20%", animationDelay: "0.5s" }}
          />
          <div
            className="absolute h-0.5 w-0.5 animate-pulse rounded-full bg-amber-200/50"
            style={{ top: "15%", left: "40%", animationDelay: "1s" }}
          />
        </div>
      )}
      
      {/* Data Stream overlay */}
      {flairVariant === 9 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-1 w-0.5 animate-ping rounded-full bg-cyan-400/70"
            style={{ top: "10%", left: "85%", animationDelay: "0s" }}
          />
          <div
            className="absolute h-1 w-0.5 animate-ping rounded-full bg-cyan-400/50"
            style={{ top: "50%", left: "90%", animationDelay: "0.2s" }}
          />
          <div
            className="absolute h-1 w-0.5 animate-ping rounded-full bg-cyan-400/60"
            style={{ top: "80%", left: "80%", animationDelay: "0.4s" }}
          />
        </div>
      )}
      
      {/* Prismatic Aura overlay */}
      {flairVariant === 11 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-pink-400/60"
            style={{ top: "15%", left: "85%", animationDelay: "0s" }}
          />
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-blue-400/50"
            style={{ top: "75%", left: "10%", animationDelay: "0.3s" }}
          />
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-green-400/50"
            style={{ top: "40%", left: "5%", animationDelay: "0.6s" }}
          />
        </div>
      )}
      
      {/* Celestial Flame overlay */}
      {flairVariant === 12 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-1.5 w-1 animate-pulse rounded-full bg-orange-400/70"
            style={{ top: "5%", left: "50%", animationDelay: "0s" }}
          />
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-yellow-400/60"
            style={{ top: "10%", left: "60%", animationDelay: "0.2s" }}
          />
          <div
            className="absolute h-1 w-1 animate-ping rounded-full bg-red-400/50"
            style={{ top: "8%", left: "40%", animationDelay: "0.4s" }}
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
