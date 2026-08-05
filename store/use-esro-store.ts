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
  OpsTab,
  PartyMember,
  Profile,
  ProfileNotification,
  ProfileTitle,
  QuickAction,
  RecoveryResult,
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
  type SkillBonuses,
} from "@/lib/skill-effects"

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
  
  // Player Stats
  getPlayerStats: () => BaseStats
  getStatBonus: (stat: keyof BaseStats) => number
  
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
  startExpedition: (id: string) => void
  cancelExpedition: () => void

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

  // Ops - Crafting/Rolling
  inventory: InventoryItem[]
  shards: typeof seedShards
  recovery: RecoveryResult[]
  lastRecovered: RecoveryResult | null
  runRecovery: (mode: "standard" | "focused") => void
  clearLastRecovered: () => void
  activeCraft: { recipeId: string; label: string; startedAt: number; duration: number } | null
  craftItem: (recipeId: string) => { success: boolean; message: string }
  completeCraft: () => void
  addMaterials: () => void // Admin function to add crafting materials

  // Contracts
  contracts: Contract[]
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
  
  // Social - Trade
  tradeOffers: TradeOffer[]

  // Profile
  identity: typeof seedIdentity
  profile: Profile
  profileTab: "summary" | "notifications"
  setProfileTab: (tab: "summary" | "notifications") => void
  setActiveTitle: (titleId: string) => void
  markNotificationRead: (id: number) => void
  openNotification: (notification: ProfileNotification) => void
  clearNotification: (id: number) => void
  clearAllNotifications: () => void
  
  // Avatar & Vanity
  equipVanity: (vanityId: string) => void
  unequipVanity: (layerType: AvatarLayerType) => void
  
  // Admin/Debug
  setHandle: (newHandle: string) => void
  unlockAllCosmetics: () => void
  unlockAllTitles: () => void
  simulateExpedition: (expeditionId?: string) => void
  completeActiveExpedition: (lootMultiplier?: number) => void
  injectTestChatMessages: () => void
  
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

function rollRarity(focused: boolean): Rarity {
  const r = Math.random()
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
    // Hats
    { label: "Route Cap", type: "cosmetic", vanityData: { layerType: "hat", variant: 1 } },
    { label: "Dust Hood", type: "cosmetic", vanityData: { layerType: "hat", variant: 7 } },
    { label: "Signal Beanie", type: "cosmetic", vanityData: { layerType: "hat", variant: 8 } },
    { label: "Worn Helmet", type: "cosmetic", vanityData: { layerType: "hat", variant: 9 } },
    // Flair
    { label: "Soft Glow", type: "cosmetic", vanityData: { layerType: "flair", variant: 4 } },
    { label: "Dust Motes", type: "cosmetic", vanityData: { layerType: "flair", variant: 5 } },
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
    // Hats
    { label: "Signal Antenna", type: "cosmetic", vanityData: { layerType: "hat", variant: 3 } },
    { label: "Relay Headset", type: "cosmetic", vanityData: { layerType: "hat", variant: 10 } },
    { label: "Archive Hood", type: "cosmetic", vanityData: { layerType: "hat", variant: 11 } },
    { label: "Scout Helm", type: "cosmetic", vanityData: { layerType: "hat", variant: 12 } },
    // Flair
    { label: "Signal Flicker", type: "cosmetic", vanityData: { layerType: "flair", variant: 6 } },
    { label: "Route Trails", type: "cosmetic", vanityData: { layerType: "flair", variant: 7 } },
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
    // Hats
    { label: "Relay Horns", type: "cosmetic", vanityData: { layerType: "hat", variant: 4 } },
    { label: "Drift Crown", type: "cosmetic", vanityData: { layerType: "hat", variant: 13 } },
    { label: "Echo Circlet", type: "cosmetic", vanityData: { layerType: "hat", variant: 14 } },
    { label: "Signal Crest", type: "cosmetic", vanityData: { layerType: "hat", variant: 15 } },
    // Flair
    { label: "Sparkle Effect", type: "cosmetic", vanityData: { layerType: "flair", variant: 3 } },
    { label: "Echo Ripples", type: "cosmetic", vanityData: { layerType: "flair", variant: 8 } },
    { label: "Data Stream", type: "cosmetic", vanityData: { layerType: "flair", variant: 9 } },
  ],
  epic: [
    // Non-cosmetics
    { label: "Relay Warden", type: "title" },
    { label: "Depth Touched", type: "title" },
    { label: "Void Speaker", type: "title" },
    { label: "Rift Sovereign", type: "title" },
    { label: "Archive Seeker", type: "title" },
    // Accessories
    { label: "Void Visor", type: "cosmetic", vanityData: { layerType: "accessory", variant: 14 } },
    { label: "Prismatic Lens", type: "cosmetic", vanityData: { layerType: "accessory", variant: 15 } },
    // Hats
    { label: "Archive Halo", type: "cosmetic", vanityData: { layerType: "hat", variant: 5 } },
    { label: "Void Helm", type: "cosmetic", vanityData: { layerType: "hat", variant: 16 } },
    { label: "Rift Diadem", type: "cosmetic", vanityData: { layerType: "hat", variant: 17 } },
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
    // Hats
    { label: "Crown of Routes", type: "cosmetic", vanityData: { layerType: "hat", variant: 6 } },
    { label: "Primordial Antlers", type: "cosmetic", vanityData: { layerType: "hat", variant: 18 } },
    // Flair
    { label: "Prismatic Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 11 } },
    { label: "Celestial Flame", type: "cosmetic", vanityData: { layerType: "flair", variant: 12 } },
  ],
  mythic: [
    { label: "Origin Cipher", type: "title" },
    { label: "Worldcurrent Antlers", type: "cosmetic", vanityData: { layerType: "hat", variant: 19 } },
    { label: "Genesis Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 13 } },
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

const PARTY_ROLES = ["Logistics", "Surveying", "Analysis", "Security", "Relay Tuning", "Scavenging"]
const PARTY_TITLES: { label: string; rarity: Rarity }[] = [
  { label: "Route Tender", rarity: "common" },
  { label: "Signal Keeper", rarity: "uncommon" },
  { label: "Archive Listener", rarity: "rare" },
  { label: "Waystone Keeper", rarity: "epic" },
]

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
  uiTheme: "default",
  unlockedThemes: [], // Start with no rollable themes unlocked
  setCharacterData: (race, courier, handle, starterSkills, avatar) => {
    const { profile, identity } = get()
    set({
      characterCreated: true,
      characterRace: race,
      characterCourier: courier,
      isNewUser: false,
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
      },
    })
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

    // Conditioning and other survivability skills widen the HP pool directly.
    stats.hp += Math.round(get().getSkillBonuses().maxHpBonus)

    return stats
  },

  /** Aggregated sub-stat effects across every unlocked skill. */
  getSkillBonuses: () => aggregateSkillBonuses(get().skills),

  /** Content unlocked by skill tier breakpoints (levels 5 / 10 / 15). */
  getSkillUnlocks: () => getSkillUnlocks(get().skills),

  hasSkillUnlock: (id) => get().getSkillUnlocks().has(id),
  
  getStatBonus: (stat) => {
    const stats = get().getPlayerStats()
    // Return percentage bonus based on stat value (each point above 10 = 2% bonus)
    return Math.max(0, (stats[stat] - 10) * 2)
  },

  // Navigation
  screen: "terminal",
  setScreen: (s) => set({ screen: s }),
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
    const { identity, messages, channels } = get()
    const channelDef = channels.find((ch) => ch.id === channel)
    if (channelDef?.readOnly) return
    const next: ChatMessage = {
      id: `local-${Date.now()}`,
      channel,
      kind: "player",
      handle: identity.handle,
      title: identity.title,
      titleRarity: identity.titleRarity,
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
  startExpedition: (id) => {
    const exp = get().expeditions.find((e) => e.id === id)
    if (!exp || get().activeExpedition) return

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
      },
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
    const cost = mode === "focused" ? 2 : 1
    const currencyKey = mode === "focused" ? "resonance" : "relay_tokens"
    const { shards, recovery, profile, inventory } = get()
    if ((shards as any)[currencyKey] < cost) return
    const rarity = rollRarity(mode === "focused")
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

    // Faction building upgrades: Apothecary trims material cost, Workshop cuts craft time.
    const bonuses = craftingBonusesFrom(get().factionBuildings)
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
    
    // Relay Forge upgrade: chance-weighted bonus yield on each craft.
    const yieldBonus = craftingBonusesFrom(get().factionBuildings).yield
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

  // Contracts
  contracts: seedContracts,
  acceptContract: (id) =>
    set((s) => ({
      contracts: s.contracts.map((c) =>
        c.id === id && c.status === "available"
          ? { ...c, status: "active" as const }
          : c
      ),
    })),
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

    const bonus = craftingBonusesFrom(get().factionBuildings).standing
    const newProgress = Math.min(project.goal, project.progress + amount)
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

    const newProgress = Math.min(rally.goal, rally.progress + amount)
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
    }))
  },
  
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
    const layers: { type: AvatarLayerType; maxVariants: number; labels: string[]; mythicStart?: number }[] = [
      { type: "hair", maxVariants: 8, labels: ["Short Cut", "Long Flow", "Spiky", "Slicked", "Braided", "Mohawk", "Curly", "Bald Fade"] },
      { type: "eyes", maxVariants: 6, labels: ["Standard", "Narrow", "Wide", "Glowing", "Cyber", "Ancient"] },
      { type: "mouth", maxVariants: 5, labels: ["Neutral", "Smirk", "Frown", "Open", "Masked"] },
      { type: "accessory", maxVariants: 22, mythicStart: 17, labels: ["None", "Glasses", "Eyepatch", "Scar", "Visor", "Shades", "Face Mask", "Worn Bandana", "Relay Earpiece", "Signal Monocle", "Route Mask", "Deep Scanner", "Rift Lens", "Echo Mask", "Void Visor", "Prismatic Lens", "All-Seeing Eye", "Voidtouched Gaze", "Relay Sea Mask", "Shardheart Visor", "Eternal Courier's Mark", "Primordial Echo"] },
      { type: "hat", maxVariants: 24, mythicStart: 19, labels: ["None", "Cap", "Hood", "Antenna", "Horns", "Halo", "Crown", "Dust Hood", "Signal Beanie", "Worn Helmet", "Relay Headset", "Archive Hood", "Scout Helm", "Drift Crown", "Echo Circlet", "Signal Crest", "Void Helm", "Rift Diadem", "Primordial Antlers", "Crown of the Relay Sea", "Shardheart Coronet", "Eternal Courier's Crest", "Voidtouched Halo", "Primordial Echo Crown"] },
      { type: "flair", maxVariants: 18, mythicStart: 13, labels: ["None", "Pulse Glow", "Static Aura", "Sparkle", "Soft Glow", "Dust Motes", "Signal Flicker", "Route Trails", "Echo Ripples", "Data Stream", "Void Shimmer", "Prismatic Aura", "Celestial Flame", "Relay Sea Aura", "Shardheart Radiance", "Eternal Courier's Light", "Voidtouched Presence", "Primordial Resonance"] },
    ]
    
    for (const layer of layers) {
      for (let v = 1; v < layer.maxVariants; v++) {
        // Determine rarity - mythic for transcendent tier items
        let rarity: Rarity
        if (layer.mythicStart && v >= layer.mythicStart) {
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
      { id: "silence_between_stars", label: "Silence Between Stars", rarity: "mythic", equipped: false, source: "Admin unlock" },
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

    // Total wipe: all cargo is lost, no rewards granted.
    if (mult <= 0) {
      set({ activeExpedition: null })
      return
    }

    // Generate random loot rewards, scaled by how much loot was carried back.
    const lootTypes = ["Archive Fragment", "Signal Shard", "Relay Component", "Ancient Glyph", "Void Essence"]
    const numRewards = Math.max(1, Math.round((2 + Math.floor(Math.random() * 3)) * mult)) // up to 2-4 items
    
    const newItems: InventoryItem[] = []
    for (let i = 0; i < numRewards; i++) {
      const rarityRoll = Math.random()
      let rarity: Rarity = "common"
      if (rarityRoll > 0.95) rarity = "legendary"
      else if (rarityRoll > 0.85) rarity = "epic"
      else if (rarityRoll > 0.65) rarity = "rare"
      else if (rarityRoll > 0.40) rarity = "uncommon"
      
      const lootLabel = lootTypes[Math.floor(Math.random() * lootTypes.length)]
      newItems.push({
        id: `loot-${Date.now()}-${i}`,
        label: lootLabel,
        aspect: "material",
        rarity,
        qty: 1 + Math.floor(Math.random() * 3),
        identified: true,
        description: `Salvaged ${lootLabel.toLowerCase()} recovered during the expedition.`,
        type: "material",
      })
    }
    
    // Add token reward, scaled by the loot that made it back.
    const tokenReward = Math.round((50 + Math.floor(Math.random() * 150)) * mult)
    
    set({
      activeExpedition: null,
      inventory: [...inventory, ...newItems],
      profile: {
        ...get().profile,
        tokens: get().profile.tokens + tokenReward,
      },
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
    const { contracts } = get()
    const newContract: Contract = {
      ...contract,
      id: `contract-${Date.now()}`,
    }
    set({ contracts: [...contracts, newContract] })
    get().logAdminAction("create_contract", newContract.label, `Created ${contract.type} contract`)
  },
  deleteContract: (id) => {
    const { contracts } = get()
    const contract = contracts.find((c) => c.id === id)
    set({ contracts: contracts.filter((c) => c.id !== id) })
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
