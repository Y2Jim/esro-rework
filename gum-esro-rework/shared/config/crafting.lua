Config = Config or {}

Config.Crafting = {
    recipes = {
        field_kit = {
            id = 'field_kit',
            label = 'Field Kit',
            category = 'support_utilities',
            durationSeconds = 90,
            cost = {
                relay_scrap = 2,
                packed_rations = 1
            },
            output = {
                itemId = 'field_kit',
                amount = 1,
                itemType = 'utility'
            }
        },
        signal_beacon = {
            id = 'signal_beacon',
            label = 'Signal Beacon',
            category = 'expedition_tools',
            durationSeconds = 120,
            cost = {
                relay_glass = 1,
                scrap_wire = 2
            },
            output = {
                itemId = 'signal_beacon',
                amount = 1,
                itemType = 'utility'
            }
        },
        support_crate = {
            id = 'support_crate',
            label = 'Support Crate',
            category = 'faction_supplies',
            durationSeconds = 150,
            cost = {
                salvage_plate = 2,
                packed_rations = 2
            },
            output = {
                itemId = 'support_crate',
                amount = 1,
                itemType = 'faction_supply'
            }
        },
        relay_stabilizer = {
            id = 'relay_stabilizer',
            label = 'Relay Stabilizer',
            category = 'raid_preparation',
            durationSeconds = 180,
            cost = {
                archive_fragments = 1,
                relay_glass = 2
            },
            output = {
                itemId = 'relay_stabilizer',
                amount = 1,
                itemType = 'support_item'
            }
        }
    }
}