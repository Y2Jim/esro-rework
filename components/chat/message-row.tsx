import type { ChatMessage, Rarity } from "@/lib/types"
import { rarityColor, rarityAnimation, rarityBorder, rarityBg } from "@/lib/rarity"
import { cn } from "@/lib/cn"

/** Map specific transcendent titles to their unique animation classes */
const TRANSCENDENT_TITLE_ANIMATIONS: Record<string, string> = {
  "Myth of the Relay Sea": "title-relay-sea",
  "Shardheart Ascendant": "title-shardheart",
  "Eternal Courier": "title-eternal-courier",
  "Voidtouched Oracle": "title-voidtouched",
  "Primordial Flame": "title-primordial-flame",
  "Astral Wayfarer": "title-silence-stars",
  "Dreamer Unchained": "title-dreamer-unchained",
  "Ashen Sovereign": "title-ashen-sovereign",
}

function getAnimationClass(title: string | undefined, rarity: Rarity | undefined): string {
  if (!rarity) return ""
  // Admin titles always use admin animation
  if (rarity === "admin") {
    return rarityAnimation[rarity]
  }
  // Check for unique transcendent animations first
  if (rarity === "mythic" && title && TRANSCENDENT_TITLE_ANIMATIONS[title]) {
    return TRANSCENDENT_TITLE_ANIMATIONS[title]
  }
  // Fall back to standard rarity animation
  return rarityAnimation[rarity]
}

function formatClock(ts: number) {
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, "0")
  const m = d.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}

const logTypeStyles: Record<string, { tag: string; content: string }> = {
  expedition: { tag: "text-[color:var(--color-cyan)]", content: "text-[color:var(--color-foreground)]" },
  party: { tag: "text-[color:var(--color-green)]", content: "text-[color:var(--color-foreground)]" },
  skill: { tag: "text-[color:var(--color-violet-bright)]", content: "text-[color:var(--color-foreground)]" },
  recovery: { tag: "text-[color:var(--color-amber)]", content: "text-[color:var(--color-foreground)]" },
  system: { tag: "text-[color:var(--color-muted)]", content: "text-[color:var(--color-foreground)]/85" },
}

function parseLogType(body: string): { type: string; content: string } {
  const match = body.match(/^\[(\w+)\]\s*(.*)$/)
  if (match) {
    return { type: match[1].toLowerCase(), content: match[2] }
  }
  return { type: "system", content: body }
}

export function MessageRow({ msg, isLogChannel }: { msg: ChatMessage; isLogChannel?: boolean }) {
  // Special LOG channel rendering
  if (isLogChannel && msg.kind === "system") {
    const { type, content } = parseLogType(msg.body)
    const style = logTypeStyles[type] || logTypeStyles.system
    return (
      <div className="flex items-start gap-2.5 px-3 py-2 text-[14px] leading-relaxed">
        <span className="shrink-0 pt-0.5 text-[14px] tabular-nums text-[color:var(--color-muted)]">
          {formatClock(msg.at)}
        </span>
        <span className={cn("shrink-0 pt-0.5 text-[14px] uppercase tracking-[0.15em] font-semibold", style.tag)}>
          {type}
        </span>
        <span className={cn("flex-1", style.content)}>{content}</span>
      </div>
    )
  }

  if (msg.kind === "system") {
    return (
      <div className="flex items-baseline gap-2 px-3 py-0.5 text-[15px] leading-snug text-[color:var(--color-cyan-muted)]">
        <span className="shrink-0 text-[13px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        <span className="uppercase tracking-[0.22em] text-[color:var(--color-cyan)]">
          ::
        </span>
        <span className="italic">{msg.body}</span>
      </div>
    )
  }

  if (msg.kind === "whisper") {
    return (
      <div className="px-3 py-1.5 text-[14px] leading-relaxed">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-[14px] tabular-nums text-[color:var(--color-muted)]">
            {formatClock(msg.at)}
          </span>
          <span className="font-semibold text-[color:var(--color-danger)]">{msg.handle}</span>
          <span className="rounded-sm border border-[color:var(--color-danger-muted)]/40 bg-[color:var(--color-danger)]/10 px-1.5 py-[1px] text-[13px] uppercase tracking-[0.15em] text-[color:var(--color-danger-muted)]">
            whisper
          </span>
        </div>
        <div className="mt-0.5 pl-[42px] text-[color:var(--color-foreground)]/85">{msg.body}</div>
      </div>
    )
  }

  const titleAnimClass = getAnimationClass(msg.title, msg.titleRarity)
  // For mythic with unique animation, don't apply colorClass (animation handles colors)
  const hasUniqueAnim = msg.titleRarity === "mythic" && msg.title && TRANSCENDENT_TITLE_ANIMATIONS[msg.title]
  const titleColorClass = hasUniqueAnim ? "" : (msg.titleRarity ? rarityColor[msg.titleRarity] : "text-[color:var(--color-muted)]")
  const titleBorderClass = msg.titleRarity ? rarityBorder[msg.titleRarity] : "border-[color:var(--color-border)]"
  const titleBgClass = msg.titleRarity ? rarityBg[msg.titleRarity] : "bg-[color:var(--color-panel-2)]/80"

  return (
    <div className={cn(
      "px-3 py-1.5 text-[14px] leading-relaxed",
      msg.pinned && "border-l-2 border-[color:var(--color-amber)] bg-[color:var(--color-amber)]/5"
    )}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="shrink-0 text-[14px] tabular-nums text-[color:var(--color-muted-2)]">
          {formatClock(msg.at)}
        </span>
        {msg.pinned && (
          <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-amber)]">
            pinned
          </span>
        )}
        <span className="font-semibold text-[color:var(--color-violet-bright)]">
          {msg.handle}
        </span>
        {msg.title && (
          <span
            className={cn(
              "rounded-sm border px-1.5 py-[2px] text-[13px] uppercase tracking-[0.15em] font-medium",
              titleColorClass,
              titleAnimClass,
              titleBorderClass,
              titleBgClass,
            )}
          >
            {msg.title}
          </span>
        )}
      </div>
      <div className="mt-1 pl-[42px] text-[color:var(--color-foreground)]">
        {msg.body}
      </div>
    </div>
  )
}
