"use client"

/**
 * FIGMA CAPTURE FIXTURES — development tooling only.
 *
 * These functions return partial Zustand state used to put the ESRO app into a
 * deterministic, repeatable state before a screenshot is taken. They never run
 * in the normal application; they are only applied by the /figma-capture routes.
 *
 * The whole capture system is isolated under:
 *   - lib/figma-capture-*.ts
 *   - components/figma-capture/*
 *   - app/figma-capture/*
 *   - scripts/capture-figma.mjs
 * and can be deleted wholesale without touching the main app.
 */

import type { EsroState } from "@/store/use-esro-store"
import type { RecoveryResult, ActiveExpedition } from "@/lib/types"
import { FACTIONS } from "@/lib/game-data"
import { identity as seedIdentity, profile as seedProfile } from "@/lib/mock-data"

/** Fixed reference identity used across every capture. */
export const CAPTURE_HANDLE = "@VioletMoth_Aster"
export const CAPTURE_TITLE = "Signal Cartographer"

/** Fixed clock used so timestamps never drift between capture runs. */
export const CAPTURE_NOW = Date.UTC(2025, 5, 15, 12, 0, 0) // 2025-06-15T12:00:00Z

export type CaptureFixture = () => Partial<EsroState>

/**
 * Baseline "ready to play" state with the deterministic reference identity.
 * Every fixture builds on top of this.
 */
export function baseFixture(): Partial<EsroState> {
  return {
    booted: true,
    characterCreated: true,
    isNewUser: false,
    screen: "terminal",
    channel: "PUBLIC",
    pageOffset: 0,
    opsTab: "expeditions",
    profileTab: "summary",
    adminTab: "dashboard",
    uiTheme: "default",
    isAdmin: false,
    activeExpedition: null,
    activeCraft: null,
    lastRecovered: null,
    identity: {
      ...seedIdentity,
      handle: CAPTURE_HANDLE,
      title: CAPTURE_TITLE,
      titleRarity: "rare",
      established: true,
    },
    profile: {
      ...seedProfile,
      handle: CAPTURE_HANDLE,
      title: { id: "signal_cartographer", label: CAPTURE_TITLE, rarity: "rare", equipped: true },
    },
  }
}

/** A brand new, unestablished identity with no faction and no title. */
function newIdentityFixture(): Partial<EsroState> {
  const base = baseFixture()
  return {
    ...base,
    factionUnlocked: false,
    characterFaction: null,
    identity: {
      ...seedIdentity,
      handle: "@Relay0000",
      title: "",
      titleRarity: "common",
      established: false,
    },
    profile: {
      ...seedProfile,
      handle: "@Relay0000",
      title: null,
      faction: null,
      race: null,
      courier: null,
      level: 1,
      xp: 0,
      xpToNext: 500,
      tokens: 0,
      notifications: [],
    },
  }
}

/** Faction unlocked, pledged to a faction, high enough level for faction systems. */
function factionUnlockedFixture(): Partial<EsroState> {
  const base = baseFixture()
  const faction = FACTIONS[2] ?? FACTIONS[0] // gloamwhisper
  return {
    ...base,
    screen: "social",
    factionUnlocked: true,
    characterFaction: faction,
    profile: {
      ...seedProfile,
      handle: CAPTURE_HANDLE,
      title: { id: "signal_cartographer", label: CAPTURE_TITLE, rarity: "rare", equipped: true },
      level: 22,
      tokens: 4200,
      faction: { id: faction.id, label: faction.name, rank: 5, standing: 180, maxStanding: 1200 },
    },
  }
}

/** Faction not yet unlocked (low level). */
function factionLockedFixture(): Partial<EsroState> {
  const base = baseFixture()
  return {
    ...base,
    screen: "social",
    factionUnlocked: false,
    characterFaction: null,
    profile: {
      ...seedProfile,
      handle: CAPTURE_HANDLE,
      title: { id: "signal_cartographer", label: CAPTURE_TITLE, rarity: "rare", equipped: true },
      level: 4,
      faction: null,
    },
  }
}

/** An expedition currently in progress at mid-run. */
function activeExpeditionFixture(): Partial<EsroState> {
  const active: ActiveExpedition = {
    id: "exp_archive_dive",
    label: "Archive Dive",
    progress: 0.52,
    etaSeconds: 420,
    log: [
      "Descended into the lower relay stacks.",
      "Signal interference rising — rerouting.",
      "Recovered a fragment of an old broadcast.",
    ],
    currentStage: 2,
    totalStages: 4,
    partyMembers: ["@VioletMoth_Aster", "@CedarVane"],
    startedAt: CAPTURE_NOW - 460_000,
    skillGains: [{ skill: "Archive Diving", xp: 60 }],
  }
  return { ...baseFixture(), screen: "ops", opsTab: "expeditions", activeExpedition: active }
}

/** A craft currently in progress. */
function activeCraftFixture(): Partial<EsroState> {
  return {
    ...baseFixture(),
    screen: "ops",
    opsTab: "crafting",
    activeCraft: {
      recipeId: "ration_pack",
      label: "Ration Pack",
      startedAt: CAPTURE_NOW - 8_000,
      duration: 30,
    },
  }
}

/** A freshly rolled legendary recovery result to show the reveal card. */
function rollingResultFixture(): Partial<EsroState> {
  const result: RecoveryResult = {
    id: "rec_capture_legendary",
    label: "Waystone Keeper",
    type: "title",
    rarity: "legendary",
    recoveredAt: CAPTURE_NOW,
  }
  return { ...baseFixture(), screen: "ops", opsTab: "rolling", lastRecovered: result }
}

/** Profile with no notifications (empty alerts state). */
function emptyNotificationsFixture(): Partial<EsroState> {
  const base = baseFixture()
  return {
    ...base,
    screen: "profile",
    profileTab: "notifications",
    profile: { ...seedProfile, handle: CAPTURE_HANDLE, notifications: [] },
  }
}

/** Admin mode enabled, admin screen active. */
function adminFixture(): Partial<EsroState> {
  return { ...baseFixture(), isAdmin: true, screen: "admin", adminTab: "dashboard" }
}

/** Identity with no equipped title. */
function noTitleFixture(): Partial<EsroState> {
  const base = baseFixture()
  return {
    ...base,
    screen: "profile",
    identity: { ...seedIdentity, handle: CAPTURE_HANDLE, title: "", titleRarity: "common", established: true },
    profile: { ...seedProfile, handle: CAPTURE_HANDLE, title: null },
  }
}

/** Identity with a very long title to test text wrapping. */
function longTitleFixture(): Partial<EsroState> {
  const base = baseFixture()
  const longLabel = "Grand Cartographer of the Deep Relay Archives and Keeper of Lost Signals"
  return {
    ...base,
    screen: "profile",
    identity: { ...seedIdentity, handle: CAPTURE_HANDLE, title: longLabel, titleRarity: "mythic", established: true },
    profile: {
      ...seedProfile,
      handle: CAPTURE_HANDLE,
      title: { id: "grand_cartographer", label: longLabel, rarity: "mythic", equipped: true },
    },
  }
}

/** Registry of named fixtures. Registry entries reference these by id. */
export const CAPTURE_FIXTURES: Record<string, CaptureFixture> = {
  base: baseFixture,
  "new-identity": newIdentityFixture,
  "faction-unlocked": factionUnlockedFixture,
  "faction-locked": factionLockedFixture,
  "active-expedition": activeExpeditionFixture,
  "active-craft": activeCraftFixture,
  "rolling-result": rollingResultFixture,
  "empty-notifications": emptyNotificationsFixture,
  admin: adminFixture,
  "no-title": noTitleFixture,
  "long-title": longTitleFixture,
}

export function resolveFixture(id: string | undefined): CaptureFixture {
  if (!id) return baseFixture
  return CAPTURE_FIXTURES[id] ?? baseFixture
}
