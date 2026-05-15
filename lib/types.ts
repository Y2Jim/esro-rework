export type ChannelId =
  | "PUBLIC"
  | "TRADE"
  | "HELP"
  | "LOG"
  | "UNDERCHAT"
  | "GAME"

export type ScreenId =
  | "terminal"
  | "ops"
  | "contracts"
  | "faction"
  | "profile"

export type OpsTab = "expeditions" | "skills" | "crafting" | "rolling"

export interface QuickAction {
  id: string
  label: string
  description: string
  priority: "urgent" | "normal"
  deeplink: {
    screen: ScreenId
    tab?: OpsTab
  }
}

export interface Contract {
  id: string
  label: string
  issuer: string
  description: string
  reward: string
  deadline?: string
  status: "available" | "active" | "completed"
}

export interface FactionProject {
  id: string
  label: string
  description: string
  progress: number
  goal: number
  contributors: number
}

export type MessageKind = "player" | "system" | "whisper"

export interface ChatMessage {
  id: string
  channel: ChannelId
  kind: MessageKind
  handle: string
  title?: string
  titleRarity?: Rarity
  body: string
  /** unix ms */
  at: number
}

export interface Channel {
  id: ChannelId
  label: string
  description: string
  readOnly?: boolean
  restricted?: boolean
  unread?: number
}

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"

export interface Skill {
  id: string
  label: string
  summary: string
  level: number
  maxLevel: number
  locked: boolean
  variant?: string
}

export interface Expedition {
  id: string
  label: string
  /** seconds */
  duration: number
  risk: "Low" | "Medium" | "High"
  tags: string[]
  requiredSkill: string
  suggestedParty: number
  rewards: {
    xp: number
    tokens: number
    materials: string[]
  }
}

export interface ActiveExpedition {
  id: string
  label: string
  /** 0..1 */
  progress: number
  etaSeconds: number
  log: string[]
}

export type ItemAspect =
  | "relay"
  | "archive"
  | "supply"
  | "salvage"
  | "cosmetic"
  | "unknown"

export interface InventoryItem {
  id: string
  label: string
  aspect: ItemAspect
  rarity: Rarity
  qty: number
  identified: boolean
  description: string
}

export interface PartyMember {
  slot: number
  handle: string
  title?: string
  titleRarity?: Rarity
  role: string
  status: "ready" | "idle" | "offline" | "deployed"
  leader?: boolean
}

export interface RecoveryResult {
  id: string
  label: string
  type: "title" | "schematic" | "modifier" | "cosmetic" | "badge" | "blueprint" | "chat_flair"
  rarity: Rarity
  recoveredAt: number
}

export interface Identity {
  handle: string
  title: string
  titleRarity: Rarity
  established: boolean
}

export interface OwnedTitle {
  id: string
  label: string
  rarity: Rarity
  equipped: boolean
}

export interface ProfileBadge {
  id: string
  label: string
  description: string
  earnedAt: number
}

export interface ProfileNotification {
  id: number
  title: string
  body: string
  priority: "low" | "normal" | "high"
  state: "unread" | "read"
  deeplink?: {
    screen?: ScreenId
    tab?: string
    channel?: ChannelId
    contractId?: string
  }
  createdAt: number
}

export interface Faction {
  id: string
  label: string
  rank: number
  standing: number
  maxStanding: number
}

export interface Profile {
  handle: string
  title: OwnedTitle | null
  faction: Faction | null
  level: number
  xp: number
  xpToNext: number
  ownedTitles: OwnedTitle[]
  badges: ProfileBadge[]
  notifications: ProfileNotification[]
}
