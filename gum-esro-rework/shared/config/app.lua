Config = Config or {}

Config.ResourceName = 'gum-esro-rework'
Config.App = {
    identifier = 'esro-rework',
    name = 'ESRO',
    description = 'Hidden relay chat, field ops, and faction logistics.',
    defaultRoute = 'terminal',
    maxMessageLength = 220,
    pageSize = 30,
    maxQuickActions = 5
}

Config.Progression = {
    levelCap = 30,
    baseLevelXp = 100,
    xpGrowth = 25
}

Config.Currencies = {
    commonRoll = 'relay_tokens',
    rareRoll = 'deep_signals',
    salvage = 'signal_salvage'
}

Config.NotificationPriorities = {
    high = 'high',
    medium = 'medium',
    low = 'low'
}

Config.DefaultSettings = {
    notifications = {
        expeditionComplete = true,
        rewardsReady = true,
        partyInvite = true,
        contractUpdate = true,
        factionAlert = true,
        rareRoll = true,
        dailyReset = false
    }
}