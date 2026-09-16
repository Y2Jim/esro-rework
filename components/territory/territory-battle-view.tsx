"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEsroStore } from "@/store/use-esro-store"
import { PixelAvatar } from "@/components/avatar/pixel-avatar"
import { cn } from "@/lib/cn"
import { getFactionById } from "@/lib/world-map"
import type { BattleLine, StoredGroup, RaceId } from "@/lib/types"

/** Playback cadence for the cinematic log reveal. */
const LINE_MS = 900

function sideColor(factionId: RaceId | null, monster?: boolean): string {
  if (monster) return "var(--color-danger)"
  return getFactionById(factionId)?.color ?? "var(--color-muted)"
}

function sideName(factionId: RaceId | null, monster: boolean | undefined, fallback: string): string {
  if (monster) return "Feral Garrison"
  return getFactionById(factionId)?.name ?? fallback
}

function shortHandle(handle: string) {
  const base = handle.replace(/^@/, "")
  return base.length > 10 ? base.slice(0, 10) : base
}

/** A compact roster column for one side of the battle. */
function Roster({
  group,
  color,
  align,
}: {
  group: StoredGroup
  color: string
  align: "left" | "right"
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", align === "right" && "items-end")}>
      {group.members.map((m, i) => (
        <div
          key={`${m.handle}-${i}`}
          className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse")}
        >
          {m.avatar ? (
            <PixelAvatar config={m.avatar} size="sm" showFlair={false} />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded border text-[13px]"
              style={{ borderColor: color, color }}
              aria-hidden="true"
            >
              {group.monster ? "☠" : "◆"}
            </div>
          )}
          <div className={cn("leading-tight", align === "right" && "text-right")}>
            <div className="text-[12px] text-[color:var(--color-text)]">{shortHandle(m.handle)}</div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              {m.role}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HpBar({ value, color, flip }: { value: number; color: string; flip?: boolean }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-panel)]"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  )
}

export function TerritoryBattleView() {
  const battle = useEsroStore((s) => s.activeBattle)
  const resolveTerritoryBattle = useEsroStore((s) => s.resolveTerritoryBattle)

  const [revealed, setRevealed] = useState(1)
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const log: BattleLine[] = useMemo(() => battle?.log ?? [], [battle])

  // Reset playback whenever a new battle mounts.
  useEffect(() => {
    setRevealed(1)
    setDone(false)
  }, [battle?.nodeId, battle?.kind])

  // Drive the cinematic reveal one line at a time.
  useEffect(() => {
    if (!battle) return
    if (revealed >= log.length) {
      setDone(true)
      return
    }
    timerRef.current = setInterval(() => {
      setRevealed((r) => {
        if (r >= log.length) {
          if (timerRef.current) clearInterval(timerRef.current)
          return r
        }
        return r + 1
      })
    }, LINE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [battle, log.length, revealed])

  const feedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    feedRef.current?.scrollTo({ top: 0 })
  }, [revealed])

  if (!battle) return null

  const current = log[Math.min(revealed, log.length) - 1] ?? log[0]
  const attackerColor = sideColor(battle.attacker.factionId, false)
  const defenderColor = sideColor(battle.defender.factionId, battle.defender.monster)
  const attackerName = sideName(battle.attacker.factionId, false, "Invaders")
  const defenderName = sideName(battle.defender.factionId, battle.defender.monster, "Defenders")
  const win = battle.result === "win"

  const kindLabel =
    battle.kind === "base_assault" ? "Base Assault" : "Territory Claim"

  return (
    <div className="flex h-full flex-col bg-[color:var(--color-bg)]">
      {/* Header */}
      <div className="border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-danger)]">
              {kindLabel}
            </div>
            <h2 className="text-[15px] uppercase tracking-wider text-[color:var(--color-text)]">
              {battle.nodeLabel}
            </h2>
          </div>
          <div className="text-right text-[11px] uppercase tracking-wider text-[color:var(--color-muted)]">
            <span style={{ color: attackerColor }}>{attackerName}</span>
            {" vs "}
            <span style={{ color: defenderColor }}>{defenderName}</span>
          </div>
        </div>
      </div>

      {/* HP + rosters */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span style={{ color: attackerColor }}>{attackerName}</span>
            <span className="text-[color:var(--color-muted)]">PWR {battle.attacker.group.power}</span>
          </div>
          <HpBar value={current?.attackerHp ?? 1} color={attackerColor} />
          <Roster group={battle.attacker.group} color={attackerColor} align="left" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span className="text-[color:var(--color-muted)]">PWR {battle.defender.group.power}</span>
            <span style={{ color: defenderColor }}>{defenderName}</span>
          </div>
          <HpBar value={current?.defenderHp ?? 1} color={defenderColor} flip />
          <Roster group={battle.defender.group} color={defenderColor} align="right" />
        </div>
      </div>

      {/* Battle log feed */}
      <div
        ref={feedRef}
        className="min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] px-4 py-3"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {log.slice(0, revealed).reverse().map((line, idx) => {
              const realIdx = revealed - 1 - idx
              const color =
                line.side === "attacker"
                  ? attackerColor
                  : line.side === "defender"
                    ? defenderColor
                    : "var(--color-muted)"
              return (
                <motion.div
                  key={realIdx}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: idx === 0 ? 1 : 0.55, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2 text-[12px]"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="text-[color:var(--color-text)]">{line.text}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Result / continue */}
      <div className="border-t border-[color:var(--color-border)] p-4">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div
              className="rounded-lg border p-3 text-center"
              style={{
                borderColor: win ? "var(--color-success)" : "var(--color-danger)",
                backgroundColor: win
                  ? "color-mix(in oklab, var(--color-success) 12%, transparent)"
                  : "color-mix(in oklab, var(--color-danger) 12%, transparent)",
              }}
            >
              <div
                className="text-[16px] uppercase tracking-[0.2em]"
                style={{ color: win ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {win ? "Victory" : "Repelled"}
              </div>
              <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
                {win
                  ? battle.kind === "base_assault"
                    ? `${defenderName}'s base takes heavy damage.`
                    : `${attackerName} claim ${battle.nodeLabel}.`
                  : `${attackerName} fall back to friendly territory.`}
              </p>
              {win && battle.kind === "base_assault" && (
                <div className="mt-2 text-[11px] text-[color:var(--color-amber)]">
                  {battle.integrityLost != null && `-${battle.integrityLost} integrity`}
                  {battle.buildingsHit && battle.buildingsHit.length > 0 &&
                    ` · ${battle.buildingsHit.length} building${battle.buildingsHit.length > 1 ? "s" : ""} disabled`}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => resolveTerritoryBattle()}
              className="w-full rounded-lg border border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/15 py-2.5 text-[13px] uppercase tracking-wider text-[color:var(--color-accent)] transition-colors hover:bg-[color:var(--color-accent)]/25"
            >
              Continue
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Engagement in progress…
            </div>
            <button
              type="button"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current)
                setRevealed(log.length)
                setDone(true)
              }}
              className="rounded border border-[color:var(--color-border)] px-2 py-1 text-[11px] uppercase tracking-wider text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
