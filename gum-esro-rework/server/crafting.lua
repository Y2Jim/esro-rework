ESRO = ESRO or {}

local function getInventoryAmount(identifier, itemId)
    local amount = ESRO.DB.FetchOne([[ 
        SELECT amount
        FROM esro_profile_inventory
        WHERE identifier = ? AND item_id = ?
        LIMIT 1
    ]], { identifier, itemId })

    return amount and (tonumber(amount.amount or 0) or 0) or 0
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

local function removeInventoryItem(identifier, itemId, amount)
    ESRO.DB.Execute([[ 
        UPDATE esro_profile_inventory
        SET amount = amount - ?
        WHERE identifier = ? AND item_id = ? AND amount >= ?
    ]], {
        amount,
        identifier,
        itemId,
        amount
    })
end

local function canCraft(identifier, recipe)
    for itemId, requiredAmount in pairs(recipe.cost or {}) do
        if getInventoryAmount(identifier, itemId) < requiredAmount then
            return false, itemId
        end
    end

    return true
end

RegisterNetEvent(ESRO.Events.CraftItem, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local recipeId = tostring(payload.recipeId or '')
    local recipe = Config.Crafting.recipes[recipeId]

    if not recipe then
        return
    end

    local allowed, missingItem = canCraft(profile.identifier, recipe)
    if not allowed then
        ESRO.PushGameSummary(src, ('craft blocked: missing %s'):format(missingItem or 'materials'))
        return
    end

    for itemId, requiredAmount in pairs(recipe.cost or {}) do
        removeInventoryItem(profile.identifier, itemId, requiredAmount)
    end

    addInventoryItem(
        profile.identifier,
        recipe.output.itemId,
        tonumber(recipe.output.amount or 1) or 1,
        recipe.output.itemType or 'utility'
    )

    ESRO.EnqueueNotification(src, 'crafting_complete', {
        body = ('Crafted %s.'):format(recipe.label),
        dedupeKey = ('crafting_complete:%s:%s'):format(profile.identifier, recipeId),
        deeplink = { screen = 'ops', tab = 'crafting' }
    })
    ESRO.PushGameSummary(src, ('crafted: %s'):format(recipe.label))

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)