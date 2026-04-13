Config = Config or {}

Config.Notifications = {
    rateLimits = {
        highWindowSeconds = 60,
        mediumWindowSeconds = 180,
        lowWindowSeconds = 600
    },
    types = {
        party_invite = {
            id = 'party_invite',
            priority = 'high',
            defaultTitle = 'Party invite',
            deeplink = { screen = 'terminal', channel = 'GAME' }
        },
        expedition_complete = {
            id = 'expedition_complete',
            priority = 'high',
            defaultTitle = 'Expedition complete',
            deeplink = { screen = 'ops', tab = 'results' }
        },
        rewards_ready = {
            id = 'rewards_ready',
            priority = 'high',
            defaultTitle = 'Rewards ready',
            deeplink = { screen = 'ops', tab = 'results' }
        },
        contract_update = {
            id = 'contract_update',
            priority = 'medium',
            defaultTitle = 'Contract updated',
            deeplink = { screen = 'contracts' }
        },
        faction_event_started = {
            id = 'faction_event_started',
            priority = 'high',
            defaultTitle = 'Faction event',
            deeplink = { screen = 'faction', tab = 'events' }
        },
        hub_project_needs_support = {
            id = 'hub_project_needs_support',
            priority = 'medium',
            defaultTitle = 'Hub needs support',
            deeplink = { screen = 'faction', tab = 'hub' }
        },
        crafting_complete = {
            id = 'crafting_complete',
            priority = 'medium',
            defaultTitle = 'Crafting complete',
            deeplink = { screen = 'ops', tab = 'crafting' }
        },
        rare_roll_result = {
            id = 'rare_roll_result',
            priority = 'high',
            defaultTitle = 'Rare pull',
            deeplink = { screen = 'ops', tab = 'rolling' }
        },
        daily_reset = {
            id = 'daily_reset',
            priority = 'low',
            defaultTitle = 'Daily reset',
            deeplink = { screen = 'terminal', channel = 'GAME' }
        }
    }
}