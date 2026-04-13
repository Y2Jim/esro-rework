Config = Config or {}

Config.Titles = {
    defaultId = 'relay_initiate',
    definitions = {
        relay_initiate = { id = 'relay_initiate', label = 'Relay Initiate', rarity = 'common' },
        route_tender = { id = 'route_tender', label = 'Route Tender', rarity = 'common' },
        signal_keeper = { id = 'signal_keeper', label = 'Signal Keeper', rarity = 'uncommon' },
        archive_listener = { id = 'archive_listener', label = 'Archive Listener', rarity = 'rare' },
        relay_warden = { id = 'relay_warden', label = 'Relay Warden', rarity = 'epic' },
        deep_pull_regent = { id = 'deep_pull_regent', label = 'Deep Pull Regent', rarity = 'legendary' }
    }
}

Config.Badges = {
    definitions = {
        first_pull = {
            id = 'first_pull',
            label = 'First Pull',
            summary = 'Completed a first Signal Pull.'
        },
        first_claim = {
            id = 'first_claim',
            label = 'First Claim',
            summary = 'Claimed expedition results.'
        },
        faction_hand = {
            id = 'faction_hand',
            label = 'Faction Hand',
            summary = 'Contributed to a hub project.'
        }
    }
}