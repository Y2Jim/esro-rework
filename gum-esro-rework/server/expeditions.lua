ESRO = ESRO or {}

local function generateExpeditionId(identifier)
    local cleaned = tostring(identifier or 'relay'):gsub('[^%w]', '')
    return ('exp_%s_%s'):format(cleaned:sub(-6), math.random(100000, 999999))
end

local function addInventoryItem(identifier, itemId, amount, itemType)
    ESRO.DB.Execute([[ 
        INSERT INTO esro_profile_inventory (identifier, item_id, amount, item_type, item_meta_json)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
    ]], {
        identifier,
        itemId,
        amount,
        itemType,
        ESRO.DB.encodeJson({})
    })
end

local function addProfileXp(identifier, amount)
    ESRO.DB.Execute('UPDATE esro_profiles SET xp = xp + ? WHERE identifier = ?', {
        amount,
        identifier
    })
end

local function addRollCurrencies(identifier, rewards)
    ESRO.DB.Execute([[ 
        UPDATE esro_profile_roll_state
        SET common_currency = common_currency + ?, rare_currency = rare_currency + ?
        WHERE identifier = ?
    ]], {
        rewards.relay_tokens or 0,
        rewards.deep_signals or 0,
        identifier
    })
end

local function getRoute(routeId)
    return Config.Expeditions.definitions[routeId]
end

local function fetchExpeditionRows(identifier, statuses)
    local placeholders = {}
    local parameters = { identifier }

    for _, status in ipairs(statuses) do
        placeholders[#placeholders + 1] = '?'
        parameters[#parameters + 1] = status
    end

    return ESRO.DB.FetchAll(([[ 
        SELECT *
        FROM esro_expeditions
        WHERE owner_identifier = ? AND status IN (%s)
        ORDER BY started_at DESC
    ]]):format(table.concat(placeholders, ', ')), parameters)
end

local function pickLogs(route)
    local logs = {}
    local pool = route.logPool or {}
    local picks = math.min(3, #pool)

    for index = 1, picks do
        logs[#logs + 1] = pool[index]
    end

    return logs
end

local function buildResult(route)
    return {
        success = true,
        rewards = route.rewards,
        logs = pickLogs(route)
    }
end

local function resolveExpeditionRow(row)
    local route = getRoute(row.expedition_id)
    if not route then
        return
    end

    ESRO.DB.Execute([[ 
        UPDATE esro_expeditions
        SET status = 'resolved',
            resolved_at = ?,
            result_json = ?
        WHERE id = ? AND status = 'active'
    ]], {
        ESRO.Shared.Now(),
        ESRO.DB.encodeJson(buildResult(route)),
        row.id
    })
end

function ESRO.ResolveDueExpeditions(identifier, src)
    local dueRows = ESRO.DB.FetchAll([[ 
        SELECT *
        FROM esro_expeditions
        WHERE owner_identifier = ? AND status = 'active' AND ends_at <= ?
    ]], {
        identifier,
        ESRO.Shared.Now()
    })

    for _, row in ipairs(dueRows) do
        resolveExpeditionRow(row)

        if src then
            local route = getRoute(row.expedition_id)
            ESRO.EnqueueNotification(src, 'expedition_complete', {
                body = ('%s is complete. Claim results when ready.'):format(route and route.label or 'Expedition'),
                dedupeKey = ('expedition_complete:%s'):format(row.id),
                deeplink = { screen = 'ops', tab = 'results', expeditionId = row.id }
            })
            ESRO.EnqueueNotification(src, 'rewards_ready', {
                body = 'Claimable expedition rewards are ready.',
                dedupeKey = ('rewards_ready:%s'):format(row.id),
                deeplink = { screen = 'ops', tab = 'results', expeditionId = row.id }
            })
            ESRO.PushGameSummary(src, ('expedition complete: %s'):format(route and route.label or row.expedition_id))
        end
    end
end

function ESRO.BuildExpeditionSnapshot(profile, src)
    ESRO.ResolveDueExpeditions(profile.identifier, src)

    local activeRows = fetchExpeditionRows(profile.identifier, { 'active' })
    local resultRows = fetchExpeditionRows(profile.identifier, { 'resolved' })

    local active = {}
    for _, row in ipairs(activeRows) do
        local route = getRoute(row.expedition_id)
        active[#active + 1] = {
            id = row.id,
            routeId = row.expedition_id,
            label = route and route.label or row.expedition_id,
            endsAt = row.ends_at,
            remaining = math.max(0, row.ends_at - ESRO.Shared.Now())
        }
    end

    local results = {}
    for _, row in ipairs(resultRows) do
        local route = getRoute(row.expedition_id)
        results[#results + 1] = {
            id = row.id,
            routeId = row.expedition_id,
            label = route and route.label or row.expedition_id,
            resolvedAt = row.resolved_at,
            result = ESRO.DB.decodeJson(row.result_json, {})
        }
    end

    return {
        active = active,
        results = results,
        definitions = Config.Expeditions.definitions
    }
end

local function claimRewards(identifier, result)
    local rewards = result.rewards or {}

    addProfileXp(identifier, tonumber(rewards.xp or 0) or 0)

    for itemId, amount in pairs(rewards.materials or {}) do
        addInventoryItem(identifier, itemId, amount, 'material')
    end

    addRollCurrencies(identifier, rewards.currencies or {})
end

RegisterNetEvent(ESRO.Events.StartExpedition, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    ESRO.ResolveDueExpeditions(profile.identifier, src)

    local active = fetchExpeditionRows(profile.identifier, { 'active' })
    if #active > 0 then
        return
    end

    payload = type(payload) == 'table' and payload or {}

    local routeId = tostring(payload.routeId or '')
    local route = getRoute(routeId)
    if not route then
        return
    end

    local expeditionId = generateExpeditionId(profile.identifier)
    local startedAt = ESRO.Shared.Now()
    local endsAt = startedAt + (tonumber(route.durationSeconds) or 0)

    ESRO.DB.Insert([[ 
        INSERT INTO esro_expeditions (
            id,
            owner_identifier,
            party_json,
            expedition_id,
            status,
            loadout_json,
            started_at,
            ends_at,
            resolved_at,
            result_json,
            claimed_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, NULL, NULL, NULL)
    ]], {
        expeditionId,
        profile.identifier,
        ESRO.DB.encodeJson({ profile.identifier }),
        routeId,
        ESRO.DB.encodeJson(payload.loadout or {}),
        startedAt,
        endsAt
    })

    ESRO.PushGameSummary(src, ('expedition started: %s'):format(route.label))

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)

RegisterNetEvent(ESRO.Events.ClaimExpedition, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local expeditionId = tostring(payload.expeditionId or '')
    if expeditionId == '' then
        return
    end

    local row = ESRO.DB.FetchOne([[ 
        SELECT *
        FROM esro_expeditions
        WHERE id = ? AND owner_identifier = ? AND status = 'resolved' AND claimed_at IS NULL
        LIMIT 1
    ]], {
        expeditionId,
        profile.identifier
    })

    if not row then
        return
    end

    claimRewards(profile.identifier, ESRO.DB.decodeJson(row.result_json, {}))
    ESRO.AddBadge(profile.identifier, 'first_claim')

    ESRO.DB.Execute([[ 
        UPDATE esro_expeditions
        SET status = 'claimed', claimed_at = ?
        WHERE id = ? AND owner_identifier = ? AND claimed_at IS NULL
    ]], {
        ESRO.Shared.Now(),
        expeditionId,
        profile.identifier
    })

    ESRO.PushGameSummary(src, ('rewards claimed: %s'):format(row.expedition_id))

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)