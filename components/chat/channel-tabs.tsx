"use client"

import { channels } from "@/lib/mock-data"
import { useEsroStore } from "@/store/use-esro-store"
import { IconRail, type IconRailItem } from "@/components/shell/icon-rail"
import type { ChannelId } from "@/lib/types"

const channelStyle: Record<ChannelId, { accentClass: string; activeBgClass: string; accentBar: string; icon: string; hover: string }> = {
  PUBLIC: { accentClass: "text-[color:var(--color-foreground)]", activeBgClass: "bg-[color:var(--color-foreground)]/10", accentBar: "var(--color-foreground)", icon: "◫", hover: "hover-foreground" },
  TRADE: { accentClass: "text-[color:var(--color-amber)]", activeBgClass: "bg-[color:var(--color-amber)]/10", accentBar: "var(--color-amber)", icon: "⇄", hover: "hover-amber" },
  PARTY: { accentClass: "text-[color:var(--color-cyan)]", activeBgClass: "bg-[color:var(--color-cyan)]/10", accentBar: "var(--color-cyan)", icon: "⋈", hover: "hover-cyan" },
  FACTION: { accentClass: "text-[color:var(--color-lilac)]", activeBgClass: "bg-[color:var(--color-lilac)]/10", accentBar: "var(--color-lilac)", icon: "⬡", hover: "hover-lilac" },
  GAME: { accentClass: "text-[color:var(--color-green)]", activeBgClass: "bg-[color:var(--color-green)]/10", accentBar: "var(--color-green)", icon: "▸", hover: "hover-green" },
  HELP: { accentClass: "text-[color:var(--color-violet-bright)]", activeBgClass: "bg-[color:var(--color-violet)]/10", accentBar: "var(--color-violet-bright)", icon: "?", hover: "hover-violet" },
  LOG: { accentClass: "text-[color:var(--color-muted)]", activeBgClass: "bg-[color:var(--color-muted)]/10", accentBar: "var(--color-muted)", icon: "▤", hover: "hover-muted" },
  UNDERCHAT: { accentClass: "text-[color:var(--color-danger)]", activeBgClass: "bg-[color:var(--color-danger)]/10", accentBar: "var(--color-danger)", icon: "◎", hover: "hover-danger" },
}

export function ChannelTabs() {
  const current = useEsroStore((s) => s.channel)
  const setChannel = useEsroStore((s) => s.setChannel)
  const unread = useEsroStore((s) => s.unread)

  const items: IconRailItem[] = channels.map((c) => {
    const style = channelStyle[c.id]
    return {
      id: c.id,
      label: c.label,
      icon: style.icon,
      accentClass: style.accentClass,
      activeBgClass: style.activeBgClass,
      accentBar: style.accentBar,
      hoverClass: style.hover,
      badge: unread[c.id] ?? 0,
      dot: c.restricted,
      dotClass: "bg-[color:var(--color-muted-2)]",
    }
  })

  return (
    <IconRail
      railId="channels"
      ariaLabel="channels"
      className="border-r border-[color:var(--color-border-soft)] bg-[color:var(--color-bg)]/85 backdrop-blur"
      items={items}
      activeId={current}
      onSelect={(id) => setChannel(id as ChannelId)}
    />
  )
}
