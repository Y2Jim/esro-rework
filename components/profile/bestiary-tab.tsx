"use client"

import { useEsroStore } from "@/store/use-esro-store"
import { CREATURES, CLASS_LABEL, TAMEABLE, packContribution, type Creature } from "@/lib/bestiary"
import { rarityColor, rarityLabel } from "@/lib/rarity"
import { cn } from "@/lib/cn"
import { PawPrint, Lock, Check } from "lucide-react"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Hand-rolled to match formatCreatedAt in profile-screen: toLocaleDateString
 * resolves differently on server and client and causes a hydration mismatch.
 */
function formatSeen(ts: number): string {
  const d = new Date(ts)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * The bestiary: what the squad has met in the field, and what is still out there.
 *
 * Undiscovered creatures stay listed as redacted rows for the same reason the
 * ritual codex shows locked entries — knowing something is out there is the
 * reason to go looking for it.
 */
export function BestiaryTab() {
  const profile = useEsroStore((s) => s.profile)
  // canTame/tameBeast are actions, so select them rather than calling through
  // a fresh store snapshot on every render.
  const canTame = useEsroStore((s) => s.canTame)
  const tameBeast = useEsroStore((s) => s.tameBeast)
  const setActiveMount = useEsroStore((s) => s.setActiveMount)

  if (!profile) return null

  const records = profile.bestiary ?? {}
  const tamed = profile.tamedBeasts ?? []
  const activeMount = profile.activeMount ?? null

  const discovered = CREATURES.filter((c) => records[c.id])
  const undiscovered = CREATURES.filter((c) => !records[c.id])

  const mount = activeMount ? CREATURES.find((c) => c.id === activeMount) : undefined
  const carry = mount ? packContribution(mount).carry : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Pack: the mount selector, and the one place carry is explained. */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            <PawPrint className="h-3.5 w-3.5" />
            Pack
          </div>
          <span className="text-[13px] text-[color:var(--color-muted)]">
            {mount ? (
              <>
                +{carry} carry <span className="text-[color:var(--color-muted-2)]">from {mount.name}</span>
              </>
            ) : (
              <span className="text-[color:var(--color-muted-2)]">travelling unmounted</span>
            )}
          </span>
        </div>

        {tamed.length === 0 ? (
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--color-muted-2)]">
            No beasts tamed. Pack animals are sighted on expeditions — tame one to add carry slots.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {/* Explicit unmounted option so the bonus can be turned off. */}
            <button
              type="button"
              onClick={() => setActiveMount(null)}
              className={cn(
                "rounded px-2 py-1 text-[13px] uppercase tracking-wider transition-colors hover-lilac",
                activeMount === null
                  ? "bg-[color:var(--color-lilac)]/15 text-[color:var(--color-lilac)]"
                  : "text-[color:var(--color-muted)]",
              )}
            >
              None
            </button>
            {tamed.map((id) => {
              const c = CREATURES.find((x) => x.id === id)
              if (!c) return null
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveMount(id)}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-[13px] transition-colors hover-lilac",
                    activeMount === id
                      ? "bg-[color:var(--color-lilac)]/15 text-[color:var(--color-lilac)]"
                      : "text-[color:var(--color-muted)]",
                  )}
                >
                  {activeMount === id && <Check className="h-3 w-3 shrink-0" />}
                  {c.name}
                  <span className="text-[color:var(--color-muted-2)]">+{packContribution(c).carry}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Field records */}
      <div className="rounded-lg border border-[color:var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="text-[14px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Field records
          </div>
          <span className="text-[13px] text-[color:var(--color-muted-2)]">
            {discovered.length}/{CREATURES.length}
          </span>
        </div>

        {discovered.length === 0 ? (
          <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--color-muted-2)]">
            Nothing recorded yet. Creatures are logged the first time you meet them on an expedition.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-1.5">
            {discovered.map((c) => (
              <CreatureRow
                key={c.id}
                creature={c}
                encounters={records[c.id]!.encounters}
                defeats={records[c.id]!.defeats}
                firstSeen={records[c.id]!.firstSeen}
                tamed={tamed.includes(c.id)}
                tameState={canTame(c.id)}
                onTame={() => tameBeast(c.id)}
              />
            ))}
          </div>
        )}

        {undiscovered.length > 0 && (
          <div className="mt-2 border-t border-[color:var(--color-border)] pt-2">
            <div className="text-[13px] uppercase tracking-wider text-[color:var(--color-muted-2)]">
              Unrecorded ({undiscovered.length})
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              {undiscovered.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-muted-2)]"
                >
                  <Lock className="h-3 w-3 shrink-0" />
                  {/* Habitat is the hint: enough to hunt for, not a spoiler. */}
                  <span className="truncate">{c.habitat}</span>
                  <span className="ml-auto shrink-0">{CLASS_LABEL[c.kind]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tameable summary, so the player knows the pack ceiling exists. */}
      <p className="px-1 text-[13px] leading-relaxed text-[color:var(--color-muted-2)]">
        {TAMEABLE.length} of {CREATURES.length} creatures can be tamed as pack animals. Taming requires
        the Beast Tending skill, and the sturdiest beasts need its second tier.
      </p>
    </div>
  )
}

function CreatureRow({
  creature,
  encounters,
  defeats,
  firstSeen,
  tamed,
  tameState,
  onTame,
}: {
  creature: Creature
  encounters: number
  defeats: number
  firstSeen: number
  tamed: boolean
  tameState: { ok: boolean; reason?: string }
  onTame: () => void
}) {
  const pack = creature.pack

  return (
    <div className="rounded bg-[color:var(--color-panel)]/50 px-2 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-[14px]", rarityColor(creature.rarity))}>{creature.name}</span>
        <span className="shrink-0 text-[12px] text-[color:var(--color-muted-2)]">
          {rarityLabel(creature.rarity)} · {CLASS_LABEL[creature.kind]}
        </span>
      </div>

      <div className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
        {creature.notes}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[color:var(--color-muted-2)]">
        <span>{creature.habitat}</span>
        <span>·</span>
        <span>seen ×{encounters}</span>
        {/* Only mention kills once there are any; "felled ×0" reads like a bug. */}
        {defeats > 0 && (
          <>
            <span>·</span>
            <span>felled ×{defeats}</span>
          </>
        )}
        <span>·</span>
        <span>first {formatSeen(firstSeen)}</span>
      </div>

      {pack && (
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-[color:var(--color-border)] pt-1.5">
          <span className="text-[12px] text-[color:var(--color-muted-2)]">
            +{pack.carry} carry
            {pack.temperament ? ` · ${pack.temperament}` : ""}
          </span>
          {tamed ? (
            <span className="flex shrink-0 items-center gap-1 text-[12px] text-[color:var(--color-lilac)]">
              <Check className="h-3 w-3" />
              Tamed
            </span>
          ) : tameState.ok ? (
            <button
              type="button"
              onClick={onTame}
              className="shrink-0 rounded bg-[color:var(--color-lilac)]/15 px-2 py-0.5 text-[12px] uppercase tracking-wider text-[color:var(--color-lilac)] transition-colors hover-lilac"
            >
              Tame
            </button>
          ) : (
            /* Say why it can't be tamed rather than hiding the control. */
            <span className="shrink-0 text-[12px] text-[color:var(--color-muted-2)]">
              {tameState.reason}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
