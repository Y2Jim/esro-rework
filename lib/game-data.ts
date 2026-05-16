import type { Race, Courier, FactionData, OnboardingPanel, BaseStats } from "./types"

// Import JSON configs
import racesConfig from "@/config/races.json"
import couriersConfig from "@/config/couriers.json"
import factionsConfig from "@/config/factions.json"
import skillsConfig from "@/config/skills.json"
import onboardingConfig from "@/config/onboarding.json"
import gameSettingsConfig from "@/config/game-settings.json"

// ============ GAME SETTINGS ============
export const DEFAULT_BASE_STATS: BaseStats = gameSettingsConfig.baseStats as BaseStats
export const LEVEL_CURVE = gameSettingsConfig.levelCurve
export const STAT_LABELS = gameSettingsConfig.statLabels
export const STAT_COLORS = gameSettingsConfig.statColors

// ============ RACES ============
export const RACES: Race[] = racesConfig.races as Race[]

// ============ COURIERS ============
export const COURIERS: Courier[] = couriersConfig.couriers as Courier[]

// ============ FACTIONS ============
export const FACTIONS: FactionData[] = factionsConfig.factions.map(f => ({
  ...f,
  unlockLevel: factionsConfig.unlockLevel,
})) as FactionData[]

export const FACTION_UNLOCK_LEVEL = factionsConfig.unlockLevel

// ============ SKILLS ============
export interface SkillStatDefinition {
  id: string
  name: string
  effect: string
}

export interface SkillDefinition {
  name: string
  linkedStat: keyof BaseStats
  summary: string
  expeditionRole: string
  stats: SkillStatDefinition[]
}

export const SKILL_DEFINITIONS: SkillDefinition[] = skillsConfig.skills as SkillDefinition[]
export const STARTER_SKILL_COUNT = skillsConfig.starterSkillCount

// ============ ONBOARDING ============
export const BOOT_HEADER = onboardingConfig.boot.header
export const BOOT_BODY = onboardingConfig.boot.body
export const ONBOARDING_PANELS: OnboardingPanel[] = onboardingConfig.panels

// ============ HELPER FUNCTIONS ============
export function getRaceById(id: string): Race | undefined {
  return RACES.find((r) => r.id === id)
}

export function getCourierById(id: string): Courier | undefined {
  return COURIERS.find((c) => c.id === id)
}

export function getFactionById(id: string): FactionData | undefined {
  return FACTIONS.find((f) => f.id === id)
}

export function getSkillByName(name: string): SkillDefinition | undefined {
  return SKILL_DEFINITIONS.find((s) => s.name === name)
}

export function calculateCombinedStats(race: Race, courier: Courier): BaseStats {
  return {
    hp: DEFAULT_BASE_STATS.hp + race.stats.hp + courier.stats.hp,
    atk: DEFAULT_BASE_STATS.atk + race.stats.atk + courier.stats.atk,
    def: DEFAULT_BASE_STATS.def + race.stats.def + courier.stats.def,
    focus: DEFAULT_BASE_STATS.focus + race.stats.focus + courier.stats.focus,
    luck: DEFAULT_BASE_STATS.luck + race.stats.luck + courier.stats.luck,
  }
}

export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(LEVEL_CURVE.baseXp * Math.pow(LEVEL_CURVE.multiplier, level - 2))
}
