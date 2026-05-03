import { EsroLogo } from "@/components/brand/esro-logo"

/**
 * Large faint background emblem. Sits behind all screen content.
 * Must never hurt legibility.
 */
export function Watermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.05]"
    >
      <EsroLogo size={280} variant="pixel" muted />
    </div>
  )
}
