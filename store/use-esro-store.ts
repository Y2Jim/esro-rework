"use client"

import { create } from "zustand"
import type {
  ChannelId,
  ChatMessage,
  RecoveryResult,
  ScreenId,
  Rarity,
} from "@/lib/types"
import {
  channels as seedChannels,
  identity as seedIdentity,
  messages as seedMessages,
  recoveryResults as seedRecovery,
  shards as seedShards,
} from "@/lib/mock-data"

interface EsroState {
  booted: boolean
  setBooted: (v: boolean) => void

  identityRevealed: boolean
  revealIdentity: () => void

  screen: ScreenId
  setScreen: (s: ScreenId) => void

  channel: ChannelId
  setChannel: (c: ChannelId) => void

  messages: ChatMessage[]
  sendMessage: (body: string) => void

  /** 0 = newest page, N = older pages */
  pageOffset: number
  nudgePage: (delta: number) => void
  resetPage: () => void

  /** Skill loadout: up to 4 skill ids */
  loadout: string[]
  toggleLoadoutSkill: (id: string) => void

  /** Archive shard currencies */
  shards: typeof seedShards
  /** Archive recent results */
  recovery: RecoveryResult[]
  /** Latest revealed result, used for reveal animation */
  lastRecovered: RecoveryResult | null
  runRecovery: (mode: "standard" | "focused") => void
  clearLastRecovered: () => void

  identity: typeof seedIdentity
  unread: Record<ChannelId, number>
  markRead: (c: ChannelId) => void
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

  identityRevealed: true, // already established in mock
  revealIdentity: () => set({ identityRevealed: true }),

  screen: "chat",
  setScreen: (s) => {
    // reset chat paging when returning to chat
    if (s === "chat") set({ pageOffset: 0 })
    set({ screen: s })
  },

  channel: "PUBLIC",
  setChannel: (c) => {
    set({ channel: c, pageOffset: 0 })
    get().markRead(c)
  },

  messages: seedMessages,
  sendMessage: (body) => {
    const trimmed = body.trim()
    if (!trimmed) return
    const { channel, identity, messages } = get()
    const channelDef = seedChannels.find((ch) => ch.id === channel)
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

  pageOffset: 0,
  nudgePage: (delta) =>
    set((s) => ({ pageOffset: Math.max(0, s.pageOffset + delta) })),
  resetPage: () => set({ pageOffset: 0 }),

  loadout: ["analysis", "surveying", "logistics", "scavenging"],
  toggleLoadoutSkill: (id) =>
    set((s) => {
      if (s.loadout.includes(id)) {
        return { loadout: s.loadout.filter((x) => x !== id) }
      }
      if (s.loadout.length >= 4) return s
      return { loadout: [...s.loadout, id] }
    }),

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

  identity: seedIdentity,

  unread: seedChannels.reduce(
    (acc, c) => {
      acc[c.id] = c.unread ?? 0
      return acc
    },
    {} as Record<ChannelId, number>,
  ),
  markRead: (c) =>
    set((s) => ({ unread: { ...s.unread, [c]: 0 } })),
}))
