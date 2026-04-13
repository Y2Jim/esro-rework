ESRO = ESRO or {}

local function buildSkillSnapshot(profile)
    local byId = {}

    for _, row in ipairs(profile.skills or {}) do
        byId[row.skill_id] = {
            id = row.skill_id,
            level = tonumber(row.level or 1) or 1,
            xp = tonumber(row.xp or 0) or 0
        }
    end

    local ordered = {}
    for _, skillId in ipairs(Config.SkillOrder or {}) do
        local definition = Config.Skills[skillId]
        local row = byId[skillId] or { id = skillId, level = 1, xp = 0 }

        ordered[#ordered + 1] = {
            id = skillId,
            label = definition and definition.label or skillId,
            summary = definition and definition.summary or '',
            level = row.level,
            xp = row.xp
        }
    end

    return ordered
end

local function buildInventorySnapshot(profile)
    local items = {}

    for _, row in ipairs(profile.inventory or {}) do
        items[#items + 1] = {
            id = row.item_id,
            amount = tonumber(row.amount or 0) or 0,
            type = row.item_type,
            meta = ESRO.DB.decodeJson(row.item_meta_json, {})
        }
    end

    return items
end

local function buildOwnedTitleSnapshot(profile)
    local titles = {}

    for _, titleId in ipairs(ESRO.GetOwnedTitles(profile)) do
        local definition = Config.Titles.definitions[titleId]
        if definition then
            titles[#titles + 1] = definition
        end
    end

    return titles
end

local function buildFallbackProfile(src)
    local fallbackFactionId = (Config.Factions and Config.Factions.order and Config.Factions.order[1]) or 'crownborn'
    local fallbackTitleId = (Config.Titles and Config.Titles.defaultId) or 'relay_initiate'

    return {
        identifier = ('bootstrap-fallback:%s'):format(tostring(src or 'unknown')),
        handle = 'Relay Pending',
        displayName = 'Relay Pending',
        titleId = fallbackTitleId,
        factionId = fallbackFactionId,
        raceId = 'unknown',
        level = 1,
        xp = 0,
        badges = {},
        settings = ESRO.Shared.Clone(Config.DefaultSettings or {}),
        skills = {},
        rollState = {
            commonCurrency = 0,
            rareCurrency = 0,
            standardPity = 0,
            salvage = 0,
            history = {}
        },
        inventory = {}
    }
end

local function logBootstrapIssue(sectionName, errorText)
    print(('[gum-esro-rework] bootstrap %s failed: %s'):format(sectionName, tostring(errorText)))
end

local function safeBuild(sectionName, fallback, builder, ...)
    local ok, result = pcall(builder, ...)
    if not ok then
        logBootstrapIssue(sectionName, result)
        return fallback
    end

    if result == nil then
        return fallback
    end

    return result
end

function ESRO.BuildBootstrapSnapshot(src)
    local profileOk, profileOrError, errorText = pcall(ESRO.GetOrCreateProfile, src)
    local profile = profileOk and profileOrError or nil

    if not profileOk then
        logBootstrapIssue('profile', profileOrError)
        profile = buildFallbackProfile(src)
    elseif not profile then
        logBootstrapIssue('profile', errorText or 'profile unavailable')
        profile = buildFallbackProfile(src)
    end

    local faction = Config.Factions.definitions[profile.factionId] or {
        id = profile.factionId,
        label = profile.factionId or 'Unknown',
        summary = ''
    }
    local title = Config.Titles.definitions[profile.titleId] or Config.Titles.definitions[Config.Titles.defaultId] or {
        id = Config.Titles.defaultId,
        label = 'Relay Initiate',
        rarity = 'common'
    }

    local terminal = safeBuild('terminal', {
        pinned = {},
        messages = {},
        unread = {}
    }, ESRO.BuildTerminalSnapshot, profile)
    local expeditionState = safeBuild('expeditions', {
        definitions = {},
        active = {},
        results = {}
    }, ESRO.BuildExpeditionSnapshot, profile, src)
    local contractsState = safeBuild('contracts', {
        entries = {},
        filters = {}
    }, ESRO.BuildContractsSnapshot, profile)
    local factionState = safeBuild('faction', {
        definition = faction,
        objective = Config.Factions.defaultObjective,
        event = {},
        influence = 0,
        materials = {},
        projects = {}
    }, ESRO.BuildFactionSnapshot, profile, src)
    local notificationState = safeBuild('notifications', {
        unread = 0,
        items = {}
    }, ESRO.BuildNotificationSnapshot, profile)
    local skills = safeBuild('skills', {}, buildSkillSnapshot, profile)
    local inventory = safeBuild('inventory', {}, buildInventorySnapshot, profile)
    local ownedTitles = safeBuild('titles', {}, buildOwnedTitleSnapshot, profile)
    local quickActions = {}

    if #(expeditionState.active or {}) > 0 then
        quickActions[#quickActions + 1] = {
            type = 'active_expedition',
            label = expeditionState.active[1].label,
            deeplink = { screen = 'ops', tab = 'expeditions' }
        }
    end

    if #(expeditionState.results or {}) > 0 then
        quickActions[#quickActions + 1] = {
            type = 'claimable_rewards',
            label = ('%s claimable'):format(#expeditionState.results),
            deeplink = { screen = 'ops', tab = 'results' }
        }
    end

    if (profile.rollState and (profile.rollState.commonCurrency or 0) > 0) then
        quickActions[#quickActions + 1] = {
            type = 'available_rolls',
            label = ('%s relay tokens ready'):format(profile.rollState.commonCurrency),
            deeplink = { screen = 'ops', tab = 'rolling' }
        }
    end

    if (notificationState.unread or 0) > 0 then
        quickActions[#quickActions + 1] = {
            type = 'notifications',
            label = ('%s unread notices'):format(notificationState.unread),
            deeplink = { screen = 'profile', tab = 'notifications' }
        }
    end

    return {
        app = {
            identifier = Config.App.identifier,
            defaultRoute = Config.App.defaultRoute
        },
        profile = {
            identifier = profile.identifier,
            handle = profile.handle,
            displayName = profile.displayName,
            title = title,
            faction = faction,
            raceId = profile.raceId,
            level = profile.level,
            xp = profile.xp,
            badges = profile.badges,
            settings = profile.settings,
            ownedTitles = ownedTitles
        },
        channels = Config.Channels.order,
        channelDefinitions = Config.Channels.definitions,
        quickActions = quickActions,
        unread = terminal.unread,
        terminal = terminal,
        ops = {
            skills = skills,
            inventory = inventory,
            expeditions = expeditionState,
            crafting = {
                recipes = Config.Crafting.recipes,
                recent = {}
            },
            rolling = {
                pool = Config.Rolling.standardPool,
                state = profile.rollState,
                exchangeShop = Config.Rolling.exchangeShop
            }
        },
        contracts = contractsState,
        faction = factionState,
        notifications = notificationState
    }
end