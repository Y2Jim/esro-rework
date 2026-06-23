import Image from "next/image"
import { cn } from "@/lib/cn"

/**
 * ESRO emblem using the actual logo asset.
 * Supports both full and pixelated variants.
 */
export function EsroLogo({
  className,
  size = 72,
  variant = "full",
  muted = false,
}: {
  className?: string
  size?: number
  variant?: "full" | "pixel"
  muted?: boolean
}) {
  const src = variant === "pixel" ? "/images/esro-logo-pixel.png" : "/images/esro-logo.png"

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        muted && "opacity-40",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt="ESRO emblem"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}
