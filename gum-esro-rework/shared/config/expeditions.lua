Config = Config or {}

Config.Expeditions = {
    definitions = {
        signal_trace = {
            id = 'signal_trace',
            label = 'Signal Trace',
            durationSeconds = 900,
            risk = 'Low',
            tags = { 'recon', 'relay' },
            requiredSkill = 'surveying',
            rewards = {
                xp = 35,
                materials = { scrap_wire = 3, relay_glass = 1 },
                currencies = { relay_tokens = 1 },
                contribution = 4
            },
            logPool = {
                'signal recovered',
                'relay path mapped',
                'anomaly avoided',
                'route marked for reuse'
            }
        },
        archive_dive = {
            id = 'archive_dive',
            label = 'Archive Dive',
            durationSeconds = 1200,
            risk = 'Medium',
            tags = { 'archive', 'analysis' },
            requiredSkill = 'analysis',
            rewards = {
                xp = 45,
                materials = { archive_fragments = 2, dusted_filament = 2 },
                currencies = { relay_tokens = 2 },
                contribution = 5
            },
            logPool = {
                'archive fragment found',
                'pattern stabilized',
                'signal noise cleared',
                'index packet recovered'
            }
        },
        courier_run = {
            id = 'courier_run',
            label = 'Courier Run',
            durationSeconds = 780,
            risk = 'Low',
            tags = { 'supply', 'logistics' },
            requiredSkill = 'logistics',
            rewards = {
                xp = 30,
                materials = { packed_rations = 2, route_stamps = 2 },
                currencies = { relay_tokens = 1 },
                contribution = 6
            },
            logPool = {
                'cache delivered',
                'route held steady',
                'handoff confirmed',
                'supply line stabilized'
            }
        },
        scavenger_sweep = {
            id = 'scavenger_sweep',
            label = 'Scavenger Sweep',
            durationSeconds = 1020,
            risk = 'Medium',
            tags = { 'salvage', 'materials' },
            requiredSkill = 'scavenging',
            rewards = {
                xp = 40,
                materials = { relay_scrap = 4, salvage_plate = 2 },
                currencies = { relay_tokens = 1 },
                contribution = 4
            },
            logPool = {
                'salvage pocket found',
                'broken cache stripped',
                'rare material recovered',
                'route compromised then cleared'
            }
        },
        faction_relay = {
            id = 'faction_relay',
            label = 'Faction Relay',
            durationSeconds = 1500,
            risk = 'Medium',
            tags = { 'faction', 'support' },
            requiredSkill = 'networking',
            rewards = {
                xp = 55,
                materials = { faction_seal = 1, route_stamps = 3 },
                currencies = { relay_tokens = 2, deep_signals = 1 },
                contribution = 10
            },
            logPool = {
                'faction cache delivered',
                'relay synchronized',
                'pressure report forwarded',
                'channel integrity preserved'
            }
        }
    },
    quickActionLimit = 3,
    maxClaimLines = 4
}