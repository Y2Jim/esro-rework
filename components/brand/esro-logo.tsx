import { cn } from "@/lib/cn"

/**
 * A simplified, DOS-inspired emblem for ESRO.
 *
 * We deliberately avoid literal text inside the mark — the UI renders
 * the "ESRO" wordmark separately. This shape reads as a relay star /
 * broadcast ring / archive diamond combined.
 */
export function EsroLogo({
  className,
  size = 72,
  muted = false,
}: {
  className?: string
  size?: number
  muted?: boolean
}) {
  const stroke = muted
    ? "color-mix(in oklab, var(--color-violet) 30%, transparent)"
    : "var(--color-violet-bright)"
  const core = muted
    ? "color-mix(in oklab, var(--color-violet) 40%, transparent)"
    : "var(--color-violet-bright)"
  const soft = muted
    ? "color-mix(in oklab, var(--color-lilac) 20%, transparent)"
    : "var(--color-lilac)"

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("block", className)}
      role="img"
      aria-label="ESRO emblem"
      shapeRendering="crispEdges"
    >
      {/* outer broadcast ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.55"
      />
      {/* inner ring */}
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        opacity="0.8"
      />

      {/* diamond frame */}
      <path
        d="M32 8 L56 32 L32 56 L8 32 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
      />

      {/* inner diamond */}
      <path
        d="M32 16 L48 32 L32 48 L16 32 Z"
        fill="none"
        stroke={soft}
        strokeWidth="1"
        opacity="0.7"
      />

      {/* four-point relay star (pixel style) */}
      <g fill={core}>
        {/* core */}
        <rect x="30" y="30" width="4" height="4" />
        {/* up */}
        <rect x="31" y="22" width="2" height="6" />
        <rect x="30" y="20" width="4" height="2" />
        {/* down */}
        <rect x="31" y="36" width="2" height="6" />
        <rect x="30" y="42" width="4" height="2" />
        {/* left */}
        <rect x="22" y="31" width="6" height="2" />
        <rect x="20" y="30" width="2" height="4" />
        {/* right */}
        <rect x="36" y="31" width="6" height="2" />
        <rect x="42" y="30" width="2" height="4" />
      </g>

      {/* corner ticks */}
      <g stroke={stroke} strokeWidth="1" opacity="0.7">
        <line x1="6" y1="6" x2="10" y2="6" />
        <line x1="6" y1="6" x2="6" y2="10" />
        <line x1="58" y1="6" x2="54" y2="6" />
        <line x1="58" y1="6" x2="58" y2="10" />
        <line x1="6" y1="58" x2="10" y2="58" />
        <line x1="6" y1="58" x2="6" y2="54" />
        <line x1="58" y1="58" x2="54" y2="58" />
        <line x1="58" y1="58" x2="58" y2="54" />
      </g>
    </svg>
  )
}
