export type ChannelId =
  | "PUBLIC"
  | "TRADE"
  | "HELP"
  | "LOG"
  | "UNDERCHAT"
  | "GAME"
  | "FACTION"
  | "PARTY"

export type ScreenId =
  | "terminal"
  | "ops"
  | "contracts"
  | "social"
  | "profile"

export type SocialTab = "party" | "faction" | "friends" | "trade"

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
  pinned?: boolean
  replyTo?: string // message id
  reactions?: { emoji: string; count: number }[]
}

export interface DirectMessage {
  id: string
  fromHandle: string
  toHandle: string
  body: string
  at: number
  read: boolean
}

export interface Channel {
  id: ChannelId
  label: string
  description: string
  readOnly?: boolean
  restricted?: boolean
  unread?: number
  pinnedCount?: number
  memberCount?: number
  slowMode?: number // seconds between messages
}

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"

// Avatar system
export type AvatarLayerType = "base" | "skin" | "eyes" | "mouth" | "hair" | "accessory" | "hat" | "flair"

export interface AvatarLayer {
  type: AvatarLayerType
  variant: number
  color?: number // index into color palette
}

export interface AvatarConfig {
  seed: string
  layers: AvatarLayer[]
}

export interface VanityItem {
  id: string
  label: string
  layerType: AvatarLayerType
  variant: number
  rarity: Rarity
  unlocked: boolean
  equipped: boolean
}

export interface Skill {
  id: string
  label: string
  summary: string
  level: number
  maxLevel: number
  locked: boolean
  variant?: string
}

export interface ExpeditionStage {
  id: string
  label: string
  description: string
  duration: number // seconds
  skillCheck?: string
  risk: "Low" | "Medium" | "High"
}

export interface Expedition {
  id: string
  label: string
  description: string
  /** seconds */
  duration: number
  risk: "Low" | "Medium" | "High"
  tags: string[]
  requiredSkill: string
  suggestedParty: number
  minLevel?: number
  stages?: ExpeditionStage[]
  factionAttunement?: string // faction id for bonus standing
  rewards: {
    xp: number
    tokens: number
    materials: string[]
    skillXp?: { skill: string; amount: number }[]
    factionStanding?: number
    possibleDrops?: { label: string; rarity: Rarity; chance: number }[]
  }
}

export interface ActiveExpedition {
  id: string
  label: string
  /** 0..1 */
  progress: number
  etaSeconds: number
  log: string[]
  currentStage?: number
  totalStages?: number
  partyMembers?: string[] // handles
  startedAt: number
  skillGains?: { skill: string; xp: number }[]
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
  avatar?: AvatarConfig
  joinedAt?: number
  contribution?: number // XP contributed to party
  expeditionsCompleted?: number
}

export interface PartyInvite {
  id: string
  fromHandle: string
  toHandle: string
  partyName?: string
  sentAt: number
  status: "pending" | "accepted" | "declined" | "expired"
}

export interface PartySettings {
  name?: string
  isPublic: boolean
  autoAccept: boolean
  maxMembers: number
}

export interface Friend {
  handle: string
  title?: string
  titleRarity?: Rarity
  status: "online" | "away" | "offline"
  avatar?: AvatarConfig
  faction?: string
  lastSeen?: number
  note?: string
}

export interface FriendRequest {
  id: string
  fromHandle: string
  toHandle: string
  sentAt: number
  message?: string
  status: "pending" | "accepted" | "declined"
}

export interface TradeOffer {
  id: string
  fromHandle: string
  toHandle: string
  fromItems: { itemId: string; qty: number }[]
  toItems: { itemId: string; qty: number }[]
  fromTokens: number
  toTokens: number
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed"
  createdAt: number
  expiresAt: number
  message?: string
}

export interface TradeHistoryEntry {
  id: string
  withHandle: string
  itemsGiven: { label: string; qty: number }[]
  itemsReceived: { label: string; qty: number }[]
  tokensGiven: number
  tokensReceived: number
  completedAt: number
}

export interface RecoveryResult {
  id: string
  label: string
  type: "title" | "schematic" | "modifier" | "cosmetic" | "badge" | "blueprint" | "chat_flair"
  rarity: Rarity
  recoveredAt: number
  vanityData?: {
    layerType: AvatarLayerType
    variant: number
  }
}

export interface Identity {
  handle: string
  title: string
  titleRarity: Rarity
  established: boolean
  avatar: AvatarConfig
}

export interface OwnedTitle {
  id: string
  label: string
  rarity: Rarity
  equipped: boolean
  source?: string // How it was obtained (e.g., "Archive Recovery", "Waykeepers Rank 3", "Achievement")
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
  vanityItems: VanityItem[]
}
