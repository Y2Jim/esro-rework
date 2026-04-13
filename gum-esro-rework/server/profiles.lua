ESRO = ESRO or {}
ESRO.Runtime = ESRO.Runtime or {}
ESRO.Runtime.profiles = ESRO.Runtime.profiles or {}

local function getPrimaryIdentifier(src)
    local identifiers = GetPlayerIdentifiers(src)

    for _, identifier in ipairs(identifiers) do
        if identifier:find('license:', 1, true) == 1 then
            return identifier
        end
    end

    return identifiers[1]
end

local function buildDefaultHandle(identifier)
    local suffix = tostring(identifier or 'relay'):gsub('[^%w]', '')
    suffix = suffix:sub(math.max(#suffix - 5, 1))
    return ('Relay%s'):format(suffix)
end

local function buildDefaultSkills()
    local seeded = {}

    for _, skillId in ipairs(Config.SkillOrder or {}) do
        seeded[#seeded + 1] = {
            identifier = false,
            skillId = skillId,
            level = 1,
            xp = 0
        }
    end

    return seeded
end

local function seedProfile(identifier)
    local factionId = Config.Factions.order[1]
    local handle = buildDefaultHandle(identifier)

    ESRO.DB.Execute([[ 
        INSERT IGNORE INTO esro_profiles (
            identifier,
            handle,
            display_name,
            title_id,
            faction_id,
            race_id,
            level,
            xp,
            badge_json,
            settings_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        identifier,
        handle,
        handle,
        Config.Titles.defaultId,
        factionId,
        'unknown',
        1,
        0,
        ESRO.DB.encodeJson({}),
        ESRO.DB.encodeJson(Config.DefaultSettings)
    })

    for _, skill in ipairs(buildDefaultSkills()) do
        ESRO.DB.Execute([[ 
            INSERT IGNORE INTO esro_profile_skills (identifier, skill_id, level, xp)
            VALUES (?, ?, ?, ?)
        ]], {
            identifier,
            skill.skillId,
            skill.level,
            skill.xp
        })
    end

    ESRO.DB.Execute([[ 
        INSERT IGNORE INTO esro_profile_roll_state (
            identifier,
            common_currency,
            rare_currency,
            standard_pity,
            salvage,
            history_json
        ) VALUES (?, ?, ?, ?, ?, ?)
    ]], {
        identifier,
        0,
        0,
        0,
        0,
        ESRO.DB.encodeJson({})
    })

    return handle
end

local function fetchProfileRow(identifier)
    return ESRO.DB.FetchOne('SELECT * FROM esro_profiles WHERE identifier = ? LIMIT 1', { identifier })
end

local function fetchSkillRows(identifier)
    return ESRO.DB.FetchAll('SELECT skill_id, level, xp FROM esro_profile_skills WHERE identifier = ?', { identifier })
end

local function fetchRollRow(identifier)
    return ESRO.DB.FetchOne('SELECT * FROM esro_profile_roll_state WHERE identifier = ? LIMIT 1', { identifier })
end

local function fetchInventoryRows(identifier)
    return ESRO.DB.FetchAll('SELECT item_id, amount, item_type, item_meta_json FROM esro_profile_inventory WHERE identifier = ?', { identifier })
end

local function saveBadges(identifier, badges)
    ESRO.DB.Execute('UPDATE esro_profiles SET badge_json = ? WHERE identifier = ?', {
        ESRO.DB.encodeJson(badges),
        identifier
    })
end

function ESRO.GetProfileIdentifier(src)
    return getPrimaryIdentifier(src)
end

function ESRO.GetOrCreateProfile(src)
    local identifier = getPrimaryIdentifier(src)
    if not identifier then
        return nil, 'missing identifier'
    end

    local profile = fetchProfileRow(identifier)
    if not profile then
        seedProfile(identifier)
        profile = fetchProfileRow(identifier)
    end

    if not profile then
        return nil, 'failed to load profile'
    end

    local skills = fetchSkillRows(identifier)
    local rollState = fetchRollRow(identifier)
    local inventory = fetchInventoryRows(identifier)

    local hydrated = {
        identifier = identifier,
        handle = profile.handle,
        displayName = profile.display_name,
        titleId = profile.title_id,
        factionId = profile.faction_id,
        raceId = profile.race_id,
        level = profile.level,
        xp = profile.xp,
        badges = ESRO.DB.decodeJson(profile.badge_json, {}),
        settings = ESRO.DB.decodeJson(profile.settings_json, ESRO.Shared.Clone(Config.DefaultSettings)),
        skills = skills,
        rollState = {
            commonCurrency = rollState and rollState.common_currency or 0,
            rareCurrency = rollState and rollState.rare_currency or 0,
            standardPity = rollState and rollState.standard_pity or 0,
            salvage = rollState and rollState.salvage or 0,
            history = ESRO.DB.decodeJson(rollState and rollState.history_json or '[]', {})
        },
        inventory = inventory
    }

    ESRO.Runtime.profiles[src] = hydrated

    return hydrated
end

function ESRO.GetCachedProfile(src)
    if ESRO.Runtime.profiles[src] then
        return ESRO.Runtime.profiles[src]
    end

    return ESRO.GetOrCreateProfile(src)
end

function ESRO.GetOwnedTitles(profile)
    local owned = { Config.Titles.defaultId }
    local lookup = { [Config.Titles.defaultId] = true }

    for _, entry in ipairs(profile.inventory or {}) do
        if tostring(entry.item_type or '') == 'title' and Config.Titles.definitions[entry.item_id] and not lookup[entry.item_id] then
            lookup[entry.item_id] = true
            owned[#owned + 1] = entry.item_id
        end
    end

    return owned
end

function ESRO.AddBadge(identifier, badgeId)
    local profileRow = fetchProfileRow(identifier)
    if not profileRow then
        return false
    end

    local badges = ESRO.DB.decodeJson(profileRow.badge_json, {})
    if badges[badgeId] then
        return false
    end

    badges[badgeId] = true
    saveBadges(identifier, badges)
    return true
end

RegisterNetEvent(ESRO.Events.SetActiveTitle, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local titleId = tostring(payload.titleId or '')
    if not Config.Titles.definitions[titleId] then
        return
    end

    local allowed = false
    for _, ownedTitleId in ipairs(ESRO.GetOwnedTitles(profile)) do
        if ownedTitleId == titleId then
            allowed = true
            break
        end
    end

    if not allowed then
        return
    end

    ESRO.DB.Execute('UPDATE esro_profiles SET title_id = ? WHERE identifier = ?', {
        titleId,
        profile.identifier
    })

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)