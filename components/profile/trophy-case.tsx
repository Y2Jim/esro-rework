"use client"

import { useMemo } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { rarityColor, rarityLabel, rarityOrder } from "@/lib/rarity"
import { getCreature, packContribution } from "@/lib/bestiary"
import { cn } from "@/lib/utils"

/**
 * Trophy case: the player's personal bests, derived from data already tracked
 * rather than stored separately, so a trophy can never drift out of sync with
 * the log it came from.
 */

interface Trophy {
  /** Short label for the achievement slot. */
  slot: string
  /** The headline value, or null when nothing qualifies yet. */
  value: string | null
  /** Supporting detail under the value. */
  detail?: string
  /** Tailwind class colouring the value, used for rarity tinting. */
  tone?: string
  /** Shown in place of the value when the slot is empty. */
  empty: string
}

function TrophyCard({ trophy }: { trophy: Trophy }) {
  const filled = trophy.value !== null
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border p-3",
        filled
          ? "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
          : "border-dashed border-[color:var(--color-border)]/60 bg-transparent",
      )}
    >
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-muted-2)]">{trophy.slot}</span>
      {filled ? (
        <>
          <span className={cn("text-[14px] leading-tight", trophy.tone ?? "text-[color:var(--color-text)]")}>
            {trophy.value}
          </span>
          {trophy.detail ? (
            <span className="text-[11px] text-[color:var(--color-muted-2)]">{trophy.detail}</span>
          ) : null}
        </>
      ) : (
        <span className="text-[13px] italic text-[color:var(--color-muted-2)]">{trophy.empty}</span>
      )}
    </div>
  )
}

export function TrophyCase() {
  const profile = useEsroStore((s) => s.profile)
  const fishingLog = useEsroStore((s) => s.fishingLog)
  const expeditions = useEsroStore((s) => s.expeditions)

  const trophies = useMemo<Trophy[]>(() => {
    // Best fish: FishingCatch has no weight, so rank by rarity and break ties
    // on the earlier catch so the record feels earned rather than re-rolled.
    const bestFish = (fishingLog ?? []).reduce<(typeof fishingLog)[number] | null>((best, c) => {
      if (!best) return c
      const d = rarityOrder.indexOf(c.rarity) - rarityOrder.indexOf(best.rarity)
      return d > 0 || (d === 0 && c.at < best.at) ? c : best
    }, null)

    // Best mount: highest carry among tamed beasts.
    const bestMount = (profile.tamedBeasts ?? [])
      .map((id) => getCreature(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .reduce<{ name: string; carry: number; rarity: (typeof rarityOrder)[number] } | null>((best, c) => {
        const carry = packContribution(c).carry
        return !best || carry > best.carry ? { name: c.name, carry, rarity: c.rarity } : best
      }, null)

    // Route record: best haul across every route that has been run.
    const records = Object.entries(profile.routeRecords ?? {})
    const bestRoute = records.reduce<{ id: string; haul: number; items: number } | null>((best, [id, r]) => {
      return !best || r.bestHaul > best.haul ? { id, haul: r.bestHaul, items: r.bestItems } : best
    }, null)
    const routeName = bestRoute ? (expeditions.find((e) => e.id === bestRoute.id)?.label ?? bestRoute.id) : null
    const totalRuns = records.reduce((n, [, r]) => n + r.runs, 0)

    // Bestiary completion, and the rarest thing met.
    const bestiary = profile.bestiary ?? {}
    const discovered = Object.keys(bestiary)
    const rarestSeen = discovered
      .map((id) => getCreature(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .reduce<{ name: string; rarity: (typeof rarityOrder)[number] } | null>((best, c) => {
        return !best || rarityOrder.indexOf(c.rarity) > rarityOrder.indexOf(best.rarity)
          ? { name: c.name, rarity: c.rarity }
          : best
      }, null)
    const totalDefeats = Object.values(bestiary).reduce((n, r) => n + r.defeats, 0)

    return [
      {
        slot: "Best catch",
        value: bestFish ? bestFish.label : null,
        detail: bestFish ? rarityLabel[bestFish.rarity] : undefined,
        tone: bestFish ? rarityColor[bestFish.rarity] : undefined,
        empty: "No catch logged",
      },
      {
        slot: "Best mount",
        value: bestMount ? bestMount.name : null,
        detail: bestMount ? `+${bestMount.carry} carry` : undefined,
        tone: bestMount ? rarityColor[bestMount.rarity] : undefined,
        empty: "None tamed",
      },
      {
        slot: "Route record",
        value: routeName,
        detail: bestRoute ? `${Math.round(bestRoute.haul * 100)}% haul · ${bestRoute.items} items` : undefined,
        empty: "No runs completed",
      },
      {
        slot: "Runs completed",
        value: totalRuns > 0 ? String(totalRuns) : null,
        detail: totalRuns > 0 ? `${records.length} route${records.length === 1 ? "" : "s"}` : undefined,
        empty: "No runs completed",
      },
      {
        slot: "Rarest sighting",
        value: rarestSeen ? rarestSeen.name : null,
        detail: rarestSeen ? rarityLabel[rarestSeen.rarity] : undefined,
        tone: rarestSeen ? rarityColor[rarestSeen.rarity] : undefined,
        empty: "Bestiary empty",
      },
      {
        slot: "Confirmed kills",
        value: totalDefeats > 0 ? String(totalDefeats) : null,
        detail: discovered.length > 0 ? `${discovered.length} species logged` : undefined,
        empty: "No engagements",
      },
    ]
  }, [profile, fishingLog, expeditions])

  const earned = trophies.filter((t) => t.value !== null).length

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-baseline justify-between">
        <h3 className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted)]">Trophy case</h3>
        <span className="text-[11px] text-[color:var(--color-muted-2)]">
          {earned}/{trophies.length} earned
        </span>
      </header>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {trophies.map((t) => (
          <TrophyCard key={t.slot} trophy={t} />
        ))}
      </div>
    </section>
  )
}
