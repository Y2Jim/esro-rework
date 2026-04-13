Config = Config or {}

Config.Factions = {
    order = { 'crownborn', 'hearthkin', 'gloamwhisper', 'roadsinger' },
    definitions = {
        crownborn = {
            id = 'crownborn',
            label = 'Crownborn',
            summary = 'Archive authority, ceremony, and signal discipline.',
            starterBonus = { analysis = 1 },
            hubProjects = { 'communications_array', 'archive_vault', 'command_desk' }
        },
        hearthkin = {
            id = 'hearthkin',
            label = 'Hearthkin',
            summary = 'Supply resilience, shelter work, and defensive upkeep.',
            starterBonus = { recovery = 1 },
            hubProjects = { 'logistics_ring', 'workshop_bay', 'defense_grid' }
        },
        gloamwhisper = {
            id = 'gloamwhisper',
            label = 'Gloamwhisper',
            summary = 'Hidden traffic, veiled routes, and quiet recoveries.',
            starterBonus = { networking = 1 },
            hubProjects = { 'anomaly_lab', 'shadow_relay', 'recovery_bay' }
        },
        roadsinger = {
            id = 'roadsinger',
            label = 'Roadsinger',
            summary = 'Open routes, moving supplies, and field coordination.',
            starterBonus = { logistics = 1 },
            hubProjects = { 'trade_relay', 'scouting_net', 'communications_array' }
        }
    },
    defaultObjective = {
        label = 'Stabilize relay throughput',
        target = 100,
        type = 'material_delivery'
    },
    hubProjects = {
        communications_array = {
            id = 'communications_array',
            label = 'Communications Array',
            category = 'communications',
            skill = 'networking',
            materialCosts = { scrap_wire = 10, relay_glass = 6 },
            unlock = 'Improves contract visibility and relay alerts.'
        },
        archive_vault = {
            id = 'archive_vault',
            label = 'Archive Vault',
            category = 'archives',
            skill = 'analysis',
            materialCosts = { archive_fragments = 8, relay_glass = 4 },
            unlock = 'Improves discovery quality on archive routes.'
        },
        command_desk = {
            id = 'command_desk',
            label = 'Command Desk',
            category = 'command_center',
            skill = 'surveying',
            materialCosts = { route_stamps = 8, relay_scrap = 6 },
            unlock = 'Improves faction relay coordination.'
        },
        logistics_ring = {
            id = 'logistics_ring',
            label = 'Logistics Ring',
            category = 'logistics',
            skill = 'logistics',
            materialCosts = { packed_rations = 8, salvage_plate = 6 },
            unlock = 'Reduces expedition prep waste.'
        },
        workshop_bay = {
            id = 'workshop_bay',
            label = 'Workshop Bay',
            category = 'workshop',
            skill = 'fabrication',
            materialCosts = { salvage_plate = 8, relay_scrap = 8 },
            unlock = 'Improves faction crafting throughput.'
        },
        defense_grid = {
            id = 'defense_grid',
            label = 'Defense Grid',
            category = 'defenses',
            skill = 'security',
            materialCosts = { salvage_plate = 8, scrap_wire = 8 },
            unlock = 'Mitigates hostile faction event pressure.'
        },
        anomaly_lab = {
            id = 'anomaly_lab',
            label = 'Anomaly Lab',
            category = 'anomaly_lab',
            skill = 'analysis',
            materialCosts = { archive_fragments = 8, dusted_filament = 5 },
            unlock = 'Unlocks better anomaly readings.'
        },
        shadow_relay = {
            id = 'shadow_relay',
            label = 'Shadow Relay',
            category = 'communications',
            skill = 'networking',
            materialCosts = { scrap_wire = 8, faction_seal = 3 },
            unlock = 'Supports hidden relay traffic and covert notices.'
        },
        recovery_bay = {
            id = 'recovery_bay',
            label = 'Recovery Bay',
            category = 'recovery_bay',
            skill = 'recovery',
            materialCosts = { packed_rations = 6, relay_scrap = 6 },
            unlock = 'Improves recovery and failed-route mitigation.'
        },
        trade_relay = {
            id = 'trade_relay',
            label = 'Trade Relay',
            category = 'trade_relay',
            skill = 'networking',
            materialCosts = { route_stamps = 8, faction_seal = 2 },
            unlock = 'Improves trade and request contract visibility.'
        },
        scouting_net = {
            id = 'scouting_net',
            label = 'Scouting Net',
            category = 'scouting_network',
            skill = 'surveying',
            materialCosts = { route_stamps = 10, relay_glass = 4 },
            unlock = 'Improves recon route outcomes.'
        }
    },
    events = {
        relay_disruption = {
            id = 'relay_disruption',
            label = 'Relay Disruption',
            summary = 'Signal noise is cutting through local routes.',
            favoredSkill = 'security',
            rewardPreview = {
                xp = 18,
                contribution = 12
            }
        },
        archive_breach = {
            id = 'archive_breach',
            label = 'Archive Breach',
            summary = 'Fragments are escaping containment.',
            favoredSkill = 'analysis',
            rewardPreview = {
                xp = 24,
                contribution = 8
            }
        },
        supply_shortage = {
            id = 'supply_shortage',
            label = 'Supply Shortage',
            summary = 'Faction stores need immediate support.',
            favoredSkill = 'logistics',
            rewardPreview = {
                xp = 16,
                contribution = 14
            }
        }
    }
}