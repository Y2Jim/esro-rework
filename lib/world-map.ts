import { expeditions } from "@/lib/mock-data"
import { FACTIONS } from "@/lib/game-data"
import type { Expedition, FactionData, NodeControl, RaceId } from "@/lib/types"

/**
 * Canonical world geography for ESRO.
 *
 * This is the single source of truth for regions, locations and the paths
 * between them. Coordinates are stored as *percentages* (0-100) of the map
 * viewport so the map scales cleanly inside the 464x936 phone frame.
 */

export type MapNodeKind =
  | "waystation"
  | "faction_hq"
  | "ruin"
  | "wilds"
  | "relay"
  | "settlement"
  | "contested"
  | "landmark"

export type MapPathKind = "road" | "relay" | "hidden"

export interface MapRegion {
  id: string
  label: string
  /** Owning faction, or null for neutral territory. */
  factionId: RaceId | null
  blurb: string
  /** Centroid, used for the region tint wash and its label. */
  x: number
  y: number
  /** Radius of the tint wash, in percent of map width. */
  radius: number
  /**
   * Optional explicit anchor for the region's name, in percent. Set these
   * where the default (top of the tint wash) would collide with node markers.
   */
  labelX?: number
  labelY?: number
}

/** What an expedition reward stream a controlled landmark amplifies. */
export type LandmarkBoonType = "xp" | "loot" | "materials" | "tokens"

/**
 * A transferable perk a signature landmark grants to whichever faction holds
 * it. Because the boon follows control, a rival can seize it — that is the
 * whole reason to invade someone else's homeland.
 */
export interface LandmarkBoon {
  type: LandmarkBoonType
  /** Fractional bonus, e.g. 0.2 = +20%. */
  value: number
  label: string
  description: string
}

export interface MapNode {
  id: string
  label: string
  regionId: string
  x: number
  y: number
  kind: MapNodeKind
  blurb: string
  /** Expeditions that deploy from this location. */
  expeditionIds: string[]
  /** Set for faction_hq nodes. */
  factionId?: RaceId
  /**
   * Set for `landmark` nodes: the faction that starts in control and whose
   * identity the site carries. Unlike `factionId`, this does not trigger the
   * base-management UI, so a landmark reads as a capturable prize, not an HQ.
   */
  homeFactionId?: RaceId
  /** Set for `landmark` nodes: the perk granted to the controlling faction. */
  boon?: LandmarkBoon
  /**
   * Optional per-node glyph that overrides the kind icon. Used by `landmark`
   * nodes so each signature territory reads as a distinct prize rather than
   * sharing its controller's faction emblem.
   */
  icon?: string
}

export interface MapPath {
  from: string
  to: string
  kind: MapPathKind
}

// ============ REGIONS ============

export const MAP_REGIONS: MapRegion[] = [
  {
    id: "relay_reach",
    label: "The Relay Reach",
    factionId: null,
    blurb:
      "Neutral ground at the heart of the network. Every courier route begins here, under the hum of the old relays.",
    x: 50,
    y: 48,
    radius: 26,
    // Above the hub, in the gap between the two northern faction seats.
    labelX: 50,
    labelY: 26,
  },
  {
    id: "gilded_terraces",
    label: "Gilded Terraces",
    factionId: "crownborn",
    blurb:
      "Tiered marble causeways lit by standing lamps. The Courts keep their archives here, and their secrets deeper still.",
    // The four faction washes are identical in size and mirrored about the
    // hub so no homeland reads as larger or better-served than another.
    x: 24,
    y: 17,
    radius: 25,
    labelX: 24,
    labelY: 3,
  },
  {
    id: "the_gloaming",
    label: "The Gloaming",
    factionId: "gloamwhisper",
    blurb:
      "A drowned basin where the light never fully lands. Signals go quiet here, which is precisely the point.",
    x: 76,
    y: 17,
    radius: 25,
    labelX: 76,
    labelY: 3,
  },
  {
    id: "emberhold_vale",
    label: "Emberhold Vale",
    factionId: "hearthkin",
    blurb:
      "Forge-smoke and shelter walls. The Wardens hold the vale's salvage fields and never let a road go cold.",
    x: 24,
    y: 75,
    radius: 25,
    labelX: 24,
    labelY: 95,
  },
  {
    id: "wandering_flats",
    label: "The Wandering Flats",
    factionId: "roadsinger",
    blurb:
      "Open country stitched together by cart tracks and luck. The Chorus maps it constantly; it never stays mapped.",
    x: 76,
    y: 75,
    radius: 25,
    labelX: 76,
    labelY: 95,
  },
]

// ============ NODES ============

/**
 * Every faction homeland holds exactly six sites — one seat of power, four
 * deployable or claimable locations, and one contested frontier site — laid out
 * in mirrored positions around the hub, so no faction has more ground, more
 * work, or more to fight over than any other. The layout mirrors across x about
 * 50 and across y about the hub line at 46, so every bottom slot is 92 - top_y.
 *
 * Slot template, mirrored into each quadrant:
 *   outer-crest  (32 / 68  ·  11 / 81)   a ruin or wilds
 *   outer-flank  (16 / 84  ·  20 / 72)   a relay or settlement
 *   far-flank    (14 / 86  ·  36 / 56)   an outlying wilds or ruin
 *   upper-court  (44 / 56  ·  22 / 70)   a settlement or ruin near the crest
 *   inner-seat   (26 / 74  ·  30 / 62)   the faction HQ, facing the hub
 *   frontier     (38 / 62  ·  38 / 54)   a contested site on the hub border
 */
export const MAP_NODES: MapNode[] = [
  // --- The Relay Reach (neutral hub, shared by all factions) ---
  {
    id: "waystation_prime",
    label: "Waystation Prime",
    regionId: "relay_reach",
    x: 50,
    y: 46,
    kind: "waystation",
    blurb:
      "Your home station. Bunks, a bench, and a relay mast that still catches everything worth hearing.",
    expeditionIds: [],
  },
  {
    id: "perimeter_wall",
    label: "Perimeter Wall",
    regionId: "relay_reach",
    x: 50,
    y: 62,
    kind: "settlement",
    blurb:
      "The Reach's outer cordon. Someone has to walk it, and something is always testing it.",
    expeditionIds: ["perimeter_sweep"],
  },

  // --- Gilded Terraces (Crowned Courts) ---
  {
    id: "the_archive",
    label: "The Archive",
    regionId: "gilded_terraces",
    x: 32,
    y: 11,
    kind: "ruin",
    blurb:
      "Shelf upon shelf of pre-collapse record stacks, and stairs down to the unlit levels. The Courts permit visitors. They do not permit questions.",
    expeditionIds: ["deep_archive"],
  },
  {
    id: "signal_spire",
    label: "Signal Spire",
    regionId: "gilded_terraces",
    x: 16,
    y: 20,
    kind: "relay",
    blurb:
      "A leaning mast on the terrace approach, drinking stray transmissions out of the air. The Courts let it lean.",
    expeditionIds: ["signal_trace"],
  },
  {
    id: "hq_crownborn",
    label: "The Lantern Court",
    regionId: "gilded_terraces",
    x: 26,
    y: 30,
    kind: "faction_hq",
    blurb:
      "A hall of standing lamps where the Courts hear petitions and keep the ledgers of order.",
    expeditionIds: [],
    factionId: "crownborn",
  },
  {
    id: "contested_terrace",
    label: "The Broken Terrace",
    regionId: "gilded_terraces",
    x: 38,
    y: 38,
    kind: "contested",
    blurb:
      "A collapsed causeway on the Reach border. Whoever holds it can watch every road into the Terraces — so nobody holds it for long.",
    expeditionIds: ["contest_terrace"],
  },
  {
    id: "gt_lamplighter",
    label: "Lamplighter's Row",
    regionId: "gilded_terraces",
    x: 14,
    y: 36,
    kind: "settlement",
    blurb:
      "A working street of lamp-tenders and ledger clerks on the terrace approach. The Courts keep it lit, and lightly watched.",
    expeditionIds: [],
  },
  {
    id: "gt_gallery",
    label: "The Gilded Vault",
    regionId: "gilded_terraces",
    x: 44,
    y: 22,
    kind: "landmark",
    homeFactionId: "crownborn",
    icon: "❖",
    blurb:
      "The Courts' deepest archive, where pre-collapse rites and audience laws are kept under standing lamps. The knowledge here is worth a war — and every rival covets the key.",
    expeditionIds: [],
    boon: {
      type: "xp",
      value: 0.2,
      label: "Rites of Precedent",
      description: "+20% expedition EXP while your faction holds the Vault.",
    },
  },

  // --- The Gloaming (Veiled Circle) ---
  {
    id: "cartographers_rest",
    label: "Cartographer's Rest",
    regionId: "the_gloaming",
    x: 68,
    y: 11,
    kind: "settlement",
    blurb:
      "A waypoint inn full of contradictory maps. The Circle pays well for whichever one turns out to be right.",
    expeditionIds: ["route_mapping"],
  },
  {
    id: "sunken_vault",
    label: "Sunken Vault",
    regionId: "the_gloaming",
    x: 84,
    y: 20,
    kind: "ruin",
    blurb:
      "A record vault half-swallowed by black water. The upper shelves are still dry, and still readable.",
    expeditionIds: ["archive_dive"],
  },
  {
    id: "hq_gloamwhisper",
    label: "The Quiet House",
    regionId: "the_gloaming",
    x: 74,
    y: 30,
    kind: "faction_hq",
    blurb:
      "No sign, no lamp, no listed address. The Circle finds you when it wants to be found.",
    expeditionIds: [],
    factionId: "gloamwhisper",
  },
  {
    id: "contested_basin",
    label: "The Drowned Span",
    regionId: "the_gloaming",
    x: 62,
    y: 38,
    kind: "contested",
    blurb:
      "A flooded bridge where the Gloaming meets the Reach. The Circle wants it dark; everyone else wants it watched.",
    expeditionIds: ["contest_basin"],
  },
  {
    id: "gl_stillwater",
    label: "The Sunless Hoard",
    regionId: "the_gloaming",
    x: 86,
    y: 36,
    kind: "landmark",
    homeFactionId: "gloamwhisper",
    icon: "☾",
    blurb:
      "Beneath the black mere the Circle sinks everything worth hiding — salvage, secrets, and the pick of every haul. Drain it and the loot is yours.",
    expeditionIds: [],
    boon: {
      type: "loot",
      value: 0.2,
      label: "Drowned Fortune",
      description: "+20% expedition loot while your faction holds the Hoard.",
    },
  },
  {
    id: "gl_landing",
    label: "The Hushed Landing",
    regionId: "the_gloaming",
    x: 56,
    y: 22,
    kind: "settlement",
    blurb:
      "A quiet dock where unmarked boats change hands. No lamps, no names, no records — only the tide's own schedule.",
    expeditionIds: [],
  },

  // --- Emberhold Vale (Hearth Wardens) ---
  {
    id: "salvage_flats",
    label: "Salvage Flats",
    regionId: "emberhold_vale",
    x: 32,
    y: 81,
    kind: "wilds",
    blurb:
      "Acres of picked-over wreckage, and pre-collapse store rooms still sealed underneath it.",
    expeditionIds: ["supply_cache"],
  },
  {
    id: "relay_array",
    label: "Emberhold Array",
    regionId: "emberhold_vale",
    x: 16,
    y: 72,
    kind: "relay",
    blurb:
      "A bank of resonance masts the Wardens keep lit. Maintenance is constant, thankless, and paid well.",
    expeditionIds: ["relay_maintenance"],
  },
  {
    id: "hq_hearthkin",
    label: "The Long Hearth",
    regionId: "emberhold_vale",
    x: 26,
    y: 62,
    kind: "faction_hq",
    blurb:
      "A forge-hall with the doors always open and a pot always on. The Wardens shelter anyone on the road.",
    expeditionIds: [],
    factionId: "hearthkin",
  },
  {
    id: "contested_vale",
    label: "The Cold Forge",
    regionId: "emberhold_vale",
    x: 38,
    y: 54,
    kind: "contested",
    blurb:
      "An abandoned forge on the vale's edge, its salvage still rich. The Wardens claim it by right; the roads claim it by need.",
    expeditionIds: ["contest_vale"],
  },
  {
    id: "ev_ashyard",
    label: "The Everburning Forge",
    regionId: "emberhold_vale",
    x: 14,
    y: 56,
    kind: "landmark",
    homeFactionId: "hearthkin",
    icon: "⚱",
    blurb:
      "The vale's great forge never goes cold. Its yield refits every Warden road-camp — and would arm any host that could seize the bellows.",
    expeditionIds: [],
    boon: {
      type: "materials",
      value: 0.25,
      label: "Forge Bounty",
      description: "+25% crafting materials from expeditions while your faction holds the Forge.",
    },
  },
  {
    id: "ev_kettle",
    label: "Kettle Watch",
    regionId: "emberhold_vale",
    x: 44,
    y: 70,
    kind: "settlement",
    blurb:
      "A shelter-post where the vale's road-wardens keep a pot on and an eye out. Nobody arrives cold or unseen.",
    expeditionIds: [],
  },

  // --- The Wandering Flats (Open Roads Chorus) ---
  {
    id: "cache_hollow",
    label: "Cache Hollow",
    regionId: "wandering_flats",
    x: 68,
    y: 81,
    kind: "wilds",
    blurb:
      "A dip in the flats where old supply drops were buried. Half are rotted, and worth stripping for parts.",
    expeditionIds: ["scavenger_sweep"],
  },
  {
    id: "courier_road",
    label: "The Courier Road",
    regionId: "wandering_flats",
    x: 84,
    y: 72,
    kind: "settlement",
    blurb:
      "The busiest track in the Flats. Parcels move, gossip moves faster, and nobody asks for papers.",
    expeditionIds: ["courier_run"],
  },
  {
    id: "hq_roadsinger",
    label: "The Open Gate",
    regionId: "wandering_flats",
    x: 74,
    y: 62,
    kind: "faction_hq",
    blurb:
      "Less a building than a permanent camp at a crossroads. The Chorus insists that is the whole idea.",
    expeditionIds: [],
    factionId: "roadsinger",
  },
  {
    id: "contested_crossroads",
    label: "The Split Track",
    regionId: "wandering_flats",
    x: 62,
    y: 54,
    kind: "contested",
    blurb:
      "The one crossroads the Flats can't keep mapped. Every faction has run a caravan through it, and every faction has lost one here.",
    expeditionIds: ["contest_crossroads"],
  },
  {
    id: "wf_camp",
    label: "The Songlines Nexus",
    regionId: "wandering_flats",
    x: 86,
    y: 56,
    kind: "landmark",
    homeFactionId: "roadsinger",
    icon: "♪",
    blurb:
      "Where every road the Chorus ever sang crosses at once. Tolls, trade, and traffic all flow through it — hold it and the coin follows.",
    expeditionIds: [],
    boon: {
      type: "tokens",
      value: 0.25,
      label: "Crossroads Tithe",
      description: "+25% expedition token income while your faction holds the Nexus.",
    },
  },
  {
    id: "wf_detour",
    label: "The Long Detour",
    regionId: "wandering_flats",
    x: 56,
    y: 70,
    kind: "wilds",
    blurb:
      "The track everyone takes when the direct road goes bad. It always goes bad, so the detour is the real road now.",
    expeditionIds: [],
  },
]

// ============ PATHS ============

/**
 * Each faction is reachable by the same shape of journey: one spoke from the
 * neutral hub to its outer flank, a leg on to its outer crest, then a final
 * leg to its seat — plus one lateral link to the neighbouring homeland. Each
 * homeland also has a direct hub spoke to its contested frontier site, and two
 * short legs out to its far-flank and upper-court sites. Seven edges per
 * faction, so no homeland is better connected than another.
 */
export const MAP_PATHS: MapPath[] = [
  // Hub spokes — one per homeland, plus the neutral cordon
  { from: "waystation_prime", to: "perimeter_wall", kind: "road" },
  { from: "waystation_prime", to: "signal_spire", kind: "road" },
  { from: "waystation_prime", to: "sunken_vault", kind: "relay" },
  { from: "waystation_prime", to: "relay_array", kind: "relay" },
  { from: "waystation_prime", to: "courier_road", kind: "road" },

  // Contested frontier spokes — the hub's disputed approaches, one per homeland
  { from: "waystation_prime", to: "contested_terrace", kind: "road" },
  { from: "waystation_prime", to: "contested_basin", kind: "relay" },
  { from: "waystation_prime", to: "contested_vale", kind: "road" },
  { from: "waystation_prime", to: "contested_crossroads", kind: "road" },

  // Gilded Terraces
  { from: "signal_spire", to: "the_archive", kind: "road" },
  { from: "the_archive", to: "hq_crownborn", kind: "road" },
  { from: "signal_spire", to: "gt_lamplighter", kind: "road" },
  { from: "the_archive", to: "gt_gallery", kind: "road" },

  // The Gloaming — the Circle keeps its own approaches off the open charts
  { from: "sunken_vault", to: "cartographers_rest", kind: "hidden" },
  { from: "cartographers_rest", to: "hq_gloamwhisper", kind: "hidden" },
  { from: "sunken_vault", to: "gl_stillwater", kind: "hidden" },
  { from: "cartographers_rest", to: "gl_landing", kind: "hidden" },

  // Emberhold Vale
  { from: "relay_array", to: "salvage_flats", kind: "road" },
  { from: "salvage_flats", to: "hq_hearthkin", kind: "road" },
  { from: "relay_array", to: "ev_ashyard", kind: "road" },
  { from: "salvage_flats", to: "ev_kettle", kind: "road" },

  // Wandering Flats
  { from: "courier_road", to: "cache_hollow", kind: "road" },
  { from: "cache_hollow", to: "hq_roadsinger", kind: "road" },
  { from: "courier_road", to: "wf_camp", kind: "road" },
  { from: "cache_hollow", to: "wf_detour", kind: "road" },

  // Lateral links between neighbouring homelands
  { from: "the_archive", to: "cartographers_rest", kind: "hidden" },
  { from: "salvage_flats", to: "cache_hollow", kind: "hidden" },
]

// ============ PRESENTATION MAPS ============

export const NODE_KIND_META: Record<
  MapNodeKind,
  { icon: string; label: string }
> = {
  waystation: { icon: "◉", label: "Waystation" },
  // Keep to glyphs the terminal mono stack actually ships — ⬡ / ◭ / ❋ render blank.
  faction_hq: { icon: "◆", label: "Faction Base" },
  ruin: { icon: "▲", label: "Ruin" },
  wilds: { icon: "◇", label: "Wilds" },
  relay: { icon: "↑", label: "Relay" },
  settlement: { icon: "⌂", label: "Settlement" },
  contested: { icon: "✦", label: "Contested Site" },
  landmark: { icon: "✪", label: "Signature Territory" },
}

export const PATH_KIND_META: Record<
  MapPathKind,
  { label: string; dash?: string; opacity: number }
> = {
  // Lifted so the route network reads over the terrain art while keeping the
  // hierarchy: relay lines brightest, hidden routes faintest.
  road: { label: "Road", opacity: 0.7 },
  relay: { label: "Relay Line", dash: "3 2", opacity: 0.85 },
  hidden: { label: "Hidden Route", dash: "1 3", opacity: 0.55 },
}

// ============ HELPERS ============

export function getNodeById(id: string): MapNode | undefined {
  return MAP_NODES.find((n) => n.id === id)
}

export function getRegionById(id: string): MapRegion | undefined {
  return MAP_REGIONS.find((r) => r.id === id)
}

export function getFactionById(id: RaceId | null | undefined): FactionData | undefined {
  if (!id) return undefined
  return FACTIONS.find((f) => f.id === id)
}

export function getExpeditionsForNode(node: MapNode): Expedition[] {
  return node.expeditionIds
    .map((id) => expeditions.find((e) => e.id === id))
    .filter((e): e is Expedition => Boolean(e))
}

/** The node whose expedition list includes `expeditionId`, if any. */
export function getNodeForExpedition(expeditionId: string): MapNode | undefined {
  return MAP_NODES.find((n) => n.expeditionIds.includes(expeditionId))
}

/**
 * Contested frontier sites are faction-warfare ground: only faction members
 * who have unlocked warfare may deploy there. Regular claimable sites
 * (settlements, ruins, wilds) stay open to everyone for normal PvE.
 */
export function isContestedNode(node: MapNode): boolean {
  return node.kind === "contested"
}

/** Lowest level requirement across a node's expeditions (1 if unrestricted). */
export function nodeRequiredLevel(node: MapNode): number {
  const levels = getExpeditionsForNode(node).map((e) => e.minLevel ?? 1)
  return levels.length ? Math.min(...levels) : 1
}

export function getFactionHqNode(factionId: RaceId | null | undefined): MapNode | undefined {
  if (!factionId) return undefined
  return MAP_NODES.find((n) => n.kind === "faction_hq" && n.factionId === factionId)
}

export function getNodesInRegion(regionId: string): MapNode[] {
  return MAP_NODES.filter((n) => n.regionId === regionId)
}

// ============ TERRITORY WAR ============

/** Bases (faction HQs) are assault-only — they can never be captured. */
export function isBaseNode(node: MapNode): boolean {
  return node.kind === "faction_hq"
}

/** Signature landmark territories — each faction's founding prize, capturable. */
export function isLandmarkNode(node: MapNode): boolean {
  return node.kind === "landmark"
}

/**
 * A node factions can actually own. Everything except the faction HQs and the
 * neutral home waystation is claimable ground.
 */
export function isClaimableNode(node: MapNode): boolean {
  return !isBaseNode(node) && node.id !== "waystation_prime"
}

/** Neighbouring node ids via any path, in either direction. */
export function getAdjacentNodeIds(nodeId: string): string[] {
  const ids = new Set<string>()
  for (const path of MAP_PATHS) {
    if (path.from === nodeId) ids.add(path.to)
    if (path.to === nodeId) ids.add(path.from)
  }
  return [...ids]
}

/**
 * Seed control: each faction owns only its home base at the start of the war.
 * Every other node is neutral, so factions must expand outward one adjacent
 * node at a time.
 */
export function buildInitialNodeControl(): NodeControl {
  const control: NodeControl = {}
  for (const node of MAP_NODES) {
    if (isBaseNode(node) && node.factionId) {
      control[node.id] = node.factionId
    } else if (node.kind === "landmark" && node.homeFactionId) {
      // Signature landmarks begin under their own faction's control — they are
      // held ground a rival must invade to take, not neutral land to grab.
      control[node.id] = node.homeFactionId
    } else {
      control[node.id] = null
    }
  }
  return control
}

/**
 * Nodes a faction currently controls, including its (never-lost) home base.
 * Used as the frontier set for adjacency-limited expansion.
 */
export function getControlledNodeIds(control: NodeControl, factionId: RaceId): string[] {
  const owned = MAP_NODES.filter((n) => control[n.id] === factionId).map((n) => n.id)
  const hq = getFactionHqNode(factionId)
  if (hq && !owned.includes(hq.id)) owned.push(hq.id)
  return owned
}

/**
 * Whether `factionId` may claim `nodeId`: the node must be claimable, currently
 * held by someone else (or neutral), and adjacent to ground the faction already
 * controls. Base nodes are excluded because they are never captured.
 */
export function isNodeClaimableBy(
  control: NodeControl,
  factionId: RaceId,
  nodeId: string,
): boolean {
  const node = getNodeById(nodeId)
  if (!node || !isClaimableNode(node)) return false
  if (control[nodeId] === factionId) return false
  const frontier = new Set(getControlledNodeIds(control, factionId))
  return getAdjacentNodeIds(nodeId).some((adj) => frontier.has(adj))
}

/** Rival HQ nodes a faction could assault (any faction base but its own). */
export function getAssaultableBaseNodes(factionId: RaceId): MapNode[] {
  return MAP_NODES.filter((n) => isBaseNode(n) && n.factionId && n.factionId !== factionId)
}

/** All signature landmark nodes (one per faction). */
export function getLandmarkNodes(): MapNode[] {
  return MAP_NODES.filter((n) => isLandmarkNode(n))
}

/** The landmark node a faction was founded around, if any. */
export function getLandmarkForFaction(factionId: RaceId): MapNode | undefined {
  return MAP_NODES.find((n) => isLandmarkNode(n) && n.factionId === factionId)
}

/** Landmark boon a faction currently benefits from, based on live control. */
export function getActiveLandmarkBoon(
  control: Record<string, RaceId | null>,
  factionId: RaceId,
  ): LandmarkBoon | undefined {
  for (const node of MAP_NODES) {
    if (!isLandmarkNode(node) || !node.boon) continue
    if (control[node.id] === factionId) return node.boon
  }
  return undefined
}
