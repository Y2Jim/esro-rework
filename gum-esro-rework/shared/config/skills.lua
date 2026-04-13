Config = Config or {}

Config.Skills = {
    scavenging = {
        id = 'scavenging',
        label = 'Scavenging',
        summary = 'Improves material yield on recovery-focused runs.',
        maxLevel = 10,
        expeditionYieldBonus = 0.03,
        craftingSupportBonus = 0.00
    },
    analysis = {
        id = 'analysis',
        label = 'Analysis',
        summary = 'Improves archive quality and discovery rolls.',
        maxLevel = 10,
        expeditionYieldBonus = 0.00,
        discoveryQualityBonus = 0.03
    },
    fabrication = {
        id = 'fabrication',
        label = 'Fabrication',
        summary = 'Improves crafting output efficiency and build work.',
        maxLevel = 10,
        craftingCostReduction = 0.02,
        hubContributionBonus = 0.03
    },
    logistics = {
        id = 'logistics',
        label = 'Logistics',
        summary = 'Improves prep efficiency and supply throughput.',
        maxLevel = 10,
        expeditionDurationReduction = 0.02,
        depositBonus = 0.02
    },
    networking = {
        id = 'networking',
        label = 'Networking',
        summary = 'Supports contracts, invites, and coordination tasks.',
        maxLevel = 10,
        contractRewardBonus = 0.02,
        socialPriorityWeight = 1
    },
    surveying = {
        id = 'surveying',
        label = 'Surveying',
        summary = 'Improves recon and zone-pressure contributions.',
        maxLevel = 10,
        reconSuccessBonus = 0.03,
        zonePressureBonus = 0.03
    },
    recovery = {
        id = 'recovery',
        label = 'Recovery',
        summary = 'Improves repair actions and safe returns.',
        maxLevel = 10,
        failureMitigation = 0.03,
        repairContributionBonus = 0.03
    },
    security = {
        id = 'security',
        label = 'Security',
        summary = 'Improves hostile-event mitigation and convoy safety.',
        maxLevel = 10,
        hostileRiskReduction = 0.03,
        defenseContributionBonus = 0.03
    }
}

Config.SkillOrder = {
    'scavenging',
    'analysis',
    'fabrication',
    'logistics',
    'networking',
    'surveying',
    'recovery',
    'security'
}