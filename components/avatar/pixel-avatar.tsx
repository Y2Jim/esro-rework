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
  
  // Flair styles - using inline styles for the glow effects to avoid overflow clipping
  const flairStyles: Record<number, React.CSSProperties> = {
    1: { boxShadow: "0 0 8px 2px rgba(168,85,247,0.5), 0 0 16px 4px rgba(168,85,247,0.3)" }, // Pulse Glow - purple
    2: { boxShadow: "0 0 6px 2px rgba(200,200,255,0.3)" }, // Static Aura
    3: {}, // Sparkle - handled separately with overlay
    4: { boxShadow: "0 0 8px 2px rgba(255,255,255,0.25)" }, // Soft Glow - white
    5: { boxShadow: "0 0 6px 2px rgba(200,180,140,0.4)" }, // Dust Motes - tan
    6: { boxShadow: "0 0 8px 3px rgba(100,180,255,0.4)" }, // Signal Flicker - blue pulse
    7: { boxShadow: "0 0 10px 4px rgba(100,200,180,0.35)" }, // Route Trails - teal
    8: { boxShadow: "0 0 8px 3px rgba(80,120,200,0.5)" }, // Echo Ripples - blue
    9: { boxShadow: "0 0 12px 4px rgba(60,200,255,0.45)" }, // Data Stream - cyan
    10: { boxShadow: "0 0 14px 5px rgba(100,50,150,0.6)" }, // Void Shimmer - purple
    11: { boxShadow: "0 0 12px 4px rgba(255,100,150,0.4), 0 0 24px 8px rgba(100,150,255,0.25)" }, // Prismatic Aura
    12: { boxShadow: "0 0 14px 5px rgba(255,180,80,0.6), 0 0 20px 8px rgba(255,100,50,0.3)" }, // Celestial Flame - orange
  }
  
  const currentFlairStyle = showFlair && flairVariant > 0 ? flairStyles[flairVariant] || {} : {}
  const isPulsing = showFlair && (flairVariant === 2 || flairVariant === 6)
  
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-sm",
        isPulsing && "animate-pulse",
        className
      )}
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: "var(--color-panel)",
        ...currentFlairStyle,
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
