"use client"

import { useEffect, useMemo, useState } from "react"
import { useEsroStore } from "@/store/use-esro-store"
import { cn } from "@/lib/cn"
import {
  MAP_NODES,
  MAP_PATHS,
  MAP_REGIONS,
  NODE_KIND_META,
  PATH_KIND_META,
  getExpeditionsForNode,
  getFactionById,
  getFactionHqNode,
  getNodeById,
  getRegionById,
  isBaseNode,
  isClaimableNode,
  nodeRequiredLevel,
  type MapNode,
} from "@/lib/world-map"
import { unlockRequirementLabel } from "@/lib/skill-effects"
import type { NodeControl, RaceId } from "@/lib/types"

const riskColor = (risk: string) => {
  switch (risk) {
    case "Low":
      return "text-[color:var(--color-success)]"
    case "Medium":
      return "text-[color:var(--color-amber)]"
    case "High":
      return "text-[color:var(--color-danger)]"
    default:
      return "text-[color:var(--color-muted)]"
  }
}

const formatDuration = (seconds: number) => {
  const m = Math.round(seconds / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

export function MapTab() {
  const profile = useEsroStore((s) => s.profile)
  const startExpedition = useEsroStore((s) => s.startExpedition)
  const setOpsTab = useEsroStore((s) => s.setOpsTab)
  const setScreen = useEsroStore((s) => s.setScreen)
  const requestFactionView = useEsroStore((s) => s.requestFactionView)
  const factionBuildings = useEsroStore((s) => s.factionBuildings)
  const mapFocusNodeId = useEsroStore((s) => s.mapFocusNodeId)
  const setMapFocus = useEsroStore((s) => s.setMapFocus)
  const characterFaction = useEsroStore((s) => s.characterFaction)
  const nodeControl = useEsroStore((s) => s.nodeControl)
  const canClaimNode = useEsroStore((s) => s.canClaimNode)
  const canAssaultBase = useEsroStore((s) => s.canAssaultBase)
  const startTerritoryClaim = useEsroStore((s) => s.startTerritoryClaim)
  const startBaseAssault = useEsroStore((s) => s.startBaseAssault)

  const playerLevel = profile?.level ?? 1
  // `characterFaction` is the canonical selection; profile.faction.id can still
  // hold a legacy label, so only trust it when it matches a real faction.
  const myFactionId: RaceId | null =
    characterFaction?.id ??
    (getFactionById(profile?.faction?.id as RaceId | undefined)?.id ?? null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  // Consume a deep-link focus request (e.g. "View on Map" from faction buildings).
  useEffect(() => {
    if (mapFocusNodeId) {
      setSelectedId(mapFocusNodeId)
      setMapFocus(null)
    }
  }, [mapFocusNodeId, setMapFocus])

  const selected = selectedId ? getNodeById(selectedId) : undefined
  const nodeById = useMemo(
    () => new Map(MAP_NODES.map((n) => [n.id, n])),
    []
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] uppercase tracking-wider text-[color:var(--color-text)]">
            World Map
          </h2>
          <p className="text-[12px] text-[color:var(--color-muted)]">
            {MAP_REGIONS.length} regions · {MAP_NODES.length} locations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLegend((v) => !v)}
          className="rounded border border-[color:var(--color-border)] px-2 py-1 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
        >
          {showLegend ? "Hide Key" : "Key"}
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {Object.entries(NODE_KIND_META).map(([kind, meta]) => (
              <span
                key={kind}
                className="flex items-center gap-1 text-[12px] text-[color:var(--color-muted)]"
              >
                <span className="text-[color:var(--color-accent)]" aria-hidden="true">
                  {meta.icon}
                </span>
                {meta.label}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-[color:var(--color-border)] pt-2">
            {Object.entries(PATH_KIND_META).map(([kind, meta]) => (
              <span
                key={kind}
                className="flex items-center gap-1.5 text-[12px] text-[color:var(--color-muted)]"
              >
                <svg width="18" height="6" aria-hidden="true">
                  <line
                    x1="0"
                    y1="3"
                    x2="18"
                    y2="3"
                    stroke="var(--color-accent)"
                    strokeWidth="1.5"
                    strokeDasharray={meta.dash}
                  />
                </svg>
                {meta.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Map viewport */}
      <div className="relative aspect-[1/1.12] w-full overflow-hidden rounded-lg border border-[color:var(--color-border)]">
        {/* Backdrop art (decorative) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/world-map-backdrop.png')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, transparent 40%, rgba(10,11,15,0.65) 100%)",
          }}
        />

        {/* Region tints */}
        {MAP_REGIONS.map((region) => {
          const faction = getFactionById(region.factionId)
          const tint = faction?.color ?? "#8b8fa3"
          return (
            <div
              key={region.id}
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.radius * 2}%`,
                aspectRatio: "1",
                background: `radial-gradient(circle, ${tint}26 0%, ${tint}0d 55%, transparent 75%)`,
              }}
            />
          )
        })}

        {/* Region labels */}
        {MAP_REGIONS.map((region) => {
          const faction = getFactionById(region.factionId)
          return (
            <span
              key={`label-${region.id}`}
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-[12px] uppercase tracking-[0.18em]"
              style={{
                left: `${region.labelX ?? region.x}%`,
                top: `${region.labelY ?? Math.max(2, region.y - region.radius + 2)}%`,
                color: faction?.color ?? "var(--color-muted)",
                textShadow: "0 0 6px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)",
                opacity: 0.8,
              }}
            >
              {region.label}
            </span>
          )
        })}

        {/* Paths */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {MAP_PATHS.map((path, i) => {
            const a = nodeById.get(path.from)
            const b = nodeById.get(path.to)
            if (!a || !b) return null
            const meta = PATH_KIND_META[path.kind]
            const stroke =
              path.kind === "relay"
                ? "var(--color-accent)"
                : path.kind === "hidden"
                  ? "var(--color-cyan)"
                  : "var(--color-border-strong, #8b8fa3)"
            return (
              <line
                key={`${path.from}-${path.to}-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth="1.5"
                strokeDasharray={meta.dash}
                strokeOpacity={meta.opacity}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {MAP_NODES.map((node) => {
          const meta = NODE_KIND_META[node.kind]
          // Live control wins for coloring; base nodes fall back to their
          // inherent faction identity so an HQ always reads as its owner.
          const controllerId = nodeControl[node.id] ?? null
          const faction = getFactionById(controllerId) ?? getFactionById(node.factionId)
          const reqLevel = nodeRequiredLevel(node)
          const locked = playerLevel < reqLevel
          const isSelected = selectedId === node.id
          const isMine = Boolean(faction && faction.id === myFactionId)
          const accent = faction?.color ?? "var(--color-accent)"

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedId(isSelected ? null : node.id)}
              aria-label={`${node.label} — ${meta.label}`}
              aria-pressed={isSelected}
              className={cn(
                "group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 hover:z-20 focus-visible:z-20",
                isSelected && "z-20"
              )}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span className="relative flex items-center justify-center">
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute inline-block h-8 w-8 animate-ping rounded-full"
                    style={{ border: `1px solid ${accent}` }}
                  />
                )}
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[13px] transition-transform",
                    isSelected && "scale-110"
                  )}
                  style={{
                    backgroundColor: "rgba(10,11,15,0.85)",
                    border: `1px solid ${isSelected || isMine ? accent : "var(--color-border)"}`,
                    color: locked ? "var(--color-muted)" : accent,
                    boxShadow: isSelected || isMine ? `0 0 8px ${accent}66` : undefined,
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  {faction ? faction.emblem : meta.icon}
                </span>
              </span>
              <span
                className={cn(
                  "pointer-events-none absolute top-full left-1/2 mt-1 w-[80px] -translate-x-1/2 rounded px-1 text-center text-[12px] leading-tight text-balance transition-opacity",
                  "text-[color:var(--color-muted)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
                style={{ backgroundColor: "rgba(10,11,15,0.9)" }}
              >
                {node.label}
              </span>
              {locked && (
                <span className="rounded bg-[color:var(--color-danger)]/20 px-1 text-[12px] text-[color:var(--color-danger)]">
                  Lv.{reqLevel}+
                </span>
              )}
            </button>
          )
        })}

        {/* Detail sheet */}
        {selected && (
          <NodeDetail
            node={selected}
            playerLevel={playerLevel}
            myFactionId={myFactionId}
            buildings={factionBuildings}
            nodeControl={nodeControl}
            claimStatus={canClaimNode(selected.id)}
            assaultStatus={canAssaultBase(selected.id)}
            onClose={() => setSelectedId(null)}
            onDeploy={(id) => {
              startExpedition(id)
              setOpsTab("expeditions")
            }}
            onManageBase={() => {
              requestFactionView("buildings")
              setScreen("social")
            }}
            onClaim={() => startTerritoryClaim(selected.id)}
            onAssault={() => startBaseAssault(selected.id)}
          />
        )}
      </div>

      {/* Your base shortcut, or a nudge to pick a faction */}
      {!myFactionId && (
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-3 py-2 text-[13px] text-[color:var(--color-muted)]">
          Join a faction to claim a base on the map.
        </div>
      )}
      {myFactionId && (
        <button
          type="button"
          onClick={() => setSelectedId(getFactionHqNode(myFactionId)?.id ?? null)}
          className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-3 py-2 text-left transition-colors hover:border-[color:var(--color-accent)]/50"
        >
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="text-[15px]"
              style={{ color: getFactionById(myFactionId)?.color }}
            >
              {getFactionById(myFactionId)?.emblem}
            </span>
            <span className="text-[13px] text-[color:var(--color-text)]">
              Your base — {getFactionHqNode(myFactionId)?.label}
            </span>
          </span>
          <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Locate
          </span>
        </button>
      )}
    </div>
  )
}

// ============ DETAIL SHEET ============

function NodeDetail({
  node,
  playerLevel,
  myFactionId,
  buildings,
  nodeControl,
  claimStatus,
  assaultStatus,
  onClose,
  onDeploy,
  onManageBase,
  onClaim,
  onAssault,
}: {
  node: MapNode
  playerLevel: number
  myFactionId: string | null
  buildings: { id: string; label: string; icon: string; level: number; maxLevel: number }[]
  nodeControl: NodeControl
  claimStatus: { ok: boolean; reason?: string }
  assaultStatus: { ok: boolean; reason?: string }
  onClose: () => void
  onDeploy: (expeditionId: string) => void
  onManageBase: () => void
  onClaim: () => void
  onAssault: () => void
}) {
  const hasSkillUnlock = useEsroStore((s) => s.hasSkillUnlock)
  const region = getRegionById(node.regionId)
  const owner = getFactionById(region?.factionId)
  const nodeFaction = getFactionById(node.factionId)
  const kindMeta = NODE_KIND_META[node.kind]
  const missions = getExpeditionsForNode(node)
  const isMyHq = Boolean(nodeFaction && nodeFaction.id === myFactionId)
  // Live controller of this node (may differ from its inherent faction).
  const controller = getFactionById(nodeControl[node.id] ?? null)
  const claimable = isClaimableNode(node)
  const isBase = isBaseNode(node)
  const controlledByMe = Boolean(controller && controller.id === myFactionId)

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[76%] overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-panel)]/97 p-3 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="text-[15px]"
              style={{ color: nodeFaction?.color ?? "var(--color-accent)" }}
            >
              {nodeFaction ? nodeFaction.emblem : kindMeta.icon}
            </span>
            <h3 className="truncate text-[15px] text-[color:var(--color-text)]">
              {node.label}
            </h3>
          </div>
          <p className="mt-0.5 text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            {kindMeta.label} · {region?.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close location details"
          className="shrink-0 rounded border border-[color:var(--color-border)] px-2 py-0.5 text-[13px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]"
        >
          ✕
        </button>
      </div>

      {/* Owner chip */}
      {owner && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[12px]"
          style={{
            borderColor: `${owner.color}55`,
            backgroundColor: `${owner.color}14`,
            color: owner.color,
          }}
        >
          <span aria-hidden="true">{owner.emblem}</span>
          {owner.name}
          {owner.id === myFactionId && " · your faction"}
        </div>
      )}

      {/* Blurb */}
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--color-muted)]">
        {node.blurb}
      </p>

      {/* Faction HQ content */}
      {nodeFaction && (
        <div className="mt-3">
          {isMyHq ? (
            <>
              <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Your Structures
              </div>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {buildings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded border border-[color:var(--color-border)] px-2 py-1.5"
                  >
                    <span className="flex items-center gap-1.5 text-[13px] text-[color:var(--color-text)]">
                      <span aria-hidden="true">{b.icon}</span>
                      {b.label}
                    </span>
                    <span
                      className={cn(
                        "text-[12px]",
                        b.level > 0
                          ? "text-[color:var(--color-success)]"
                          : "text-[color:var(--color-muted)]"
                      )}
                    >
                      {b.level > 0 ? `Lv.${b.level}/${b.maxLevel}` : "Not built"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onManageBase}
                className="mt-2 w-full rounded border px-3 py-2 text-[13px] uppercase tracking-wider transition-colors"
                style={{
                  borderColor: `${nodeFaction.color}66`,
                  backgroundColor: `${nodeFaction.color}1a`,
                  color: nodeFaction.color,
                }}
              >
                Manage Base
              </button>
            </>
          ) : (
            <div className="rounded border border-[color:var(--color-border)] p-2">
              <p className="text-[13px] italic leading-relaxed text-[color:var(--color-muted)]">
                &ldquo;{nodeFaction.motto}&rdquo;
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--color-muted)]">
                {nodeFaction.bonus}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Territory control */}
      {claimable && (
        <div className="mt-3 rounded border border-[color:var(--color-border)] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Control
            </span>
            {controller ? (
              <span
                className="inline-flex items-center gap-1 text-[12px]"
                style={{ color: controller.color }}
              >
                <span aria-hidden="true">{controller.emblem}</span>
                {controlledByMe ? "Held by you" : controller.name}
              </span>
            ) : (
              <span className="text-[12px] text-[color:var(--color-danger)]">Uncontested (feral)</span>
            )}
          </div>
          {!controlledByMe && (
            <button
              type="button"
              disabled={!claimStatus.ok}
              onClick={onClaim}
              className={cn(
                "mt-2 w-full rounded px-3 py-2 text-[13px] uppercase tracking-wider transition-colors",
                claimStatus.ok
                  ? "border border-[color:var(--color-danger)]/60 bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/25"
                  : "cursor-not-allowed border border-[color:var(--color-border)] text-[color:var(--color-muted)]"
              )}
            >
              {claimStatus.ok ? (controller ? "Attack & Claim" : "Claim Territory") : claimStatus.reason}
            </button>
          )}
        </div>
      )}

      {/* Base assault (rival HQ) */}
      {isBase && !isMyHq && (
        <div className="mt-3 rounded border border-[color:var(--color-border)] p-2">
          <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Base Assault
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--color-muted)]">
            Raid this base to disable its structures and strip supplies. Bases cannot be captured.
          </p>
          <button
            type="button"
            disabled={!assaultStatus.ok}
            onClick={onAssault}
            className={cn(
              "mt-2 w-full rounded px-3 py-2 text-[13px] uppercase tracking-wider transition-colors",
              assaultStatus.ok
                ? "border border-[color:var(--color-danger)]/60 bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/25"
                : "cursor-not-allowed border border-[color:var(--color-border)] text-[color:var(--color-muted)]"
            )}
          >
            {assaultStatus.ok ? "Launch Assault" : assaultStatus.reason}
          </button>
        </div>
      )}

      {/* Expeditions */}
      {missions.length > 0 && (
        <div className="mt-3">
          <div className="text-[12px] uppercase tracking-wider text-[color:var(--color-muted)]">
            Expeditions ({missions.length})
          </div>
          <div className="mt-1.5 flex flex-col gap-2">
            {missions.map((exp) => {
              const req = exp.minLevel ?? 1
              // Level gate plus the run's skill tier breakpoint, so the button
              // never offers a deploy the store will refuse.
              const tierLocked = !!exp.requiresUnlock && !hasSkillUnlock(exp.requiresUnlock)
              // Contested frontier sites are faction-warfare ground: a
              // factionless courier can never deploy there. Mirrors the store's
              // startExpedition gate so the button reflects the real rule.
              const factionLocked = claimable && node.kind === "contested" && !myFactionId
              const locked = playerLevel < req || tierLocked || factionLocked
              return (
                <div
                  key={exp.id}
                  className="rounded border border-[color:var(--color-border)] p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-[color:var(--color-text)]">
                      {exp.label}
                    </span>
                    <span className={cn("shrink-0 text-[12px]", riskColor(exp.risk))}>
                      {exp.risk}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-1 text-[12px] text-[color:var(--color-muted)]">
                    <span>{formatDuration(exp.duration)}</span>
                    <span>{exp.rewards.xp} XP</span>
                    <span>{exp.rewards.tokens} tokens</span>
                    <span>{exp.suggestedParty} party</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {exp.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-[color:var(--color-accent)]/12 px-1.5 py-0.5 text-[12px] text-[color:var(--color-accent)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onDeploy(exp.id)}
                    className={cn(
                      "mt-2 w-full rounded px-3 py-1.5 text-[13px] uppercase tracking-wider transition-colors",
                      locked
                        ? "cursor-not-allowed border border-[color:var(--color-border)] text-[color:var(--color-muted)]"
                        : "border border-[color:var(--color-cyan)]/60 bg-[color:var(--color-cyan)]/15 text-[color:var(--color-cyan)] hover:bg-[color:var(--color-cyan)]/25"
                    )}
                  >
                    {factionLocked
                      ? "Join a faction to deploy"
                      : tierLocked && exp.requiresUnlock
                        ? unlockRequirementLabel(exp.requiresUnlock)
                        : playerLevel < req
                          ? `Requires Lv.${req}`
                          : "Deploy"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Home station note */}
      {node.kind === "waystation" && missions.length === 0 && (
        <p className="mt-3 rounded border border-[color:var(--color-border)] p-2 text-[12px] text-[color:var(--color-muted)]">
          Your home station. All routes lead back here.
        </p>
      )}
    </div>
  )
}
