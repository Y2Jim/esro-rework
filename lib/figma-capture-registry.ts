/**
 * FIGMA CAPTURE REGISTRY — development tooling only.
 *
 * A single source of truth describing every screenshot the capture system can
 * produce. The gallery, the individual capture routes, and the Playwright
 * automation all read from this list. Add a new screenshot by appending an
 * entry here — no new pages required.
 *
 * This whole system is isolated and can be removed without touching the app.
 */

import type { ScreenId, ChannelId, OpsTab, AdminTab } from "@/lib/types"

export type CaptureCategory =
  | "reference"
  | "onboarding"
  | "terminal"
  | "ops"
  | "contracts"
  | "social"
  | "profile"
  | "inventory"
  | "archive"
  | "admin"
  | "themes"
  | "components"

/** How the capture frame renders the target. */
export type CaptureRender = "shell" | "boot" | "character-creation" | "phone-stage"

/** Serializable navigation/theme overrides applied on top of the fixture. */
export interface CaptureStateOverrides {
  screen?: ScreenId
  channel?: ChannelId
  opsTab?: OpsTab
  profileTab?: "summary" | "notifications"
  adminTab?: AdminTab
  uiTheme?: string
  isAdmin?: boolean
  factionUnlocked?: boolean
}

/** A deterministic DOM action performed after the fixture is applied. */
export type CaptureAction =
  | { clickText: string; nth?: number }
  | { scroll: "top" | "middle" | "bottom" }
  | { wait: number }

export type CaptureScroll = "top" | "middle" | "bottom"

export interface CaptureState {
  slug: string
  category: CaptureCategory
  /** Output subfolder, e.g. "02-terminal". */
  folder: string
  title: string
  description: string
  /** Source component path this capture represents. */
  source: string
  /** Named fixture id from figma-capture-fixtures. Defaults to "base". */
  fixture?: string
  /** Scalar store overrides applied after the fixture. */
  state?: CaptureStateOverrides
  render?: CaptureRender
  actions?: CaptureAction[]
  scroll?: CaptureScroll
  /** Animation reference note (start / middle / complete / none). */
  animation?: string
  /** Output PNG filename. */
  filename: string
  /** Extra guidance for Figma rebuild. */
  notes?: string
}

export const CAPTURE_VIEWPORT = { width: 464, height: 936, deviceScaleFactor: 2 } as const

const SHELL = "components/shell/app-shell.tsx"
const CHAT = "components/chat/chat-screen.tsx"
const OPS = "components/ops/ops-screen.tsx"
const CONTRACTS = "components/contracts/contracts-screen.tsx"
const SOCIAL = "components/social/social-screen.tsx"
const PROFILE = "components/profile/profile-screen.tsx"
const INVENTORY = "components/inventory/inventory-screen.tsx"
const ADMIN = "components/admin/admin-screen.tsx"

// ============ 00 REFERENCE ============
const reference: CaptureState[] = [
  {
    slug: "phone-stage-full",
    category: "reference",
    folder: "00-reference",
    title: "PhoneStage with frame",
    description: "The full phone stage including the bezel, notch and side buttons for context.",
    source: "components/phone/phone-stage.tsx",
    render: "phone-stage",
    filename: "00-reference-phone-stage-full.png",
    notes: "Only capture that includes the phone frame. All others are the bare 464x936 viewport.",
  },
  {
    slug: "shell-terminal",
    category: "reference",
    folder: "00-reference",
    title: "Clean shell (Terminal)",
    description: "Status bar, identity bar, watermark, content and bottom navigation with Terminal active.",
    source: SHELL,
    state: { screen: "terminal" },
    filename: "00-reference-shell-terminal.png",
  },
  {
    slug: "nav-ops",
    category: "reference",
    folder: "00-reference",
    title: "Bottom nav — Ops active",
    description: "Bottom navigation with the Ops destination active.",
    source: SHELL,
    state: { screen: "ops" },
    filename: "00-reference-nav-ops.png",
  },
  {
    slug: "nav-contracts",
    category: "reference",
    folder: "00-reference",
    title: "Bottom nav — Contracts active",
    description: "Bottom navigation with the Contracts destination active.",
    source: SHELL,
    state: { screen: "contracts" },
    filename: "00-reference-nav-contracts.png",
  },
  {
    slug: "nav-social",
    category: "reference",
    folder: "00-reference",
    title: "Bottom nav — Social active",
    description: "Bottom navigation with the Social destination active.",
    source: SHELL,
    state: { screen: "social" },
    filename: "00-reference-nav-social.png",
  },
  {
    slug: "nav-profile",
    category: "reference",
    folder: "00-reference",
    title: "Bottom nav — Profile active",
    description: "Bottom navigation with the Profile destination active.",
    source: SHELL,
    state: { screen: "profile" },
    filename: "00-reference-nav-profile.png",
  },
]

// ============ 01 ONBOARDING ============
const onboarding: CaptureState[] = [
  {
    slug: "boot-logo",
    category: "onboarding",
    folder: "01-onboarding",
    title: "Boot splash",
    description: "The ESRO boot splash using the existing logo asset.",
    source: "components/boot/boot-splash.tsx",
    render: "boot",
    animation: "complete",
    filename: "01-onboarding-boot-logo.png",
    notes: "Uses public/images/esro-logo*.png. Boot animation captured at its settled frame.",
  },
  {
    slug: "character-creation-start",
    category: "onboarding",
    folder: "01-onboarding",
    title: "Character creation — first step",
    description: "The entry step of the current character creation flow.",
    source: "components/onboarding/character-creation.tsx",
    render: "character-creation",
    filename: "01-onboarding-character-creation-start.png",
    notes: "Character creation manages its own internal step state; deeper steps are driven by clicking through in the live flow.",
  },
]

// ============ 02 TERMINAL ============
const CHANNELS: ChannelId[] = ["PUBLIC", "TRADE", "HELP", "LOG", "UNDERCHAT", "GAME", "FACTION", "PARTY"]
const terminal: CaptureState[] = CHANNELS.map((ch) => ({
  slug: `terminal-${ch.toLowerCase()}`,
  category: "terminal" as const,
  folder: "02-terminal",
  title: `Terminal — ${ch}`,
  description: `The ${ch} channel populated with its seeded message history.`,
  source: CHAT,
  state: { screen: "terminal" as ScreenId, channel: ch },
  filename: `02-terminal-${ch.toLowerCase()}-default.png`,
})).concat([
  {
    slug: "terminal-public-older-page",
    category: "terminal",
    folder: "02-terminal",
    title: "Terminal — older history page",
    description: "PUBLIC channel paged back to older messages via the log pagination controls.",
    source: CHAT,
    state: { screen: "terminal", channel: "PUBLIC" },
    actions: [{ clickText: "older" }],
    filename: "02-terminal-public-older-page.png",
    notes: "If pagination control text differs, capture falls back to the newest page.",
  },
])

// ============ 03 OPS ============
const OPS_TABS: OpsTab[] = ["expeditions", "skills", "crafting", "rolling"]
const ops: CaptureState[] = OPS_TABS.map((t) => ({
  slug: `ops-${t}`,
  category: "ops" as const,
  folder: "03-ops",
  title: `Ops — ${t[0].toUpperCase()}${t.slice(1)}`,
  description: `The ${t} tab of the Ops screen with seeded data.`,
  source: OPS,
  state: { screen: "ops" as ScreenId, opsTab: t },
  filename: `03-ops-${t}-default.png`,
})).concat([
  {
    slug: "ops-expedition-active",
    category: "ops",
    folder: "03-ops",
    title: "Ops — active expedition",
    description: "An expedition in progress at mid-run with live log entries.",
    source: OPS,
    fixture: "active-expedition",
    state: { screen: "ops", opsTab: "expeditions" },
    filename: "03-ops-expedition-active-mid.png",
  },
  {
    slug: "ops-crafting-active",
    category: "ops",
    folder: "03-ops",
    title: "Ops — crafting in progress",
    description: "A craft currently in progress with the faction bench buffs banner visible.",
    source: "components/ops/crafting-tab.tsx",
    fixture: "active-craft",
    state: { screen: "ops", opsTab: "crafting" },
    filename: "03-ops-crafting-active.png",
  },
  {
    slug: "ops-rolling-result-legendary",
    category: "ops",
    folder: "03-ops",
    title: "Ops — legendary roll result",
    description: "The recovery reveal card showing a legendary title result.",
    source: "components/ops/rolling-tab.tsx",
    fixture: "rolling-result",
    state: { screen: "ops", opsTab: "rolling" },
    animation: "complete",
    filename: "03-ops-rolling-legendary-result.png",
  },
])

// ============ 04 CONTRACTS ============
const contracts: CaptureState[] = [
  {
    slug: "contracts-all",
    category: "contracts",
    folder: "04-contracts",
    title: "Contracts — All",
    description: "All contracts (available and active) under the default All filter.",
    source: CONTRACTS,
    state: { screen: "contracts" },
    filename: "04-contracts-all.png",
  },
  {
    slug: "contracts-open",
    category: "contracts",
    folder: "04-contracts",
    title: "Contracts — Open filter",
    description: "Contracts filtered to the Open (neutral) type.",
    source: CONTRACTS,
    state: { screen: "contracts" },
    actions: [{ clickText: "Open" }],
    filename: "04-contracts-open.png",
  },
  {
    slug: "contracts-faction",
    category: "contracts",
    folder: "04-contracts",
    title: "Contracts — Faction filter",
    description: "Contracts filtered to the Faction type.",
    source: CONTRACTS,
    state: { screen: "contracts" },
    actions: [{ clickText: "Faction" }],
    filename: "04-contracts-faction.png",
  },
  {
    slug: "contracts-event",
    category: "contracts",
    folder: "04-contracts",
    title: "Contracts — Event filter",
    description: "Contracts filtered to the Event type.",
    source: CONTRACTS,
    state: { screen: "contracts" },
    actions: [{ clickText: "Event" }],
    filename: "04-contracts-event.png",
  },
]

// ============ 05 SOCIAL ============
const social: CaptureState[] = [
  {
    slug: "social-party",
    category: "social",
    folder: "05-social",
    title: "Social — Party",
    description: "The party roster with seeded members and empty invite slots.",
    source: SOCIAL,
    state: { screen: "social" },
    filename: "05-social-party-default.png",
  },
  {
    slug: "social-friends",
    category: "social",
    folder: "05-social",
    title: "Social — Friends",
    description: "Friends list with a mix of online and offline players.",
    source: SOCIAL,
    state: { screen: "social" },
    actions: [{ clickText: "Friends" }],
    filename: "05-social-friends.png",
  },
  {
    slug: "social-trade",
    category: "social",
    folder: "05-social",
    title: "Social — Trade",
    description: "Trade offers list.",
    source: SOCIAL,
    state: { screen: "social" },
    actions: [{ clickText: "Trade" }],
    filename: "05-social-trade.png",
  },
  {
    slug: "social-faction-locked",
    category: "social",
    folder: "05-social",
    title: "Social — Faction locked",
    description: "The faction tab before the player has reached the unlock level.",
    source: SOCIAL,
    fixture: "faction-locked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }],
    filename: "05-social-faction-locked.png",
  },
  {
    slug: "social-faction-overview",
    category: "social",
    folder: "05-social",
    title: "Social — Faction overview",
    description: "Faction overview with standing and rank once unlocked.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }],
    filename: "05-social-faction-overview.png",
  },
  {
    slug: "social-faction-projects",
    category: "social",
    folder: "05-social",
    title: "Social — Faction projects",
    description: "Faction projects with token contribution controls.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }, { clickText: "projects" }],
    filename: "05-social-faction-projects.png",
  },
  {
    slug: "social-faction-buildings",
    category: "social",
    folder: "05-social",
    title: "Social — Faction buildings",
    description: "Upgradeable faction buildings with cost and effect summaries.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }, { clickText: "buildings" }],
    filename: "05-social-faction-buildings.png",
  },
  {
    slug: "social-faction-rallies",
    category: "social",
    folder: "05-social",
    title: "Social — Faction rallies",
    description: "Time-limited faction rallies with join and contribute controls.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }, { clickText: "rallies" }],
    filename: "05-social-faction-rallies.png",
  },
  {
    slug: "social-faction-ranks",
    category: "social",
    folder: "05-social",
    title: "Social — Faction ranks & perks",
    description: "The rank ladder and rank-perk list.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }, { clickText: "ranks" }],
    scroll: "middle",
    filename: "05-social-faction-ranks.png",
  },
  {
    slug: "social-faction-activity",
    category: "social",
    folder: "05-social",
    title: "Social — Faction activity feed",
    description: "Recent faction activity feed.",
    source: SOCIAL,
    fixture: "faction-unlocked",
    state: { screen: "social" },
    actions: [{ clickText: "Faction" }, { clickText: "activity" }],
    filename: "05-social-faction-activity.png",
  },
]

// ============ 06 PROFILE ============
const profile: CaptureState[] = [
  {
    slug: "profile-summary",
    category: "profile",
    folder: "06-profile",
    title: "Profile — summary (top)",
    description: "Established identity summary with faction, level and stats.",
    source: PROFILE,
    state: { screen: "profile", profileTab: "summary" },
    scroll: "top",
    filename: "06-profile-summary-01-top.png",
  },
  {
    slug: "profile-summary-middle",
    category: "profile",
    folder: "06-profile",
    title: "Profile — summary (middle)",
    description: "Profile summary scrolled to the middle section.",
    source: PROFILE,
    state: { screen: "profile", profileTab: "summary" },
    scroll: "middle",
    filename: "06-profile-summary-02-middle.png",
  },
  {
    slug: "profile-summary-bottom",
    category: "profile",
    folder: "06-profile",
    title: "Profile — summary (bottom)",
    description: "Profile summary scrolled to the bottom section.",
    source: PROFILE,
    state: { screen: "profile", profileTab: "summary" },
    scroll: "bottom",
    filename: "06-profile-summary-03-bottom.png",
  },
  {
    slug: "profile-new-identity",
    category: "profile",
    folder: "06-profile",
    title: "Profile — new identity",
    description: "A fresh, unestablished identity with no faction and no title.",
    source: PROFILE,
    fixture: "new-identity",
    state: { screen: "profile", profileTab: "summary" },
    filename: "06-profile-new-identity.png",
  },
  {
    slug: "profile-no-title",
    category: "profile",
    folder: "06-profile",
    title: "Profile — no title",
    description: "Profile summary with no title equipped.",
    source: PROFILE,
    fixture: "no-title",
    state: { screen: "profile", profileTab: "summary" },
    filename: "06-profile-no-title.png",
  },
  {
    slug: "profile-long-title",
    category: "profile",
    folder: "06-profile",
    title: "Profile — long title",
    description: "Profile summary with an extra long mythic title to test wrapping.",
    source: PROFILE,
    fixture: "long-title",
    state: { screen: "profile", profileTab: "summary" },
    filename: "06-profile-long-title.png",
  },
  {
    slug: "profile-notifications",
    category: "profile",
    folder: "06-profile",
    title: "Profile — alerts",
    description: "Profile notifications/alerts with unread and read entries.",
    source: PROFILE,
    state: { screen: "profile", profileTab: "notifications" },
    filename: "06-profile-alerts.png",
  },
  {
    slug: "profile-notifications-empty",
    category: "profile",
    folder: "06-profile",
    title: "Profile — empty alerts",
    description: "Profile notifications when there are none.",
    source: PROFILE,
    fixture: "empty-notifications",
    state: { screen: "profile", profileTab: "notifications" },
    filename: "06-profile-alerts-empty.png",
  },
]

// ============ 07 INVENTORY ============
const inventory: CaptureState[] = [
  {
    slug: "inventory-populated",
    category: "inventory",
    folder: "07-inventory",
    title: "Inventory — populated (top)",
    description: "Inventory grid with seeded items across aspects and rarities.",
    source: INVENTORY,
    state: { screen: "inventory" },
    scroll: "top",
    filename: "07-inventory-populated-01-top.png",
  },
  {
    slug: "inventory-populated-bottom",
    category: "inventory",
    folder: "07-inventory",
    title: "Inventory — populated (bottom)",
    description: "Inventory grid scrolled to the bottom.",
    source: INVENTORY,
    state: { screen: "inventory" },
    scroll: "bottom",
    filename: "07-inventory-populated-02-bottom.png",
  },
]

// ============ 08 ARCHIVE (recovery) ============
const archive: CaptureState[] = [
  {
    slug: "archive-recovery-overview",
    category: "archive",
    folder: "08-archive",
    title: "Archive — recovery overview",
    description: "The rolling/recovery system that powers Archive recovery, with shard currencies.",
    source: "components/ops/rolling-tab.tsx",
    state: { screen: "ops", opsTab: "rolling" },
    filename: "08-archive-recovery-overview.png",
    notes: "The Archive recovery flow is implemented as the Ops > Rolling tab; there is no separate archive screen mounted in AppShell.",
  },
  {
    slug: "archive-recovery-legendary",
    category: "archive",
    folder: "08-archive",
    title: "Archive — legendary recovery reveal",
    description: "A fully revealed legendary recovery result.",
    source: "components/ops/rolling-tab.tsx",
    fixture: "rolling-result",
    state: { screen: "ops", opsTab: "rolling" },
    animation: "complete",
    filename: "08-archive-recovery-legendary.png",
  },
]

// ============ 09 ADMIN ============
const ADMIN_TABS: AdminTab[] = [
  "dashboard",
  "events",
  "contracts",
  "expeditions",
  "players",
  "broadcast",
  "logs",
  "devtools",
]
const admin: CaptureState[] = ADMIN_TABS.map((t) => ({
  slug: `admin-${t}`,
  category: "admin" as const,
  folder: "09-admin",
  title: `Admin — ${t[0].toUpperCase()}${t.slice(1)}`,
  description: `The ${t} tab of the admin panel.`,
  source: ADMIN,
  fixture: "admin",
  state: { screen: "admin" as ScreenId, isAdmin: true, adminTab: t },
  filename: `09-admin-${t}.png`,
  notes: "No real player data — all values are seeded mock data.",
}))

// ============ 10 THEMES ============
const RACE_THEMES = ["crownborn", "hearthkin", "gloamwhisper", "roadsinger"]
const ROLLABLE_THEME_IDS = [
  "terminal_green",
  "blood_moon",
  "ocean_depths",
  "golden_archive",
  "void_static",
  "aurora_drift",
  "ember_core",
  "crystal_lattice",
  "neon_pulse",
  "primordial_glow",
  "toxic_surge",
  "blood_circuit",
  "solar_flare",
  "void_rift",
  "quantum_flux",
]
const themes: CaptureState[] = [
  {
    slug: "theme-default",
    category: "themes",
    folder: "10-themes",
    title: "Theme — Default",
    description: "The representative theme test screen in the default theme.",
    source: SHELL,
    state: { screen: "terminal", uiTheme: "default" },
    filename: "10-theme-default.png",
  },
  ...RACE_THEMES.map((id) => ({
    slug: `theme-race-${id}`,
    category: "themes" as const,
    folder: "10-themes",
    title: `Theme — ${id} (race)`,
    description: `The representative theme test screen using the ${id} race theme.`,
    source: SHELL,
    state: { screen: "terminal" as ScreenId, uiTheme: id },
    filename: `10-theme-race-${id}.png`,
  })),
  ...ROLLABLE_THEME_IDS.map((id) => ({
    slug: `theme-${id}`,
    category: "themes" as const,
    folder: "10-themes",
    title: `Theme — ${id}`,
    description: `The representative theme test screen using the ${id} rollable theme.`,
    source: SHELL,
    state: { screen: "terminal" as ScreenId, uiTheme: id },
    animation: "complete",
    filename: `10-theme-${id}.png`,
  })),
]

// ============ 11 COMPONENT SHEETS ============
const components: CaptureState[] = [
  {
    slug: "component-bottom-nav",
    category: "components",
    folder: "11-components",
    title: "Component — bottom navigation",
    description: "Bottom navigation bar in its default state (Terminal active).",
    source: "components/shell/bottom-nav.tsx",
    state: { screen: "terminal" },
    scroll: "bottom",
    filename: "11-component-bottom-nav.png",
    notes: "Component sheets are captured in-context on their host screen rather than in isolation.",
  },
  {
    slug: "component-identity-bar",
    category: "components",
    folder: "11-components",
    title: "Component — identity bar",
    description: "Status bar and identity bar at the top of the shell.",
    source: "components/shell/identity-bar.tsx",
    state: { screen: "terminal" },
    scroll: "top",
    filename: "11-component-identity-bar.png",
  },
  {
    slug: "component-expedition-cards",
    category: "components",
    folder: "11-components",
    title: "Component — expedition cards",
    description: "Expedition list cards.",
    source: "components/ops/expeditions-tab.tsx",
    state: { screen: "ops", opsTab: "expeditions" },
    filename: "11-component-expedition-cards.png",
  },
  {
    slug: "component-skill-cards",
    category: "components",
    folder: "11-components",
    title: "Component — skill cards & loadout",
    description: "Skill library cards and loadout slots.",
    source: "components/ops/skills-tab.tsx",
    state: { screen: "ops", opsTab: "skills" },
    filename: "11-component-skill-cards.png",
  },
  {
    slug: "component-contract-cards",
    category: "components",
    folder: "11-components",
    title: "Component — contract cards",
    description: "Contract cards across difficulty and type.",
    source: CONTRACTS,
    state: { screen: "contracts" },
    filename: "11-component-contract-cards.png",
  },
  {
    slug: "component-party-slots",
    category: "components",
    folder: "11-components",
    title: "Component — party slots",
    description: "Party member rows and empty invite slots.",
    source: SOCIAL,
    state: { screen: "social" },
    filename: "11-component-party-slots.png",
  },
  {
    slug: "component-recovery-cards",
    category: "components",
    folder: "11-components",
    title: "Component — recovery cards",
    description: "Recovery result cards in the rolling tab.",
    source: "components/ops/rolling-tab.tsx",
    fixture: "rolling-result",
    state: { screen: "ops", opsTab: "rolling" },
    filename: "11-component-recovery-cards.png",
  },
]

export const CAPTURE_REGISTRY: CaptureState[] = [
  ...reference,
  ...onboarding,
  ...terminal,
  ...ops,
  ...contracts,
  ...social,
  ...profile,
  ...inventory,
  ...archive,
  ...admin,
  ...themes,
  ...components,
]

export const CAPTURE_CATEGORIES: CaptureCategory[] = [
  "reference",
  "onboarding",
  "terminal",
  "ops",
  "contracts",
  "social",
  "profile",
  "inventory",
  "archive",
  "admin",
  "themes",
  "components",
]

export function getCaptureBySlug(slug: string): CaptureState | undefined {
  return CAPTURE_REGISTRY.find((c) => c.slug === slug)
}
