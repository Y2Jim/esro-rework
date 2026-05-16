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
} from "@/lib/types"
import { FACTIONS, FACTION_UNLOCK_LEVEL, getRaceById } from "@/lib/game-data"
import {
  channels as seedChannels,
  contracts as seedContracts,
  expeditions as seedExpeditions,
  activeExpedition as seedActiveExpedition,
  factionProjects as seedFactionProjects,
  identity as seedIdentity,
  inventory as seedInventory,
  messages as seedMessages,
  party as seedParty,
  profile as seedProfile,
  quickActions as seedQuickActions,
  recoveryResults as seedRecovery,
  shards as seedShards,
  skills as seedSkills,
} from "@/lib/mock-data"

interface EsroState {
  booted: boolean
  setBooted: (v: boolean) => void

  // Character Creation & Onboarding
  isNewUser: boolean
  characterCreated: boolean
  characterRace: Race | null
  characterCourier: Courier | null
  characterFaction: FactionData | null
  factionUnlocked: boolean
  uiTheme: "default" | RaceId
  setCharacterData: (race: Race, courier: Courier, handle: string, starterSkills: string[]) => void
  setFaction: (factionId: RaceId) => void
  setUiTheme: (theme: "default" | RaceId) => void
  checkFactionUnlock: () => void
  
  // Navigation
  screen: ScreenId
  setScreen: (s: ScreenId) => void
  opsTab: OpsTab
  setOpsTab: (t: OpsTab) => void

  // Terminal (Chat)
  channel: ChannelId
  setChannel: (c: ChannelId) => void
  channels: Channel[]
  messages: ChatMessage[]
  sendMessage: (channel: ChannelId, body: string) => void
  unread: Record<ChannelId, number>
  markRead: (c: ChannelId) => void

  // Quick Actions
  quickActions: QuickAction[]

  // Ops - Expeditions
  expeditions: Expedition[]
  activeExpedition: ActiveExpedition | null
  startExpedition: (id: string) => void

  // Ops - Skills
  skills: Skill[]
  loadout: string[]
  toggleLoadout: (id: string) => void

  // Ops - Crafting/Rolling
  inventory: InventoryItem[]
  shards: typeof seedShards
  recovery: RecoveryResult[]
  lastRecovered: RecoveryResult | null
  runRecovery: (mode: "standard" | "focused") => void
  clearLastRecovered: () => void

  // Contracts
  contracts: Contract[]
  acceptContract: (id: string) => void
  cancelContract: (id: string) => void
  
  // Social - Party
  party: PartyMember[]
  
  // Social - Faction
  factionProjects: FactionProject[]
  
  // Social - Friends
  friends: Friend[]
  
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
  unlockAllCosmetics: () => void
  unlockAllTitles: () => void
  simulateExpedition: (expeditionId?: string) => void
  completeActiveExpedition: () => void
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
}

export const useEsroStore = create<EsroState>((set, get) => ({
  booted: false,
  setBooted: (v) => set({ booted: v }),

  // Character Creation & Onboarding
  isNewUser: false, // Set to true to trigger onboarding
  characterCreated: true, // Set to false for new users
  characterRace: null,
  characterCourier: null,
  characterFaction: null,
  factionUnlocked: false,
  uiTheme: "default",
  setCharacterData: (race, courier, handle, starterSkills) => {
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
  checkFactionUnlock: () => {
    const { profile, factionUnlocked } = get()
    if (!factionUnlocked && profile.level >= FACTION_UNLOCK_LEVEL) {
      set({ factionUnlocked: true })
    }
  },

  // Navigation
  screen: "terminal",
  setScreen: (s) => set({ screen: s }),
  opsTab: "expeditions",
  setOpsTab: (t) => set({ opsTab: t }),

  // Terminal
  channel: "PUBLIC",
  setChannel: (c) => {
    set({ channel: c })
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
    set({ messages: [...messages, next] })
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

  // Quick Actions
  quickActions: seedQuickActions,

  // Expeditions
  expeditions: seedExpeditions,
  activeExpedition: seedActiveExpedition,
  startExpedition: (id) => {
    const exp = get().expeditions.find((e) => e.id === id)
    if (!exp || get().activeExpedition) return
    set({
      activeExpedition: {
        id: exp.id,
        label: exp.label,
        progress: 0,
        etaSeconds: exp.duration,
        log: ["Expedition started..."],
      },
    })
  },

  // Skills
  skills: seedSkills,
  loadout: ["analysis", "surveying", "logistics", "scavenging"],
  toggleLoadout: (id) =>
    set((s) => {
      if (s.loadout.includes(id)) {
        return { loadout: s.loadout.filter((x) => x !== id) }
      }
      if (s.loadout.length >= 4) return s
      return { loadout: [...s.loadout, id] }
    }),

  // Inventory & Recovery
  inventory: seedInventory,
  shards: { ...seedShards },
  recovery: seedRecovery,
  lastRecovered: null,
  runRecovery: (mode) => {
    const cost = mode === "focused" ? 2 : 1
    const currencyKey = mode === "focused" ? "deep_signals" : "relay_tokens"
    const { shards, recovery, profile } = get()
    if ((shards as any)[currencyKey] < cost) return
    const rarity = rollRarity(mode === "focused")
    const pool = POOL[rarity]
    const pick = pool[Math.floor(Math.random() * pool.length)]
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
  factionProjects: seedFactionProjects,

  // Friends
  friends: [
    {
      handle: "@signalwatcher",
      title: "Signal Keeper",
      titleRarity: "uncommon" as const,
      status: "online" as const,
      faction: "Waykeepers",
    },
    {
      handle: "@archivesoul",
      title: "Archive Listener",
      titleRarity: "rare" as const,
      status: "online" as const,
      faction: "Archive Collective",
    },
    {
      handle: "@dustrunner",
      status: "away" as const,
      faction: "Waykeepers",
    },
    {
      handle: "@relaykeeper",
      title: "Route Tender",
      titleRarity: "common" as const,
      status: "offline" as const,
      faction: "Signal Corps",
    },
  ] as Friend[],

  // Trade
  tradeOffers: [
    {
      id: "trade-1",
      fromHandle: "@signalwatcher",
      toHandle: "@you",
      fromItems: [{ itemId: "relay_scrap", qty: 5 }],
      toItems: [{ itemId: "archive_core", qty: 1 }],
      fromTokens: 2,
      toTokens: 0,
      status: "pending" as const,
      createdAt: Date.now() - 1000 * 60 * 30,
      expiresAt: Date.now() + 1000 * 60 * 90,
      message: "Fair trade? Let me know!",
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
  
  // Admin/Debug - unlock all cosmetics
  unlockAllCosmetics: () => {
    const { profile } = get()
    const allCosmetics: VanityItem[] = []
    const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]
    
    // Generate all possible cosmetic variants for each layer type
    const layers: { type: AvatarLayerType; maxVariants: number; labels: string[] }[] = [
      { type: "hair", maxVariants: 8, labels: ["Short Cut", "Long Flow", "Spiky", "Slicked", "Braided", "Mohawk", "Curly", "Bald Fade"] },
      { type: "eyes", maxVariants: 6, labels: ["Standard", "Narrow", "Wide", "Glowing", "Cyber", "Ancient"] },
      { type: "mouth", maxVariants: 5, labels: ["Neutral", "Smirk", "Frown", "Open", "Masked"] },
      { type: "accessory", maxVariants: 7, labels: ["None", "Glasses", "Eyepatch", "Scar", "Visor", "Shades", "Face Mask"] },
      { type: "hat", maxVariants: 7, labels: ["None", "Cap", "Hood", "Headband", "Helmet", "Crown", "Antenna"] },
      { type: "flair", maxVariants: 4, labels: ["None", "Glow", "Pulse", "Sparkle"] },
    ]
    
    for (const layer of layers) {
      for (let v = 1; v < layer.maxVariants; v++) {
        const rarity = rarities[Math.min(Math.floor(v / 2), rarities.length - 1)]
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
      },
    })
  },
  
  // Admin/Debug - instantly complete active expedition
  completeActiveExpedition: () => {
    const { activeExpedition, inventory } = get()
    if (!activeExpedition) return
    
    // Generate random loot rewards
    const lootTypes = ["Archive Fragment", "Signal Shard", "Relay Component", "Ancient Glyph", "Void Essence"]
    const rarities: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"]
    const numRewards = 2 + Math.floor(Math.random() * 3) // 2-4 items
    
    const newItems: InventoryItem[] = []
    for (let i = 0; i < numRewards; i++) {
      const rarityRoll = Math.random()
      let rarity: Rarity = "common"
      if (rarityRoll > 0.95) rarity = "legendary"
      else if (rarityRoll > 0.85) rarity = "epic"
      else if (rarityRoll > 0.65) rarity = "rare"
      else if (rarityRoll > 0.40) rarity = "uncommon"
      
      newItems.push({
        id: `loot-${Date.now()}-${i}`,
        label: lootTypes[Math.floor(Math.random() * lootTypes.length)],
        rarity,
        qty: 1 + Math.floor(Math.random() * 3),
        type: "material",
      })
    }
    
    // Add token reward
    const tokenReward = 50 + Math.floor(Math.random() * 150)
    
    set({
      activeExpedition: null,
      inventory: [...inventory, ...newItems],
      profile: {
        ...get().profile,
        tokens: get().profile.tokens + tokenReward,
      },
    })
  },
}))
