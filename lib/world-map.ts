import { expeditions } from "@/lib/mock-data"
import { FACTIONS } from "@/lib/game-data"
import type { Expedition, FactionData, RaceId } from "@/lib/types"

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
    // Sits in the gap between Signal Spire and Perimeter Wall.
    labelX: 50,
    labelY: 30,
  },
  {
    id: "gilded_terraces",
    label: "Gilded Terraces",
    factionId: "crownborn",
    blurb:
      "Tiered marble causeways lit by standing lamps. The Courts keep their archives here, and their secrets deeper still.",
    x: 24,
    y: 17,
    radius: 24,
  },
  {
    id: "the_gloaming",
    label: "The Gloaming",
    factionId: "gloamwhisper",
    blurb:
      "A drowned basin where the light never fully lands. Signals go quiet here, which is precisely the point.",
    x: 79,
    y: 16,
    radius: 24,
  },
  {
    id: "emberhold_vale",
    label: "Emberhold Vale",
    factionId: "hearthkin",
    blurb:
      "Forge-smoke and shelter walls. The Wardens hold the vale's salvage fields and never let a road go cold.",
    x: 24,
    y: 73,
    radius: 25,
    // Open ground at the lower-left, clear of Salvage Flats.
    labelX: 20,
    labelY: 95,
  },
  {
    id: "wandering_flats",
    label: "The Wandering Flats",
    factionId: "roadsinger",
    blurb:
      "Open country stitched together by cart tracks and luck. The Chorus maps it constantly; it never stays mapped.",
    x: 77,
    y: 78,
    radius: 26,
    // Kept inboard of the right edge so the long name never clips.
    labelX: 70,
    labelY: 95,
  },
]

// ============ NODES ============

export const MAP_NODES: MapNode[] = [
  // --- The Relay Reach (neutral hub) ---
  {
    id: "waystation_prime",
    label: "Waystation Prime",
    regionId: "relay_reach",
    x: 50,
    y: 47,
    kind: "waystation",
    blurb:
      "Your home station. Bunks, a bench, and a relay mast that still catches everything worth hearing.",
    expeditionIds: [],
  },
  {
    id: "signal_spire",
    label: "Signal Spire",
    regionId: "relay_reach",
    x: 34,
    y: 38,
    kind: "relay",
    blurb:
      "A leaning mast that drinks stray transmissions out of the air. Good hunting for a patient courier.",
    expeditionIds: ["signal_trace"],
  },
  {
    id: "perimeter_wall",
    label: "Perimeter Wall",
    regionId: "relay_reach",
    x: 66,
    y: 56,
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
    x: 30,
    y: 16,
    kind: "ruin",
    blurb:
      "Shelf upon shelf of pre-collapse record stacks. The Courts permit visitors. They do not permit questions.",
    expeditionIds: ["archive_dive"],
  },
  {
    id: "hq_crownborn",
    label: "The Lantern Court",
    regionId: "gilded_terraces",
    x: 17,
    y: 28,
    kind: "faction_hq",
    blurb:
      "A hall of standing lamps where the Courts hear petitions and keep the ledgers of order.",
    expeditionIds: [],
    factionId: "crownborn",
  },

  // --- The Gloaming (Veiled Circle) ---
  {
    id: "sunken_vault",
    label: "Sunken Vault",
    regionId: "the_gloaming",
    x: 73,
    y: 22,
    kind: "ruin",
    blurb:
      "A record vault half-swallowed by black water. Whatever is still readable down there is worth a fortune.",
    expeditionIds: ["deep_archive"],
  },
  {
    id: "hq_gloamwhisper",
    label: "The Quiet House",
    regionId: "the_gloaming",
    x: 80,
    y: 13,
    kind: "faction_hq",
    blurb:
      "No sign, no lamp, no listed address. The Circle finds you when it wants to be found.",
    expeditionIds: [],
    factionId: "gloamwhisper",
  },

  // --- Emberhold Vale (Hearth Wardens) ---
  {
    id: "salvage_flats",
    label: "Salvage Flats",
    regionId: "emberhold_vale",
    x: 25,
    y: 68,
    kind: "wilds",
    blurb:
      "Acres of picked-over wreckage. The good scrap is always one layer under the bad scrap.",
    expeditionIds: ["scavenger_sweep"],
  },
  {
    id: "relay_array",
    label: "Emberhold Array",
    regionId: "emberhold_vale",
    x: 38,
    y: 82,
    kind: "relay",
    blurb:
      "A bank of resonance masts the Wardens keep lit. Maintenance is constant, thankless, and paid well.",
    expeditionIds: ["relay_maintenance"],
  },
  {
    id: "hq_hearthkin",
    label: "The Long Hearth",
    regionId: "emberhold_vale",
    x: 16,
    y: 57,
    kind: "faction_hq",
    blurb:
      "A forge-hall with the doors always open and a pot always on. The Wardens shelter anyone on the road.",
    expeditionIds: [],
    factionId: "hearthkin",
  },

  // --- The Wandering Flats (Open Roads Chorus) ---
  {
    id: "courier_road",
    label: "The Courier Road",
    regionId: "wandering_flats",
    x: 61,
    y: 71,
    kind: "settlement",
    blurb:
      "The busiest track in the Flats. Parcels move, gossip moves faster, and nobody asks for papers.",
    expeditionIds: ["courier_run"],
  },
  {
    id: "cache_hollow",
    label: "Cache Hollow",
    regionId: "wandering_flats",
    x: 79,
    y: 85,
    kind: "wilds",
    blurb:
      "A dip in the flats where old supply drops were buried. Half are rotted. Half are not.",
    expeditionIds: ["supply_cache"],
  },
  {
    id: "cartographers_rest",
    label: "Cartographer's Rest",
    regionId: "wandering_flats",
    x: 79,
    y: 62,
    kind: "settlement",
    blurb:
      "A waypoint inn full of contradictory maps. The Chorus pays for whichever one turns out to be right.",
    expeditionIds: ["route_mapping"],
  },
  {
    id: "hq_roadsinger",
    label: "The Open Gate",
    regionId: "wandering_flats",
    x: 58,
    y: 89,
    kind: "faction_hq",
    blurb:
      "Less a building than a permanent camp at a crossroads. The Chorus insists that is the whole idea.",
    expeditionIds: [],
    factionId: "roadsinger",
  },
]

// ============ PATHS ============

export const MAP_PATHS: MapPath[] = [
  // Hub spokes
  { from: "waystation_prime", to: "signal_spire", kind: "road" },
  { from: "waystation_prime", to: "perimeter_wall", kind: "road" },
  { from: "waystation_prime", to: "salvage_flats", kind: "road" },
  { from: "waystation_prime", to: "courier_road", kind: "road" },
  { from: "waystation_prime", to: "relay_array", kind: "relay" },
  { from: "waystation_prime", to: "sunken_vault", kind: "relay" },

  // Gilded Terraces
  { from: "signal_spire", to: "the_archive", kind: "road" },
  { from: "the_archive", to: "hq_crownborn", kind: "road" },

  // The Gloaming
  { from: "sunken_vault", to: "hq_gloamwhisper", kind: "hidden" },
  { from: "the_archive", to: "sunken_vault", kind: "hidden" },

  // Emberhold Vale
  { from: "salvage_flats", to: "relay_array", kind: "road" },
  { from: "salvage_flats", to: "hq_hearthkin", kind: "road" },

  // Wandering Flats
  { from: "perimeter_wall", to: "courier_road", kind: "road" },
  { from: "courier_road", to: "cache_hollow", kind: "road" },
  { from: "courier_road", to: "cartographers_rest", kind: "relay" },
  { from: "cache_hollow", to: "hq_roadsinger", kind: "road" },
  { from: "cartographers_rest", to: "sunken_vault", kind: "hidden" },
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
}

export const PATH_KIND_META: Record<
  MapPathKind,
  { label: string; dash?: string; opacity: number }
> = {
  road: { label: "Road", opacity: 0.5 },
  relay: { label: "Relay Line", dash: "3 2", opacity: 0.65 },
  hidden: { label: "Hidden Route", dash: "1 3", opacity: 0.4 },
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
