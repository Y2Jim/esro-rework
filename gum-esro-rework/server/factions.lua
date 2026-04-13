ESRO = ESRO or {}

local function ensureFactionRows()
    for _, factionId in ipairs(Config.Factions.order or {}) do
        ESRO.DB.Execute([[ 
            INSERT IGNORE INTO esro_factions (faction_id, influence, weekly_objective_json, event_json, bonuses_json)
            VALUES (?, ?, ?, ?, ?)
        ]], {
            factionId,
            0,
            ESRO.DB.encodeJson(Config.Factions.defaultObjective),
            ESRO.DB.encodeJson({}),
            ESRO.DB.encodeJson({})
        })

        local definition = Config.Factions.definitions[factionId]
        for _, projectId in ipairs(definition.hubProjects or {}) do
            ESRO.DB.Execute([[ 
                INSERT IGNORE INTO esro_hub_projects (
                    project_id,
                    faction_id,
                    category_id,
                    level,
                    status,
                    progress_json,
                    contributors_json
                ) VALUES (?, ?, ?, 0, 'available', ?, ?)
            ]], {
                ('%s:%s'):format(factionId, projectId),
                factionId,
                projectId,
                ESRO.DB.encodeJson({ current = 0 }),
                ESRO.DB.encodeJson({})
            })
        end
    end
end

local function fetchMaterialRows(factionId)
    return ESRO.DB.FetchAll('SELECT material_id, amount FROM esro_faction_materials WHERE faction_id = ?', { factionId })
end

local function fetchProjectRows(factionId)
    return ESRO.DB.FetchAll([[ 
        SELECT project_id, category_id, level, status, progress_json
        FROM esro_hub_projects
        WHERE faction_id = ?
        ORDER BY project_id ASC
    ]], { factionId })
end

local function ensureFactionEvent(factionId)
    local factionRow = ESRO.DB.FetchOne('SELECT event_json FROM esro_factions WHERE faction_id = ? LIMIT 1', { factionId })
    local currentEvent = ESRO.DB.decodeJson(factionRow and factionRow.event_json or '{}', {})
    local now = ESRO.Shared.Now()

    if currentEvent.id and tonumber(currentEvent.expiresAt or 0) > now then
        return currentEvent, false
    end

    local eventIds = ESRO.Shared.TableKeys(Config.Factions.events or {})
    local eventId = eventIds[math.random(1, #eventIds)]
    local definition = Config.Factions.events[eventId]
    local nextEvent = {
        id = eventId,
        label = definition.label,
        summary = definition.summary,
        favoredSkill = definition.favoredSkill,
        rewardPreview = definition.rewardPreview or { xp = 20, contribution = 10 },
        startedAt = now,
        expiresAt = now + 21600
    }

    ESRO.DB.Execute('UPDATE esro_factions SET event_json = ? WHERE faction_id = ?', {
        ESRO.DB.encodeJson(nextEvent),
        factionId
    })

    return nextEvent, true
end

local function ensureEventContract(factionId, eventData)
    local contractId = ('event_%s_%s'):format(factionId, tostring(eventData.startedAt or 0))
    local existing = ESRO.DB.FetchOne('SELECT id FROM esro_contracts WHERE id = ? LIMIT 1', { contractId })
    if existing then
        return contractId, false
    end

    ESRO.DB.Insert([[ 
        INSERT INTO esro_contracts (
            id,
            type_id,
            scope_id,
            poster_identifier,
            faction_id,
            title,
            summary,
            requirements_json,
            reward_preview_json,
            status,
            assignee_json,
            created_at,
            expires_at
        ) VALUES (?, 'event', 'event', ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
    ]], {
        contractId,
        ('system:%s'):format(factionId),
        factionId,
        eventData.label,
        eventData.summary,
        ESRO.DB.encodeJson({ favoredSkill = eventData.favoredSkill }),
        ESRO.DB.encodeJson(eventData.rewardPreview or { xp = 20, contribution = 10 }),
        ESRO.DB.encodeJson({}),
        ESRO.Shared.Now(),
        eventData.expiresAt or (ESRO.Shared.Now() + 21600)
    })

    return contractId, true
end

function ESRO.BuildFactionSnapshot(profile, src)
    ensureFactionRows()

    local factionRow = ESRO.DB.FetchOne('SELECT * FROM esro_factions WHERE faction_id = ? LIMIT 1', { profile.factionId })
    local materials = fetchMaterialRows(profile.factionId)
    local projects = fetchProjectRows(profile.factionId)
    local currentEvent, isNewEvent = ensureFactionEvent(profile.factionId)

    if src and isNewEvent then
        local contractId, createdContract = ensureEventContract(profile.factionId, currentEvent)

        ESRO.EnqueueNotification(src, 'faction_event_started', {
            body = currentEvent.label,
            dedupeKey = ('faction_event:%s:%s'):format(profile.factionId, currentEvent.startedAt),
            deeplink = {
                screen = 'contracts',
                tab = 'events',
                contractId = contractId
            }
        })

        ESRO.PushFactionGameSummary(
            profile.factionId,
            createdContract
                and ('faction event: %s | event contract posted'):format(currentEvent.label)
                or ('faction event: %s'):format(currentEvent.label)
        )
    end

    local materialList = {}
    for _, row in ipairs(materials) do
        materialList[#materialList + 1] = {
            id = row.material_id,
            amount = tonumber(row.amount or 0) or 0
        }
    end

    local projectList = {}
    for _, row in ipairs(projects) do
        local definition = Config.Factions.hubProjects[row.category_id]
        local progress = ESRO.DB.decodeJson(row.progress_json, { current = 0 })
        projectList[#projectList + 1] = {
            id = row.project_id,
            projectId = row.category_id,
            label = definition and definition.label or row.category_id,
            category = definition and definition.category or row.category_id,
            skill = definition and definition.skill or 'general',
            unlock = definition and definition.unlock or '',
            current = tonumber(progress.current or 0) or 0,
            status = row.status,
            level = tonumber(row.level or 0) or 0
        }
    end

    return {
        definition = Config.Factions.definitions[profile.factionId],
        objective = ESRO.DB.decodeJson(factionRow and factionRow.weekly_objective_json or '{}', Config.Factions.defaultObjective),
        event = currentEvent,
        influence = factionRow and factionRow.influence or 0,
        materials = materialList,
        projects = projectList
    }
end

RegisterNetEvent(ESRO.Events.ContributeHubProject, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local projectKey = tostring(payload.projectId or '')
    if projectKey == '' then
        return
    end

    local row = ESRO.DB.FetchOne([[ 
        SELECT project_id, category_id, level, progress_json, contributors_json
        FROM esro_hub_projects
        WHERE project_id = ? AND faction_id = ?
        LIMIT 1
    ]], { projectKey, profile.factionId })

    if not row then
        return
    end

    local definition = Config.Factions.hubProjects[row.category_id]
    if not definition then
        return
    end

    local materialId = next(definition.materialCosts or {})
    if not materialId then
        return
    end

    local poolRow = ESRO.DB.FetchOne([[ 
        SELECT amount
        FROM esro_faction_materials
        WHERE faction_id = ? AND material_id = ?
        LIMIT 1
    ]], { profile.factionId, materialId })

    if not poolRow or (tonumber(poolRow.amount or 0) or 0) <= 0 then
        ESRO.PushGameSummary(src, ('hub blocked: %s needed'):format(materialId))
        return
    end

    local progress = ESRO.DB.decodeJson(row.progress_json, { current = 0 })
    local contributors = ESRO.DB.decodeJson(row.contributors_json, {})
    local bonus = 1

    for _, skill in ipairs(profile.skills or {}) do
        if skill.skill_id == definition.skill then
            bonus = 1 + math.floor((tonumber(skill.level or 1) or 1) / 4)
            break
        end
    end

    progress.current = (tonumber(progress.current or 0) or 0) + bonus
    contributors[profile.identifier] = (tonumber(contributors[profile.identifier] or 0) or 0) + bonus

    ESRO.DB.Execute([[ 
        UPDATE esro_faction_materials
        SET amount = amount - 1
        WHERE faction_id = ? AND material_id = ? AND amount > 0
    ]], {
        profile.factionId,
        materialId
    })

    ESRO.DB.Execute([[ 
        UPDATE esro_hub_projects
        SET progress_json = ?, contributors_json = ?
        WHERE project_id = ? AND faction_id = ?
    ]], {
        ESRO.DB.encodeJson(progress),
        ESRO.DB.encodeJson(contributors),
        projectKey,
        profile.factionId
    })

    ESRO.EnqueueNotification(src, 'hub_project_needs_support', {
        body = ('Contribution logged to %s.'):format(definition.label),
        dedupeKey = ('hub_contribution:%s:%s:%s'):format(profile.identifier, projectKey, progress.current),
        deeplink = { screen = 'faction', tab = 'hub' }
    })

    ESRO.AddBadge(profile.identifier, 'faction_hand')

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)

RegisterNetEvent(ESRO.Events.DepositFactionMaterials, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local itemId = tostring(payload.itemId or '')
    local amount = math.max(tonumber(payload.amount or 0) or 0, 0)

    if itemId == '' or amount <= 0 then
        return
    end

    local row = ESRO.DB.FetchOne([[ 
        SELECT amount
        FROM esro_profile_inventory
        WHERE identifier = ? AND item_id = ?
        LIMIT 1
    ]], { profile.identifier, itemId })

    if not row or (tonumber(row.amount or 0) or 0) < amount then
        return
    end

    ESRO.DB.Execute('UPDATE esro_profile_inventory SET amount = amount - ? WHERE identifier = ? AND item_id = ?', {
        amount,
        profile.identifier,
        itemId
    })

    ESRO.DB.Execute([[ 
        INSERT INTO esro_faction_materials (faction_id, material_id, amount)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount)
    ]], {
        profile.factionId,
        itemId,
        amount
    })

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)