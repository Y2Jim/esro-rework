---@diagnostic disable: undefined-global
local APP_IDENTIFIER = 'esro'
local APP_RESOURCE = 'gum-esro'
local PHONE_RESOURCE = 'lb-phone'

local appRegistered = false
local registrationPending = false

local function getAppIcon()
    return ('https://cfx-nui-%s/ui/assets/esro-logo.png'):format(APP_RESOURCE)
end

local function notifyBridgeIssue(message)
    print(('[gum-esro-lbphone] %s'):format(message))

    if lib and lib.notify then
        lib.notify({
            title = 'ESRO',
            description = message,
            type = 'error'
        })
    end
end

local function openEsroFromPhone()
    if GetResourceState(APP_RESOURCE) ~= 'started' then
        notifyBridgeIssue('gum-esro is not started.')
        return false
    end

    if GetResourceState(PHONE_RESOURCE) ~= 'started' then
        notifyBridgeIssue('lb-phone is not started.')
        return false
    end

    local ok, result = pcall(function()
        if exports[PHONE_RESOURCE].IsOpen and not exports[PHONE_RESOURCE]:IsOpen() then
            exports[PHONE_RESOURCE]:ToggleOpen(true)
        end

        return exports[PHONE_RESOURCE]:OpenApp(APP_IDENTIFIER)
    end)

    if not ok then
        notifyBridgeIssue('Failed to open ESRO from LBPhone.')
        return false
    end

    return result ~= false
end

local function sendEmbeddedAppMessage(payload)
    if GetResourceState(PHONE_RESOURCE) ~= 'started' then
        return false
    end

    local ok, result = pcall(function()
        return exports[PHONE_RESOURCE]:SendCustomAppMessage(APP_IDENTIFIER, payload)
    end)

    if not ok then
        return false
    end

    return result ~= false
end

local function closeEmbeddedApp()
    if GetResourceState(PHONE_RESOURCE) ~= 'started' then
        return false
    end

    local ok, result = pcall(function()
        return exports[PHONE_RESOURCE]:CloseApp({
            app = APP_IDENTIFIER
        })
    end)

    if not ok then
        return false
    end

    return result ~= false
end

RegisterNUICallback('proxyUiEvent', function(data, cb)
    data = type(data) == 'table' and data or {}

    local eventName = tostring(data.eventName or '')
    local payload = type(data.payload) == 'table' and data.payload or {}

    if eventName == '' then
        cb({ ok = false, error = 'missing event name' })
        return
    end

    if GetResourceState(APP_RESOURCE) ~= 'started' or not exports[APP_RESOURCE] or not exports[APP_RESOURCE].HandleEmbeddedUiEvent then
        cb({ ok = false, error = 'gum-esro is not ready' })
        return
    end

    local ok, handled, errorMessage = pcall(function()
        return exports[APP_RESOURCE]:HandleEmbeddedUiEvent(eventName, payload)
    end)

    if not ok then
        cb({ ok = false, error = 'embedded ui proxy failed' })
        return
    end

    cb({
        ok = handled ~= false,
        error = errorMessage
    })
end)

local function buildAppDefinition()
    return {
        identifier = APP_IDENTIFIER,
        resourceName = APP_RESOURCE,
        name = 'ESRO',
        description = 'Relay chat, expeditions, party rosters, and profile telemetry.',
        developer = 'Gum',
        images = { getAppIcon() },
        ui = ('%s/ui/index.html'):format(APP_RESOURCE),
        defaultApp = false,
        removable = true,
        size = 84200,
        price = 0,
        icon = getAppIcon(),
        onOpen = function()
            return exports[APP_RESOURCE]:OpenFromPhone({
                embeddedMode = true,
                source = PHONE_RESOURCE
            })
        end,
        onClose = function()
            return exports[APP_RESOURCE]:CloseFromPhone({
                embeddedMode = true,
                source = PHONE_RESOURCE
            })
        end,
    }
end

local function registerLbPhoneApp()
    if appRegistered or registrationPending then
        return
    end

    if GetResourceState(PHONE_RESOURCE) ~= 'started' or GetResourceState(APP_RESOURCE) ~= 'started' then
        return
    end

    registrationPending = true

    CreateThread(function()
        Wait(750)

        if GetResourceState(PHONE_RESOURCE) ~= 'started' or GetResourceState(APP_RESOURCE) ~= 'started' then
            registrationPending = false
            return
        end

        pcall(function()
            exports[PHONE_RESOURCE]:RemoveCustomApp(APP_IDENTIFIER)
        end)

        local ok, success, errorMessage = pcall(function()
            return exports[PHONE_RESOURCE]:AddCustomApp(buildAppDefinition())
        end)

        registrationPending = false

        if ok and success then
            appRegistered = true

            pcall(function()
                exports[PHONE_RESOURCE]:SetAppInstalled(APP_IDENTIFIER, false)
            end)

            return
        end

        if ok and type(errorMessage) == 'string' and errorMessage:lower():find('already') then
            appRegistered = true

            pcall(function()
                exports[PHONE_RESOURCE]:SetAppInstalled(APP_IDENTIFIER, false)
            end)

            return
        end

        if ok then
            notifyBridgeIssue(('Failed to register ESRO in LBPhone: %s'):format(errorMessage or 'unknown reason'))
            return
        end

        if not ok then
            notifyBridgeIssue('Failed to register ESRO in LBPhone.')
        end
    end)
end

exports('OpenFromPhone', openEsroFromPhone)
exports('OpenESRO', openEsroFromPhone)
exports('OpenLBPhone', openEsroFromPhone)
exports('SendEmbeddedAppMessage', sendEmbeddedAppMessage)
exports('CloseEmbeddedApp', closeEmbeddedApp)

RegisterNetEvent('gum-esro-lbphone:client:OpenFromPhone', openEsroFromPhone)
RegisterNetEvent('gum-esro-lbphone:client:OpenESRO', openEsroFromPhone)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() or resourceName == PHONE_RESOURCE or resourceName == APP_RESOURCE then
        registerLbPhoneApp()
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() and GetResourceState(PHONE_RESOURCE) == 'started' then
        pcall(function()
            exports[PHONE_RESOURCE]:RemoveCustomApp(APP_IDENTIFIER)
        end)
    end

    if resourceName == PHONE_RESOURCE or resourceName == APP_RESOURCE then
        appRegistered = false
        registrationPending = false
    end
end)

CreateThread(function()
    registerLbPhoneApp()
end)