export type ChannelId =
  | "PUBLIC"
  | "TRADE"
  | "HELP"
  | "LORE"
  | "UNDERCHAT"
  | "GAME"

export type ScreenId =
  | "chat"
  | "expedition"
  | "skills"
  | "inventory"
  | "party"
  | "archive"

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
