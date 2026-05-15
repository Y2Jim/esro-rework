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
  InventoryItem,
  OpsTab,
  PartyMember,
  Profile,
  ProfileNotification,
  QuickAction,
  RecoveryResult,
  ScreenId,
  Skill,
  Rarity,
  VanityItem,
} from "@/lib/types"
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

  // Faction
  party: PartyMember[]
  factionProjects: FactionProject[]

  // Profile
  identity: typeof seedIdentity
  profile: Profile
  profileTab: "summary" | "notifications"
  setProfileTab: (tab: "summary" | "notifications") => void
  setActiveTitle: (titleId: string) => void
  markNotificationRead: (id: number) => void
  openNotification: (notification: ProfileNotification) => void
  
  // Avatar & Vanity
  equipVanity: (vanityId: string) => void
  unequipVanity: (layerType: AvatarLayerType) => void
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
    { label: "Relay Flair", type: "chat_flair" },
    { label: "Field Kit Schematic", type: "schematic" },
    { label: "Calm Route", type: "modifier" },
    { label: "Signal Glasses", type: "cosmetic", vanityData: { layerType: "accessory", variant: 1 } },
    { label: "Route Cap", type: "cosmetic", vanityData: { layerType: "hat", variant: 1 } },
    { label: "Drifter", type: "title" },
    { label: "Relay Initiate", type: "title" },
    { label: "Path Follower", type: "title" },
  ],
  uncommon: [
    { label: "Signal Keeper", type: "title" },
    { label: "Signal Beacon Schematic", type: "schematic" },
    { label: "Clean Entry", type: "modifier" },
    { label: "Eyepatch", type: "cosmetic", vanityData: { layerType: "accessory", variant: 2 } },
    { label: "Signal Antenna", type: "cosmetic", vanityData: { layerType: "hat", variant: 3 } },
    { label: "Scar Mark", type: "cosmetic", vanityData: { layerType: "accessory", variant: 3 } },
    { label: "Pale Wanderer", type: "title" },
    { label: "Circuit Speaker", type: "title" },
    { label: "Dust Walker", type: "title" },
    { label: "Signal Chaser", type: "title" },
  ],
  rare: [
    { label: "Archive Listener", type: "title" },
    { label: "Support Crate Blueprint", type: "blueprint" },
    { label: "Archive Visor", type: "cosmetic", vanityData: { layerType: "accessory", variant: 4 } },
    { label: "Relay Horns", type: "cosmetic", vanityData: { layerType: "hat", variant: 4 } },
    { label: "Sparkle Effect", type: "cosmetic", vanityData: { layerType: "flair", variant: 3 } },
    { label: "Waystone Keeper", type: "title" },
    { label: "Deep Touched", type: "title" },
    { label: "Echo Finder", type: "title" },
    { label: "Rift Walker", type: "title" },
  ],
  epic: [
    { label: "Relay Warden", type: "title" },
    { label: "Glass Signal", type: "cosmetic" },
    { label: "Archive Halo", type: "cosmetic", vanityData: { layerType: "hat", variant: 5 } },
    { label: "Static Aura", type: "cosmetic", vanityData: { layerType: "flair", variant: 2 } },
    { label: "Pulse Glow", type: "cosmetic", vanityData: { layerType: "flair", variant: 1 } },
    { label: "Depth Touched", type: "title" },
    { label: "Void Speaker", type: "title" },
    { label: "Rift Sovereign", type: "title" },
    { label: "Archive Seeker", type: "title" },
  ],
  legendary: [
    { label: "Deep Pull Regent", type: "title" },
    { label: "Crown of Routes", type: "cosmetic", vanityData: { layerType: "hat", variant: 6 } },
    { label: "Primordial Echo", type: "title" },
    { label: "The Returned", type: "title" },
    { label: "Signal Sovereign", type: "title" },
  ],
}

export const useEsroStore = create<EsroState>((set, get) => ({
  booted: false,
  setBooted: (v) => set({ booted: v }),

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

  // Faction
  party: seedParty,
  factionProjects: seedFactionProjects,

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
        party: "faction",
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
}))
