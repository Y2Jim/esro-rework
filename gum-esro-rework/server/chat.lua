ESRO = ESRO or {}

local function normalizeChannel(channelId)
    local upper = tostring(channelId or ''):upper()
    if Config.Channels.definitions[upper] then
        return upper
    end

    return nil
end

local function canAccessUnderchat(profile)
    if not profile then
        return false
    end

    return profile.raceId == 'changeling' or profile.factionId == 'gloamwhisper'
end

local function canAccessChannel(profile, channelId)
    local definition = Config.Channels.definitions[channelId]
    if not definition then
        return false
    end

    if channelId == 'UNDERCHAT' then
        return canAccessUnderchat(profile)
    end

    return true
end

local function buildScope(profile, channelId)
    if channelId == 'UNDERCHAT' then
        return 'underchat', 'underchat'
    end

    if channelId == 'GAME' then
        return 'player', profile.identifier
    end

    return 'global', ''
end

local function fetchMessages(channelId, scopeKey)
    local rows = ESRO.DB.FetchAll([[ 
        SELECT sender_handle, sender_title_id, message, created_at
        FROM esro_messages
        WHERE channel_id = ? AND scope_key = ?
        ORDER BY id DESC
        LIMIT ?
    ]], {
        channelId,
        scopeKey,
        Config.App.pageSize
    })

    local messages = {}
    for index = #rows, 1, -1 do
        local row = rows[index]
        messages[#messages + 1] = {
            handle = row.sender_handle,
            title = Config.Titles.definitions[row.sender_title_id] or Config.Titles.definitions[Config.Titles.defaultId],
            text = row.message,
            ts = row.created_at
        }
    end

    return messages
end

local function fetchPin(channelId, scopeKey)
    local row = ESRO.DB.FetchOne([[ 
        SELECT pinned_by, message, created_at
        FROM esro_channel_pins
        WHERE channel_id = ? AND scope_key = ?
        LIMIT 1
    ]], { channelId, scopeKey })

    if not row then
        return nil
    end

    return {
        pinnedBy = row.pinned_by,
        text = row.message,
        ts = row.created_at
    }
end

function ESRO.BuildTerminalSnapshot(profile)
    local messages = {}
    local pinned = {}
    local unread = {}

    for _, channelId in ipairs(Config.Channels.order or {}) do
        if canAccessChannel(profile, channelId) then
            local _, scopeKey = buildScope(profile, channelId)
            messages[channelId] = fetchMessages(channelId, scopeKey)
            pinned[channelId] = fetchPin(channelId, scopeKey)
            unread[channelId] = 0
        end
    end

    return {
        pinned = pinned,
        messages = messages,
        unread = unread
    }
end

local function buildLinePacket(profile, text)
    return {
        handle = profile.handle,
        title = Config.Titles.definitions[profile.titleId] or Config.Titles.definitions[Config.Titles.defaultId],
        text = text,
        ts = os.date('%Y-%m-%d %H:%M:%S')
    }
end

local function getRecipients(channelId)
    local recipients = {}

    for _, playerId in ipairs(GetPlayers()) do
        local src = tonumber(playerId)
        local profile = src and ESRO.GetCachedProfile(src) or nil

        if src and profile and canAccessChannel(profile, channelId) then
            recipients[#recipients + 1] = src
        end
    end

    return recipients
end

local function storeMessage(profile, channelId, text)
    local scopeType, scopeKey = buildScope(profile, channelId)

    ESRO.DB.Insert([[ 
        INSERT INTO esro_messages (
            channel_id,
            sender_identifier,
            sender_handle,
            sender_title_id,
            message,
            scope_type,
            scope_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], {
        channelId,
        profile.identifier,
        profile.handle,
        profile.titleId,
        text,
        scopeType,
        scopeKey
    })
end

function ESRO.PushGameSummary(src, text)
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    local trimmed = tostring(text or ''):sub(1, Config.App.maxMessageLength)
    local scopeType, scopeKey = buildScope(profile, 'GAME')

    ESRO.DB.Insert([[ 
        INSERT INTO esro_messages (
            channel_id,
            sender_identifier,
            sender_handle,
            sender_title_id,
            message,
            scope_type,
            scope_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ]], {
        'GAME',
        'system',
        'SYSTEM',
        Config.Titles.defaultId,
        trimmed,
        scopeType,
        scopeKey
    })

    TriggerClientEvent(ESRO.Events.ReceiveChatMessage, src, {
        channel = 'GAME',
        line = {
            handle = 'SYSTEM',
            title = Config.Titles.definitions[Config.Titles.defaultId],
            text = trimmed,
            ts = os.date('%Y-%m-%d %H:%M:%S')
        }
    })
end

function ESRO.PushFactionGameSummary(factionId, text)
    for _, playerId in ipairs(GetPlayers()) do
        local src = tonumber(playerId)
        local profile = src and ESRO.GetCachedProfile(src) or nil

        if src and profile and profile.factionId == factionId then
            ESRO.PushGameSummary(src, text)
        end
    end
end

RegisterNetEvent(ESRO.Events.SendChatMessage, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)

    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}

    local channelId = normalizeChannel(payload.channel)
    local text = tostring(payload.text or '')
    text = text:gsub('^%s+', ''):gsub('%s+$', '')
    text = text:sub(1, Config.App.maxMessageLength)

    if not channelId or text == '' then
        return
    end

    if not canAccessChannel(profile, channelId) then
        return
    end

    if Config.Channels.definitions[channelId].readOnly then
        return
    end

    storeMessage(profile, channelId, text)

    local line = buildLinePacket(profile, text)
    for _, recipient in ipairs(getRecipients(channelId)) do
        TriggerClientEvent(ESRO.Events.ReceiveChatMessage, recipient, {
            channel = channelId,
            line = line
        })
    end
end)