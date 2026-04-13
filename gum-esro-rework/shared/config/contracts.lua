Config = Config or {}

Config.Contracts = {
    types = {
        public = {
            id = 'public',
            label = 'Public',
            allowPosting = true,
            allowFactionScope = false
        },
        faction = {
            id = 'faction',
            label = 'Faction',
            allowPosting = true,
            allowFactionScope = true
        },
        request = {
            id = 'request',
            label = 'Request',
            allowPosting = true,
            allowFactionScope = false
        },
        group = {
            id = 'group',
            label = 'Group',
            allowPosting = true,
            allowFactionScope = false
        },
        event = {
            id = 'event',
            label = 'Event',
            allowPosting = false,
            allowFactionScope = true
        },
        zone = {
            id = 'zone',
            label = 'Zone',
            allowPosting = false,
            allowFactionScope = true
        }
    },
    defaults = {
        maxActivePlayerPosts = 3,
        expirationSeconds = 86400,
        bookmarkLimit = 20
    },
    templates = {
        relay_support = {
            id = 'relay_support',
            type = 'public',
            title = 'Relay support requested',
            summary = 'Deliver support crates to stabilize a local relay.',
            rewardPreview = { xp = 20, contribution = 5 }
        },
        archive_request = {
            id = 'archive_request',
            type = 'request',
            title = 'Archive fragments wanted',
            summary = 'Seeking clean archive fragments for private study.',
            rewardPreview = { materials = { relay_tokens = 1 } }
        },
        faction_push = {
            id = 'faction_push',
            type = 'faction',
            title = 'Faction materials needed',
            summary = 'Deposit core materials to keep the hub work moving.',
            rewardPreview = { contribution = 8, xp = 15 }
        }
    }
}