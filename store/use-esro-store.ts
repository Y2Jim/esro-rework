"use client"

import { create } from "zustand"
import type {
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

const POOL: Record<Rarity, { label: string; type: RecoveryResult["type"] }[]> = {
  common: [
    { label: "Relay Flair", type: "chat_flair" },
    { label: "Field Kit Schematic", type: "schematic" },
    { label: "Calm Route", type: "modifier" },
  ],
  uncommon: [
    { label: "Signal Keeper", type: "title" },
    { label: "Signal Beacon Schematic", type: "schematic" },
    { label: "Clean Entry", type: "modifier" },
  ],
  rare: [
    { label: "Archive Listener", type: "title" },
    { label: "Support Crate Blueprint", type: "blueprint" },
  ],
  epic: [
    { label: "Relay Warden", type: "title" },
    { label: "Glass Signal", type: "cosmetic" },
  ],
  legendary: [{ label: "Deep Pull Regent", type: "title" }],
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
    const { shards, recovery } = get()
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
    }
    set({
      shards: {
        ...shards,
        [currencyKey]: (shards as any)[currencyKey] - cost,
      } as typeof seedShards,
      recovery: [result, ...recovery].slice(0, 8),
      lastRecovered: result,
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
}))
