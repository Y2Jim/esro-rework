"use client"

import type { PartyMember } from "@/lib/types"
import { getTitleClass } from "@/lib/rarity"
import { cn } from "@/lib/cn"

const statusTone: Record<PartyMember["status"], string> = {
  ready: "text-[color:var(--color-green)]",
  idle: "text-[color:var(--color-cyan)]",
  offline: "text-[color:var(--color-muted)]",
  deployed: "text-[color:var(--color-amber)]",
}

export function PartySlot({
  member,
  slot,
}: {
  member: PartyMember | null
  slot: number
}) {
  if (!member) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-[color:var(--color-border-soft)] bg-[color:var(--color-panel)]/30 px-3 py-2 text-left transition-colors hover:border-[color:var(--color-border)]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-dashed border-[color:var(--color-border-soft)] text-[16px] text-[color:var(--color-muted-2)]">
            +
          </div>
          <div className="leading-tight">
            <div className="text-[11px] text-[color:var(--color-muted)]">
              slot {slot} · empty
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-muted-2)]">
              send invite
            </div>
          </div>
        </div>
        <span className="text-[9.5px] uppercase tracking-[0.25em] text-[color:var(--color-green)]">
          invite
        </span>
      </button>
    )
  }

  const titleCls = member.titleRarity 
    ? getTitleClass(member.titleRarity) 
    : "text-[color:var(--color-muted)]"

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border bg-[color:var(--color-panel)]/50 px-3 py-2",
        member.leader
          ? "border-[color:var(--color-green-muted)]/50"
          : "border-[color:var(--color-border-soft)]",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-[13px]",
          member.leader
            ? "border-[color:var(--color-green)] text-[color:var(--color-green)] text-glow-green"
            : "border-[color:var(--color-border)] text-[color:var(--color-green-muted)]",
        )}
      >
        {member.leader ? "✦" : "◈"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-[12px] text-[color:var(--color-foreground)] text-glow-soft">
              {member.handle}
            </span>
            {member.leader && (
              <span className="text-[8.5px] uppercase tracking-[0.25em] text-[color:var(--color-green)]">
                lead
              </span>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 text-[9px] uppercase tracking-[0.22em]",
              statusTone[member.status],
            )}
          >
            {member.status}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[9px] uppercase tracking-[0.22em]">
          {member.title && <span className={titleCls}>{member.title}</span>}
          {member.title && (
            <span className="text-[color:var(--color-muted-2)]">·</span>
          )}
          <span className="text-[color:var(--color-muted)]">{member.role}</span>
        </div>
      </div>
    </div>
  )
}
