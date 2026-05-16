import type { Race, Courier, FactionData, OnboardingPanel, BaseStats } from "./types"

// ============ BASE STATS ============
export const DEFAULT_BASE_STATS: BaseStats = {
  hp: 10,
  atk: 1,
  def: 1,
  focus: 1,
  luck: 1,
}

// ============ RACES / FACTIONS ============
export const RACES: Race[] = [
  {
    id: "crownborn",
    name: "Crownborn",
    summary: "Poised and luminous, Crownborn carry high presence and a steadier hand for refined or arcane play.",
    affinity: "Best for composed pressure, ritual focus, and command presence.",
    role: "Luminous Houses",
    icon: "CRN",
    color: "#f1d38a",
    glow: "rgba(241, 211, 138, 0.30)",
    lore: "Crownborn lineages were raised around old courts and radiant halls where posture mattered as much as steel. They still move like every decision is being witnessed.",
    stats: { hp: 0, atk: 0, def: 1, focus: 2, luck: 1 },
  },
  {
    id: "hearthkin",
    name: "Hearthkin",
    summary: "Sturdy and reliable, Hearthkin are built to endure pressure and keep the rest of the line standing.",
    affinity: "Best for shielding allies, long marches, and defensive support.",
    role: "Hearth Wardens",
    icon: "HRT",
    color: "#ff9b6a",
    glow: "rgba(255, 155, 106, 0.28)",
    lore: "Hearthkin settlements survived by making every outpost feel like a defended home. Their operators learned to absorb hardship first so others could keep moving.",
    stats: { hp: 2, atk: 0, def: 2, focus: 0, luck: 0 },
  },
  {
    id: "gloamwhisper",
    name: "Gloamwhisper",
    summary: "Balanced and subtle, Gloamwhispers excel at adaptable play, quiet reads, and sharp turns in uncertain terrain.",
    affinity: "Best for shadowed routes, flexible skirmishing, and subtle reads.",
    role: "Veil Circles",
    icon: "GLM",
    color: "#8cb2ff",
    glow: "rgba(140, 178, 255, 0.30)",
    lore: "Gloamwhisper circles train by listening before acting. Their operators read tension in the dark, then shift shape around whatever the frontier tries next.",
    stats: { hp: 0, atk: 1, def: 1, focus: 1, luck: 1 },
  },
  {
    id: "roadsinger",
    name: "Roadsinger",
    summary: "Mobile and fortunate, Roadsingers thrive on discovery, motion, and sudden opportunity.",
    affinity: "Best for scouting, route discovery, and opportunistic momentum.",
    role: "Wayfinding Choirs",
    icon: "RDS",
    color: "#68d9c0",
    glow: "rgba(104, 217, 192, 0.28)",
    lore: "Roadsingers cross borders like they were written into the path itself. Their lineages trust chance, motion, and the promise that every road still has one more door to open.",
    stats: { hp: 0, atk: 1, def: 0, focus: 1, luck: 2 },
  },
]

// ============ COURIERS ============
export const COURIERS: Courier[] = [
  {
    id: "gallant",
    name: "Gallant",
    summary: "Frontliner courier built for bold entry and straightforward pressure.",
    theme: "Frontliner, bold, straightforward pressure.",
    icon: "GAL",
    color: "#ff8e78",
    glow: "rgba(255, 142, 120, 0.28)",
    stats: { hp: 2, atk: 2, def: 1, focus: 0, luck: 0 },
  },
  {
    id: "trickster",
    name: "Trickster",
    summary: "Clever courier built around luck, disruption, and improvisation.",
    theme: "Clever, slippery, luck-driven, disruption and improvisation.",
    icon: "TRK",
    color: "#9e8bff",
    glow: "rgba(158, 139, 255, 0.30)",
    stats: { hp: 0, atk: 1, def: 0, focus: 1, luck: 2 },
  },
  {
    id: "caregiver",
    name: "Caregiver",
    summary: "Support courier focused on sustain, protection, and utility.",
    theme: "Sustain, protection, utility, strong support identity.",
    icon: "CAR",
    color: "#7ed4a5",
    glow: "rgba(126, 212, 165, 0.28)",
    stats: { hp: 2, atk: 0, def: 2, focus: 2, luck: 0 },
  },
  {
    id: "visionary",
    name: "Visionary",
    summary: "High-focus courier specialized in insight, arcane strength, and analysis.",
    theme: "Insight, arcane strength, analysis, high-focus specialist.",
    icon: "VIS",
    color: "#e6b7ff",
    glow: "rgba(230, 183, 255, 0.30)",
    stats: { hp: 0, atk: 0, def: 0, focus: 3, luck: 1 },
  },
]

// ============ FACTION DATA (for faction selection screen) ============
export const FACTIONS: FactionData[] = [
  {
    id: "crownborn",
    name: "Crown Courts",
    emblem: "◇",
    color: "#f1d38a",
    glow: "rgba(241, 211, 138, 0.35)",
    colorVars: {
      primary: "#f1d38a",
      secondary: "#c9a84d",
      accent: "#ffe4a8",
      bg: "rgba(241, 211, 138, 0.08)",
    },
    lore: "Crownborn courts believe bearing matters. Their towers preserve luminous rites, audience laws, and the controlled projection of force that keeps lesser halls from fracturing.",
    motto: "Light reveals. Order endures.",
    unlockLevel: 5,
  },
  {
    id: "hearthkin",
    name: "Hearth Wardens",
    emblem: "◈",
    color: "#ff9b6a",
    glow: "rgba(255, 155, 106, 0.35)",
    colorVars: {
      primary: "#ff9b6a",
      secondary: "#c76a3d",
      accent: "#ffc299",
      bg: "rgba(255, 155, 106, 0.08)",
    },
    lore: "Hearthkin rings build for tomorrow first. Their wardens keep roads lit, train escorts, and hold refuge lines wherever the frontier tries to starve a settlement out.",
    motto: "Hold the line. Shelter the road.",
    unlockLevel: 5,
  },
  {
    id: "gloamwhisper",
    name: "Veil Circles",
    emblem: "◎",
    color: "#8cb2ff",
    glow: "rgba(140, 178, 255, 0.35)",
    colorVars: {
      primary: "#8cb2ff",
      secondary: "#5a82d4",
      accent: "#b8d4ff",
      bg: "rgba(140, 178, 255, 0.08)",
    },
    lore: "The Veil Circles prefer half-light and layered plans. Their networks share route whispers, hidden caches, and methods for surviving when a direct answer would get everyone noticed.",
    motto: "See without being seen.",
    unlockLevel: 5,
  },
  {
    id: "roadsinger",
    name: "Open Roads Chorus",
    emblem: "⬡",
    color: "#68d9c0",
    glow: "rgba(104, 217, 192, 0.35)",
    colorVars: {
      primary: "#68d9c0",
      secondary: "#3da88f",
      accent: "#9aebd7",
      bg: "rgba(104, 217, 192, 0.08)",
    },
    lore: "Roadsingers map by feel as much as by ink. Their choirs keep route songs, hazard memory, and the uncanny instinct that sends them down the one path everyone else overlooked.",
    motto: "Every road opens another door.",
    unlockLevel: 5,
  },
]

// ============ ONBOARDING / BOOT ============
export const BOOT_HEADER = "ESRO TERMINAL"
export const BOOT_BODY = `Linking relay...

Establishing packet route...

Preparing handset shell.`

export const ONBOARDING_PANELS: OnboardingPanel[] = [
  {
    title: "Relay Briefing",
    body: "ESRO is the shard relay every field runner carries after induction. It keeps your relay handle, route traffic, pack state, skill shell, and party links synchronized across the frontier.",
  },
  {
    title: "Frontier Conditions",
    body: "Beyond the settled gates, routes fracture, fauna mutates, and signal drift pulls squads apart. Use GAME for live expedition telemetry, PARTY to keep a linked roster, and PACK to review whatever you drag back through the relay.",
  },
  {
    title: "Operator Primer",
    body: "Your induction binds two traits to this character: RACE, which marks lineage and natural affinity, and COURIER, which defines field role and stat spread. Together they shape how ESRO reads your presence once the handle goes live.",
  },
]

// ============ SKILLS ============
export interface SkillDefinition {
  name: string
  linkedStat: keyof BaseStats
  summary: string
  stats: { id: string; name: string }[]
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    name: "Conditioning",
    linkedStat: "hp",
    summary: "Long-haul stamina, recovery discipline, and carrying strength under pressure.",
    stats: [
      { id: "marching", name: "Marching" },
      { id: "recovery", name: "Recovery" },
      { id: "loadbearing", name: "Loadbearing" },
    ],
  },
  {
    name: "Field Medicine",
    linkedStat: "hp",
    summary: "Keeping bodies standing with triage, stabilization, and practical frontier care.",
    stats: [
      { id: "triage", name: "Triage" },
      { id: "stabilization", name: "Stabilization" },
      { id: "remedies", name: "Remedies" },
    ],
  },
  {
    name: "Beast Tending",
    linkedStat: "hp",
    summary: "Managing mounts, pack beasts, and living cargo through stress and fatigue.",
    stats: [
      { id: "handling", name: "Handling" },
      { id: "soothing", name: "Soothing" },
      { id: "harnessing", name: "Harnessing" },
    ],
  },
  {
    name: "Bladecraft",
    linkedStat: "atk",
    summary: "Close-range offense built on edge control, tempo, and committed finishing blows.",
    stats: [
      { id: "edgework", name: "Edgework" },
      { id: "riposte", name: "Riposte" },
      { id: "finishing", name: "Finishing" },
    ],
  },
  {
    name: "Marksmanship",
    linkedStat: "atk",
    summary: "Ranged pressure through sight discipline, shot preparation, and precision release.",
    stats: [
      { id: "sighting", name: "Sighting" },
      { id: "draw", name: "Draw" },
      { id: "precision", name: "Precision" },
    ],
  },
  {
    name: "Brawling",
    linkedStat: "atk",
    summary: "Raw physical offense built on leverage, breaks, and punishing impact.",
    stats: [
      { id: "clinch", name: "Clinch" },
      { id: "breaks", name: "Breaks" },
      { id: "impact", name: "Impact" },
    ],
  },
  {
    name: "Bulwark",
    linkedStat: "def",
    summary: "Direct protection through bracing, shield discipline, and body-line interception.",
    stats: [
      { id: "shielding", name: "Shielding" },
      { id: "bracing", name: "Bracing" },
      { id: "interception", name: "Interception" },
    ],
  },
  {
    name: "Guardwork",
    linkedStat: "def",
    summary: "Defensive positioning, watch discipline, and safe escort through hostile ground.",
    stats: [
      { id: "formation", name: "Formation" },
      { id: "watchkeeping", name: "Watchkeeping" },
      { id: "escorting", name: "Escorting" },
    ],
  },
  {
    name: "Warding",
    linkedStat: "def",
    summary: "Arcane or technical protection through barriers, anchors, and disruption control.",
    stats: [
      { id: "barriers", name: "Barriers" },
      { id: "anchors", name: "Anchors" },
      { id: "resistance", name: "Resistance" },
    ],
  },
  {
    name: "Gathering",
    linkedStat: "luck",
    summary: "Field retrieval, harvest timing, and salvage appraisal.",
    stats: [
      { id: "foraging", name: "Foraging" },
      { id: "harvesting", name: "Harvesting" },
      { id: "appraisal", name: "Appraisal" },
    ],
  },
  {
    name: "Fishing",
    linkedStat: "luck",
    summary: "Line placement, tension control, and wreck salvage handling.",
    stats: [
      { id: "casting", name: "Casting" },
      { id: "tension", name: "Tension" },
      { id: "salvage", name: "Salvage" },
    ],
  },
  {
    name: "Scavenging",
    linkedStat: "luck",
    summary: "Finding overlooked value through spotting, extraction, and deal-making instinct.",
    stats: [
      { id: "spotting", name: "Spotting" },
      { id: "extraction", name: "Extraction" },
      { id: "haggling", name: "Haggling" },
    ],
  },
  {
    name: "Pathfinding",
    linkedStat: "focus",
    summary: "Route surveying, traversal planning, and survival reads.",
    stats: [
      { id: "surveying", name: "Surveying" },
      { id: "routing", name: "Routing" },
      { id: "survival", name: "Survival" },
    ],
  },
  {
    name: "Ritualism",
    linkedStat: "focus",
    summary: "Measured spellwork and ceremonial execution through channels, sigils, and invocations.",
    stats: [
      { id: "channeling", name: "Channeling" },
      { id: "sigils", name: "Sigils" },
      { id: "invocation", name: "Invocation" },
    ],
  },
  {
    name: "Lorekeeping",
    linkedStat: "focus",
    summary: "Focused knowledge work through recall, translation, and sharp analysis.",
    stats: [
      { id: "recall", name: "Recall" },
      { id: "translation", name: "Translation" },
      { id: "analysis", name: "Analysis" },
    ],
  },
]

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

export function calculateCombinedStats(race: Race, courier: Courier): BaseStats {
  return {
    hp: DEFAULT_BASE_STATS.hp + race.stats.hp + courier.stats.hp,
    atk: DEFAULT_BASE_STATS.atk + race.stats.atk + courier.stats.atk,
    def: DEFAULT_BASE_STATS.def + race.stats.def + courier.stats.def,
    focus: DEFAULT_BASE_STATS.focus + race.stats.focus + courier.stats.focus,
    luck: DEFAULT_BASE_STATS.luck + race.stats.luck + courier.stats.luck,
  }
}

export const STARTER_SKILL_COUNT = 3
export const FACTION_UNLOCK_LEVEL = 5
