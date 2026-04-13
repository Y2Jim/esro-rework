ESRO = ESRO or {}

ESRO.Events = {
    RequestBootstrap = 'gum-esro-rework:server:requestBootstrap',
    ReceiveBootstrap = 'gum-esro-rework:client:receiveBootstrap',
    RefreshSnapshot = 'gum-esro-rework:server:refreshSnapshot',
    ReceiveSnapshot = 'gum-esro-rework:client:receiveSnapshot',

    SendChatMessage = 'gum-esro-rework:server:sendChatMessage',
    ReceiveChatMessage = 'gum-esro-rework:client:receiveChatMessage',
    ReceivePinnedNotice = 'gum-esro-rework:client:receivePinnedNotice',

    StartExpedition = 'gum-esro-rework:server:startExpedition',
    ClaimExpedition = 'gum-esro-rework:server:claimExpedition',
    ReceiveExpeditionUpdate = 'gum-esro-rework:client:receiveExpeditionUpdate',

    CreateContract = 'gum-esro-rework:server:createContract',
    AcceptContract = 'gum-esro-rework:server:acceptContract',
    CompleteContract = 'gum-esro-rework:server:completeContract',
    ReceiveContractUpdate = 'gum-esro-rework:client:receiveContractUpdate',

    CraftItem = 'gum-esro-rework:server:craftItem',
    PerformRoll = 'gum-esro-rework:server:performRoll',
    ExchangeSalvage = 'gum-esro-rework:server:exchangeSalvage',
    SetActiveTitle = 'gum-esro-rework:server:setActiveTitle',
    DepositFactionMaterials = 'gum-esro-rework:server:depositFactionMaterials',
    ContributeHubProject = 'gum-esro-rework:server:contributeHubProject',

    ReceiveNotification = 'gum-esro-rework:client:receiveNotification',
    MarkNotificationRead = 'gum-esro-rework:server:markNotificationRead',

    OpenApp = 'gum-esro-rework:client:openApp',
    CloseApp = 'gum-esro-rework:client:closeApp'
}