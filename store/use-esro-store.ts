"use client"

import { create } from "zustand"
import type {
  AvatarConfig,
  AvatarLayerType,
  ChannelId,
  Channel,
  ChatMessage,
  Contract,
  Expedition,
  ActiveExpedition,
  FactionProject,
  FactionBuilding,
  FactionRally,
  FactionActivity,
  FactionView,
  Friend,
  InventoryItem,
  FishingCatch,
  FishingState,
  OpsTab,
  PartyMember,
  PlayerView,
  Profile,
  ProfileNotification,
  ProfileTitle,
  QuickAction,
  RecoveryResult,
  RouteRecord,
  ScreenId,
  Skill,
  Rarity,
  TradeOffer,
  VanityItem,
  Race,
  Courier,
  FactionData,
  RaceId,
  AdminTab,
  GameEvent,
  PlayerRecord,
  AdminLog,
  AdminAction,
} from "@/lib/types"
import { FACTIONS, FACTION_UNLOCK_LEVEL, getRaceById, DEFAULT_BASE_STATS, SKILL_DEFINITIONS } from "@/lib/game-data"
import {
  FACTION_BUILDINGS,
  RANK_TIERS,
  buildingUpgradeCost,
  craftingBonusesFrom,
  seedFactionActivity,
  seedFactionRallies,
} from "@/config/faction"
import { generateAvatarFromSeed } from "@/lib/avatar-generator"
import type { BaseStats } from "@/lib/types"
import type {
  NodeControl,
  StoredGroup,
  FactionBaseState,
  TerritoryBattle,
  TerritoryBattleKind,
} from "@/lib/types"
import { derivedStatScore, deriveMemberStats } from "@/lib/expedition-sim"
import {
  MAP_NODES,
  buildInitialNodeControl,
  isNodeClaimableBy,
  getAdjacentNodeIds,
  getControlledNodeIds,
  getNodeById,
  nodeRequiredLevel,
  isClaimableNode,
  getNodeForExpedition,
  isContestedNode,
} from "@/lib/world-map"
import {
  buildMonsterGarrison,
  buildFactionGarrison,
  buildInitialFactionBases,
  snapshotGroup,
  simulateTerritoryBattle,
  planBaseAssaultDamage,
  recoverBaseState,
  ENDGAME_NODE_LEVEL,
  BASE_DEFENSE_LEVEL,
  BUILDING_DISABLE_MS,
} from "@/lib/territory-sim"
import {
  applyXp,
  emptyAllocation,
  POINTS_PER_LEVEL,
  spentPoints,
  type AllocatableStat,
} from "@/lib/leveling"
import {
  attunementCapacity,
  attunementUsed,
  getRitual,
  getRituals,
  MAJOR_RITUAL_BOOKS,
  MINOR_RITUAL_BOOKS,
} from "@/lib/rituals"
import {
  channels as seedChannels,
  contracts as seedContracts,
  expeditions as seedExpeditions,
  factionProjects as seedFactionProjects,
  identity as seedIdentity,
  inventory as seedInventory,
  messages as seedMessages,
  party as seedParty,
  profile as seedProfile,
  quickActions as seedQuickActions,
  recoveryResults as seedRecovery,
  shards as seedShards,
} from "@/lib/mock-data"
import {
  aggregateSkillBonuses,
  createInitialSkills,
  getSkillMechanic,
  getSkillUnlocks,
  skillIdFromName,
  UNLOCK_LABELS,
  UNLOCK_KIND,
  type SkillBonuses,
  type SkillUnlockId,
} from "@/lib/skill-effects"
import {
  CLASS_LABEL,
  TAME_MASTER_UNLOCK,
  TAME_UNLOCK,
  TAMEABLE,
  getCreature,
  packContribution,
  rollShiny,
} from "@/lib/bestiary"
import { DIG_BAIT_ID, DIG_COOLDOWN_MS, DIG_MAX, DIG_MIN, getBait } from "@/config/bait"
import { FISHING_SPOTS, JUNK, fishToItem, getFish, pickFish } from "@/config/fishing"
import { recipeUnlockFor } from "@/config/crafting-recipes"
import { dayKey, rotateContracts } from "@/lib/contract-rotation"

/** Archive reconstruction passes, cheapest first. */
export type RecoveryMode = "standard" | "focused" | "translation"

export interface EsroState {
  booted: boolean
  setBooted: (v: boolean) => void

  // Character Creation & Onboarding
  isNewUser: boolean
  characterCreated: boolean
  characterRace: Race | null
  characterCourier: Courier | null
  characterFaction: FactionData | null
  factionUnlocked: boolean
  uiTheme: string // "default" | RaceId | RollableThemeId
  unlockedThemes: string[] // List of unlocked rollable theme IDs
  setCharacterData: (race: Race, courier: Courier, handle: string, starterSkills: string[], avatar?: AvatarConfig) => void
  setFaction: (factionId: RaceId) => void
  setUiTheme: (theme: string) => void
  unlockTheme: (themeId: string) => void
  checkFactionUnlock: () => void
  /** Unlock ids already announced to the player, so each fires exactly once. */
  seenUnlocks: string[]
  /**
   * Diff current skill/stat unlocks against what has been announced and push a
   * "new route"/"new feature" notification for each newcomer. Pass silent to
   * re-baseline without notifying (used at character creation).
   */
  syncUnlocks: (opts?: { silent?: boolean }) => void
  
  // Player Stats
  getPlayerStats: () => BaseStats
  getStatBonus: (stat: keyof BaseStats) => number

  // Leveling & stat allocation
  /** Award XP and resolve any level-ups it triggers. */
  awardXp: (amount: number) => void
  /** Spend one unspent point on a core stat. */
  allocateStat: (stat: AllocatableStat, amount?: number) => void
  /** Refund every spent point back into the pool. */
  respecStats: () => void
  /** Sub-stats derived from the core stats, as used by expedition checks. */
  getDerivedStats: () => { label: string; value: number; from: string }[]

  // Rituals (Focus)
  /** Attunement capacity from Focus, and how much the given set consumes. */
  getAttunement: () => { capacity: number; used: number }
  /** Rituals prepped for the next launch. */
  preparedRituals: string[]
  toggleRitual: (id: string) => void
  learnRitual: (id: string) => void
  /** Whether the player took Ritualism, which gates all ritual prep. */
  hasRitualism: () => boolean

  // Bestiary + mounts
  /** Record a sighting. First sighting is what discovers the codex entry. */
  recordEncounter: (creatureId: string) => void
  /** Record a kill. Field notes only; taming is gated on encounters, not kills. */
  recordDefeat: (creatureId: string) => void
  /** Bring a beast in as a pack animal. No-op unless `canTame` allows it. */
  tameBeast: (creatureId: string) => void
  /** Set the active pack animal, or pass null to travel unmounted. */
  setActiveMount: (creatureId: string | null) => void
  /** Whether this beast can be tamed right now, plus why not when it can't. */
  canTame: (creatureId: string) => { ok: boolean; reason?: string }


  // Navigation
  screen: ScreenId
  setScreen: (s: ScreenId) => void
  opsTab: OpsTab
  setOpsTab: (t: OpsTab) => void
  /** World-map node to preselect when the Map tab mounts (deep-link target). */
  mapFocusNodeId: string | null
  setMapFocus: (id: string | null) => void
  /** Faction sub-view to open when the Faction tab mounts (deep-link target). */
  factionViewRequest: FactionView | null
  requestFactionView: (v: FactionView | null) => void

  // Terminal (Chat)
  channel: ChannelId
  setChannel: (c: ChannelId) => void
  channels: Channel[]
  messages: ChatMessage[]
  sendMessage: (channel: ChannelId, body: string) => void
  unread: Record<ChannelId, number>
  markRead: (c: ChannelId) => void
  /** Message-log pagination: 0 = newest page, higher = further back */
  pageOffset: number
  nudgePage: (delta: number) => void
  resetPage: () => void

  // Quick Actions
  quickActions: QuickAction[]

  // Ops - Expeditions
  expeditions: Expedition[]
  activeExpedition: ActiveExpedition | null
  /**
   * Launch a run. `ritualIds` is optional so existing call sites that launch
   * without a prep step keep working; omitted means "use preparedRituals".
   */
  startExpedition: (id: string, ritualIds?: string[]) => void
  cancelExpedition: () => void
  /**
   * Epoch ms until which new expeditions are locked after a failed run, or null
   * when no cooldown is active. A "failed" run is a total wipe (no cargo home).
   */
  expeditionCooldownUntil: number | null
  /** Seconds left on the failure cooldown, clamped to 0. */
  getExpeditionCooldownRemaining: () => number

  // Ops - Skills
  skills: Skill[]
  loadout: string[]
  toggleLoadout: (id: string) => void
  /** Alias of toggleLoadout used by loadout UI components */
  toggleLoadoutSkill: (id: string) => void
  setSkillVariant: (skillId: string, variantId: string) => void
  /** Aggregated mechanical effects of every unlocked skill sub-stat. */
  getSkillBonuses: () => SkillBonuses
  /** Content unlocked by skill tier breakpoints (levels 5 / 10 / 15). */
  getSkillUnlocks: () => Set<string>
  hasSkillUnlock: (id: string) => boolean
  /** Unlock ids forced on via admin dev tools, bypassing the skill requirement. */
  debugUnlocks: SkillUnlockId[]
  toggleDebugUnlock: (id: SkillUnlockId) => void
  clearDebugUnlocks: () => void

  // Ops - Crafting/Rolling
  inventory: InventoryItem[]
  shards: typeof seedShards
  recovery: RecoveryResult[]
  lastRecovered: RecoveryResult | null
  /**
   * "translation" is the Lorekeeping payoff: it reads the sealed packets the
   * other two passes cannot, and is gated on the `archive_translation` unlock.
   */
  runRecovery: (mode: RecoveryMode) => void
  clearLastRecovered: () => void
  activeCraft: { recipeId: string; label: string; startedAt: number; duration: number } | null
  craftItem: (recipeId: string) => { success: boolean; message: string }
  completeCraft: () => void
  addMaterials: () => void // Admin function to add crafting materials

  // Ops - Fishing (gated behind the Fishing skill's tier unlocks)
  fishing: FishingState
  /** Bait the player has chosen to fish with. Required to cast. */
  selectedBaitId: string | null
  setBait: (baitId: string) => void
  /** How much of a given bait is in the inventory. */
  getBaitCount: (baitId: string) => number
  /** Timestamp of the last free grub dig, for the cooldown. */
  lastDigAt: number | null
  /**
   * Free fallback bait so "bait required" can never hard-lock a courier who
   * has no materials. Returns false while still on cooldown.
   */
  digForGrubs: () => boolean
  /**
   * Drop the line at a spot with a bait. Consumes one bait.
   * Returns false if the spot is locked or the bait is not in the inventory.
   */
  castLine: (spotId: string, baitId: string) => boolean
  /** A fish has taken the bait; the store picks which one and opens the window. */
  triggerBite: () => void
  /** Player struck. Lands the catch if the window is still open. */
  setHook: () => void
  /** Window closed without a strike, or the player reeled in early. */
  reelIn: () => void
  fishingLog: FishingCatch[]

  // Contracts
  contracts: Contract[]
  /** Every contract that can be drawn; `contracts` is today's subset. */
  contractPool: Contract[]
  /** Local day key the current board was generated for. */
  contractDay: string
  rotateContractsIfStale: () => void
  acceptContract: (id: string) => void
  cancelContract: (id: string) => void
  
  // Social - Party
  party: PartyMember[]
  invitePartyMember: () => { success: boolean; message: string }
  removePartyMember: (slot: number) => void
  setPartyMemberRole: (slot: number, role: string) => void
  readyUpParty: () => void

  // Social - Faction
  factionProjects: FactionProject[]
  factionBuildings: FactionBuilding[]
  factionRallies: FactionRally[]
  factionActivity: FactionActivity[]
  contributeToProject: (projectId: string, amount: number) => { success: boolean; message: string }
  upgradeBuilding: (buildingId: string) => { success: boolean; message: string }
  joinRally: (rallyId: string) => void
  contributeToRally: (rallyId: string, amount: number) => { success: boolean; message: string }
  
  // Social - Friends
  friends: Friend[]
  removeFriend: (handle: string) => void

  // Social - Player profile viewer
  viewedPlayer: PlayerView | null
  viewPlayer: (player: PlayerView) => void
  closePlayerProfile: () => void
  // Full-page read-only view of another player, opened from the modal.
  viewedProfile: PlayerView | null
  openPlayerProfilePage: (player: PlayerView) => void
  clearViewedProfile: () => void
  
  // Social - Trade
  tradeOffers: TradeOffer[]

  // Profile
  identity: typeof seedIdentity
  profile: Profile
  profileTab: "summary" | "titles" | "bestiary" | "cosmetics" | "settings" | "notifications"
  setProfileTab: (tab: "summary" | "titles" | "bestiary" | "cosmetics" | "settings" | "notifications") => void
  setActiveTitle: (titleId: string) => void
  /** Push a new unread notification; id and timestamp are assigned here. */
  addNotification: (
    n: Omit<ProfileNotification, "id" | "state" | "createdAt">
  ) => void
  markNotificationRead: (id: number) => void
  openNotification: (notification: ProfileNotification) => void
  clearNotification: (id: number) => void
  clearAllNotifications: () => void
  
  // Avatar & Vanity
  equipVanity: (vanityId: string) => void
  unequipVanity: (layerType: AvatarLayerType) => void
  /**
   * Spend one Appearance Reset Token to overwrite the base look (head, skin,
   * eyes, hair) with the supplied config and clear every equipped cosmetic.
   * Owned cosmetics are kept (still unlocked), only unequipped. Returns false
   * without changing anything when no token is held.
   */
  resetBaseAppearance: (nextAvatar: AvatarConfig) => boolean
  
  // Admin/Debug
  setHandle: (newHandle: string) => void
  unlockAllCosmetics: () => void
  unlockAllTitles: () => void
  /** Dev-only: tame every pack beast, bypassing encounter and skill gates. */
  devUnlockAllMounts: () => void
  simulateExpedition: (expeditionId?: string) => void
  completeActiveExpedition: (lootMultiplier?: number) => void
  injectTestChatMessages: () => void

  // ============ TERRITORY WAR ============
  /** Controlling faction per node id; null/absent = neutral. */
  nodeControl: NodeControl
  /** Stored defender garrison per claimed node. */
  nodeGarrisons: Record<string, StoredGroup>
  /** Per-faction home base integrity + buildings. */
  factionBases: Record<string, FactionBaseState>
  /** The battle currently being watched, or null. */
  activeBattle: TerritoryBattle | null
  /** A claim/assault awaiting its expedition to finish before the battle. */
  pendingTerritory: { nodeId: string; kind: TerritoryBattleKind } | null
  /** The player's faction id, or null if factionless. */
  getPlayerFactionId: () => RaceId | null
  /** Whether the player may claim a node right now, with a reason when not. */
  canClaimNode: (nodeId: string) => { ok: boolean; reason?: string }
  /** Whether the player may assault a rival base right now. */
  canAssaultBase: (nodeId: string) => { ok: boolean; reason?: string }
  /** Launch a claim: runs the node's expedition, then a battle on arrival. */
  startTerritoryClaim: (nodeId: string) => void
  /** Launch a base raid on a rival HQ (immediate battle, no expedition). */
  startBaseAssault: (nodeId: string) => void
  /** Build + simulate the pending battle so the view can play it back. */
  beginTerritoryBattle: (nodeId: string, kind: TerritoryBattleKind, attacker: StoredGroup) => void
  /** Apply the watched battle's outcome, then run the rival expansion tick. */
  resolveTerritoryBattle: () => void
  /** Each rival faction makes one adjacency-limited expansion attempt. */
  runRivalExpansionTick: () => void
  /** Elapsed-time integrity + building recovery across all bases. */
  recoverBases: () => void
  
  // Admin Panel
  isAdmin: boolean
  adminTab: AdminTab
  setAdminMode: (v: boolean) => void
  setAdminTab: (tab: AdminTab) => void
  events: GameEvent[]
  createEvent: (event: Omit<GameEvent, "id">) => void
  updateEvent: (id: string, updates: Partial<GameEvent>) => void
  deleteEvent: (id: string) => void
  toggleEventActive: (id: string) => void
  playerRecords: PlayerRecord[]
  mutePlayer: (handle: string, durationMinutes: number) => void
  unmutePlayer: (handle: string) => void
  banPlayer: (handle: string, reason: string) => void
  unbanPlayer: (handle: string) => void
  warnPlayer: (handle: string) => void
  adminLogs: AdminLog[]
  logAdminAction: (action: AdminAction, target?: string, details?: string) => void
  broadcastMessage: (message: string, channel: ChannelId) => void
  createContract: (contract: Omit<Contract, "id">) => void
  deleteContract: (id: string) => void
  createExpedition: (expedition: Omit<Expedition, "id">) => void
  deleteExpedition: (id: string) => void
}

/**
 * @param luck Rollcraft / Lorekeeping bonus. Shrinks the random draw so it
 *   lands in the rarer bands more often — luck of 0.2 makes a roll behave as
 *   if it came in 20% lower.
 */
function rollRarity(focused: boolean, luck = 0): Rarity {
  const r = Math.random() * (1 - Math.min(0.6, Math.max(0, luck)))
  if (focused) {
    if (r < 0.02) return "legendary"
    if (r < 0.1) return "epic"
    if (r < 0.28) return "rare"
    if (r < 0.58) return "uncommon"
    return "common"
  }
  if (r < 0.005) return "legendary"
  if (r < 0.04) return "epic"
  if (r < 0.14) return "rare"
  if (r < 0.4) return "uncommon"
  return "common"
}

interface PoolItem {
  label: string
  type: RecoveryResult["type"]
  vanityData?: { layerType: AvatarLayerType; variant: number }
}

const POOL: Record<Rarity, PoolItem[]> = {
  common: [
    // Non-cosmetics
    { label: "Relay Flair", type: "chat_flair" },
    { label: "Field Kit Schematic", type: "schematic" },
    { label: "Calm Route", type: "modifier" },
    { label: "Drifter", type: "title" },
    { label: "Relay Initiate", type: "title" },
    { label: "Path Follower", type: "title" },
    // Accessories
    { label: "Signal Glasses", type: "cosmetic", vanityData: { layerType: "accessory", variant: 1 } },
    { label: "Basic Shades", type: "cosmetic", vanityData: { layerType: "accessory", variant: 5 } },
    { label: "Dust Goggles", type: "cosmetic", vanityData: { layerType: "accessory", variant: 6 } },
    { label: "Worn Bandana", type: "cosmetic", vanityData: { layerType: "accessory", variant: 7 } },
    { label: "Tide Goggles", type: "cosmetic", vanityData: { layerType: "accessory", variant: 22 } },
    // Hats
    { label: "Route Cap", type: "cosmetic", vanityData: { layerType: "hat", variant: 1 } },
    { label: "Dust Hood", type: "cosmetic", vanityData: { layerType: "hat", variant: 7 } },
    { label: "Signal Beanie", type: "cosmetic", vanityData: { layerType: "hat", variant: 8 } },
    { label: "Worn Helmet", type: "cosmetic", vanityData: { layerType: "hat", variant: 9 } },
    { label: "Reed Hat", type: "cosmetic", vanityData: { layerType: "hat", variant: 24 } },
    // Flair
    { label: "Soft Glow", type: "cosmetic", vanityData: { layerType: "flair", variant: 4 } },
    { label: "Dust Motes", type: "cosmetic", vanityData: { layerType: "flair", variant: 5 } },
    // Lipstick colors (Rose ships unlocked; these are the low-tier gacha shades)
    { label: "Crimson Lipstick", type: "cosmetic", vanityData: { layerType: "mouth", variant: 2 } },
    { label: "Coral Lipstick", type: "cosmetic", vanityData: { layerType: "mouth", variant: 3 } },
    { label: "Berry Lipstick", type: "cosmetic", vanityData: { layerType: "mouth", variant: 4 } },
  ],
  uncommon: [
    // Non-cosmetics
    { label: "Signal Keeper", type: "title" },
    { label: "Signal Beacon Schematic", type: "schematic" },
    { label: "Clean Entry", type: "modifier" },
    { label: "Pale Wanderer", type: "title" },
    { label: "Circuit Speaker", type: "title" },
    { label: "Dust Walker", type: "title" },
    { label: "Signal Chaser", type: "title" },
    // Accessories
    { label: "Eyepatch", type: "cosmetic", vanityData: { layerType: "accessory", variant: 2 } },
    { label: "Scar Mark", type: "cosmetic", vanityData: { layerType: "accessory", variant: 3 } },
    { label: "Relay Earpiece", type: "cosmetic", vanityData: { layerType: "accessory", variant: 8 } },
    { label: "Signal Monocle", type: "cosmetic", vanityData: { layerType: "accessory", variant: 9 } },
    { label: "Route Mask", type: "cosmetic", vanityData: { layerType: "accessory", variant: 10 } },
    { label: "Ashfall Veil", type: "cosmetic", vanityData: { layerType: "accessory", variant: 23 } },
    // Hats
    { label: "Signal Antenna", type: "cosmetic", vanityData: { layerType: "hat", variant: 3 } },
    { label: "Relay Headset", type: "cosmetic", vanityData: { layerType: "hat", variant: 10 } },
    { label: "Archive Hood", type: "cosmetic", vanityData: { layerType: "hat", variant: 11 } },
    { label: "Scout Helm", type: "cosmetic", vanityData: { layerType: "hat", variant: 12 } },
    { label: "Lantern Rig", type: "cosmetic", vanityData: { layerType: "hat", variant: 25 } },
    // Flair
    { label: "Signal Flicker", type: "cosmetic", vanityData: { layerType: "flair", variant: 6 } },
    { label: "Route Trails", type: "cosmetic", vanityData: { layerType: "flair", variant: 7 } },
    // Lipstick colors (deeper shades)
    { label: "Plum Lipstick", type: "cosmetic", vanityData: { layerType: "mouth", variant: 5 } },
    { label: "Nude Lipstick", type: "cosmetic", vanityData: { layerType: "mouth", variant: 6 } },
  ],
  rare: [
    // Non-cosmetics
    { label: "Archive Listener", type: "title" },
    { label: "Support Crate Blueprint", type: "blueprint" },
    { label: "Waystone Keeper", type: "title" },
    { label: "Deep Touched", type: "title" },
    { label: "Echo Finder", type: "title" },
    { label: "Rift Walker", type: "title" },
    // Accessories
    { label: "Archive Visor", type: "cosmetic", vanityData: { layerType: "accessory", variant: 4 } },
    { label: "Deep Scanner", type: "cosmetic", vanityData: { layerType: "accessory", variant: 11 } },
    { label: "Rift Lens", type: "cosmetic", vanityData: { layerType: "accessory", variant: 12 } },
    { label: "Echo Mask", type: "cosmetic", vanityData: { layerType: "accessory", variant: 13 } },
    { label: "Currentweave Mask", type: "cosmetic", vanityData: { layerType: "accessory", variant: 24 } },
    // Hats
    { label: "Relay Horns", type: "cosmetic", vanityData: { layerType: "hat", variant: 4 } },
    { label: "Drift Crown", type: "cosmetic", vanityData: { layerType: "hat", variant: 13 } },
    { label: "Echo Circlet", type: "cosmetic", vanityData: { layerType: "hat", variant: 14 } },
    { label: "Signal Crest", type: "cosmetic", vanityData: { layerType: "hat", variant: 15 } },
    { label: "Deepline Coil", type: "cosmetic", vanityData: { layerType: "hat", variant: 26 } },
    // Flair
    { label: "Sparkle Effect", type: "cosmetic", vanityData: { layerType: "flair", variant: 3 } },
    { label: "Echo Ripples", type: "cosmetic", vanityData: { layerType: "flair", variant: 8 } },
    { label: "Data Stream", type: "cosmetic", vanityData: { layerType: "flair", variant: 9 } },
  ],
  epic: [
    // Non-cosmetics
    // Consumable: re-opens the base appearance editor without discarding cosmetics.
    { label: "Appearance Reset Token", type: "appearance_token" },
    { label: "Relay Warden", type: "title" },
    { label: "Depth Touched", type: "title" },
    { label: "Void Speaker", type: "title" },
    { label: "Rift Sovereign", type: "title" },
    { label: "Archive Seeker", type: "title" },
    // Accessories
    { label: "Void Visor", type: "cosmetic", vanityData: { layerType: "accessory", variant: 14 } },
    { label: "Prismatic Lens", type: "cosmetic", vanityData: { layerType: "accessory", variant: 15 } },
    { label: "Stormglass Lens", type: "cosmetic", vanityData: { layerType: "accessory", variant: 25 } },
    // Hats
    { label: "Archive Halo", type: "cosmetic", vanityData: { layerType: "hat", variant: 5 } },
    { label: "Void Helm", type: "cosmetic", vanityData: { layerType: "hat", variant: 16 } },
    { label: "Rift Diadem", type: "cosmetic", vanityData: { layerType: "hat", variant: 17 } },
    { label: "Stormglass Crown", type: "cosmetic", vanityData: { layerType: "hat", variant: 27 } },
    // Flair
    { label: "Static Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 2 } },
    { label: "Pulse Glow", type: "cosmetic", vanityData: { layerType: "flair", variant: 1 } },
    { label: "Void Shimmer", type: "cosmetic", vanityData: { layerType: "flair", variant: 10 } },
  ],
  legendary: [
    // Non-cosmetics
    { label: "Deep Pull Regent", type: "title" },
    { label: "Primordial Echo", type: "title" },
    { label: "The Returned", type: "title" },
    { label: "Signal Sovereign", type: "title" },
    // Accessories
    { label: "All-Seeing Eye", type: "cosmetic", vanityData: { layerType: "accessory", variant: 16 } },
    { label: "Leviathan's Regard", type: "cosmetic", vanityData: { layerType: "accessory", variant: 26 } },
    // Hats
    { label: "Crown of Routes", type: "cosmetic", vanityData: { layerType: "hat", variant: 6 } },
    { label: "Primordial Antlers", type: "cosmetic", vanityData: { layerType: "hat", variant: 18 } },
    { label: "Kelpwarden Wreath", type: "cosmetic", vanityData: { layerType: "hat", variant: 28 } },
    // Flair
    { label: "Prismatic Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 11 } },
    { label: "Celestial Flame", type: "cosmetic", vanityData: { layerType: "flair", variant: 12 } },
  ],
  mythic: [
    { label: "Origin Cipher", type: "title" },
    { label: "Worldcurrent Antlers", type: "cosmetic", vanityData: { layerType: "hat", variant: 19 } },
    { label: "Genesis Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 13 } },
    { label: "Tidecaller's Visage", type: "cosmetic", vanityData: { layerType: "accessory", variant: 27 } },
    { label: "Abyssal Diadem", type: "cosmetic", vanityData: { layerType: "hat", variant: 29 } },
    // Mythic accessories that previously had no in-game unlock path.
    { label: "Voidtouched Gaze", type: "cosmetic", vanityData: { layerType: "accessory", variant: 17 } },
    { label: "Relay Sea Mask", type: "cosmetic", vanityData: { layerType: "accessory", variant: 18 } },
    { label: "Shardheart Visor", type: "cosmetic", vanityData: { layerType: "accessory", variant: 19 } },
    { label: "Eternal Courier's Mark", type: "cosmetic", vanityData: { layerType: "accessory", variant: 20 } },
    { label: "Primordial Echo", type: "cosmetic", vanityData: { layerType: "accessory", variant: 21 } },
    // Mythic hats that previously had no in-game unlock path.
    { label: "Eternal Courier's Crest", type: "cosmetic", vanityData: { layerType: "hat", variant: 21 } },
    { label: "Voidtouched Halo", type: "cosmetic", vanityData: { layerType: "hat", variant: 22 } },
    { label: "Primordial Echo Crown", type: "cosmetic", vanityData: { layerType: "hat", variant: 23 } },
    // Mythic flair that previously had no in-game unlock path.
    { label: "Shardheart Radiance", type: "cosmetic", vanityData: { layerType: "flair", variant: 14 } },
    { label: "Eternal Courier's Light", type: "cosmetic", vanityData: { layerType: "flair", variant: 15 } },
    { label: "Voidtouched Presence", type: "cosmetic", vanityData: { layerType: "flair", variant: 16 } },
    { label: "Primordial Resonance", type: "cosmetic", vanityData: { layerType: "flair", variant: 17 } },
  ],
  admin: [
    { label: "Architect's Seal", type: "title" },
    { label: "Root Access Crown", type: "cosmetic", vanityData: { layerType: "hat", variant: 20 } },
  ],
}

// ============ FACTION HELPERS ============

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

let factionActivitySeq = 0

/** Prepend a faction activity entry, capping the log length. */
function pushActivity(
  list: FactionActivity[],
  entry: Omit<FactionActivity, "id" | "at"> & { at?: number },
): FactionActivity[] {
  factionActivitySeq += 1
  const full: FactionActivity = {
    id: `fa-live-${factionActivitySeq}`,
    at: entry.at ?? Date.now(),
    ...entry,
  }
  return [full, ...list].slice(0, 40)
}

/**
 * Apply a standing gain to the profile's faction, handling rank-ups against the
 * cumulative RANK_TIERS thresholds. `bonus` is a fractional multiplier (0.15 = +15%).
 */
function applyStanding(
  profile: Profile,
  rawAmount: number,
  bonus: number,
): { profile: Profile; gained: number; rankedUp: boolean; newRank: number } {
  if (!profile.faction) return { profile, gained: 0, rankedUp: false, newRank: 0 }
  const gained = Math.max(0, Math.round(rawAmount * (1 + bonus)))
  let { rank, standing, maxStanding } = profile.faction
  standing += gained
  let rankedUp = false
  const maxRank = RANK_TIERS.length - 1
  while (standing >= maxStanding && rank < maxRank) {
    standing -= maxStanding
    rank += 1
    rankedUp = true
    const nextDelta =
      (RANK_TIERS[rank + 1]?.standing ?? RANK_TIERS[rank].standing + 1000) - RANK_TIERS[rank].standing
    maxStanding = Math.max(100, nextDelta)
  }
  if (rank >= maxRank) standing = Math.min(standing, maxStanding)
  return {
    profile: { ...profile, faction: { ...profile.faction, rank, standing, maxStanding } },
    gained,
    rankedUp,
    newRank: rank,
  }
}

/** Recovery lockout after a failed (fully wiped) expedition. */
const EXPEDITION_FAIL_COOLDOWN_MS = 2 * 60 * 1000

const PARTY_ROLES = ["Logistics", "Surveying", "Analysis", "Security", "Relay Tuning", "Scavenging"]
const PARTY_TITLES: { label: string; rarity: Rarity }[] = [
  { label: "Route Tender", rarity: "common" },
  { label: "Signal Keeper", rarity: "uncommon" },
  { label: "Archive Listener", rarity: "rare" },
  { label: "Waystone Keeper", rarity: "epic" },
]

/**
 * Freeze a squad of handles into a stored group for a territory battle. The
 * player uses their live derived stats (no run buffs — those never enter
 * getPlayerStats), party members use their deterministic derived stats.
 */
function groupFromHandles(
  handles: string[],
  factionId: RaceId,
  identity: { handle: string; avatar?: AvatarConfig },
  party: PartyMember[],
  playerStats: BaseStats,
): StoredGroup {
  const members = handles.map((h) => {
    if (h === identity.handle) {
      return { handle: h, role: "Courier", avatar: identity.avatar, stats: playerStats }
    }
    const pm = party.find((m) => m.handle === h)
    const role = pm?.role ?? "Crew"
    return { handle: h, role, avatar: pm?.avatar, stats: deriveMemberStats(h, role) }
  })
  return snapshotGroup(members, factionId)
}

/** Assemble the deployable squad (leader first), capped at `maxSquad`. */
function assembleSquadHandles(
  party: PartyMember[],
  playerHandle: string,
  maxSquad: number,
): string[] {
  const available = [...party]
    .filter((m) => m.avatar && (m.status === "ready" || m.status === "idle" || m.leader))
    .sort((a, b) => (b.leader ? 1 : 0) - (a.leader ? 1 : 0))
  const handles = available.slice(0, maxSquad).map((m) => m.handle)
  if (!handles.includes(playerHandle)) handles.unshift(playerHandle)
  return handles
}

export const useEsroStore = create<EsroState>((set, get) => ({
  booted: false,
  setBooted: (v) => set({ booted: v }),

  // Character Creation & Onboarding
  isNewUser: true, // Set to true to trigger onboarding
  characterCreated: false, // Set to false for new users
  characterRace: null,
  characterCourier: null,
  characterFaction: null,
  factionUnlocked: false,
  // Baseline of unlocks a default character already has, so the first sync only
  // ever announces things earned during play — never the starting kit on load.
  seenUnlocks: Array.from(getSkillUnlocks(createInitialSkills(), DEFAULT_BASE_STATS)),
  uiTheme: "default",
  unlockedThemes: [], // Start with no rollable themes unlocked
  setCharacterData: (race, courier, handle, starterSkills, avatar) => {
    const { profile, identity } = get()
    set({
      characterCreated: true,
      characterRace: race,
      characterCourier: courier,
      isNewUser: false,
      // The player's chosen starter skills start unlocked at level 1; the rest
      // stay locked to be earned. Previously starterSkills was accepted and
      // then discarded, so character creation had no mechanical effect.
      skills: createInitialSkills(starterSkills),
      loadout: starterSkills.slice(0, 4).map(skillIdFromName),
      identity: {
        ...identity,
        handle: `@${handle}`,
        established: true,
        ...(avatar && { avatar }),
      },
      profile: {
        ...profile,
        handle: `@${handle}`,
        race: race,
        courier: courier,
        // Stamped once, here, so it records when the courier was actually made
        // rather than when the profile was last touched.
        createdAt: Date.now(),
      },
    })
    // The chosen race/courier/starter skills define the real starting kit, so
    // re-baseline against them silently — anything earned later then announces.
    get().syncUnlocks({ silent: true })
  },
  setFaction: (factionId) => {
    const faction = FACTIONS.find(f => f.id === factionId)
    if (!faction) return
    const race = getRaceById(factionId)
    set({ 
      characterFaction: faction,
      uiTheme: factionId,
      characterRace: race || get().characterRace,
    })
  },
  setUiTheme: (theme) => set({ uiTheme: theme }),
  unlockTheme: (themeId) => {
    const { unlockedThemes } = get()
    if (!unlockedThemes.includes(themeId)) {
      set({ unlockedThemes: [...unlockedThemes, themeId] })
    }
  },
  checkFactionUnlock: () => {
    const { profile, factionUnlocked } = get()
    if (!factionUnlocked && profile.level >= FACTION_UNLOCK_LEVEL) {
      set({ factionUnlocked: true })
    }
  },

  syncUnlocks: (opts) => {
    const current = get().getSkillUnlocks()
    const seen = new Set(get().seenUnlocks)
    const newly = [...current].filter((id) => !seen.has(id)) as SkillUnlockId[]
    if (newly.length === 0) return
    // Re-baseline first so a notification's own re-render can never double-fire.
    set({ seenUnlocks: [...current] })
    if (opts?.silent) return
    // Escort work lives on the contracts board and faction rites on the faction
    // page; everything else is reached from the ops hub (map, crafting, archive).
    const deeplinkFor: Partial<Record<SkillUnlockId, ScreenId>> = {
      escort_contracts: "contracts",
      faction_rites: "social",
    }
    for (const id of newly) {
      const label = UNLOCK_LABELS[id] ?? id
      const isRoute = UNLOCK_KIND[id] === "route"
      get().addNotification({
        title: isRoute ? "New route unlocked" : "New feature unlocked",
        body: isRoute
          ? `${label} — a new destination is open on the expedition map.`
          : `${label} is now available.`,
        priority: "high",
        deeplink: { screen: deeplinkFor[id] ?? "ops" },
      })
    }
  },
  
  // Player Stats - calculated from race, courier, level, and skills
  getPlayerStats: () => {
    const { characterRace, characterCourier, profile, skills } = get()
    
    // Start with base stats
    const stats: BaseStats = { ...DEFAULT_BASE_STATS }
    
    // Add race bonuses
    if (characterRace) {
      stats.hp += characterRace.stats.hp
      stats.atk += characterRace.stats.atk
      stats.def += characterRace.stats.def
      stats.focus += characterRace.stats.focus
      stats.luck += characterRace.stats.luck
    }
    
    // Add courier bonuses
    if (characterCourier) {
      stats.hp += characterCourier.stats.hp
      stats.atk += characterCourier.stats.atk
      stats.def += characterCourier.stats.def
      stats.focus += characterCourier.stats.focus
      stats.luck += characterCourier.stats.luck
    }
    
    // Add level bonuses (+1 to each stat every 5 levels)
    const levelBonus = Math.floor((profile.level - 1) / 5)
    stats.hp += levelBonus * 2 // HP grows faster
    stats.atk += levelBonus
    stats.def += levelBonus
    stats.focus += levelBonus
    stats.luck += levelBonus
    
    // Add skill bonuses (+1 to the linked stat per 2 skill levels).
    // Reads linkedStat off the skill itself, which is populated from
    // config/skills.json. The old lookup matched skill.label against
    // SKILL_DEFINITIONS and missed on all but one skill, so 8 of 9 skills
    // contributed nothing.
    skills.forEach((skill) => {
      if (skill.locked || skill.level <= 0) return
      const linkedStat = skill.linkedStat ?? getSkillMechanic(skill.label)?.linkedStat
      if (linkedStat) {
        stats[linkedStat] += Math.floor(skill.level / 2)
      }
    })

    // Points the player spent from level-ups. Added here so every consumer —
    // expedition checks, the Luck 15 fishing gate, the readiness panel — picks
    // them up without any further wiring.
    const allocated = profile.allocated
    if (allocated) {
      stats.atk += allocated.atk || 0
      stats.def += allocated.def || 0
      stats.focus += allocated.focus || 0
      stats.luck += allocated.luck || 0
      // HP is intentionally level-driven; DEF remains the sole allocatable
      // primary for Endurance and cannot be converted into free HP.
    }

    // Conditioning and other survivability skills widen the HP pool directly.
    stats.hp += Math.round(get().getSkillBonuses().maxHpBonus)

    return stats
  },

  /**
   * Award XP and resolve level-ups. This is the only place XP enters the
   * profile; before it existed, `rewards.xp` was dead data and levels never
   * moved, so stat points were unreachable.
   */
  awardXp: (amount) => {
    if (amount <= 0) return
    const { profile } = get()
    const result = applyXp(profile, amount)

    set({
      profile: {
        ...profile,
        level: result.level,
        xp: result.xp,
        xpToNext: result.xpToNext,
        statPoints: result.statPoints,
      },
    })

    // One notification per level crossed, so a multi-level award is legible.
    for (const lvl of result.levelsGained) {
      get().addNotification({
        title: `Level ${lvl}`,
        body: `You reached level ${lvl}. ${POINTS_PER_LEVEL} stat points available.`,
        priority: "high",
        deeplink: { screen: "profile" },
      })
    }

    // Reaching a level can satisfy the faction gate and open level-tier routes
    // and features (deep ruins, escort contracts, anomaly zones…).
    if (result.levelsGained.length) {
      get().checkFactionUnlock()
      get().syncUnlocks()
    }
  },

  allocateStat: (stat, amount = 1) => {
    const { profile } = get()
    const points = profile.statPoints ?? 0
    // Never spend more than the pool holds, so the UI cannot overdraw.
    const spend = Math.max(0, Math.min(amount, points))
    if (spend === 0) return

    const allocated = { ...(profile.allocated ?? emptyAllocation()) }
    allocated[stat] = (allocated[stat] || 0) + spend

    set({
      profile: { ...profile, allocated, statPoints: points - spend },
    })
    // Spending points can cross a stat gate (e.g. Luck 15 opens fishing).
    get().syncUnlocks()
  },

  respecStats: () => {
    const { profile } = get()
    // Refund exactly what was spent rather than recomputing from level, so a
    // partially spent pool is never inflated or truncated.
    const refund = spentPoints(profile.allocated)
    if (refund === 0) return
    set({
      profile: {
        ...profile,
        allocated: emptyAllocation(),
        statPoints: (profile.statPoints ?? 0) + refund,
      },
    })
  },

  /**
   * The sub-stats expedition checks actually roll against. These already
   * existed inside the sim's EVENT_CHECK table but were never surfaced, which
   * is why spending points felt disconnected from outcomes.
   */
  getDerivedStats: () => {
    const s = get().getPlayerStats()
    return [
      { label: "Combat", value: derivedStatScore(s.atk, s.def), from: "ATK + DEF" },
      { label: "Endurance", value: derivedStatScore(s.def, s.hp), from: "DEF + HP" },
      { label: "Insight", value: derivedStatScore(s.focus, s.luck), from: "FOC + LUK" },
      { label: "Navigation", value: derivedStatScore(s.luck, s.focus), from: "LUK + FOC" },
      // The only place the hidden fishing bite-window bonus is surfaced. Left
      // deliberately vague so an attentive player can connect it themselves.
      { label: "Reflex", value: s.focus, from: "FOC" },
    ]
  },

  // ---- Rituals ----
  preparedRituals: [],

  getAttunement: () => ({
    capacity: attunementCapacity(get().getPlayerStats().focus),
    used: attunementUsed(get().preparedRituals),
  }),

  hasRitualism: () => get().skills.some((s) => s.id === "ritualism" && !s.locked),

  toggleRitual: (id) => {
    const { preparedRituals, profile } = get()
    if (preparedRituals.includes(id)) {
      set({ preparedRituals: preparedRituals.filter((r) => r !== id) })
      return
    }
    const ritual = getRitual(id)
    if (!ritual) return
    // Prepping anything at all requires Ritualism. Enforced here rather than only
    // in the UI so the rule holds for every caller, and so a build that never took
    // the skill can't end up carrying buffs it shouldn't have.
    if (!get().hasRitualism()) return
    // Rites are taught by a skill unlock rather than a book, so they bypass the
    // known-ritual check and are gated on the unlock instead.
    if (ritual.requiresUnlock) {
      if (!get().hasSkillUnlock(ritual.requiresUnlock)) return
    } else if (!profile.knownRituals?.includes(id)) {
      // Can only prep what is known, and only within Focus capacity.
      return
    }
    const { capacity, used } = get().getAttunement()
    if (used + ritual.attunement > capacity) return
    set({ preparedRituals: [...preparedRituals, id] })
  },

  learnRitual: (id) => {
    const { profile } = get()
    const known = profile.knownRituals ?? []
    if (known.includes(id)) return
    const ritual = getRitual(id)
    if (!ritual) return
    set({ profile: { ...profile, knownRituals: [...known, id] } })
    get().addNotification({
      title: "Ritual learned",
      body: `${ritual.label} — ${ritual.description}`,
      priority: "normal",
      deeplink: { screen: "profile" },
    })
  },

  recordEncounter: (creatureId) => {
    const creature = getCreature(creatureId)
    if (!creature) return
    const { profile } = get()
    const bestiary = profile.bestiary ?? {}
    const prev = bestiary[creatureId]
    // Every sighting gets its own roll, but the flag is sticky: once a shiny has
    // been logged an ordinary sighting must never overwrite it back to false.
    const foundShiny = !prev?.shiny && rollShiny()
    set({
      profile: {
        ...profile,
        bestiary: {
          ...bestiary,
          [creatureId]: {
            encounters: (prev?.encounters ?? 0) + 1,
            defeats: prev?.defeats ?? 0,
            firstSeen: prev?.firstSeen ?? Date.now(),
            tamed: prev?.tamed,
            shiny: prev?.shiny || foundShiny,
            shinyAt: prev?.shinyAt ?? (foundShiny ? Date.now() : undefined),
          },
        },
      },
    })
    // A shiny is the rarest thing in the game, so it gets its own high-priority
    // callout on whichever encounter turns it up — not just the first sighting.
    if (foundShiny) {
      get().addNotification({
        title: "Anomalous variant",
        body: `A shiny ${creature.name}. Recoloured, and the only one you have seen.`,
        priority: "high",
        deeplink: { screen: "profile" },
      })
      return
    }
    // Otherwise only announce the first sighting; repeats would spam the feed.
    if (!prev) {
      get().addNotification({
        title: "Bestiary updated",
        body: `${creature.name} recorded — ${creature.habitat}.`,
        priority: "normal",
        deeplink: { screen: "profile" },
      })
    }
  },

  recordDefeat: (creatureId) => {
    const { profile } = get()
    const bestiary = profile.bestiary ?? {}
    const prev = bestiary[creatureId]
    // A defeat implies a sighting, so seed the record rather than dropping it.
    set({
      profile: {
        ...profile,
        bestiary: {
          ...bestiary,
          [creatureId]: {
            encounters: prev?.encounters ?? 1,
            defeats: (prev?.defeats ?? 0) + 1,
            firstSeen: prev?.firstSeen ?? Date.now(),
            tamed: prev?.tamed,
          },
        },
      },
    })
  },

  canTame: (creatureId) => {
    const creature = getCreature(creatureId)
    if (!creature) return { ok: false, reason: "Unknown creature" }
    if (!creature.pack) return { ok: false, reason: `${CLASS_LABEL[creature.kind]} — cannot be tamed` }
    const { profile } = get()
    if ((profile.tamedBeasts ?? []).includes(creatureId)) return { ok: false, reason: "Already tamed" }
    if (!get().hasSkillUnlock(TAME_UNLOCK)) return { ok: false, reason: "Requires Pack Beasts" }
    // Must have met it in the field first; the codex is the prerequisite.
    if (!(profile.bestiary ?? {})[creatureId]) return { ok: false, reason: "Not yet encountered" }
    // The sturdiest beasts need the second Beast Tending tier.
    const heavy = creature.rarity === "epic" || creature.rarity === "legendary"
    if (heavy && !get().hasSkillUnlock(TAME_MASTER_UNLOCK)) {
      return { ok: false, reason: "Requires Pack Train" }
    }
    return { ok: true }
  },

  tameBeast: (creatureId) => {
    // Route through canTame so the UI and any caller share one rule set.
    if (!get().canTame(creatureId).ok) return
    const creature = getCreature(creatureId)
    if (!creature) return
    const { profile } = get()
    const bestiary = profile.bestiary ?? {}
    const prev = bestiary[creatureId]
    const tamed = [...(profile.tamedBeasts ?? []), creatureId]
    set({
      profile: {
        ...profile,
        tamedBeasts: tamed,
        bestiary: {
          ...bestiary,
          [creatureId]: {
            encounters: prev?.encounters ?? 1,
            defeats: prev?.defeats ?? 0,
            firstSeen: prev?.firstSeen ?? Date.now(),
            tamed: true,
          },
        },
        // First beast becomes the active mount so the bonus applies immediately
        // rather than sitting unused until the player notices the selector.
        activeMount: profile.activeMount ?? creatureId,
      },
    })
    get().addNotification({
      title: "Beast tamed",
      body: `${creature.name} joins your pack — +${creature.pack?.carry ?? 0} carry.`,
      priority: "high",
      deeplink: { screen: "profile" },
    })
  },

  setActiveMount: (creatureId) => {
    const { profile } = get()
    // Guard against mounting something that was never tamed.
    if (creatureId !== null && !(profile.tamedBeasts ?? []).includes(creatureId)) return
    set({ profile: { ...profile, activeMount: creatureId } })
  },

  devUnlockAllMounts: () => {
    const { profile } = get()
    const bestiary = { ...(profile.bestiary ?? {}) }
    // Tame every pack beast and mark it discovered, ignoring the usual
    // encounter/skill prerequisites so mounts can be tested from a fresh save.
    for (const creature of TAMEABLE) {
      const prev = bestiary[creature.id]
      bestiary[creature.id] = {
        encounters: prev?.encounters ?? 1,
        defeats: prev?.defeats ?? 0,
        firstSeen: prev?.firstSeen ?? Date.now(),
        tamed: true,
      }
    }
    const tamed = TAMEABLE.map((c) => c.id)
    set({
      profile: {
        ...profile,
        tamedBeasts: tamed,
        bestiary,
        // Equip one so the profile card has something to show immediately.
        activeMount: profile.activeMount ?? tamed[0] ?? null,
      },
    })
  },

  /** Aggregated sub-stat effects across every unlocked skill. */
  getSkillBonuses: () => aggregateSkillBonuses(get().skills),

  /**
   * Content unlocked by skill tier breakpoints (levels 5 / 10 / 15), plus the
   * stat-threshold gates in STAT_UNLOCKS (e.g. fishing needs Luck 15).
   */
  getSkillUnlocks: () => {
    const earned = getSkillUnlocks(get().skills, get().getPlayerStats())
    // Admin/debug forces are merged in here rather than at each call site, so a
    // single toggle covers every gate that reads hasSkillUnlock.
    for (const id of get().debugUnlocks) earned.add(id)
    return earned
  },

  hasSkillUnlock: (id) => get().getSkillUnlocks().has(id),

  debugUnlocks: [],
  toggleDebugUnlock: (id) => {
    const active = get().debugUnlocks.includes(id)
    set({
      debugUnlocks: active
        ? get().debugUnlocks.filter((u) => u !== id)
        : [...get().debugUnlocks, id],
    })
    // Forcing an unlock on announces it like any other; forcing it off just
    // drops it from the seen set so it can announce again if re-earned.
    if (active) {
      set({ seenUnlocks: get().seenUnlocks.filter((u) => u !== id) })
    } else {
      get().syncUnlocks()
    }
    get().logAdminAction(
      "debug_unlock",
      id,
      active ? `Cleared forced unlock ${id}` : `Forced unlock ${id}`
    )
  },
  clearDebugUnlocks: () => {
    if (get().debugUnlocks.length === 0) return
    set({ debugUnlocks: [] })
    get().logAdminAction("debug_unlock", undefined, "Cleared all forced unlocks")
  },
  
  getStatBonus: (stat) => {
    const stats = get().getPlayerStats()
    // Return percentage bonus based on stat value (each point above 10 = 2% bonus)
    return Math.max(0, (stats[stat] - 10) * 2)
  },

  // Navigation
  screen: "terminal",
  // Any explicit navigation resets the other-player profile page back to your own.
  setScreen: (s) => set({ screen: s, viewedProfile: null }),
  opsTab: "expeditions",
  setOpsTab: (t) => set({ opsTab: t }),
  mapFocusNodeId: null,
  setMapFocus: (id) => set({ mapFocusNodeId: id }),
  factionViewRequest: null,
  requestFactionView: (v) => set({ factionViewRequest: v }),

  // Terminal
  channel: "PUBLIC",
  setChannel: (c) => {
    set({ channel: c, pageOffset: 0 })
    get().markRead(c)
  },
  channels: seedChannels,
  messages: seedMessages,
  sendMessage: (channel, body) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const { identity, profile, messages, channels } = get()
    const channelDef = channels.find((ch) => ch.id === channel)
    if (channelDef?.readOnly) return
    const next: ChatMessage = {
      id: `local-${Date.now()}`,
      channel,
      kind: "player",
      handle: identity.handle,
      // Prefer the equipped title so messages reflect what the player selected,
      // falling back to the seed identity before anything is equipped.
      title: profile.title?.label ?? identity.title,
      titleRarity: profile.title?.rarity ?? identity.titleRarity,
      body: trimmed.slice(0, 220),
      at: Date.now(),
    }
    set({ messages: [...messages, next], pageOffset: 0 })
  },
  unread: seedChannels.reduce(
    (acc, c) => {
      acc[c.id] = c.unread ?? 0
      return acc
    },
    {} as Record<ChannelId, number>,
  ),
  markRead: (c) =>
    set((s) => ({ unread: { ...s.unread, [c]: 0 } })),

  // Message-log pagination
  pageOffset: 0,
  nudgePage: (delta) =>
    set((s) => ({ pageOffset: Math.max(0, s.pageOffset + delta) })),
  resetPage: () => set({ pageOffset: 0 }),

  // Quick Actions
  quickActions: seedQuickActions,

  // Expeditions
  expeditions: seedExpeditions,
  activeExpedition: null,
  expeditionCooldownUntil: null,
  getExpeditionCooldownRemaining: () => {
    const until = get().expeditionCooldownUntil
    if (!until) return 0
    return Math.max(0, Math.ceil((until - Date.now()) / 1000))
  },
  startExpedition: (id, ritualIds) => {
    const exp = get().expeditions.find((e) => e.id === id)
    if (!exp || get().activeExpedition) return
    // A failed run locks out new launches until the recovery cooldown elapses.
    if (get().getExpeditionCooldownRemaining() > 0) return
    // Tier gate: some sites only open once the matching skill breakpoint is hit.
    if (exp.requiresUnlock && !get().hasSkillUnlock(exp.requiresUnlock)) return
    // Faction-warfare gate: contested frontier sites are endgame faction ground.
    // Only warfare-unlocked faction members may deploy there — this blocks the
    // expedition DEPLOY button too, not just the Claim/Assault actions, so a
    // factionless courier can never slip into contested territory.
    const originNode = getNodeForExpedition(id)
    if (originNode && isContestedNode(originNode)) {
      if (!get().getPlayerFactionId()) return
      if (!get().factionUnlocked) return
    }

    // Callers may pass an explicit ritual set; otherwise use whatever the prep
    // dialog left staged. Filter to known rituals and re-check capacity so a
    // stale selection can never exceed current Focus.
    const known = get().profile.knownRituals ?? []
    const capacity = attunementCapacity(get().getPlayerStats().focus)
    const requested = (ritualIds ?? get().preparedRituals).filter((r) =>
      known.includes(r)
    )
    const rituals: string[] = []
    for (const rid of requested) {
      const ritual = getRitual(rid)
      if (!ritual) continue
      if (attunementUsed(rituals) + ritual.attunement > capacity) continue
      rituals.push(rid)
    }

    // Assemble the deploying squad from available party members (leader first),
    // capped at the expedition's suggested party size.
    const { party, identity } = get()
    const maxSquad = Math.max(1, exp.suggestedParty)
    const available = [...party]
      .filter((m) => m.avatar && (m.status === "ready" || m.status === "idle" || m.leader))
      .sort((a, b) => (b.leader ? 1 : 0) - (a.leader ? 1 : 0))
    const squadHandles = available.slice(0, maxSquad).map((m) => m.handle)
    // Guarantee the player is on the roster.
    if (!squadHandles.includes(identity.handle)) {
      squadHandles.unshift(identity.handle)
    }

    const totalStages = exp.stages?.length ?? 4

    set({
      activeExpedition: {
        id: exp.id,
        label: exp.label,
        progress: 0,
        etaSeconds: exp.duration,
        log: [
          "Signal lock established.",
          `Squad of ${squadHandles.length} deployed to ${exp.label}.`,
          "Traversing relay network...",
        ],
        currentStage: 1,
        totalStages,
        partyMembers: squadHandles,
        startedAt: Date.now(),
        rituals,
      },
      // The staged set has been copied onto the run, so release it now. Clearing
      // only on completion let a cancelled run leak its selection into the next
      // launch that relies on the preparedRituals fallback.
      preparedRituals: [],
    })
  },
  cancelExpedition: () => {
    const { activeExpedition } = get()
    if (!activeExpedition) return
    set({ activeExpedition: null })
  },

  // Skills — the canonical 15 from config/skills.json, so every skill resolves
  // to a real mechanic in lib/skill-effects.ts.
  skills: createInitialSkills(),
  loadout: ["scavenging", "gathering", "pathfinding", "lorekeeping"],
  toggleLoadout: (id) =>
    set((s) => {
      if (s.loadout.includes(id)) {
        return { loadout: s.loadout.filter((x) => x !== id) }
      }
      if (s.loadout.length >= 4) return s
      return { loadout: [...s.loadout, id] }
    }),
  toggleLoadoutSkill: (id) => get().toggleLoadout(id),
  setSkillVariant: (skillId, variantId) =>
    set((s) => ({
      skills: s.skills.map((skill) =>
        skill.id === skillId ? { ...skill, activeVariant: variantId } : skill
      ),
    })),

  // Inventory & Recovery
  inventory: seedInventory,
  shards: { ...seedShards },
  recovery: seedRecovery,
  lastRecovered: null,
  runRecovery: (mode) => {
    // Translation reads sealed packets, so it needs the Lorekeeping unlock and
    // spends salvage rather than relay or resonance.
    if (mode === "translation" && !get().hasSkillUnlock("archive_translation")) return
    const COSTS = {
      standard: { cost: 1, currencyKey: "relay_tokens" },
      focused: { cost: 2, currencyKey: "resonance" },
      translation: { cost: 3, currencyKey: "signal_salvage" },
    } as const
    const { cost, currencyKey } = COSTS[mode]
    const { shards, recovery, profile, inventory } = get()
    if ((shards as any)[currencyKey] < cost) return
    // Translation inherits the focused odds table and adds its own luck on top.
    const rarity = rollRarity(
      mode !== "standard",
      get().getSkillBonuses().rollLuck + (mode === "translation" ? 0.15 : 0),
    )
    const pool = POOL[rarity]
    const pick = pool[Math.floor(Math.random() * pool.length)]
    
    // Salvage rewards by rarity for duplicates
    const SALVAGE_REWARDS: Record<string, { label: string; qty: number }> = {
      common: { label: "Scrap Metal", qty: 1 },
      uncommon: { label: "Signal Dust", qty: 2 },
      rare: { label: "Relay Fragment", qty: 3 },
      epic: { label: "Echo Crystal", qty: 4 },
      legendary: { label: "Void Shard", qty: 5 },
      mythic: { label: "Transcendent Core", qty: 8 },
    }
    
    // Check if this is a duplicate
    let isDuplicate = false
    if (pick.type === "cosmetic" && pick.vanityData) {
      // Check if cosmetic already owned
      const existingVanity = profile.vanityItems.find(
        v => v.layerType === pick.vanityData!.layerType && v.variant === pick.vanityData!.variant && v.unlocked
      )
      isDuplicate = !!existingVanity
    } else if (pick.type === "title") {
      // Check if title already owned
      const existingTitle = profile.ownedTitles.find((t) => t.label === pick.label)
      isDuplicate = !!existingTitle
    } else if (pick.type === "badge") {
      // Check previous recoveries for same badge
      isDuplicate = recovery.some(r => r.label === pick.label && r.type === "badge")
    }
    
    // If duplicate, convert to salvage
    if (isDuplicate) {
      const salvageReward = SALVAGE_REWARDS[rarity] || SALVAGE_REWARDS.common
      const result: RecoveryResult = {
        id: `rec-${Date.now()}`,
        label: salvageReward.label,
        type: "salvage",
        rarity,
        recoveredAt: Date.now(),
        isDuplicate: true,
        duplicateOf: pick.label,
        salvageReward,
      }
      
      // Add salvage to inventory
      const existingItem = inventory.find(i => i.label === salvageReward.label)
      let updatedInventory = inventory
      if (existingItem) {
        updatedInventory = inventory.map(i =>
          i.label === salvageReward.label ? { ...i, qty: i.qty + salvageReward.qty } : i
        )
      } else {
        const newItem: InventoryItem = {
          id: `salvage-${Date.now()}`,
          label: salvageReward.label,
          aspect: "salvage",
          rarity,
          qty: salvageReward.qty,
          identified: true,
          description: `Salvage material from a duplicate ${pick.type}.`,
          type: "material",
        }
        updatedInventory = [...inventory, newItem]
      }
      
      set({
        shards: {
          ...shards,
          [currencyKey]: (shards as any)[currencyKey] - cost,
        } as typeof seedShards,
        recovery: [result, ...recovery].slice(0, 8),
        lastRecovered: result,
        inventory: updatedInventory,
      })
      return
    }
    
    // Not a duplicate - normal recovery
    const result: RecoveryResult = {
      id: `rec-${Date.now()}`,
      label: pick.label,
      type: pick.type,
      rarity,
      recoveredAt: Date.now(),
      vanityData: pick.vanityData,
    }
    
    // If this is a cosmetic with vanity data, unlock it in profile
    let updatedProfile = profile
    if (pick.vanityData && pick.type === "cosmetic") {
      const existingVanity = profile.vanityItems.find(
        v => v.layerType === pick.vanityData!.layerType && v.variant === pick.vanityData!.variant
      )
      if (!existingVanity) {
        // Add new vanity item
        const newVanity: VanityItem = {
          id: `vanity-${Date.now()}`,
          label: pick.label,
          layerType: pick.vanityData.layerType,
          variant: pick.vanityData.variant,
          rarity,
          unlocked: true,
          equipped: false,
        }
        updatedProfile = {
          ...profile,
          vanityItems: [...profile.vanityItems, newVanity],
        }
      } else if (!existingVanity.unlocked) {
        // Unlock existing item
        updatedProfile = {
          ...profile,
          vanityItems: profile.vanityItems.map(v =>
            v.id === existingVanity.id ? { ...v, unlocked: true } : v
          ),
        }
      }
    } else if (pick.type === "appearance_token") {
      // Consumable — stack it onto the player's held count.
      updatedProfile = {
        ...profile,
        appearanceResetTokens: (profile.appearanceResetTokens ?? 0) + 1,
      }
    }
    
    set({
      shards: {
        ...shards,
        [currencyKey]: (shards as any)[currencyKey] - cost,
      } as typeof seedShards,
      recovery: [result, ...recovery].slice(0, 8),
      lastRecovered: result,
      profile: updatedProfile,
    })
  },
  clearLastRecovered: () => set({ lastRecovered: null }),
  
  // Crafting
  activeCraft: null,
  craftItem: (recipeId) => {
    const { inventory, activeCraft } = get()
    if (activeCraft) return { success: false, message: "Already crafting something" }
    
    // Import recipes dynamically to avoid circular deps
    const { CRAFTING_RECIPES } = require("@/config/crafting-recipes")
    const recipe = CRAFTING_RECIPES.find((r: any) => r.id === recipeId)
    if (!recipe) return { success: false, message: "Recipe not found" }
    if (!recipe.unlocked) return { success: false, message: "Recipe locked" }

    // Tier gate: epic/legendary work needs the matching Bladecraft or Ritualism
    // breakpoint. Enforced here so the rule holds no matter which UI calls in.
    const needed = recipeUnlockFor(recipe.output.rarity)
    if (needed && !get().hasSkillUnlock(needed)) {
      return {
        success: false,
        message:
          needed === "master_recipes"
            ? "Requires Ritualism 10 (Marked Work) or Lorekeeping 10 (Lost Techniques)"
            : "Requires Bladecraft 10 (Blade Smithing) or Marksmanship 10 (Munitions)",
      }
    }

    // Faction building upgrades: Apothecary trims material cost, Workshop cuts craft time.
    const buildingBonuses = craftingBonusesFrom(get().factionBuildings)
    // Skills stack on top: Lorekeeping (Efficiency) trims material cost,
    // Lorekeeping (Technique) speeds the work up, and Ritualism (Sigils)
    // raises yield.
    const skillFx = get().getSkillBonuses()
    const bonuses = {
      cost: buildingBonuses.cost + skillFx.craftCost,
      speed: buildingBonuses.speed + skillFx.craftSpeed,
      yield: buildingBonuses.yield + skillFx.craftQuality,
    }
    const effQty = (qty: number) => Math.max(1, Math.ceil(qty * (1 - bonuses.cost)))

    // Check ingredients (against the reduced requirement)
    for (const ing of recipe.ingredients) {
      const owned = inventory.find(i => i.id === ing.itemId || i.label === ing.label)
      if (!owned || owned.qty < effQty(ing.qty)) {
        return { success: false, message: `Missing ${ing.label}` }
      }
    }
    
    // Consume ingredients
    let updatedInventory = [...inventory]
    for (const ing of recipe.ingredients) {
      const need = effQty(ing.qty)
      const idx = updatedInventory.findIndex(i => i.id === ing.itemId || i.label === ing.label)
      if (idx !== -1) {
        if (updatedInventory[idx].qty <= need) {
          updatedInventory = updatedInventory.filter((_, i) => i !== idx)
        } else {
          updatedInventory[idx] = { ...updatedInventory[idx], qty: updatedInventory[idx].qty - need }
        }
      }
    }
    
    set({
      inventory: updatedInventory,
      activeCraft: {
        recipeId: recipe.id,
        label: recipe.label,
        startedAt: Date.now(),
        duration: Math.round(recipe.craftTime * 1000 * (1 - bonuses.speed)),
      },
    })
    
    return { success: true, message: `Crafting ${recipe.label}...` }
  },
  completeCraft: () => {
    const { activeCraft, inventory } = get()
    if (!activeCraft) return
    
    const { CRAFTING_RECIPES } = require("@/config/crafting-recipes")
    const recipe = CRAFTING_RECIPES.find((r: any) => r.id === activeCraft.recipeId)
    if (!recipe) {
      set({ activeCraft: null })
      return
    }
    
    // Relay Forge upgrade plus skill yield bonuses on each craft.
    const yieldBonus =
      craftingBonusesFrom(get().factionBuildings).yield + get().getSkillBonuses().craftQuality
    const outputQty = recipe.output.qty + Math.round(recipe.output.qty * yieldBonus)

    // Add crafted item to inventory
    const existingItem = inventory.find(i => i.id === recipe.output.itemId)
    let updatedInventory: InventoryItem[]
    
    if (existingItem) {
      updatedInventory = inventory.map(i =>
        i.id === recipe.output.itemId
          ? { ...i, qty: i.qty + outputQty }
          : i
      )
    } else {
      const newItem: InventoryItem = {
        id: recipe.output.itemId,
        label: recipe.output.label,
        aspect: recipe.output.aspect,
        rarity: recipe.output.rarity,
        qty: outputQty,
        identified: true,
        description: recipe.output.description,
        effects: recipe.output.effects,
      }
      updatedInventory = [...inventory, newItem]
    }
    
    set({
      inventory: updatedInventory,
      activeCraft: null,
    })
  },
  addMaterials: () => {
    const { inventory } = get()
    const { CRAFTING_MATERIALS } = require("@/config/crafting-recipes")
    
    // Add some of each material
    const newMaterials: InventoryItem[] = CRAFTING_MATERIALS.map((mat: InventoryItem) => ({
      ...mat,
      qty: 5 + Math.floor(Math.random() * 10),
    }))
    
    // Merge with existing inventory
    let updatedInventory = [...inventory]
    for (const mat of newMaterials) {
      const existing = updatedInventory.find(i => i.id === mat.id)
      if (existing) {
        updatedInventory = updatedInventory.map(i =>
          i.id === mat.id ? { ...i, qty: i.qty + mat.qty } : i
        )
      } else {
        updatedInventory.push(mat)
      }
    }
    
    set({ inventory: updatedInventory })
  },

  // Ops - Fishing
  fishing: {
    phase: "idle",
    spotId: null,
    baitId: null,
    fishId: null,
    biteAt: null,
    windowMs: 0,
    lastQty: 0,
    streak: 0,
  },
  fishingLog: [],

  selectedBaitId: null,
  lastDigAt: null,

  setBait: (baitId) => set({ selectedBaitId: baitId }),

  getBaitCount: (baitId) => get().inventory.find((i) => i.id === baitId)?.qty ?? 0,

  digForGrubs: () => {
    const { lastDigAt } = get()
    const now = Date.now()
    if (lastDigAt !== null && now - lastDigAt < DIG_COOLDOWN_MS) return false

    const qty = DIG_MIN + Math.floor(Math.random() * (DIG_MAX - DIG_MIN + 1))
    const def = getBait(DIG_BAIT_ID)
    if (!def) return false

    set((s) => {
      const existing = s.inventory.find((i) => i.id === DIG_BAIT_ID)
      return {
        lastDigAt: now,
        selectedBaitId: s.selectedBaitId ?? DIG_BAIT_ID,
        inventory: existing
          ? s.inventory.map((i) => (i.id === DIG_BAIT_ID ? { ...i, qty: i.qty + qty } : i))
          : [
              ...s.inventory,
              {
                id: def.id,
                label: def.label,
                aspect: "consumable" as const,
                rarity: def.rarity,
                qty,
                identified: true,
                description: def.description,
                type: "consumable" as const,
              },
            ],
      }
    })
    return true
  },

  castLine: (spotId, baitId) => {
    const spot = FISHING_SPOTS.find((s) => s.id === spotId)
    if (!spot) return false
    if (spot.requires && !get().hasSkillUnlock(spot.requires)) return false
    if (get().fishing.phase === "casting" || get().fishing.phase === "bite") return false

    // Bait is required, and one is spent per cast whether or not anything bites.
    // Enforced here rather than in the view so the component cannot cast for
    // free, matching how triggerBite refuses to let the view pick its own fish.
    if (!getBait(baitId)) return false
    if (get().getBaitCount(baitId) < 1) return false

    set((s) => ({
      selectedBaitId: baitId,
      inventory: s.inventory
        .map((i) => (i.id === baitId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
      fishing: {
        ...s.fishing,
        phase: "casting",
        spotId,
        baitId,
        fishId: null,
        biteAt: null,
      },
    }))
    return true
  },

  triggerBite: () => {
    const { fishing } = get()
    if (fishing.phase !== "casting" || !fishing.spotId) return

    const spot = FISHING_SPOTS.find((s) => s.id === fishing.spotId)
    if (!spot) return

    // Pick what bit here in the store, not in the view: the component only
    // reports "a bite happened", so it can never nominate its own rare fish.
    // Rollcraft/Lorekeeping luck also biases the fishing table toward rarity.
    const luck = get().getSkillBonuses().rollLuck
    const bait = fishing.baitId ? getBait(fishing.baitId) : undefined

    // Better bait keeps more of the debris off the hook.
    const junkChance = spot.junkChance * (bait?.junkMult ?? 1)
    const fish =
      Math.random() < junkChance ? JUNK : pickFish(spot, luck, Math.random, bait)
    const fishId = fish.id

    // Casting (Tension) widens the strike window, so a trained angler gets a
    // more forgiving reaction test on the same fish.
    const success = get().getSkillBonuses().fishingSuccess

    // Focus quietly buys reaction time: a high-FOC courier gets a longer beat
    // between the bite and the fish spitting the hook. Deliberately unadvertised
    // in the fishing UI — the only tell is the "Reflex" derived stat on Profile.
    // Capped at +50% so stacking Focus can never make the strike test trivial.
    const focus = get().getPlayerStats().focus
    const focusGrace = 1 + Math.min(0.5, focus * 0.02)

    const windowMs = Math.round(fish.biteWindow * 1000 * (1 + success) * focusGrace)

    set((s) => ({
      fishing: { ...s.fishing, phase: "bite", fishId, biteAt: Date.now(), windowMs },
    }))
  },

  setHook: () => {
    const { fishing } = get()
    if (fishing.phase !== "bite" || !fishing.fishId || fishing.biteAt === null) return

    // Struck too late — the window already closed.
    if (Date.now() - fishing.biteAt > fishing.windowMs) {
      get().reelIn()
      return
    }

    const fish = getFish(fishing.fishId)
    if (!fish) return

    // Casting (Casting) raises how many land per successful catch.
    const yieldBonus = get().getSkillBonuses().fishingYield
    const qty = Math.max(1, Math.round((1 + yieldBonus) * (1 + Math.random() * 0.5)))
    const item = fishToItem(fish, qty)
    const isJunk = fish.id === JUNK.id

    set((s) => {
      const existing = s.inventory.find((i) => i.id === item.id)
      return {
        inventory: existing
          ? s.inventory.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i))
          : [...s.inventory, item],
        fishing: {
          ...s.fishing,
          phase: "landed",
          lastQty: qty,
          // Junk breaks the streak; a real fish extends it.
          streak: isJunk ? 0 : s.fishing.streak + 1,
        },
        fishingLog: [
          { fishId: fish.id, label: fish.label, rarity: fish.rarity, qty, at: Date.now() },
          ...s.fishingLog,
        ].slice(0, 12),
      }
    })

  },

  reelIn: () =>
    set((s) => ({
      fishing: {
        ...s.fishing,
        phase: s.fishing.phase === "bite" ? "escaped" : "idle",
        streak: s.fishing.phase === "bite" ? 0 : s.fishing.streak,
      },
    })),

  // Contracts — the board is the day's rotated subset of the full pool, not the
  // whole pool. contractPool keeps every contract available to draw from.
  contractPool: seedContracts,
  contracts: rotateContracts(seedContracts),
  contractDay: dayKey(),
  /**
   * Rolls the board to the current day if it has changed. Active and completed
   * contracts carry over so a reset never cancels work in progress.
   */
  rotateContractsIfStale: () => {
    const today = dayKey()
    if (get().contractDay === today) return
    const keep = get().contracts.filter((c) => c.status !== "available")
    set({
      contractDay: today,
      contracts: rotateContracts(get().contractPool, new Date(), keep),
    })
  },
  acceptContract: (id) => {
    // Tier gate: escort and anomaly work needs the matching skill breakpoint.
    // Mirrors startExpedition so a locked job cannot be signed from any surface.
    const target = get().contracts.find((c) => c.id === id)
    if (target?.requiresUnlock && !get().hasSkillUnlock(target.requiresUnlock)) return

    // Negotiation (Lorekeeping) and Appraisal raise the agreed payout at the
    // moment the contract is signed, so the bonus is locked into the terms.
    const rewardBonus = get().getSkillBonuses().contractReward
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === id && c.status === "available"
          ? {
              ...c,
              status: "active" as const,
              // reward is a display string ("120 relay tokens"); scale the
              // numbers inside it and leave the wording intact.
              reward:
                rewardBonus > 0
                  ? c.reward.replace(/\d+/g, (n) =>
                      String(Math.round(Number(n) * (1 + rewardBonus))),
                    )
                  : c.reward,
            }
          : c,
      ),
    }))
  },
  cancelContract: (id) =>
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === id && c.status === "active"
          ? { ...c, status: "available" as const }
          : c
      ),
    })),

  // Faction
  party: seedParty,
  invitePartyMember: () => {
    const { party } = get()
    const maxSlots = 4
    if (party.length >= maxSlots) return { success: false, message: "Party is full" }
    const usedSlots = new Set(party.map((m) => m.slot))
    let slot = 1
    while (usedSlots.has(slot)) slot += 1
    const suffix = Math.random().toString(16).slice(2, 7)
    const handle = `@Relay${suffix}`
    const title = randItem(PARTY_TITLES)
    const member: PartyMember = {
      slot,
      handle,
      title: title.label,
      titleRarity: title.rarity,
      role: randItem(PARTY_ROLES),
      status: "idle",
      avatar: generateAvatarFromSeed(handle),
      joinedAt: Date.now(),
      contribution: 0,
      expeditionsCompleted: 0,
    }
    set((s) => ({
      party: [...s.party, member].sort((a, b) => a.slot - b.slot),
      factionActivity: pushActivity(s.factionActivity, {
        kind: "join",
        handle,
        text: "joined your party",
      }),
    }))
    return { success: true, message: `${handle} joined the party` }
  },
  removePartyMember: (slot) =>
    set((s) => ({
      party: s.party.filter((m) => m.slot !== slot || m.leader),
    })),
  setPartyMemberRole: (slot, role) =>
    set((s) => ({
      party: s.party.map((m) => (m.slot === slot ? { ...m, role } : m)),
    })),
  readyUpParty: () =>
    set((s) => ({
      party: s.party.map((m) => (m.status === "idle" ? { ...m, status: "ready" as const } : m)),
    })),

  factionProjects: seedFactionProjects,
  factionBuildings: FACTION_BUILDINGS,
  factionRallies: seedFactionRallies,
  factionActivity: seedFactionActivity,

  contributeToProject: (projectId, amount) => {
    const { factionProjects, profile } = get()
    const project = factionProjects.find((p) => p.id === projectId)
    if (!project) return { success: false, message: "Project not found" }
    if (project.complete) return { success: false, message: "Project already complete" }
    const cost = amount // tokens spent equals units contributed
    if (profile.tokens < cost) return { success: false, message: "Not enough tokens" }

    // Ritualism (Consecration) makes each token contributed count for more.
    const skillFx = get().getSkillBonuses()
    const bonus = craftingBonusesFrom(get().factionBuildings).standing
    const effAmount = Math.round(amount * (1 + skillFx.factionContribution))
    const newProgress = Math.min(project.goal, project.progress + effAmount)
    const willComplete = newProgress >= project.goal

    // Standing reward scales with contribution; completion grants a bonus.
    const standingReward = Math.round(amount * 0.5) + (willComplete ? 100 : 0)
    const { profile: afterStanding, gained, rankedUp, newRank } = applyStanding(
      { ...profile, tokens: profile.tokens - cost },
      standingReward,
      bonus,
    )

    set((s) => {
      let activity = pushActivity(s.factionActivity, {
        kind: "contribution",
        handle: s.identity.handle,
        text: `contributed to ${project.label}`,
        amount,
      })
      if (willComplete) {
        activity = pushActivity(activity, {
          kind: "project_complete",
          handle: s.profile.faction?.label ?? "Faction",
          text: `completed ${project.label}`,
        })
      }
      if (rankedUp) {
        activity = pushActivity(activity, {
          kind: "rank_up",
          handle: s.identity.handle,
          text: `reached Rank ${newRank} — ${RANK_TIERS[newRank]?.title ?? ""}`,
        })
      }
      return {
        profile: afterStanding,
        factionProjects: s.factionProjects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                progress: newProgress,
                complete: willComplete,
                contributors: p.contributors + (p.progress === 0 ? 1 : 0),
              }
            : p,
        ),
        factionActivity: activity,
      }
    })

    return {
      success: true,
      message: willComplete
        ? `Project complete! +${gained} standing`
        : `Contributed ${amount} · +${gained} standing`,
    }
  },

  upgradeBuilding: (buildingId) => {
    const { factionBuildings, profile, inventory } = get()
    const building = factionBuildings.find((b) => b.id === buildingId)
    if (!building) return { success: false, message: "Building not found" }
    if ((profile.faction?.rank ?? 0) < building.requiredRank) {
      return { success: false, message: `Requires Rank ${building.requiredRank}` }
    }
    if (building.level >= building.maxLevel) return { success: false, message: "Max level reached" }

    const cost = buildingUpgradeCost(building)
    if (profile.tokens < cost.tokens) return { success: false, message: "Not enough tokens" }
    for (const mat of cost.materials) {
      const owned = inventory.find((i) => i.id === mat.itemId || i.label === mat.label)
      if (!owned || owned.qty < mat.qty) return { success: false, message: `Missing ${mat.label}` }
    }

    // Consume materials
    let updatedInventory = [...inventory]
    for (const mat of cost.materials) {
      const idx = updatedInventory.findIndex((i) => i.id === mat.itemId || i.label === mat.label)
      if (idx !== -1) {
        if (updatedInventory[idx].qty <= mat.qty) {
          updatedInventory = updatedInventory.filter((_, i) => i !== idx)
        } else {
          updatedInventory[idx] = { ...updatedInventory[idx], qty: updatedInventory[idx].qty - mat.qty }
        }
      }
    }

    const newLevel = building.level + 1
    set((s) => ({
      inventory: updatedInventory,
      profile: { ...s.profile, tokens: s.profile.tokens - cost.tokens },
      factionBuildings: s.factionBuildings.map((b) =>
        b.id === buildingId ? { ...b, level: newLevel } : b,
      ),
      factionActivity: pushActivity(s.factionActivity, {
        kind: "building",
        handle: s.identity.handle,
        text: `upgraded the ${building.label} to Lv.${newLevel}`,
      }),
    }))
    return { success: true, message: `${building.label} upgraded to Lv.${newLevel}` }
  },

  joinRally: (rallyId) =>
    set((s) => {
      const rally = s.factionRallies.find((r) => r.id === rallyId)
      if (!rally || rally.joined) return {}
      return {
        factionRallies: s.factionRallies.map((r) => (r.id === rallyId ? { ...r, joined: true } : r)),
        factionActivity: pushActivity(s.factionActivity, {
          kind: "rally",
          handle: s.identity.handle,
          text: `joined ${rally.label}`,
        }),
      }
    }),

  contributeToRally: (rallyId, amount) => {
    const { factionRallies, profile } = get()
    const rally = factionRallies.find((r) => r.id === rallyId)
    if (!rally) return { success: false, message: "Rally not found" }
    if (rally.complete) return { success: false, message: "Rally already complete" }
    if (Date.now() > rally.endsAt) return { success: false, message: "Rally has ended" }
    if (profile.tokens < amount) return { success: false, message: "Not enough tokens" }

    // Ritualism (Consecration) amplifies rally contributions the same way.
    const skillFx = get().getSkillBonuses()
    const effAmount = Math.round(amount * (1 + skillFx.factionContribution))
    const newProgress = Math.min(rally.goal, rally.progress + effAmount)
    const willComplete = newProgress >= rally.goal
    const bonus = craftingBonusesFrom(get().factionBuildings).standing

    // Personal standing for helping; the full reward lands when the rally completes.
    let standingReward = Math.round(amount * 0.4)
    let tokenRefund = 0
    if (willComplete) {
      standingReward += rally.reward.standing
      tokenRefund = rally.reward.tokens
    }
    const { profile: afterStanding, gained, rankedUp, newRank } = applyStanding(
      { ...profile, tokens: profile.tokens - amount + tokenRefund },
      standingReward,
      bonus,
    )

    set((s) => {
      let activity = pushActivity(s.factionActivity, {
        kind: "rally",
        handle: s.identity.handle,
        text: `pushed ${rally.label} forward`,
        amount,
      })
      if (willComplete) {
        activity = pushActivity(activity, {
          kind: "rally",
          handle: s.profile.faction?.label ?? "Faction",
          text: `completed ${rally.label}`,
        })
      }
      if (rankedUp) {
        activity = pushActivity(activity, {
          kind: "rank_up",
          handle: s.identity.handle,
          text: `reached Rank ${newRank} — ${RANK_TIERS[newRank]?.title ?? ""}`,
        })
      }
      return {
        profile: afterStanding,
        factionRallies: s.factionRallies.map((r) =>
          r.id === rallyId
            ? {
                ...r,
                progress: newProgress,
                complete: willComplete,
                joined: true,
                contribution: r.contribution + amount,
              }
            : r,
        ),
        factionActivity: activity,
      }
    })

    return {
      success: true,
      message: willComplete
        ? `Rally complete! +${gained} standing, +${tokenRefund} tokens`
        : `Contributed ${amount} · +${gained} standing`,
    }
  },

  // Friends
  friends: [
    {
      handle: "@Relay3e8f2",
      title: "Signal Keeper",
      titleRarity: "uncommon" as const,
      status: "online" as const,
      faction: "Hearth Wardens",
    },
    {
      handle: "@Relay9d2e7",
      title: "Archive Listener",
      titleRarity: "rare" as const,
      status: "online" as const,
      faction: "Veiled Circle",
    },
    {
      handle: "@Relay8b1c5",
      status: "away" as const,
      faction: "Open Roads Chorus",
    },
    {
      handle: "@Relay6c4d3",
      title: "Route Tender",
      titleRarity: "common" as const,
      status: "offline" as const,
      faction: "Crowned Courts",
    },
] as Friend[],
  removeFriend: (handle) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.handle !== handle),
      // If the removed player is currently open in the viewer, close it.
      viewedPlayer: state.viewedPlayer?.handle === handle ? null : state.viewedPlayer,
    }))
  },

  // Player profile viewer — shared modal opened from friends or party lists.
  viewedPlayer: null,
  viewPlayer: (player) => set({ viewedPlayer: player }),
  closePlayerProfile: () => set({ viewedPlayer: null }),
  // Open the full profile page: switch to the Profile screen showing this player
  // (read-only) and dismiss the quick-look modal in the same update.
  viewedProfile: null,
  openPlayerProfilePage: (player) =>
    set({ viewedProfile: player, viewedPlayer: null, screen: "profile" }),
  clearViewedProfile: () => set({ viewedProfile: null }),
  
  // Trade
  tradeOffers: [
    {
      id: "trade-1",
      fromHandle: "@Relay3e8f2",
      toHandle: "@Relay7a3b2",
      fromItems: [
        { itemId: "relay_scrap", label: "Relay Scrap", qty: 5, rarity: "common" as const },
        { itemId: "signal_shard", label: "Signal Shard", qty: 2, rarity: "uncommon" as const },
      ],
      toItems: [
        { itemId: "archive_core", label: "Archive Core", qty: 1, rarity: "rare" as const },
      ],
      fromTokens: 50,
      toTokens: 0,
      status: "pending" as const,
      createdAt: Date.now() - 1000 * 60 * 30,
      expiresAt: Date.now() + 1000 * 60 * 90,
      message: "Fair trade? Let me know!",
    },
    {
      id: "trade-2",
      fromHandle: "@you",
      toHandle: "@dustwalker",
      fromItems: [
        { itemId: "void_essence", label: "Void Essence", qty: 3, rarity: "epic" as const },
      ],
      toItems: [
        { itemId: "ancient_glyph", label: "Ancient Glyph", qty: 1, rarity: "legendary" as const },
      ],
      fromTokens: 100,
      toTokens: 0,
      status: "pending" as const,
      createdAt: Date.now() - 1000 * 60 * 15,
      expiresAt: Date.now() + 1000 * 60 * 105,
      message: "Really need that glyph!",
    },
  ] as TradeOffer[],

  // Profile
  identity: seedIdentity,
  profile: seedProfile,
  profileTab: "summary",
  setProfileTab: (tab) => set({ profileTab: tab }),
  setActiveTitle: (titleId) =>
    set((s) => ({
      profile: {
        ...s.profile,
        ownedTitles: s.profile.ownedTitles.map((t) => ({
          ...t,
          equipped: t.id === titleId,
        })),
        title: s.profile.ownedTitles.find((t) => t.id === titleId) || s.profile.title,
      },
    })),
  addNotification: (notification) =>
    set((s) => ({
      profile: {
        ...s.profile,
        notifications: [
          {
            ...notification,
            // Monotonic id derived from the current max, so rapid successive
            // pushes (e.g. a multi-level XP award) cannot collide.
            id: s.profile.notifications.reduce((max, n) => Math.max(max, n.id), 0) + 1,
            state: "unread" as const,
            createdAt: Date.now(),
          },
          ...s.profile.notifications,
        ],
      },
    })),
  markNotificationRead: (id) =>
    set((s) => ({
      profile: {
        ...s.profile,
        notifications: s.profile.notifications.map((n) =>
          n.id === id ? { ...n, state: "read" as const } : n
        ),
      },
    })),
  openNotification: (notification) => {
    const { markNotificationRead, setScreen, setChannel, setProfileTab, setOpsTab } = get()
    markNotificationRead(notification.id)
    if (notification.deeplink?.screen) {
      // Map old screen names to new ones
      const screenMap: Record<string, ScreenId> = {
        chat: "terminal",
        expedition: "ops",
        skills: "ops",
        inventory: "ops",
        party: "social",
        faction: "social",
        archive: "ops",
      }
      const targetScreen = screenMap[notification.deeplink.screen] || notification.deeplink.screen as ScreenId
      setScreen(targetScreen)
      
      if (notification.deeplink.channel) {
        setChannel(notification.deeplink.channel)
      }
      if (targetScreen === "profile" && notification.deeplink.tab) {
        setProfileTab(notification.deeplink.tab as "summary" | "notifications")
      }
      if (targetScreen === "ops") {
        // Default to expeditions for expedition-related notifications
        if (notification.deeplink.screen === "expedition") {
          setOpsTab("expeditions")
        } else if (notification.deeplink.screen === "skills") {
          setOpsTab("skills")
        } else if (notification.deeplink.screen === "archive") {
          setOpsTab("rolling")
        }
      }
    }
  },
  clearNotification: (id) => set((s) => ({
    profile: {
      ...s.profile,
      notifications: s.profile.notifications.filter((n) => n.id !== id),
    },
  })),
  clearAllNotifications: () => set((s) => ({
    profile: {
      ...s.profile,
      notifications: [],
    },
  })),
  
  // Avatar & Vanity
  equipVanity: (vanityId) => {
    const { profile, identity } = get()
    const vanity = profile.vanityItems.find(v => v.id === vanityId)
    if (!vanity || !vanity.unlocked) return
    
    // Unequip any existing item of the same layer type
    const updatedItems = profile.vanityItems.map(v => ({
      ...v,
      equipped: v.id === vanityId ? true : (v.layerType === vanity.layerType ? false : v.equipped)
    }))
    
    // Update avatar config
    const updatedAvatar: AvatarConfig = {
      ...identity.avatar,
      layers: identity.avatar.layers.map(l =>
        l.type === vanity.layerType ? { ...l, variant: vanity.variant } : l
      )
    }
    
    set({
      profile: { ...profile, vanityItems: updatedItems },
      identity: { ...identity, avatar: updatedAvatar },
    })
  },
  
  unequipVanity: (layerType) => {
    const { profile, identity } = get()
    
    // Unequip all items of this layer type
    const updatedItems = profile.vanityItems.map(v => ({
      ...v,
      equipped: v.layerType === layerType ? false : v.equipped
    }))
    
    // Reset avatar layer to variant 0 (none)
    const updatedAvatar: AvatarConfig = {
      ...identity.avatar,
      layers: identity.avatar.layers.map(l =>
        l.type === layerType ? { ...l, variant: 0 } : l
      )
    }
    
    set({
      profile: { ...profile, vanityItems: updatedItems },
      identity: { ...identity, avatar: updatedAvatar },
    })
  },

  resetBaseAppearance: (nextAvatar) => {
    const { profile, identity } = get()
    if ((profile.appearanceResetTokens ?? 0) < 1) return false

    // The editor only owns the base look. Force every cosmetic layer back to
    // "none" so a reset gives a clean face; owned cosmetics stay unlocked and
    // can simply be re-equipped from the wardrobe afterwards.
    const COSMETIC_LAYERS: AvatarLayerType[] = ["mouth", "accessory", "hat", "flair"]
    const layers = nextAvatar.layers.map((l) =>
      COSMETIC_LAYERS.includes(l.type) ? { ...l, variant: 0 } : l
    )

    set({
      identity: {
        ...identity,
        avatar: { ...identity.avatar, seed: nextAvatar.seed, layers },
      },
      profile: {
        ...profile,
        appearanceResetTokens: (profile.appearanceResetTokens ?? 0) - 1,
        vanityItems: profile.vanityItems.map((v) => ({ ...v, equipped: false })),
      },
    })
    return true
  },
  
  // Admin/Debug - set handle (admin only)
  setHandle: (newHandle) => {
    const { identity, profile } = get()
    const formattedHandle = newHandle.startsWith("@") ? newHandle : `@${newHandle}`
    set({
      identity: { ...identity, handle: formattedHandle },
      profile: { ...profile, handle: formattedHandle },
    })
  },

  // Admin/Debug - unlock all cosmetics
  unlockAllCosmetics: () => {
    const { profile } = get()
    const allCosmetics: VanityItem[] = []
    const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]
    
    // Generate all possible cosmetic variants for each layer type (including mythic transcendent tier)
    // The Tidal Set (accessory 22-27, hat 24-29) deliberately spans every rarity
    // tier, so it cannot use the `mythicStart` rule that assumes all high
    // variants are mythic. rarityByVariant pins each one explicitly.
    const TIDAL_ACCESSORY_RARITY: Record<number, Rarity> = {
      22: "common", 23: "uncommon", 24: "rare", 25: "epic", 26: "legendary", 27: "mythic",
    }
    const TIDAL_HAT_RARITY: Record<number, Rarity> = {
      24: "common", 25: "uncommon", 26: "rare", 27: "epic", 28: "legendary", 29: "mythic",
    }
    const layers: { type: AvatarLayerType; maxVariants: number; labels: string[]; mythicStart?: number; rarityByVariant?: Record<number, Rarity> }[] = [
      { type: "hair", maxVariants: 10, labels: ["Short Cut", "Long Flow", "Spiky", "Slicked", "Braided", "Mohawk", "Curly", "Bald Fade", "Slicked Back", "Undercut"] },
      { type: "eyes", maxVariants: 6, labels: ["Standard", "Narrow", "Wide", "Glowing", "Cyber", "Ancient"] },
      { type: "mouth", maxVariants: 7, rarityByVariant: { 1: "common", 2: "common", 3: "common", 4: "common", 5: "uncommon", 6: "uncommon" }, labels: ["Neutral", "Rose Lipstick", "Crimson Lipstick", "Coral Lipstick", "Berry Lipstick", "Plum Lipstick", "Nude Lipstick"] },
      { type: "accessory", maxVariants: 28, mythicStart: 17, rarityByVariant: TIDAL_ACCESSORY_RARITY, labels: ["None", "Glasses", "Eyepatch", "Scar", "Visor", "Shades", "Face Mask", "Worn Bandana", "Relay Earpiece", "Signal Monocle", "Route Mask", "Deep Scanner", "Rift Lens", "Echo Mask", "Void Visor", "Prismatic Lens", "All-Seeing Eye", "Voidtouched Gaze", "Relay Sea Mask", "Shardheart Visor", "Eternal Courier's Mark", "Primordial Echo", "Tide Goggles", "Ashfall Veil", "Currentweave Mask", "Stormglass Lens", "Leviathan's Regard", "Tidecaller's Visage"] },
      { type: "hat", maxVariants: 30, mythicStart: 19, rarityByVariant: TIDAL_HAT_RARITY, labels: ["None", "Cap", "Hood", "Antenna", "Horns", "Halo", "Crown", "Dust Hood", "Signal Beanie", "Worn Helmet", "Relay Headset", "Archive Hood", "Scout Helm", "Drift Crown", "Echo Circlet", "Signal Crest", "Void Helm", "Rift Diadem", "Primordial Antlers", "Crown of the Relay Sea", "Shardheart Coronet", "Eternal Courier's Crest", "Voidtouched Halo", "Primordial Echo Crown", "Reed Hat", "Lantern Rig", "Deepline Coil", "Stormglass Crown", "Kelpwarden Wreath", "Abyssal Diadem"] },
      { type: "flair", maxVariants: 18, mythicStart: 13, labels: ["None", "Pulse Glow", "Static Aura", "Sparkle", "Soft Glow", "Dust Motes", "Signal Flicker", "Route Trails", "Echo Ripples", "Data Stream", "Void Shimmer", "Prismatic Aura", "Celestial Flame", "Relay Sea Aura", "Shardheart Radiance", "Eternal Courier's Light", "Voidtouched Presence", "Primordial Resonance"] },
    ]
    
    for (const layer of layers) {
      for (let v = 1; v < layer.maxVariants; v++) {
        // Determine rarity - mythic for transcendent tier items
        let rarity: Rarity
        if (layer.rarityByVariant?.[v]) {
          rarity = layer.rarityByVariant[v]
        } else if (layer.mythicStart && v >= layer.mythicStart) {
          rarity = "mythic"
        } else {
          rarity = rarities[Math.min(Math.floor(v / 2), rarities.length - 2)] // Cap at legendary for non-mythic
        }
        const existing = profile.vanityItems.find(
          item => item.layerType === layer.type && item.variant === v
        )
        if (!existing) {
          allCosmetics.push({
            id: `vanity-admin-${layer.type}-${v}`,
            label: layer.labels[v] || `${layer.type} Style ${v}`,
            layerType: layer.type,
            variant: v,
            rarity,
            unlocked: true,
            equipped: false,
          })
        }
      }
    }
    
    // Unlock existing items and add new ones
    const updatedItems = profile.vanityItems.map(v => ({ ...v, unlocked: true }))
    
    set({
      profile: {
        ...profile,
        vanityItems: [...updatedItems, ...allCosmetics],
      },
    })
  },
  
  // Admin/Debug - unlock all titles
  unlockAllTitles: () => {
    const { profile } = get()
    const allTitles: ProfileTitle[] = [
      { id: "faded_echo", label: "Faded Echo", rarity: "common", equipped: false, source: "Admin unlock" },
      { id: "signal_keeper", label: "Signal Keeper", rarity: "uncommon", equipped: false, source: "Admin unlock" },
      { id: "route_finder", label: "Route Finder", rarity: "uncommon", equipped: false, source: "Admin unlock" },
      { id: "archive_listener", label: "Archive Listener", rarity: "rare", equipped: false, source: "Admin unlock" },
      { id: "waystone_keeper", label: "Waystone Keeper", rarity: "rare", equipped: false, source: "Admin unlock" },
      { id: "drift_walker", label: "Drift Walker", rarity: "rare", equipped: false, source: "Admin unlock" },
      { id: "relay_warden", label: "Relay Warden", rarity: "epic", equipped: false, source: "Admin unlock" },
      { id: "depth_touched", label: "Depth Touched", rarity: "epic", equipped: false, source: "Admin unlock" },
      { id: "void_speaker", label: "Void Speaker", rarity: "epic", equipped: false, source: "Admin unlock" },
      { id: "deep_pull_regent", label: "Deep Pull Regent", rarity: "legendary", equipped: false, source: "Admin unlock" },
      { id: "primordial_echo", label: "Primordial Echo", rarity: "legendary", equipped: false, source: "Admin unlock" },
      { id: "the_returned", label: "The Returned", rarity: "legendary", equipped: false, source: "Admin unlock" },
      { id: "gloam_signal_regent", label: "Gloam Signal Regent", rarity: "legendary", equipped: false, source: "Admin unlock" },
      { id: "myth_relay_sea", label: "Myth of the Relay Sea", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "shardheart_ascendant", label: "Shardheart Ascendant", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "eternal_courier", label: "Eternal Courier", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "voidtouched_oracle", label: "Voidtouched Oracle", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "primordial_flame", label: "Primordial Flame", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "silence_between_stars", label: "Astral Wayfarer", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "dreamer_unchained", label: "Dreamer Unchained", rarity: "mythic", equipped: false, source: "Admin unlock" },
      { id: "ashen_sovereign", label: "Ashen Sovereign", rarity: "mythic", equipped: false, source: "Admin unlock" },
      // Admin exclusive
      { id: "system_overseer", label: "System Overseer", rarity: "admin", equipped: false, source: "Admin exclusive" },
    ]
    
    // Merge with existing titles (don't duplicate)
    const existingIds = new Set(profile.ownedTitles.map(t => t.id))
    const newTitles = allTitles.filter(t => !existingIds.has(t.id))
    
    set({
      profile: {
        ...profile,
        ownedTitles: [...profile.ownedTitles, ...newTitles],
      },
    })
  },
  
  // Admin/Debug - simulate starting an expedition
  simulateExpedition: (expeditionId) => {
    const { expeditions, activeExpedition } = get()
    if (activeExpedition) return // already have an active one
    
    // Pick first available expedition if no ID provided
    const exp = expeditionId 
      ? expeditions.find(e => e.id === expeditionId)
      : expeditions[0]
    
    if (!exp) return
    
    const { party, identity } = get()
    const squadHandles = [identity.handle, ...party.filter((m) => m.avatar && !m.leader).map((m) => m.handle)].slice(
      0,
      Math.max(1, exp.suggestedParty),
    )

    set({
      activeExpedition: {
        id: exp.id,
        label: exp.label,
        progress: 0.15,
        etaSeconds: 180,
        log: [
          "Expedition started...",
          "Signal lock established.",
          "Traversing relay network...",
        ],
        currentStage: 1,
        totalStages: exp.stages?.length ?? 4,
        partyMembers: squadHandles,
        startedAt: Date.now(),
      },
    })
  },
  
  // Complete the active expedition. `lootMultiplier` scales the haul that makes
  // it back: 1 = survivors deliver everything, 0 = total squad wipe (no rewards).
  completeActiveExpedition: (lootMultiplier = 1) => {
    const { activeExpedition, inventory } = get()
    if (!activeExpedition) return

    const mult = Math.max(0, Math.min(1, lootMultiplier))

    // A territory claim run travels via the normal sim, then fights a battle on
    // arrival. Capture the squad + pending target before activeExpedition clears.
    const pending = get().pendingTerritory
    const pendingNode = pending ? getNodeById(pending.nodeId) : null
    const isTerritoryRun = Boolean(
      pending && pendingNode && pendingNode.expeditionIds.includes(activeExpedition.id),
    )
    const claimSquad = isTerritoryRun ? [...(activeExpedition.partyMembers ?? [])] : []

    // Total wipe: all cargo is lost, no rewards granted, and a recovery
    // cooldown blocks new launches so failure carries a real cost. A wiped claim
    // run never reaches the battle.
    if (mult <= 0) {
      set({
        activeExpedition: null,
        expeditionCooldownUntil: Date.now() + EXPEDITION_FAIL_COOLDOWN_MS,
        ...(isTerritoryRun ? { pendingTerritory: null } : {}),
      })
      return
    }

    // Gathering skill shapes the haul: carryCapacity adds slots, rareChance
    // biases the rarity roll, materialYield/salvageYield grow the stack sizes.
    const fx = get().getSkillBonuses()

    const lootTypes = ["Archive Fragment", "Signal Shard", "Relay Component", "Ancient Glyph", "Void Essence"]
    const baseRewards = Math.max(1, Math.round((2 + Math.floor(Math.random() * 3)) * mult)) // up to 2-4 items
    // The Beast Tending unlocks keep their flat carry, and an active mount adds
    // on top. This has to stay additive: replacing the flat bonus with the
    // mount's own carry made mounting a weak beast (+1) a downgrade for anyone
    // holding both unlocks (+3), so taming could actively hurt you.
    const mount = getCreature(get().profile.activeMount ?? "")
    const unlockCarry =
      (get().hasSkillUnlock("pack_beasts") ? 1 : 0) + (get().hasSkillUnlock("pack_train") ? 2 : 0)
    const packSlots = unlockCarry + (mount ? packContribution(mount).carry : 0)
    // Extra loot slots are whole items, so they scale with what made it back.
    const numRewards = baseRewards + Math.round((fx.carryCapacity + packSlots) * mult)

    const newItems: InventoryItem[] = []
    for (let i = 0; i < numRewards; i++) {
      // Shrinking the roll pushes it up through the rarity bands.
      const rarityRoll = Math.random() * (1 - Math.min(0.6, Math.max(0, fx.rareChance)))
      let rarity: Rarity = "common"
      if (rarityRoll > 0.95) rarity = "legendary"
      else if (rarityRoll > 0.85) rarity = "epic"
      else if (rarityRoll > 0.65) rarity = "rare"
      else if (rarityRoll > 0.40) rarity = "uncommon"

      const lootLabel = lootTypes[Math.floor(Math.random() * lootTypes.length)]
      const baseQty = 1 + Math.floor(Math.random() * 3)
      newItems.push({
        id: `loot-${Date.now()}-${i}`,
        label: lootLabel,
        aspect: "material",
        rarity,
        qty: Math.max(1, Math.round(baseQty * (1 + fx.materialYield + fx.salvageYield))),
        identified: true,
        description: `Salvaged ${lootLabel.toLowerCase()} recovered during the expedition.`,
        type: "material",
      })
    }
    
    // Add token reward, scaled by the loot that made it back.
    const tokenReward = Math.round((50 + Math.floor(Math.random() * 150)) * mult)

    // Ritual book drops. Hidden/deep routes are the main source; ordinary
    // routes have a small chance at the minor books only.
    const expDef = get().expeditions.find((e) => e.id === activeExpedition.id)
    const isHiddenRoute = Boolean(expDef?.requiresUnlock)
    const bookPool = isHiddenRoute
      ? [...MAJOR_RITUAL_BOOKS, ...MINOR_RITUAL_BOOKS]
      : MINOR_RITUAL_BOOKS
    const bookChance = (isHiddenRoute ? 0.35 : 0.06) * mult
    // Only roll against books the player does not already know, so a drop is
    // never wasted on a duplicate.
    const unknownBooks = bookPool.filter(
      (id) => !(get().profile.knownRituals ?? []).includes(id)
    )
    const learnedBook =
      unknownBooks.length > 0 && Math.random() < bookChance
        ? unknownBooks[Math.floor(Math.random() * unknownBooks.length)]
        : null

    // Per-route bests. `mult` is the fraction of cargo that survived the trip,
    // so it doubles as the haul score; keep the max rather than the latest.
    const prevRecords = get().profile.routeRecords ?? {}
    const prevRecord = prevRecords[activeExpedition.id]
    const isBest = !prevRecord || mult > prevRecord.bestHaul || newItems.length > prevRecord.bestItems
    const nextRecord: RouteRecord = {
      runs: (prevRecord?.runs ?? 0) + 1,
      bestHaul: Math.max(prevRecord?.bestHaul ?? 0, mult),
      bestItems: Math.max(prevRecord?.bestItems ?? 0, newItems.length),
      bestAt: isBest ? Date.now() : (prevRecord?.bestAt ?? Date.now()),
    }

    set({
      activeExpedition: null,
      inventory: [...inventory, ...newItems],
      profile: {
        ...get().profile,
        tokens: get().profile.tokens + tokenReward,
        routeRecords: { ...prevRecords, [activeExpedition.id]: nextRecord },
      },
    })

    // XP is awarded after the loot commit so a level-up notification lands last.
    // xpBonus is fed by ritual effects (e.g. Scholar's Rite).
    const baseXp = expDef?.rewards.xp ?? 0
    if (baseXp > 0) {
      get().awardXp(Math.round(baseXp * (1 + fx.xpBonus) * mult))
    }

    if (learnedBook) get().learnRitual(learnedBook)

    // Squad reached the contested site — trigger the invaders-vs-defenders battle.
    if (isTerritoryRun && pending) {
      const factionId = get().getPlayerFactionId()
      if (factionId) {
        const { party, identity } = get()
        const attacker = groupFromHandles(
          claimSquad,
          factionId,
          identity,
          party,
          get().getPlayerStats(),
        )
        get().beginTerritoryBattle(pending.nodeId, pending.kind, attacker)
      } else {
        set({ pendingTerritory: null })
      }
    }
  },

  // ============ TERRITORY WAR ============
  nodeControl: buildInitialNodeControl(),
  nodeGarrisons: {},
  factionBases: buildInitialFactionBases(FACTIONS.map((f) => f.id), null),
  activeBattle: null,
  pendingTerritory: null,

  getPlayerFactionId: () => {
    const { characterFaction, profile } = get()
    return (characterFaction?.id ?? profile.faction?.id ?? null) as RaceId | null
  },

  canClaimNode: (nodeId) => {
    const factionId = get().getPlayerFactionId()
    if (!factionId) return { ok: false, reason: "Join a faction to contest territory." }
    if (!get().factionUnlocked)
      return { ok: false, reason: `Reach level ${FACTION_UNLOCK_LEVEL} to unlock faction warfare.` }
    const node = getNodeById(nodeId)
    if (!node || !isClaimableNode(node)) return { ok: false, reason: "This site can't be claimed." }
    if (get().nodeControl[nodeId] === factionId)
      return { ok: false, reason: "Your faction already holds this site." }
    if (!isNodeClaimableBy(get().nodeControl, factionId, nodeId))
      return { ok: false, reason: "Not connected to your territory — claim an adjacent site first." }
    const required = Math.max(nodeRequiredLevel(node), ENDGAME_NODE_LEVEL)
    if (get().profile.level < required)
      return { ok: false, reason: `Requires level ${required} — come prepared.` }
    return { ok: true }
  },

  canAssaultBase: (nodeId) => {
    const factionId = get().getPlayerFactionId()
    if (!factionId) return { ok: false, reason: "Join a faction to raid rival bases." }
    if (!get().factionUnlocked)
      return { ok: false, reason: `Reach level ${FACTION_UNLOCK_LEVEL} to unlock faction warfare.` }
    const node = getNodeById(nodeId)
    if (!node || node.kind !== "faction_hq" || !node.factionId)
      return { ok: false, reason: "This isn't a faction base." }
    if (node.factionId === factionId) return { ok: false, reason: "This is your own base." }
    const frontier = new Set(getControlledNodeIds(get().nodeControl, factionId))
    const adjacent = getAdjacentNodeIds(nodeId).some((a) => frontier.has(a))
    if (!adjacent)
      return { ok: false, reason: "Push your territory adjacent to this base first." }
    return { ok: true }
  },

  startTerritoryClaim: (nodeId) => {
    if (!get().canClaimNode(nodeId).ok) return
    if (get().activeExpedition || get().activeBattle) return
    const node = getNodeById(nodeId)
    if (!node) return
    const expId = node.expeditionIds[0]
    if (expId) {
      // Travel to the site via the normal expedition sim; the battle fires on
      // arrival (see completeActiveExpedition).
      set({ pendingTerritory: { nodeId, kind: "claim" } })
      get().startExpedition(expId)
    } else {
      const factionId = get().getPlayerFactionId()
      if (!factionId) return
      const { party, identity } = get()
      const handles = assembleSquadHandles(party, identity.handle, 4)
      const attacker = groupFromHandles(handles, factionId, identity, party, get().getPlayerStats())
      get().beginTerritoryBattle(nodeId, "claim", attacker)
    }
  },

  startBaseAssault: (nodeId) => {
    if (!get().canAssaultBase(nodeId).ok) return
    if (get().activeExpedition || get().activeBattle) return
    const factionId = get().getPlayerFactionId()
    if (!factionId) return
    const { party, identity } = get()
    const handles = assembleSquadHandles(party, identity.handle, 4)
    const attacker = groupFromHandles(handles, factionId, identity, party, get().getPlayerStats())
    get().beginTerritoryBattle(nodeId, "base_assault", attacker)
  },

  beginTerritoryBattle: (nodeId, kind, attacker) => {
    const factionId = get().getPlayerFactionId()
    if (!factionId) return
    const node = getNodeById(nodeId)
    if (!node) return

    let defenderGroup: StoredGroup
    let defenderFaction: RaceId | null
    let monster = false
    if (kind === "claim") {
      const stored = get().nodeGarrisons[nodeId]
      if (stored) {
        defenderGroup = stored
        defenderFaction = stored.factionId
      } else {
        defenderGroup = buildMonsterGarrison(Math.max(nodeRequiredLevel(node), ENDGAME_NODE_LEVEL))
        defenderFaction = null
        monster = true
      }
    } else {
      defenderFaction = node.factionId ?? null
      defenderGroup = buildFactionGarrison(defenderFaction ?? factionId, BASE_DEFENSE_LEVEL)
    }

    const { log, result, margin } = simulateTerritoryBattle(attacker, defenderGroup)

    let buildingsHit: string[] | undefined
    let integrityLost: number | undefined
    if (kind === "base_assault" && result === "win" && defenderFaction) {
      const base = get().factionBases[defenderFaction]
      if (base) {
        const dmg = planBaseAssaultDamage(margin, base)
        buildingsHit = dmg.buildingsHit
        integrityLost = dmg.integrityLost
      }
    }

    set({
      activeBattle: {
        nodeId,
        nodeLabel: node.label,
        kind,
        attacker: { factionId, group: attacker },
        defender: { factionId: defenderFaction, group: defenderGroup, monster },
        log,
        result,
        margin,
        buildingsHit,
        integrityLost,
      },
      pendingTerritory: null,
    })
  },

  resolveTerritoryBattle: () => {
    const battle = get().activeBattle
    if (!battle) return

    if (battle.result === "win") {
      if (battle.kind === "claim") {
        set((s) => ({
          nodeControl: { ...s.nodeControl, [battle.nodeId]: battle.attacker.factionId },
          // Store the victors as the site's new garrison — buffs already stripped.
          nodeGarrisons: { ...s.nodeGarrisons, [battle.nodeId]: battle.attacker.group },
        }))
      } else if (battle.kind === "base_assault" && battle.defender.factionId) {
        const now = Date.now()
        set((s) => {
          const base = s.factionBases[battle.defender.factionId as RaceId]
          if (!base) return {}
          const hit = new Set(battle.buildingsHit ?? [])
          const buildings = base.buildings.map((b) =>
            hit.has(b.id) ? { ...b, disabledUntil: now + BUILDING_DISABLE_MS } : b,
          )
          const integrity = Math.max(0, base.integrity - (battle.integrityLost ?? 0))
          return {
            factionBases: {
              ...s.factionBases,
              [base.factionId]: { ...base, integrity, buildings, lastRecoveredAt: now },
            },
          }
        })
      }
    }

    set({ activeBattle: null })
    // A siege just happened — rivals answer with their own expansion.
    get().runRivalExpansionTick()
  },

  runRivalExpansionTick: () => {
    const playerFaction = get().getPlayerFactionId()
    const rivals = FACTIONS.map((f) => f.id).filter((id) => id !== playerFaction)
    const control: NodeControl = { ...get().nodeControl }
    const garrisons: Record<string, StoredGroup> = { ...get().nodeGarrisons }
    const lostNodes: string[] = []

    for (const rival of rivals) {
      const candidates = MAP_NODES.filter((n) => isNodeClaimableBy(control, rival, n.id))
      if (candidates.length === 0) continue
      // Prefer soft neutral ground; fall back to biting into a held node.
      const neutral = candidates.filter((n) => !control[n.id])
      const pool = neutral.length ? neutral : candidates
      const target = pool[Math.floor(Math.random() * pool.length)]

      const rivalGroup = buildFactionGarrison(rival, ENDGAME_NODE_LEVEL)
      const defender =
        garrisons[target.id] ??
        buildMonsterGarrison(Math.max(nodeRequiredLevel(target), ENDGAME_NODE_LEVEL))
      const { result } = simulateTerritoryBattle(rivalGroup, defender)
      if (result === "win") {
        if (control[target.id] === playerFaction) lostNodes.push(target.label)
        control[target.id] = rival
        garrisons[target.id] = rivalGroup
      }
    }

    set({ nodeControl: control, nodeGarrisons: garrisons })

    if (lostNodes.length > 0) {
      const now = Date.now()
      set((s) => ({
        profile: {
          ...s.profile,
          notifications: [
            {
              id: now,
              title: "Territory lost",
              body: `Rival factions seized ${lostNodes.join(", ")}.`,
              priority: "high" as const,
              state: "unread" as const,
              createdAt: now,
            },
            ...s.profile.notifications,
          ],
        },
      }))
    }
  },

  recoverBases: () => {
    const now = Date.now()
    set((s) => {
      let changed = false
      const bases: Record<string, FactionBaseState> = { ...s.factionBases }
      for (const key of Object.keys(bases)) {
        const next = recoverBaseState(bases[key], now)
        if (next !== bases[key]) {
          bases[key] = next
          changed = true
        }
      }
      return changed ? { factionBases: bases } : {}
    })
  },

  // Admin/Debug - inject test chat messages with all title rarities to PUBLIC channel
  injectTestChatMessages: () => {
    const { messages } = get()
    const now = Date.now()
    const targetChannel: ChannelId = "PUBLIC"
    
    const testMessages: ChatMessage[] = [
      {
        id: `test-common-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@faded_one",
        title: "Faded Echo",
        titleRarity: "common",
        body: "This is a common title - simple gray styling.",
        at: now - 5000,
      },
      {
        id: `test-uncommon-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@signal_keeper",
        title: "Signal Keeper",
        titleRarity: "uncommon",
        body: "Uncommon titles have a cyan/teal color.",
        at: now - 4000,
      },
      {
        id: `test-rare-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@archive_seeker",
        title: "Archive Listener",
        titleRarity: "rare",
        body: "Rare titles glow with violet energy.",
        at: now - 3000,
      },
      {
        id: `test-epic-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@depth_walker",
        title: "Void Speaker",
        titleRarity: "epic",
        body: "Epic titles shine with amber radiance.",
        at: now - 2000,
      },
      {
        id: `test-legendary-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@golden_regent",
        title: "Deep Pull Regent",
        titleRarity: "legendary",
        body: "Legendary titles shimmer with golden light and have animated effects.",
        at: now - 1000,
      },
      {
        id: `test-mythic-1-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@relay_myth",
        title: "Myth of the Relay Sea",
        titleRarity: "mythic",
        body: "This title flows like ocean currents, with deep blue waves and aquatic shimmer.",
        at: now,
      },
      {
        id: `test-mythic-2-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@shard_ascendant",
        title: "Shardheart Ascendant",
        titleRarity: "mythic",
        body: "Crystal shards pulse and fracture with prismatic light, scaling with intensity.",
        at: now + 1000,
      },
      {
        id: `test-mythic-3-${now}`,
        channel: targetChannel,
        kind: "player",
        handle: "@eternal_one",
        title: "Eternal Courier",
        titleRarity: "mythic",
        body: "Motion trails drift endlessly, with golden amber light that stretches through time.",
        at: now + 2000,
      },
    ]
    
    // Set messages and switch to PUBLIC channel so user can see them
    set({ messages: [...messages, ...testMessages], channel: targetChannel })
  },

  // ============ ADMIN PANEL ============
  isAdmin: false,
  adminTab: "dashboard",
  setAdminMode: (v) => set({ isAdmin: v }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  
  // Events
  events: [],
  createEvent: (event) => {
    const { events, identity } = get()
    const newEvent: GameEvent = {
      ...event,
      id: `event-${Date.now()}`,
    }
    set({ events: [...events, newEvent] })
    get().logAdminAction("create_event", newEvent.label, `Created ${event.type} event`)
  },
  updateEvent: (id, updates) => {
    const { events } = get()
    set({
      events: events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })
  },
  deleteEvent: (id) => {
    const { events } = get()
    const event = events.find((e) => e.id === id)
    set({ events: events.filter((e) => e.id !== id) })
    if (event) {
      get().logAdminAction("delete_event", event.label, "Deleted event")
    }
  },
  toggleEventActive: (id) => {
    const { events } = get()
    const event = events.find((e) => e.id === id)
    if (event) {
      set({
        events: events.map((e) =>
          e.id === id ? { ...e, active: !e.active } : e
        ),
      })
      get().logAdminAction("toggle_event", event.label, `Set active: ${!event.active}`)
    }
  },

  // Player Records
  playerRecords: [
    { handle: "@test_player", status: "active", warnings: 0, lastSeen: Date.now() },
    { handle: "@quiet_one", status: "active", warnings: 1, lastSeen: Date.now() - 3600000 },
    { handle: "@troublemaker", status: "muted", mutedUntil: Date.now() + 1800000, warnings: 2, lastSeen: Date.now() - 7200000 },
  ],
  mutePlayer: (handle, durationMinutes) => {
    const { playerRecords } = get()
    const mutedUntil = Date.now() + durationMinutes * 60 * 1000
    set({
      playerRecords: playerRecords.map((p) =>
        p.handle === handle ? { ...p, status: "muted" as const, mutedUntil } : p
      ),
    })
    get().logAdminAction("mute_player", handle, `Muted for ${durationMinutes} minutes`)
  },
  unmutePlayer: (handle) => {
    const { playerRecords } = get()
    set({
      playerRecords: playerRecords.map((p) =>
        p.handle === handle ? { ...p, status: "active" as const, mutedUntil: undefined } : p
      ),
    })
    get().logAdminAction("unmute_player", handle, "Unmuted player")
  },
  banPlayer: (handle, reason) => {
    const { playerRecords } = get()
    set({
      playerRecords: playerRecords.map((p) =>
        p.handle === handle ? { ...p, status: "banned" as const, bannedReason: reason } : p
      ),
    })
    get().logAdminAction("ban_player", handle, `Banned: ${reason}`)
  },
  unbanPlayer: (handle) => {
    const { playerRecords } = get()
    set({
      playerRecords: playerRecords.map((p) =>
        p.handle === handle ? { ...p, status: "active" as const, bannedReason: undefined } : p
      ),
    })
    get().logAdminAction("unban_player", handle, "Unbanned player")
  },
  warnPlayer: (handle) => {
    const { playerRecords } = get()
    set({
      playerRecords: playerRecords.map((p) =>
        p.handle === handle ? { ...p, warnings: p.warnings + 1 } : p
      ),
    })
    get().logAdminAction("warn_player", handle, "Issued warning")
  },

  // Admin Logs
  adminLogs: [],
  logAdminAction: (action, target, details) => {
    const { adminLogs, identity } = get()
    const log: AdminLog = {
      id: `log-${Date.now()}`,
      action,
      target,
      adminHandle: identity.handle,
      timestamp: Date.now(),
      details,
    }
    set({ adminLogs: [log, ...adminLogs].slice(0, 100) }) // Keep last 100 logs
  },

  // Broadcast
  broadcastMessage: (message, channel) => {
    const { messages } = get()
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      channel,
      kind: "system",
      handle: "SYSTEM",
      body: message,
      at: Date.now(),
    }
    set({ messages: [...messages, systemMessage] })
    get().logAdminAction("broadcast", channel, message)
  },

  // Admin Contract Management
  createContract: (contract) => {
    const { contracts, contractPool } = get()
    const newContract: Contract = {
      ...contract,
      id: `contract-${Date.now()}`,
    }
    // Added to both the pool (so it can be drawn on later days) and today's
    // board (so it shows up immediately).
    set({
      contractPool: [...contractPool, newContract],
      contracts: [...contracts, newContract],
    })
    get().logAdminAction("create_contract", newContract.label, `Created ${contract.type} contract`)
  },
  deleteContract: (id) => {
    const { contracts, contractPool } = get()
    const contract = contracts.find((c) => c.id === id) ?? contractPool.find((c) => c.id === id)
    set({
      contractPool: contractPool.filter((c) => c.id !== id),
      contracts: contracts.filter((c) => c.id !== id),
    })
    if (contract) {
      get().logAdminAction("delete_contract", contract.label, "Deleted contract")
    }
  },

  // Admin Expedition Management
  createExpedition: (expedition) => {
    const { expeditions } = get()
    const newExpedition: Expedition = {
      ...expedition,
      id: `expedition-${Date.now()}`,
    }
    set({ expeditions: [...expeditions, newExpedition] })
    get().logAdminAction("create_expedition", newExpedition.label, `Created ${expedition.risk} risk expedition`)
  },
  deleteExpedition: (id) => {
    const { expeditions } = get()
    const expedition = expeditions.find((e) => e.id === id)
    set({ expeditions: expeditions.filter((e) => e.id !== id) })
    if (expedition) {
      get().logAdminAction("delete_expedition", expedition.label, "Deleted expedition")
    }
  },
  }))

// TEMP-V0-DEBUG: remove after visual verification.
if (typeof window !== "undefined") {
  ;(window as any).__esro = useEsroStore
}
