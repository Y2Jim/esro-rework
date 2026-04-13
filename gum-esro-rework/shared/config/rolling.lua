Config = Config or {}

Config.Rolling = {
    standardPool = {
        id = 'signal_pull_standard',
        label = 'Signal Pull',
        currency = 'relay_tokens',
        cost = 1,
        pityThreshold = 20,
        duplicateCurrency = 'signal_salvage',
        rewards = {
            common = {
                { id = 'chat_flair_relay', type = 'chat_flair', label = 'Relay Flair', weight = 30 },
                { id = 'schematic_field_kit', type = 'schematic', label = 'Field Kit Schematic', weight = 28 },
                { id = 'modifier_calm_route', type = 'modifier', label = 'Calm Route', weight = 22 }
            },
            uncommon = {
                { id = 'badge_signal_keeper', type = 'badge', label = 'Signal Keeper', weight = 18 },
                { id = 'schematic_signal_beacon', type = 'schematic', label = 'Signal Beacon Schematic', weight = 15 },
                { id = 'modifier_clean_entry', type = 'modifier', label = 'Clean Entry', weight = 13 }
            },
            rare = {
                { id = 'title_archive_listener', type = 'title', label = 'Archive Listener', weight = 9 },
                { id = 'blueprint_support_crate', type = 'blueprint', label = 'Support Crate Blueprint', weight = 8 }
            },
            epic = {
                { id = 'title_relay_warden', type = 'title', label = 'Relay Warden', weight = 4 },
                { id = 'cosmetic_glass_signal', type = 'cosmetic', label = 'Glass Signal', weight = 3 }
            },
            legendary = {
                { id = 'title_deep_pull_regent', type = 'title', label = 'Deep Pull Regent', weight = 1 }
            }
        }
    },
    rarityOrder = { 'common', 'uncommon', 'rare', 'epic', 'legendary' },
    duplicateSalvage = {
        common = 1,
        uncommon = 2,
        rare = 4,
        epic = 8,
        legendary = 15
    },
    exchangeShop = {
        { id = 'exchange_field_kit', cost = 4, rewardId = 'schematic_field_kit', label = 'Field Kit Schematic' },
        { id = 'exchange_signal_beacon', cost = 6, rewardId = 'schematic_signal_beacon', label = 'Signal Beacon Schematic' },
        { id = 'exchange_relay_flair', cost = 3, rewardId = 'chat_flair_relay', label = 'Relay Flair' }
    }
}