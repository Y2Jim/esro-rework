ESRO = ESRO or {}

RegisterNetEvent(ESRO.Events.RequestBootstrap, function()
    local src = source
    local ok, snapshot, errorText = pcall(ESRO.BuildBootstrapSnapshot, src)

    if not ok then
        TriggerClientEvent(ESRO.Events.ReceiveBootstrap, src, {
            ok = false,
            error = 'bootstrap crashed'
        })
        print(('[gum-esro-rework] requestBootstrap failed for %s: %s'):format(src, tostring(snapshot)))
        return
    end

    if not snapshot then
        TriggerClientEvent(ESRO.Events.ReceiveBootstrap, src, {
            ok = false,
            error = errorText or 'bootstrap failed'
        })
        return
    end

    TriggerClientEvent(ESRO.Events.ReceiveBootstrap, src, {
        ok = true,
        snapshot = snapshot
    })
end)

RegisterNetEvent(ESRO.Events.RefreshSnapshot, function()
    local src = source
    local ok, snapshot, errorText = pcall(ESRO.BuildBootstrapSnapshot, src)

    if not ok then
        TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
            ok = false,
            error = 'refresh crashed'
        })
        print(('[gum-esro-rework] refreshSnapshot failed for %s: %s'):format(src, tostring(snapshot)))
        return
    end

    if not snapshot then
        TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
            ok = false,
            error = errorText or 'refresh failed'
        })
        return
    end

    TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
        ok = true,
        snapshot = snapshot
    })
end)

RegisterNetEvent(ESRO.Events.MarkNotificationRead, function(notificationId)
    local src = source
    ESRO.MarkNotificationRead(src, notificationId)
end)

AddEventHandler('playerDropped', function()
    ESRO.Runtime = ESRO.Runtime or {}
    ESRO.Runtime.profiles = ESRO.Runtime.profiles or {}
    ESRO.Runtime.profiles[source] = nil
end)

RegisterCommand('esroreworktestnotify', function(src)
    if src == 0 then
        return
    end

    local notificationId = ESRO.EnqueueNotification(src, 'contract_update', {
        title = 'ESRO debug',
        body = 'Embedded UI path verified from debug notification.',
        dedupeKey = ('debug_notify:%s:%s'):format(src, ESRO.Shared.Now()),
        deeplink = { screen = 'contracts', tab = 'board' }
    })

    if notificationId then
        TriggerClientEvent(ESRO.Events.ReceiveSnapshot, src, {
            ok = true,
            snapshot = ESRO.BuildBootstrapSnapshot(src)
        })
    end
end, false)

RegisterCommand('esroreworktestgame', function(src)
    if src == 0 then
        return
    end

    ESRO.PushGameSummary(src, 'debug relay line: embedded terminal path verified')
end, false)