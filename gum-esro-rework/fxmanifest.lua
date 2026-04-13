fx_version 'cerulean'
game 'gta5'

name 'gum-esro-rework'
description 'ESRO rework as a chat-first LB Phone app'
author 'GitHub Copilot'
version '0.1.0'

lua54 'yes'

ui_page 'ui/index.html'

files {
    'ui/index.html',
    'ui/style.css',
    'ui/app.js',
    'ui/assets/*.png'
}

shared_scripts {
    'shared/bootstrap.lua',
    'shared/events.lua',
    'shared/utils.lua',
    'shared/config/*.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/db.lua',
    'server/profiles.lua',
    'server/chat.lua',
    'server/notifications.lua',
    'server/expeditions.lua',
    'server/contracts.lua',
    'server/factions.lua',
    'server/crafting.lua',
    'server/rolling.lua',
    'server/bootstrap.lua',
    'server/main.lua'
}

client_scripts {
    'client/main.lua'
}

dependencies {
    'oxmysql',
    'ox_lib',
    'lb-phone'
}