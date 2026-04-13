---@diagnostic disable: undefined-global
ESRO = ESRO or {}

local appVisible = false
local phoneLaunchOptions = {
    embeddedMode = false,
    phoneResource = nil
}

local APP_IDENTIFIER = 'esro-rework'

local function isEmbeddedLbPhoneMode()
    return phoneLaunchOptions.embeddedMode == true
        and phoneLaunchOptions.phoneResource == 'lb-phone'
        and GetResourceState('lb-phone') == 'started'
end

local function sendUi(payload)
    if isEmbeddedLbPhoneMode() then
        local delivered = false

        if GetResourceState('gum-esro-rework-lbphone') == 'started' and exports['gum-esro-rework-lbphone'] and exports['gum-esro-rework-lbphone'].SendEmbeddedAppMessage then
            local ok, result = pcall(function()
                return exports['gum-esro-rework-lbphone']:SendEmbeddedAppMessage(payload)
            end)

            delivered = ok and result ~= false
        end

        if not delivered then
            pcall(function()
                exports['lb-phone']:SendCustomAppMessage(APP_IDENTIFIER, payload)
            end)
        end

        return
    end

    SendNUIMessage(payload)
end

local function requestBootstrap()
    TriggerServerEvent(ESRO.Events.RequestBootstrap)
end

local function syncUiState()
    if not appVisible then
        return
    end

    sendUi({
        type = 'esro:visibility',
        visible = true,
        embedded = phoneLaunchOptions.embeddedMode == true
    })

    requestBootstrap()
end

local function openApp(options)
    options = type(options) == 'table' and options or {}

    if appVisible then
        requestBootstrap()
        return true
    end

    appVisible = true

    phoneLaunchOptions.embeddedMode = options.embeddedMode == true
    phoneLaunchOptions.phoneResource = type(options.source) == 'string' and options.source or nil

    if not phoneLaunchOptions.embeddedMode then
        SetNuiFocus(true, true)
    end

    syncUiState()

    CreateThread(function()
        local replayDelays = phoneLaunchOptions.embeddedMode and { 200, 500, 1000 } or { 150 }

        for _, delay in ipairs(replayDelays) do
            Wait(delay)

            if not appVisible then
                return
            end

            syncUiState()
        end
    end)

    return true
end

local function closeApp(options)
    options = type(options) == 'table' and options or {}

    if not appVisible then
        return true
    end

    appVisible = false

    local embeddedMode = phoneLaunchOptions.embeddedMode == true
    local phoneResource = phoneLaunchOptions.phoneResource

    if not embeddedMode then
        SetNuiFocus(false, false)
    end

    sendUi({
        type = 'esro:visibility',
        visible = false
    })

    phoneLaunchOptions.embeddedMode = false
    phoneLaunchOptions.phoneResource = nil

    if embeddedMode and options.skipPhoneClose ~= true and phoneResource == 'lb-phone' and GetResourceState('lb-phone') == 'started' then
        local closed = false

        if GetResourceState('gum-esro-rework-lbphone') == 'started' and exports['gum-esro-rework-lbphone'] and exports['gum-esro-rework-lbphone'].CloseEmbeddedApp then
            local ok, result = pcall(function()
                return exports['gum-esro-rework-lbphone']:CloseEmbeddedApp()
            end)

            closed = ok and result ~= false
        end

        if not closed then
            pcall(function()
                exports['lb-phone']:CloseApp({
                    app = APP_IDENTIFIER
                })
            end)
        end
    end

    return true
end

local function openFromPhone(options)
    options = type(options) == 'table' and options or {}
    return openApp(options)
end

local function closeFromPhone(options)
    options = type(options) == 'table' and options or {}
    return closeApp({
        skipPhoneClose = options.embeddedMode == true
    })
end

local uiEventHandlers = {
    uiReady = function(data)
        data = type(data) == 'table' and data or {}

        if data.embedded == true then
            phoneLaunchOptions.embeddedMode = true

            if type(data.source) == 'string' and data.source ~= '' then
                phoneLaunchOptions.phoneResource = data.source
            elseif not phoneLaunchOptions.phoneResource then
                phoneLaunchOptions.phoneResource = 'lb-phone'
            end
        end

        syncUiState()
        return true
    end,
    requestBootstrap = function()
        requestBootstrap()
        return true
    end,
    refreshSnapshot = function()
        TriggerServerEvent(ESRO.Events.RefreshSnapshot)
        return true
    end,
    sendChatMessage = function(data)
        TriggerServerEvent(ESRO.Events.SendChatMessage, data)
        return true
    end,
    startExpedition = function(data)
        TriggerServerEvent(ESRO.Events.StartExpedition, data)
        return true
    end,
    claimExpedition = function(data)
        TriggerServerEvent(ESRO.Events.ClaimExpedition, data)
        return true
    end,
    acceptContract = function(data)
        TriggerServerEvent(ESRO.Events.AcceptContract, data)
        return true
    end,
    completeContract = function(data)
        TriggerServerEvent(ESRO.Events.CompleteContract, data)
        return true
    end,
    createContract = function(data)
        TriggerServerEvent(ESRO.Events.CreateContract, data)
        return true
    end,
    craftItem = function(data)
        TriggerServerEvent(ESRO.Events.CraftItem, data)
        return true
    end,
    performRoll = function(data)
        TriggerServerEvent(ESRO.Events.PerformRoll, data)
        return true
    end,
    exchangeSalvage = function(data)
        TriggerServerEvent(ESRO.Events.ExchangeSalvage, data)
        return true
    end,
    setActiveTitle = function(data)
        TriggerServerEvent(ESRO.Events.SetActiveTitle, data)
        return true
    end,
    depositFactionMaterials = function(data)
        TriggerServerEvent(ESRO.Events.DepositFactionMaterials, data)
        return true
    end,
    contributeHubProject = function(data)
        TriggerServerEvent(ESRO.Events.ContributeHubProject, data)
        return true
    end,
    markNotificationRead = function(data)
        TriggerServerEvent(ESRO.Events.MarkNotificationRead, data.notificationId)
        return true
    end,
    closeApp = function()
        closeApp()
        return true
    end
}

local function handleUiEvent(eventName, data)
    local handler = uiEventHandlers[tostring(eventName or '')]
    if not handler then
        return false, 'unknown ui event'
    end

    return handler(type(data) == 'table' and data or {}), nil
end

RegisterNetEvent(ESRO.Events.OpenApp, function()
    openApp()
end)

RegisterNetEvent(ESRO.Events.CloseApp, function()
    closeApp()
end)

RegisterNetEvent(ESRO.Events.ReceiveBootstrap, function(payload)
    sendUi({
        type = 'esro:bootstrap',
        payload = payload
    })
end)

RegisterNetEvent(ESRO.Events.ReceiveSnapshot, function(payload)
    sendUi({
        type = 'esro:snapshot',
        payload = payload
    })
end)

RegisterNetEvent(ESRO.Events.ReceiveChatMessage, function(payload)
    sendUi({
        type = 'esro:chat',
        payload = payload
    })
end)

RegisterNetEvent(ESRO.Events.ReceiveNotification, function(payload)
    if lib and lib.notify then
        lib.notify({
            title = payload.title or 'ESRO',
            description = payload.body or '',
            type = payload.priority == 'high' and 'success' or 'info'
        })
    end

    if GetResourceState('lb-phone') == 'started' then
        pcall(function()
            exports['lb-phone']:SendNotification({
                app = 'ESRO',
                title = payload.title or 'ESRO',
                content = payload.body or ''
            })
        end)
    end

    sendUi({
        type = 'esro:notification',
        payload = payload
    })
end)

RegisterNUICallback('requestBootstrap', function(_, cb)
    local ok, errorMessage = handleUiEvent('requestBootstrap', {})
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('uiReady', function(data, cb)
    local ok, errorMessage = handleUiEvent('uiReady', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('refreshSnapshot', function(_, cb)
    local ok, errorMessage = handleUiEvent('refreshSnapshot', {})
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('sendChatMessage', function(data, cb)
    local ok, errorMessage = handleUiEvent('sendChatMessage', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('startExpedition', function(data, cb)
    local ok, errorMessage = handleUiEvent('startExpedition', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('claimExpedition', function(data, cb)
    local ok, errorMessage = handleUiEvent('claimExpedition', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('acceptContract', function(data, cb)
    local ok, errorMessage = handleUiEvent('acceptContract', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('completeContract', function(data, cb)
    local ok, errorMessage = handleUiEvent('completeContract', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('craftItem', function(data, cb)
    local ok, errorMessage = handleUiEvent('craftItem', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('performRoll', function(data, cb)
    local ok, errorMessage = handleUiEvent('performRoll', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('createContract', function(data, cb)
    local ok, errorMessage = handleUiEvent('createContract', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('exchangeSalvage', function(data, cb)
    local ok, errorMessage = handleUiEvent('exchangeSalvage', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('setActiveTitle', function(data, cb)
    local ok, errorMessage = handleUiEvent('setActiveTitle', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('depositFactionMaterials', function(data, cb)
    local ok, errorMessage = handleUiEvent('depositFactionMaterials', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('contributeHubProject', function(data, cb)
    local ok, errorMessage = handleUiEvent('contributeHubProject', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('markNotificationRead', function(data, cb)
    local ok, errorMessage = handleUiEvent('markNotificationRead', data)
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterNUICallback('closeApp', function(_, cb)
    local ok, errorMessage = handleUiEvent('closeApp', {})
    cb({ ok = ok ~= false, error = errorMessage })
end)

RegisterCommand('esrorework', function()
    openApp()
end, false)

RegisterCommand('esroreworkembedded', function()
    openApp({
        embeddedMode = true,
        source = 'lb-phone'
    })
end, false)

RegisterCommand('esroreworkrefresh', function()
    requestBootstrap()
end, false)

RegisterCommand('esroreworkclose', function()
    closeApp()
end, false)

exports('OpenFromPhone', openFromPhone)
exports('OpenESRO', openFromPhone)
exports('CloseFromPhone', closeFromPhone)
exports('HandleEmbeddedUiEvent', function(eventName, data)
    local ok = handleUiEvent(eventName, data)
    return ok ~= false
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        closeApp()
    end
end)