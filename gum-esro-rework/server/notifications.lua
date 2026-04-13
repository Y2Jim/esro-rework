ESRO = ESRO or {}

local function resolveNotificationDefinition(typeId)
    return Config.Notifications.types[typeId]
end

local function canReceiveNotification(profile, typeId)
    if not profile or not profile.settings or not profile.settings.notifications then
        return true
    end

    if typeId == 'expedition_complete' then
        return profile.settings.notifications.expeditionComplete ~= false
    end

    if typeId == 'rewards_ready' then
        return profile.settings.notifications.rewardsReady ~= false
    end

    if typeId == 'party_invite' then
        return profile.settings.notifications.partyInvite ~= false
    end

    if typeId == 'contract_update' then
        return profile.settings.notifications.contractUpdate ~= false
    end

    if typeId == 'faction_event_started' then
        return profile.settings.notifications.factionAlert ~= false
    end

    if typeId == 'rare_roll_result' then
        return profile.settings.notifications.rareRoll ~= false
    end

    if typeId == 'daily_reset' then
        return profile.settings.notifications.dailyReset ~= false
    end

    return true
end

function ESRO.EnqueueNotification(src, typeId, options)
    local profile = ESRO.GetCachedProfile(src)
    local definition = resolveNotificationDefinition(typeId)

    if not profile or not definition or not canReceiveNotification(profile, typeId) then
        return nil
    end

    options = type(options) == 'table' and options or {}

    local title = tostring(options.title or definition.defaultTitle or 'ESRO')
    local body = tostring(options.body or ''):sub(1, 140)
    local deeplink = options.deeplink or definition.deeplink or { screen = 'terminal' }
    local dedupeKey = tostring(options.dedupeKey or ('%s:%s'):format(typeId, profile.identifier))

    local existing = ESRO.DB.FetchOne([[ 
        SELECT id
        FROM esro_notifications
        WHERE identifier = ? AND dedupe_key = ? AND state IN ('queued', 'delivered')
        LIMIT 1
    ]], { profile.identifier, dedupeKey })

    if existing then
        return existing.id
    end

    local notificationId = ESRO.DB.Insert([[ 
        INSERT INTO esro_notifications (
            identifier,
            type_id,
            priority,
            title,
            body,
            deeplink_json,
            dedupe_key,
            state,
            delivered_at,
            read_at,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'delivered', ?, NULL, ?)
    ]], {
        profile.identifier,
        typeId,
        definition.priority,
        title,
        body,
        ESRO.DB.encodeJson(deeplink),
        dedupeKey,
        ESRO.Shared.Now(),
        ESRO.Shared.Now()
    })

    TriggerClientEvent(ESRO.Events.ReceiveNotification, src, {
        id = notificationId,
        typeId = typeId,
        priority = definition.priority,
        title = title,
        body = body,
        deeplink = deeplink
    })

    return notificationId
end

function ESRO.MarkNotificationRead(src, notificationId)
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return false
    end

    ESRO.DB.Execute([[ 
        UPDATE esro_notifications
        SET state = 'read', read_at = ?
        WHERE id = ? AND identifier = ?
    ]], {
        ESRO.Shared.Now(),
        tonumber(notificationId),
        profile.identifier
    })

    return true
end

function ESRO.BuildNotificationSnapshot(profile)
    local rows = ESRO.DB.FetchAll([[ 
        SELECT id, type_id, priority, title, body, deeplink_json, state, created_at, read_at
        FROM esro_notifications
        WHERE identifier = ?
        ORDER BY id DESC
        LIMIT 20
    ]], { profile.identifier })

    local items = {}
    local unread = 0

    for _, row in ipairs(rows) do
        if row.state ~= 'read' then
            unread = unread + 1
        end

        items[#items + 1] = {
            id = row.id,
            typeId = row.type_id,
            priority = row.priority,
            title = row.title,
            body = row.body,
            deeplink = ESRO.DB.decodeJson(row.deeplink_json, {}),
            state = row.state,
            createdAt = row.created_at,
            readAt = row.read_at
        }
    end

    return {
        unread = unread,
        items = items
    }
end