"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { FISHING_SPOTS, getFish } from "@/config/fishing"
import { rarityBorder, rarityColor, rarityGlow, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"

export function FishingTab() {
  const fishing = useEsroStore((s) => s.fishing)
  const fishingLog = useEsroStore((s) => s.fishingLog)
  const castLine = useEsroStore((s) => s.castLine)
  const triggerBite = useEsroStore((s) => s.triggerBite)
  const setHook = useEsroStore((s) => s.setHook)
  const reelIn = useEsroStore((s) => s.reelIn)
  const hasSkillUnlock = useEsroStore((s) => s.hasSkillUnlock)

  const canFish = true || hasSkillUnlock("fishing_basic")
  const [spotId, setSpotId] = useState(FISHING_SPOTS[0].id)
  // Drives the shrinking reaction bar during the bite window.
  const [remaining, setRemaining] = useState(1)

  const hooked = fishing.fishId ? getFish(fishing.fishId) : undefined

  // The cast delay is deliberately random so the strike can't be pre-timed.
  const biteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (fishing.phase !== "casting") return
    biteTimer.current = setTimeout(triggerBite, 1200 + Math.random() * 2600)
    return () => {
      if (biteTimer.current) clearTimeout(biteTimer.current)
    }
  }, [fishing.phase, triggerBite])

  // Close the window if the player never strikes.
  useEffect(() => {
    if (fishing.phase !== "bite" || fishing.biteAt === null) return

    let frame = 0
    const tick = () => {
      const left = 1 - (Date.now() - (fishing.biteAt as number)) / fishing.windowMs
      if (left <= 0) {
        setRemaining(0)
        reelIn()
        return
      }
      setRemaining(left)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [fishing.phase, fishing.biteAt, fishing.windowMs, reelIn])

  const isBusy = fishing.phase === "casting" || fishing.phase === "bite"

  if (!canFish) {
    return (
      <div className="flex flex-col items-center gap-3 rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-10 text-center">
        <Image
          src="/fishing/bobber.png"
          alt=""
          width={48}
          height={48}
          className="opacity-30 [image-rendering:pixelated]"
        />
        <p className="text-[15px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Fishing locked
        </p>
        <p className="max-w-xs text-[14px] leading-relaxed text-[color:var(--color-muted)]">
          Reach <span className="text-[color:var(--color-cyan)]">Fishing level 5</span> to earn a rod
          and start working the relay waters.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Spot selection */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Fishing spot
        </p>
        <div className="flex flex-col gap-1.5">
          {FISHING_SPOTS.map((spot) => {
            const locked = !!spot.requires && !hasSkillUnlock(spot.requires)
            const active = spot.id === spotId
            return (
              <button
                key={spot.id}
                type="button"
                disabled={locked || isBusy}
                onClick={() => setSpotId(spot.id)}
                className={cn(
                  "flex flex-col gap-0.5 rounded border px-3 py-2 text-left transition-colors hover-cyan",
                  active
                    ? "border-[color:var(--color-cyan)]/60 bg-[color:var(--color-cyan)]/10"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-surface)]",
                  (locked || isBusy) && "opacity-40",
                )}
              >
                <span
                  className={cn(
                    "text-[15px] uppercase tracking-wider",
                    active ? "text-[color:var(--color-cyan)]" : "text-[color:var(--color-text)]",
                  )}
                >
                  {spot.label}
                  {locked && " — locked"}
                </span>
                <span className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
                  {locked ? "Requires Fishing level 10." : spot.blurb}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* The water: sprite stage */}
      <div
        className={cn(
          "relative flex h-44 flex-col items-center justify-center overflow-hidden rounded border bg-[color:var(--color-surface)]",
          hooked && fishing.phase === "landed"
            ? rarityBorder[hooked.rarity]
            : "border-[color:var(--color-border)]",
        )}
      >
        {/* Idle / casting: the bobber waits on the line */}
        {(fishing.phase === "idle" || fishing.phase === "casting") && (
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/fishing/bobber.png"
              alt="Fishing bobber"
              width={40}
              height={40}
              className={cn(
                "[image-rendering:pixelated]",
                fishing.phase === "casting" && "animate-bounce",
              )}
            />
            <p className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
              {fishing.phase === "casting" ? "Waiting for a bite…" : "Line is dry"}
            </p>
          </div>
        )}

        {/* Bite: hide what it is, show only the urgency */}
        {fishing.phase === "bite" && (
          <div className="flex w-full flex-col items-center gap-3 px-6">
            <p className="text-[20px] uppercase tracking-widest text-[color:var(--color-cyan)]">
              Bite!
            </p>
            <div className="h-2 w-full overflow-hidden rounded bg-[color:var(--color-border)]">
              <div
                className="h-full bg-[color:var(--color-cyan)]"
                style={{ width: `${Math.max(0, remaining) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Landed: reveal the sprite */}
        {fishing.phase === "landed" && hooked && (
          <div className="flex flex-col items-center gap-1.5">
            <Image
              src={hooked.sprite}
              alt={hooked.label}
              width={92}
              height={92}
              className={cn("[image-rendering:pixelated]", rarityGlow[hooked.rarity])}
            />
            <p className={cn("text-[17px] uppercase tracking-wider", rarityColor[hooked.rarity])}>
              {hooked.label}
              {fishing.lastQty > 1 && ` ×${fishing.lastQty}`}
            </p>
            <p className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
              {rarityLabel[hooked.rarity]}
            </p>
            <p className="max-w-xs text-center text-[13px] leading-relaxed text-[color:var(--color-muted)]">
              {hooked.description}
            </p>
          </div>
        )}

        {/* Escaped */}
        {fishing.phase === "escaped" && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[28px] text-[color:var(--color-muted)]">〰</span>
            <p className="text-[15px] uppercase tracking-wider text-[color:var(--color-muted)]">
              It got away
            </p>
            <p className="text-[13px] text-[color:var(--color-muted)]">Strike sooner next time.</p>
          </div>
        )}

        {fishing.streak > 1 && (
          <span className="absolute right-2 top-2 rounded bg-[color:var(--color-amber)]/15 px-1.5 py-0.5 text-[13px] uppercase tracking-wider text-[color:var(--color-amber)]">
            {fishing.streak} streak
          </span>
        )}
      </div>

      {/* Primary action */}
      {fishing.phase === "bite" ? (
        <button
          type="button"
          onClick={setHook}
          className="rounded bg-[color:var(--color-cyan)]/20 px-4 py-3 text-[17px] uppercase tracking-widest text-[color:var(--color-cyan)] transition-colors hover:bg-[color:var(--color-cyan)]/30"
        >
          Set hook
        </button>
      ) : (
        <button
          type="button"
          disabled={fishing.phase === "casting"}
          onClick={() => castLine(spotId)}
          className={cn(
            "rounded px-4 py-3 text-[17px] uppercase tracking-widest transition-colors",
            fishing.phase === "casting"
              ? "bg-[color:var(--color-surface)] text-[color:var(--color-muted)]"
              : "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/30",
          )}
        >
          {fishing.phase === "casting" ? "Line out…" : "Cast line"}
        </button>
      )}

      {/* Recent catches */}
      {fishingLog.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Recent catches
          </p>
          <div className="flex flex-col gap-1">
            {fishingLog.map((c, i) => {
              const def = getFish(c.fishId)
              return (
                <div
                  key={`${c.at}-${i}`}
                  className="flex items-center gap-2 rounded border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5"
                >
                  {def && (
                    <Image
                      src={def.sprite}
                      alt=""
                      width={24}
                      height={24}
                      className="[image-rendering:pixelated]"
                    />
                  )}
                  <span className={cn("flex-1 text-[14px]", rarityColor[c.rarity])}>{c.label}</span>
                  <span className="text-[13px] text-[color:var(--color-muted)]">×{c.qty}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
