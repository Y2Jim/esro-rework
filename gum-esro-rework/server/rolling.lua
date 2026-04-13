ESRO = ESRO or {}

local function fetchOwnedReward(identifier, reward)
    if reward.type == 'title' then
        local row = ESRO.DB.FetchOne([[ 
            SELECT amount
            FROM esro_profile_inventory
            WHERE identifier = ? AND item_id = ?
            LIMIT 1
        ]], { identifier, reward.id })
        return row and (tonumber(row.amount or 0) or 0) > 0
    end

    local row = ESRO.DB.FetchOne([[ 
        SELECT amount
        FROM esro_profile_inventory
        WHERE identifier = ? AND item_id = ?
        LIMIT 1
    ]], { identifier, reward.id })

    return row and (tonumber(row.amount or 0) or 0) > 0
end

local function addInventoryReward(identifier, reward)
    ESRO.DB.Execute([[ 
        INSERT INTO esro_profile_inventory (identifier, item_id, amount, item_type, item_meta_json)
        VALUES (?, ?, 1, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount + 1
    ]], {
        identifier,
        reward.id,
        reward.type or 'reward',
        ESRO.DB.encodeJson({ rarity = reward.rarity })
    })
end

local function buildPool()
    local flattened = {}

    for _, rarity in ipairs(Config.Rolling.rarityOrder or {}) do
        for _, reward in ipairs(Config.Rolling.standardPool.rewards[rarity] or {}) do
            flattened[#flattened + 1] = {
                id = reward.id,
                label = reward.label,
                type = reward.type,
                weight = reward.weight,
                rarity = rarity
            }
        end
    end

    return flattened
end

local function weightedPick(pool)
    local totalWeight = 0
    for _, reward in ipairs(pool) do
        totalWeight = totalWeight + (tonumber(reward.weight or 0) or 0)
    end

    if totalWeight <= 0 then
        return pool[1]
    end

    local roll = math.random(1, totalWeight)
    local running = 0

    for _, reward in ipairs(pool) do
        running = running + (tonumber(reward.weight or 0) or 0)
        if roll <= running then
            return reward
        end
    end

    return pool[#pool]
end

local function chooseReward(identifier, pity)
    local pool = buildPool()

    if pity >= (Config.Rolling.standardPool.pityThreshold or 20) then
        local pityPool = {}
        for _, reward in ipairs(pool) do
            if reward.rarity ~= 'common' then
                pityPool[#pityPool + 1] = reward
            end
        end

        if #pityPool > 0 then
            return weightedPick(pityPool)
        end
    end

    return weightedPick(pool)
end

local function updateRollState(identifier, fields)
    ESRO.DB.Execute([[ 
        UPDATE esro_profile_roll_state
        SET common_currency = ?, rare_currency = ?, standard_pity = ?, salvage = ?, history_json = ?
        WHERE identifier = ?
    ]], {
        fields.commonCurrency,
        fields.rareCurrency,
        fields.standardPity,
        fields.salvage,
        ESRO.DB.encodeJson(fields.history),
        identifier
    })
end

RegisterNetEvent(ESRO.Events.PerformRoll, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local poolId = tostring(payload.poolId or Config.Rolling.standardPool.id)
    if poolId ~= Config.Rolling.standardPool.id then
        return
    end

    local rollState = profile.rollState or {}
    local commonCurrency = tonumber(rollState.commonCurrency or 0) or 0
    local rareCurrency = tonumber(rollState.rareCurrency or 0) or 0
    local standardPity = tonumber(rollState.standardPity or 0) or 0
    local salvage = tonumber(rollState.salvage or 0) or 0
    local history = rollState.history or {}

    if commonCurrency < (Config.Rolling.standardPool.cost or 1) then
        ESRO.PushGameSummary(src, 'signal pull blocked: insufficient relay tokens')
        return
    end

    local reward = chooseReward(profile.identifier, standardPity)
    local duplicate = fetchOwnedReward(profile.identifier, reward)

    commonCurrency = commonCurrency - (Config.Rolling.standardPool.cost or 1)

    if duplicate then
        salvage = salvage + (Config.Rolling.duplicateSalvage[reward.rarity] or 1)
    else
        addInventoryReward(profile.identifier, reward)
    end

    ESRO.AddBadge(profile.identifier, 'first_pull')

    if reward.rarity == 'rare' or reward.rarity == 'epic' or reward.rarity == 'legendary' then
        standardPity = 0
        ESRO.EnqueueNotification(src, 'rare_roll_result', {
            body = ('%s [%s] pulled.'):format(reward.label, string.upper(reward.rarity)),
            dedupeKey = ('rare_roll:%s:%s'):format(profile.identifier, ESRO.Shared.Now()),
            deeplink = { screen = 'ops', tab = 'rolling' }
        })
        ESRO.PushGameSummary(src, ('rare pull: %s [%s]'):format(reward.label, string.upper(reward.rarity)))
    else
        standardPity = standardPity + 1
        ESRO.PushGameSummary(src, ('signal pull: %s [%s]'):format(reward.label, string.upper(reward.rarity)))
    end

    table.insert(history, 1, {
        id = reward.id,
        label = reward.label,
        rarity = reward.rarity,
        duplicate = duplicate,
        ts = ESRO.Shared.Now()
    })

    while #history > 10 do
        table.remove(history)
    end

    updateRollState(profile.identifier, {
        commonCurrency = commonCurrency,
        rareCurrency = rareCurrency,
        standardPity = standardPity,
        salvage = salvage,
        history = history
    })

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)

RegisterNetEvent(ESRO.Events.ExchangeSalvage, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local exchangeId = tostring(payload.exchangeId or '')
    local targetEntry = nil

    for _, entry in ipairs(Config.Rolling.exchangeShop or {}) do
        if entry.id == exchangeId then
            targetEntry = entry
            break
        end
    end

    if not targetEntry then
        return
    end

    local rollState = profile.rollState or {}
    local salvage = tonumber(rollState.salvage or 0) or 0
    if salvage < (targetEntry.cost or 0) then
        return
    end

    local rewardDefinition = nil
    for _, rarity in ipairs(Config.Rolling.rarityOrder or {}) do
        for _, reward in ipairs(Config.Rolling.standardPool.rewards[rarity] or {}) do
            if reward.id == targetEntry.rewardId then
                rewardDefinition = {
                    id = reward.id,
                    label = reward.label,
                    type = reward.type,
                    rarity = rarity
                }
                break
            end
        end
        if rewardDefinition then
            break
        end
    end

    if not rewardDefinition then
        return
    end

    addInventoryReward(profile.identifier, rewardDefinition)

    ESRO.DB.Execute([[ 
        UPDATE esro_profile_roll_state
        SET salvage = salvage - ?
        WHERE identifier = ? AND salvage >= ?
    ]], {
        targetEntry.cost,
        profile.identifier,
        targetEntry.cost
    })

    ESRO.PushGameSummary(src, ('exchange claimed: %s'):format(rewardDefinition.label))

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)