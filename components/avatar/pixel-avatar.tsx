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
    // MYTHIC FLAIRS (13-17)
    13: { boxShadow: "0 0 16px 6px rgba(64,160,220,0.7), 0 0 30px 12px rgba(32,100,180,0.4), 0 0 45px 18px rgba(100,200,255,0.2)" }, // Relay Sea Aura
    14: { boxShadow: "0 0 14px 5px rgba(200,96,224,0.7), 0 0 28px 10px rgba(255,128,192,0.4), 0 0 42px 16px rgba(150,200,255,0.25)" }, // Shardheart Radiance
    15: { boxShadow: "0 0 18px 6px rgba(255,180,80,0.7), 0 0 32px 12px rgba(255,140,60,0.4), 0 0 48px 20px rgba(255,200,100,0.2)" }, // Eternal Courier's Light
    16: { boxShadow: "0 0 20px 8px rgba(128,64,192,0.8), 0 0 35px 14px rgba(80,32,160,0.5), 0 0 50px 22px rgba(160,100,255,0.3)" }, // Voidtouched Presence
    17: { boxShadow: "0 0 16px 6px rgba(64,255,176,0.7), 0 0 30px 12px rgba(32,96,80,0.5), 0 0 45px 18px rgba(128,255,208,0.25)" }, // Primordial Resonance
  }
  
  const currentFlairStyle = showFlair && flairVariant > 0 ? flairStyles[flairVariant] || {} : {}
  const isPulsing = showFlair && (flairVariant === 2 || flairVariant === 6)
  const isMythicFlair = flairVariant >= 13 && flairVariant <= 17
  
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
      
      {/* MYTHIC: Relay Sea Aura overlay - ocean waves */}
      {flairVariant === 13 && showFlair && (
        <div className="pointer-events-none absolute inset-0 animate-pulse">
          <div
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300/80"
            style={{ top: "5%", left: "20%", animation: "ping 2s ease-in-out infinite" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-blue-400/70"
            style={{ top: "15%", left: "80%", animation: "ping 2s ease-in-out infinite 0.5s" }}
          />
          <div
            className="absolute h-1.5 w-1.5 rounded-full bg-teal-300/60"
            style={{ top: "85%", left: "70%", animation: "ping 2s ease-in-out infinite 1s" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-cyan-400/70"
            style={{ top: "80%", left: "15%", animation: "ping 2s ease-in-out infinite 1.5s" }}
          />
        </div>
      )}
      
      {/* MYTHIC: Shardheart Radiance overlay - crystal shards */}
      {flairVariant === 14 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-2 w-0.5 rotate-45 bg-gradient-to-t from-purple-400/0 to-pink-300/80"
            style={{ top: "0%", left: "85%", animation: "pulse 1.5s ease-in-out infinite" }}
          />
          <div
            className="absolute h-2 w-0.5 -rotate-45 bg-gradient-to-t from-pink-400/0 to-purple-300/80"
            style={{ top: "0%", left: "10%", animation: "pulse 1.5s ease-in-out infinite 0.3s" }}
          />
          <div
            className="absolute h-1.5 w-0.5 rotate-12 bg-gradient-to-t from-blue-400/0 to-pink-300/70"
            style={{ top: "75%", left: "90%", animation: "pulse 1.5s ease-in-out infinite 0.6s" }}
          />
          <div
            className="absolute h-1.5 w-0.5 -rotate-12 bg-gradient-to-t from-purple-400/0 to-blue-300/70"
            style={{ top: "80%", left: "5%", animation: "pulse 1.5s ease-in-out infinite 0.9s" }}
          />
        </div>
      )}
      
      {/* MYTHIC: Eternal Courier's Light overlay - golden trails */}
      {flairVariant === 15 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-0.5 w-3 bg-gradient-to-r from-amber-400/80 to-amber-400/0"
            style={{ top: "20%", left: "75%", animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute h-0.5 w-2.5 bg-gradient-to-r from-yellow-300/70 to-yellow-300/0"
            style={{ top: "50%", left: "80%", animation: "pulse 2s ease-in-out infinite 0.4s" }}
          />
          <div
            className="absolute h-0.5 w-2 bg-gradient-to-r from-orange-400/60 to-orange-400/0"
            style={{ top: "75%", left: "70%", animation: "pulse 2s ease-in-out infinite 0.8s" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-yellow-200/90"
            style={{ top: "10%", left: "50%", animation: "ping 3s ease-in-out infinite" }}
          />
        </div>
      )}
      
      {/* MYTHIC: Voidtouched Presence overlay - void tendrils */}
      {flairVariant === 16 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-3 w-1 rounded-full bg-gradient-to-t from-purple-900/0 via-purple-600/60 to-purple-400/80"
            style={{ top: "-10%", left: "50%", animation: "pulse 2s ease-in-out infinite" }}
          />
          <div
            className="absolute h-2 w-0.5 rounded-full bg-gradient-to-b from-violet-900/0 to-violet-500/70"
            style={{ top: "85%", left: "25%", animation: "pulse 2s ease-in-out infinite 0.5s" }}
          />
          <div
            className="absolute h-2 w-0.5 rounded-full bg-gradient-to-b from-purple-900/0 to-purple-500/70"
            style={{ top: "85%", left: "75%", animation: "pulse 2s ease-in-out infinite 1s" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-violet-300/80"
            style={{ top: "5%", left: "20%", animation: "ping 1.5s ease-in-out infinite" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-purple-300/80"
            style={{ top: "5%", left: "80%", animation: "ping 1.5s ease-in-out infinite 0.75s" }}
          />
        </div>
      )}
      
      {/* MYTHIC: Primordial Resonance overlay - ancient runes */}
      {flairVariant === 17 && showFlair && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute h-1.5 w-1.5 rounded-full bg-emerald-300/80"
            style={{ top: "0%", left: "50%", animation: "ping 2.5s ease-in-out infinite" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-teal-400/70"
            style={{ top: "50%", left: "0%", animation: "ping 2.5s ease-in-out infinite 0.6s" }}
          />
          <div
            className="absolute h-1 w-1 rounded-full bg-green-400/70"
            style={{ top: "50%", left: "95%", animation: "ping 2.5s ease-in-out infinite 1.2s" }}
          />
          <div
            className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400/60"
            style={{ top: "95%", left: "50%", animation: "ping 2.5s ease-in-out infinite 1.8s" }}
          />
          {/* Rune circle effect */}
          <div
            className="absolute inset-0 rounded-full border border-emerald-400/30"
            style={{ animation: "pulse 3s ease-in-out infinite" }}
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
