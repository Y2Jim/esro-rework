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
  | "admin"
  | "inventory"
  | "faction"
  | "expedition"
  | "party"
  | "skills"
  | "archive"

export type SocialTab = "party" | "faction" | "friends" | "trade"

export type OpsTab = "map" | "expeditions" | "skills" | "crafting" | "rolling"

/** Sub-views inside the Faction tab, used for cross-screen deep links. */
export type FactionView =
  | "overview"
  | "projects"
  | "buildings"
  | "rallies"
  | "ranks"
  | "activity"

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

export type ContractType = "faction" | "neutral" | "event"

export interface Contract {
  id: string
  label: string
  issuer: string
  description: string
  reward: string
  deadline?: string
  status: "available" | "active" | "completed"
  type: ContractType
  difficulty?: "easy" | "medium" | "hard"
  }

export interface FactionProject {
  id: string
  label: string
  description: string
  progress: number
  goal: number
  contributors: number
  /** Whether the project has reached its goal. */
  complete?: boolean
}

// ============ FACTION SYSTEMS ============

export type FactionActivityKind =
  | "contribution"
  | "rank_up"
  | "project_complete"
  | "building"
  | "rally"
  | "join"
  | "perk"

export interface FactionActivity {
  id: string
  kind: FactionActivityKind
  /** Actor handle. */
  handle: string
  text: string
  /** unix ms */
  at: number
  amount?: number
}

export type FactionBuildingEffect =
  | "craft_speed"
  | "craft_yield"
  | "cost_reduction"
  | "standing_gain"

export interface FactionBuilding {
  id: string
  label: string
  description: string
  icon: string
  /** 0 = not yet built. */
  level: number
  maxLevel: number
  effect: FactionBuildingEffect
  /** Fractional bonus granted per level (e.g. 0.08 = 8%). */
  perLevel: number
  /** Human-readable effect summary (per level). */
  effectLabel: string
  requiredRank: number
  /** Token cost for the first level; scales up per level. */
  baseTokenCost: number
  /** Materials consumed for the first level; scales up per level. */
  baseMaterials: { itemId: string; label: string; qty: number }[]
}

export interface FactionPerk {
  id: string
  label: string
  description: string
  icon: string
  requiredRank: number
  /** Short buff summary shown on the perk card. */
  effectLabel: string
}

export interface FactionRally {
  id: string
  label: string
  description: string
  icon: string
  progress: number
  goal: number
  /** unix ms deadline. */
  endsAt: number
  reward: { tokens: number; standing: number; item?: string }
  /** The player's personal contribution to this rally. */
  contribution: number
  joined: boolean
  complete?: boolean
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
  | "mythic"
  | "admin"

// Rollable UI Themes (separate from faction themes)
export type RollableThemeId =
  | "terminal_green"
  | "blood_moon"
  | "ocean_depths"
  | "golden_archive"
  | "void_static"
  | "aurora_drift"
  | "ember_core"
  | "crystal_lattice"
  | "neon_pulse"
  | "primordial_glow"
  | "toxic_surge"
  | "blood_circuit"
  | "solar_flare"
  | "void_rift"
  | "quantum_flux"

export interface RollableUITheme {
  id: RollableThemeId
  label: string
  description: string
  rarity: Rarity
  colors: {
    accent: string
    accentBright: string
    background: string
    panel: string
    /** Secondary accent for rare+ themes */
    secondary?: string
  }
  /** Visual intensity multiplier (1.0 = normal, higher = more glow/effects) */
  intensity: number
  /** Special effect class name for epic+ themes */
  effectClass?: string
  /** Border style override for legendary+ themes */
  borderStyle?: "solid" | "glow" | "pulse" | "shimmer"
  unlocked: boolean
}

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

export interface SkillEffect {
  type: "expedition_time" | "material_yield" | "rare_chance" | "xp_bonus" | "risk_reduction" | "faction_standing" | "craft_efficiency" | "party_bonus"
  value: number // percentage or flat bonus
  description: string
  appliesTo?: string[] // expedition types or categories this applies to
}

export interface SkillVariant {
  id: string
  label: string
  description: string
  unlocked: boolean
  effects?: SkillEffect[]
}

export interface Skill {
  id: string
  label: string
  summary: string
  level: number
  maxLevel: number
  locked: boolean
  /** Display label of the currently selected variant, if any */
  variant?: string
  /** Currently active variant id */
  activeVariant?: string
  /** All available variants for this skill */
  variants?: SkillVariant[]
  /** What expeditions this skill is primary for */
  primaryExpeditions?: string[]
  /** Effects granted per level */
  effects?: SkillEffect[]
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
  | "food"
  | "potion"
  | "material"
  | "herb"
  | "mineral"
  | "essence"
  | "consumable"

export interface InventoryItem {
  id: string
  label: string
  aspect: ItemAspect
  rarity: Rarity
  qty: number
  identified: boolean
  description: string
  type?: "material" | "consumable" | "equipment" | "quest" | "misc"
  effects?: string[]
  duration?: number // in seconds for buffs
}

export type CraftingCategory = "food" | "potion" | "gear" | "component" | "special"

export interface CraftingIngredient {
  itemId: string
  label: string
  qty: number
}

export interface CraftingRecipe {
  id: string
  label: string
  category: CraftingCategory
  description: string
  ingredients: CraftingIngredient[]
  output: {
    itemId: string
    label: string
    aspect: ItemAspect
    rarity: Rarity
    qty: number
    description: string
    effects?: string[]
  }
  craftTime: number // seconds
  requiredSkill?: string
  requiredSkillLevel?: number
  unlocked: boolean
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

export interface TradeItem {
  itemId: string
  label: string
  qty: number
  rarity?: Rarity
}

export interface TradeOffer {
  id: string
  fromHandle: string
  toHandle: string
  fromItems: TradeItem[]
  toItems: TradeItem[]
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
  type: "title" | "schematic" | "modifier" | "cosmetic" | "badge" | "blueprint" | "chat_flair" | "salvage"
  rarity: Rarity
  recoveredAt: number
  vanityData?: {
    layerType: AvatarLayerType
    variant: number
  }
  /** Set when the rolled reward was already owned and converted to salvage */
  isDuplicate?: boolean
  /** Label of the original reward this salvage was converted from */
  duplicateOf?: string
  /** Salvage payout granted in place of a duplicate */
  salvageReward?: {
    label: string
    qty: number
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

/** A title a player owns; structurally identical to OwnedTitle. */
export type ProfileTitle = OwnedTitle

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
  race: Race | null
  courier: Courier | null
  level: number
  xp: number
  xpToNext: number
  /** Currency balance earned from expeditions and contracts */
  tokens: number
  ownedTitles: OwnedTitle[]
  badges: ProfileBadge[]
  notifications: ProfileNotification[]
  vanityItems: VanityItem[]
}

// ============ CHARACTER CREATION / FACTIONS ============

export type RaceId = "crownborn" | "hearthkin" | "gloamwhisper" | "roadsinger"
export type CourierId = "gallant" | "trickster" | "caregiver" | "visionary"

export interface BaseStats {
  hp: number
  atk: number
  def: number
  focus: number
  luck: number
}

export interface Race {
  id: RaceId
  name: string
  summary: string
  affinity: string
  role: string
  icon: string
  color: string
  glow: string
  lore: string
  stats: BaseStats
}

export interface Courier {
  id: CourierId
  name: string
  summary: string
  theme: string
  icon: string
  color: string
  glow: string
  stats: BaseStats
}

export interface FactionData {
  id: RaceId
  name: string
  emblem: string // unicode symbol for faction emblem
  color: string
  glow: string
  colorVars: {
    primary: string
    secondary: string
    accent: string
    bg: string
  }
  lore: string
  bonus: string // gameplay bonus description
  motto: string
  unlockLevel: number
}

export interface CharacterData {
  handle: string
  race: Race
  courier: Courier
  faction: FactionData | null
  stats: BaseStats
  level: number
  xp: number
  xpToNext: number
  skills: SkillSnapshot[]
  starterSkills: string[]
  established: boolean
  createdAt: number
}

export interface SkillStat {
  id: string
  name: string
  level: number
  progress: number
}

export interface SkillSnapshot {
  name: string
  linkedStat: keyof BaseStats
  summary: string
  level: number
  progress: number
  specialty: string
  starterChoice: boolean
  stats: SkillStat[]
}

export interface OnboardingPanel {
  title: string
  body: string
}

export type CharacterCreationStep = 
  | "boot"
  | "incoming"
  | "briefing"
  | "race"
  | "courier"
  | "avatar"
  | "skills"
  | "name"
  | "confirm"
  | "complete"

export type FactionSelectionStep =
  | "intro"
  | "selection"
  | "confirm"
  | "pledged"
  | "complete"

// ============ ADMIN SYSTEM ============

export type AdminTab = "dashboard" | "events" | "contracts" | "expeditions" | "players" | "broadcast" | "logs" | "devtools"

export type EventType = "seasonal" | "limited" | "special"

export interface GameEvent {
  id: string
  label: string
  description: string
  type: EventType
  startDate: number
  endDate: number
  rewards: string[]
  active: boolean
}

export type PlayerStatus = "active" | "muted" | "banned"

export interface PlayerRecord {
  handle: string
  status: PlayerStatus
  mutedUntil?: number
  bannedReason?: string
  warnings: number
  lastSeen: number
  level?: number
  faction?: string
}

export type AdminAction = 
  | "mute_player"
  | "unmute_player"
  | "ban_player"
  | "unban_player"
  | "warn_player"
  | "create_event"
  | "delete_event"
  | "toggle_event"
  | "create_contract"
  | "delete_contract"
  | "create_expedition"
  | "delete_expedition"
  | "broadcast"
  | "add_materials"
  | "unlock_cosmetics"
  | "unlock_titles"
  | "edit_player"

export interface AdminLog {
  id: string
  action: AdminAction
  target?: string
  adminHandle: string
  timestamp: number
  details?: string
}
