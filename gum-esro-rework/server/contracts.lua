ESRO = ESRO or {}

local function expireStaleContracts()
    ESRO.DB.Execute([[ 
        UPDATE esro_contracts
        SET status = 'expired'
        WHERE type_id = 'event' AND status IN ('open', 'accepted') AND expires_at <= ?
    ]], {
        ESRO.Shared.Now()
    })
end

local function addProfileXp(identifier, amount)
    ESRO.DB.Execute('UPDATE esro_profiles SET xp = xp + ? WHERE identifier = ?', {
        amount,
        identifier
    })
end

local function applyEventContribution(factionId, favoredSkill, contribution)
    ESRO.DB.Execute('UPDATE esro_factions SET influence = influence + ? WHERE faction_id = ?', {
        contribution,
        factionId
    })

    local rows = ESRO.DB.FetchAll([[ 
        SELECT project_id, category_id, progress_json
        FROM esro_hub_projects
        WHERE faction_id = ?
        ORDER BY project_id ASC
    ]], { factionId })

    local selectedRow = nil

    for _, row in ipairs(rows) do
        local definition = Config.Factions.hubProjects[row.category_id]
        if definition and definition.skill == favoredSkill then
            selectedRow = row
            break
        end
    end

    if not selectedRow then
        selectedRow = rows[1]
    end

    if not selectedRow then
        return nil
    end

    local progress = ESRO.DB.decodeJson(selectedRow.progress_json, { current = 0 })
    progress.current = (tonumber(progress.current or 0) or 0) + contribution

    ESRO.DB.Execute([[ 
        UPDATE esro_hub_projects
        SET progress_json = ?
        WHERE project_id = ? AND faction_id = ?
    ]], {
        ESRO.DB.encodeJson(progress),
        selectedRow.project_id,
        factionId
    })

    local definition = Config.Factions.hubProjects[selectedRow.category_id]
    return {
        projectId = selectedRow.project_id,
        label = definition and definition.label or selectedRow.category_id,
        progress = progress.current
    }
end

local function ensureSeedContracts(profile)
    local existing = ESRO.DB.FetchOne('SELECT id FROM esro_contracts LIMIT 1', {})
    if existing then
        return
    end

    local now = ESRO.Shared.Now()

    for templateId, template in pairs(Config.Contracts.templates or {}) do
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
        ]], {
            ('seed_%s'):format(templateId),
            template.type,
            template.type,
            profile.identifier,
            profile.factionId,
            template.title,
            template.summary,
            ESRO.DB.encodeJson({}),
            ESRO.DB.encodeJson(template.rewardPreview or {}),
            ESRO.DB.encodeJson({}),
            now,
            now + (Config.Contracts.defaults.expirationSeconds or 86400)
        })
    end
end

function ESRO.BuildContractsSnapshot(profile)
    expireStaleContracts()
    ensureSeedContracts(profile)

    local rows = ESRO.DB.FetchAll([[ 
        SELECT id, type_id, title, summary, reward_preview_json, status, assignee_json, faction_id
        FROM esro_contracts
        WHERE status IN ('open', 'accepted')
        ORDER BY created_at DESC
        LIMIT 20
    ]], {})

    local entries = {}

    for _, row in ipairs(rows) do
        if (row.type_id ~= 'faction' and row.type_id ~= 'event') or row.faction_id == profile.factionId then
            local assignees = ESRO.DB.decodeJson(row.assignee_json, {})
            local assignedToPlayer = false

            for _, assigneeIdentifier in ipairs(assignees) do
                if assigneeIdentifier == profile.identifier then
                    assignedToPlayer = true
                    break
                end
            end

            entries[#entries + 1] = {
                id = row.id,
                type = row.type_id,
                title = row.title,
                summary = row.summary,
                rewardPreview = ESRO.DB.decodeJson(row.reward_preview_json, {}),
                status = row.status,
                assigned = #assignees > 0,
                assignedToPlayer = assignedToPlayer,
                canComplete = row.type_id == 'event' and row.status == 'accepted' and assignedToPlayer
            }
        end
    end

    return {
        filters = Config.Contracts.types,
        entries = entries
    }
end

RegisterNetEvent(ESRO.Events.CreateContract, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local typeId = tostring(payload.typeId or 'public')
    local title = tostring(payload.title or ''):sub(1, 96)
    local summary = tostring(payload.summary or ''):sub(1, 180)
    local typeDefinition = Config.Contracts.types[typeId]

    if not typeDefinition or typeDefinition.allowPosting ~= true or title == '' or summary == '' then
        return
    end

    local openCount = ESRO.DB.FetchOne([[ 
        SELECT COUNT(*) AS total
        FROM esro_contracts
        WHERE poster_identifier = ? AND status IN ('open', 'accepted')
    ]], { profile.identifier })

    if (tonumber(openCount and openCount.total or 0) or 0) >= (Config.Contracts.defaults.maxActivePlayerPosts or 3) then
        return
    end

    local now = ESRO.Shared.Now()
    local contractId = ('contract_%s_%s'):format(profile.identifier:gsub('[^%w]', ''):sub(-6), now)

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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
    ]], {
        contractId,
        typeId,
        typeId,
        profile.identifier,
        typeDefinition.allowFactionScope and profile.factionId or nil,
        title,
        summary,
        ESRO.DB.encodeJson({}),
        ESRO.DB.encodeJson({ xp = 15, contribution = typeId == 'faction' and 6 or 0 }),
        ESRO.DB.encodeJson({}),
        now,
        now + (Config.Contracts.defaults.expirationSeconds or 86400)
    })

    ESRO.EnqueueNotification(src, 'contract_update', {
        body = 'Contract posted to the relay board.',
        dedupeKey = ('contract_post:%s:%s'):format(profile.identifier, contractId),
        deeplink = { screen = 'contracts', tab = 'board', contractId = contractId }
    })

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)

RegisterNetEvent(ESRO.Events.AcceptContract, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local contractId = tostring(payload.contractId or '')
    if contractId == '' then
        return
    end

    expireStaleContracts()

    local row = ESRO.DB.FetchOne([[ 
        SELECT id, type_id, faction_id, assignee_json
        FROM esro_contracts
        WHERE id = ? AND status = 'open'
        LIMIT 1
    ]], { contractId })

    if not row then
        return
    end

    if (row.type_id == 'faction' or row.type_id == 'event') and row.faction_id ~= profile.factionId then
        return
    end

    local assignees = ESRO.DB.decodeJson(row.assignee_json, {})
    assignees[#assignees + 1] = profile.identifier

    ESRO.DB.Execute([[ 
        UPDATE esro_contracts
        SET status = 'accepted', assignee_json = ?
        WHERE id = ? AND status = 'open'
    ]], {
        ESRO.DB.encodeJson(assignees),
        contractId
    })

    ESRO.EnqueueNotification(src, 'contract_update', {
        body = 'Contract accepted and added to your relay queue.',
        dedupeKey = ('contract_accept:%s:%s'):format(profile.identifier, contractId),
        deeplink = {
            screen = 'contracts',
            tab = row.type_id == 'event' and 'events' or 'board',
            contractId = contractId
        }
    })

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)

RegisterNetEvent(ESRO.Events.CompleteContract, function(payload)
    local src = source
    local profile = ESRO.GetCachedProfile(src)
    if not profile then
        return
    end

    payload = type(payload) == 'table' and payload or {}
    local contractId = tostring(payload.contractId or '')
    if contractId == '' then
        return
    end

    expireStaleContracts()

    local row = ESRO.DB.FetchOne([[ 
        SELECT id, type_id, title, faction_id, requirements_json, reward_preview_json, assignee_json
        FROM esro_contracts
        WHERE id = ? AND status = 'accepted'
        LIMIT 1
    ]], { contractId })

    if not row or row.type_id ~= 'event' or row.faction_id ~= profile.factionId then
        return
    end

    local assignees = ESRO.DB.decodeJson(row.assignee_json, {})
    local assignedToPlayer = false

    for _, assigneeIdentifier in ipairs(assignees) do
        if assigneeIdentifier == profile.identifier then
            assignedToPlayer = true
            break
        end
    end

    if not assignedToPlayer then
        return
    end

    local requirements = ESRO.DB.decodeJson(row.requirements_json, {})
    local rewards = ESRO.DB.decodeJson(row.reward_preview_json, {})
    local xp = tonumber(rewards.xp or 0) or 0
    local contribution = tonumber(rewards.contribution or 0) or 0
    local projectProgress = applyEventContribution(row.faction_id, requirements.favoredSkill, contribution)

    ESRO.DB.Execute([[ 
        UPDATE esro_contracts
        SET status = 'completed'
        WHERE id = ? AND status = 'accepted'
    ]], { contractId })

    if xp > 0 then
        addProfileXp(profile.identifier, xp)
    end

    ESRO.EnqueueNotification(src, 'contract_update', {
        body = projectProgress
            and ('%s resolved. %s advanced.'):format(row.title, projectProgress.label)
            or ('%s resolved.'):format(row.title),
        dedupeKey = ('contract_complete:%s:%s'):format(profile.identifier, contractId),
        deeplink = { screen = 'contracts', tab = 'events' }
    })

    ESRO.PushGameSummary(
        src,
        projectProgress
            and ('event contract closed: %s | %s +%s'):format(row.title, projectProgress.label, contribution)
            or ('event contract closed: %s'):format(row.title)
    )

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = ESRO.BuildBootstrapSnapshot(src)
    })
end)