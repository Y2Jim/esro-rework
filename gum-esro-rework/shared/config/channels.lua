Config = Config or {}

Config.Channels = {
    order = { 'PUBLIC', 'TRADE', 'HELP', 'LORE', 'UNDERCHAT', 'GAME' },
    definitions = {
        PUBLIC = {
            id = 'PUBLIC',
            label = 'Public',
            description = 'General relay traffic.',
            readOnly = false,
            restricted = false,
            showUnread = true
        },
        TRADE = {
            id = 'TRADE',
            label = 'Trade',
            description = 'Item exchange, requests, and social commerce.',
            readOnly = false,
            restricted = false,
            showUnread = true
        },
        HELP = {
            id = 'HELP',
            label = 'Help',
            description = 'Questions, onboarding, and support.',
            readOnly = false,
            restricted = false,
            showUnread = true
        },
        LORE = {
            id = 'LORE',
            label = 'Lore',
            description = 'Rumors, fragments, and discoveries.',
            readOnly = false,
            restricted = false,
            showUnread = true
        },
        UNDERCHAT = {
            id = 'UNDERCHAT',
            label = 'Underchat',
            description = 'Hidden relay traffic for special states.',
            readOnly = false,
            restricted = true,
            showUnread = true
        },
        GAME = {
            id = 'GAME',
            label = 'Game',
            description = 'System summaries, expedition notices, and alerts.',
            readOnly = true,
            restricted = false,
            showUnread = true
        }
    }
}