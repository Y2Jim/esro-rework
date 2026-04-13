CREATE TABLE IF NOT EXISTS `esro_profiles` (
    `identifier` VARCHAR(64) NOT NULL,
    `handle` VARCHAR(64) NOT NULL,
    `display_name` VARCHAR(64) DEFAULT NULL,
    `title_id` VARCHAR(64) NOT NULL,
    `faction_id` VARCHAR(32) NOT NULL,
    `race_id` VARCHAR(32) DEFAULT NULL,
    `level` INT NOT NULL DEFAULT 1,
    `xp` INT NOT NULL DEFAULT 0,
    `badge_json` LONGTEXT NOT NULL,
    `settings_json` LONGTEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identifier`),
    UNIQUE KEY `uniq_esro_profiles_handle` (`handle`)
);

CREATE TABLE IF NOT EXISTS `esro_profile_skills` (
    `identifier` VARCHAR(64) NOT NULL,
    `skill_id` VARCHAR(32) NOT NULL,
    `level` INT NOT NULL DEFAULT 1,
    `xp` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`identifier`, `skill_id`)
);

CREATE TABLE IF NOT EXISTS `esro_profile_inventory` (
    `identifier` VARCHAR(64) NOT NULL,
    `item_id` VARCHAR(64) NOT NULL,
    `amount` INT NOT NULL DEFAULT 0,
    `item_type` VARCHAR(32) NOT NULL,
    `item_meta_json` LONGTEXT DEFAULT NULL,
    PRIMARY KEY (`identifier`, `item_id`)
);

CREATE TABLE IF NOT EXISTS `esro_profile_roll_state` (
    `identifier` VARCHAR(64) NOT NULL,
    `common_currency` INT NOT NULL DEFAULT 0,
    `rare_currency` INT NOT NULL DEFAULT 0,
    `standard_pity` INT NOT NULL DEFAULT 0,
    `salvage` INT NOT NULL DEFAULT 0,
    `history_json` LONGTEXT NOT NULL,
    PRIMARY KEY (`identifier`)
);

CREATE TABLE IF NOT EXISTS `esro_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `channel_id` VARCHAR(32) NOT NULL,
    `sender_identifier` VARCHAR(64) NOT NULL,
    `sender_handle` VARCHAR(64) NOT NULL,
    `sender_title_id` VARCHAR(64) NOT NULL,
    `message` VARCHAR(220) NOT NULL,
    `scope_type` VARCHAR(32) NOT NULL DEFAULT 'global',
    `scope_key` VARCHAR(64) NOT NULL DEFAULT '',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_esro_messages_channel` (`channel_id`),
    KEY `idx_esro_messages_scope` (`scope_key`),
    KEY `idx_esro_messages_created` (`created_at`)
);

CREATE TABLE IF NOT EXISTS `esro_channel_pins` (
    `channel_id` VARCHAR(32) NOT NULL,
    `scope_key` VARCHAR(64) NOT NULL DEFAULT '',
    `pinned_by` VARCHAR(64) NOT NULL,
    `message` VARCHAR(220) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`channel_id`, `scope_key`)
);

CREATE TABLE IF NOT EXISTS `esro_expeditions` (
    `id` VARCHAR(64) NOT NULL,
    `owner_identifier` VARCHAR(64) NOT NULL,
    `party_json` LONGTEXT NOT NULL,
    `expedition_id` VARCHAR(32) NOT NULL,
    `status` VARCHAR(24) NOT NULL,
    `loadout_json` LONGTEXT NOT NULL,
    `started_at` INT NOT NULL,
    `ends_at` INT NOT NULL,
    `resolved_at` INT DEFAULT NULL,
    `result_json` LONGTEXT DEFAULT NULL,
    `claimed_at` INT DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_esro_expeditions_owner` (`owner_identifier`),
    KEY `idx_esro_expeditions_status` (`status`),
    KEY `idx_esro_expeditions_ends_at` (`ends_at`)
);

CREATE TABLE IF NOT EXISTS `esro_contracts` (
    `id` VARCHAR(64) NOT NULL,
    `type_id` VARCHAR(32) NOT NULL,
    `scope_id` VARCHAR(32) NOT NULL,
    `poster_identifier` VARCHAR(64) NOT NULL,
    `faction_id` VARCHAR(32) DEFAULT NULL,
    `title` VARCHAR(96) NOT NULL,
    `summary` VARCHAR(180) NOT NULL,
    `requirements_json` LONGTEXT NOT NULL,
    `reward_preview_json` LONGTEXT NOT NULL,
    `status` VARCHAR(24) NOT NULL,
    `assignee_json` LONGTEXT NOT NULL,
    `created_at` INT NOT NULL,
    `expires_at` INT DEFAULT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `esro_factions` (
    `faction_id` VARCHAR(32) NOT NULL,
    `influence` INT NOT NULL DEFAULT 0,
    `weekly_objective_json` LONGTEXT NOT NULL,
    `event_json` LONGTEXT NOT NULL,
    `bonuses_json` LONGTEXT NOT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`faction_id`)
);

CREATE TABLE IF NOT EXISTS `esro_faction_materials` (
    `faction_id` VARCHAR(32) NOT NULL,
    `material_id` VARCHAR(64) NOT NULL,
    `amount` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`faction_id`, `material_id`)
);

CREATE TABLE IF NOT EXISTS `esro_hub_projects` (
    `project_id` VARCHAR(64) NOT NULL,
    `faction_id` VARCHAR(32) NOT NULL,
    `category_id` VARCHAR(32) NOT NULL,
    `level` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(24) NOT NULL,
    `progress_json` LONGTEXT NOT NULL,
    `contributors_json` LONGTEXT NOT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`project_id`)
);

CREATE TABLE IF NOT EXISTS `esro_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(64) NOT NULL,
    `type_id` VARCHAR(32) NOT NULL,
    `priority` VARCHAR(16) NOT NULL,
    `title` VARCHAR(64) NOT NULL,
    `body` VARCHAR(140) NOT NULL,
    `deeplink_json` LONGTEXT NOT NULL,
    `dedupe_key` VARCHAR(128) NOT NULL,
    `state` VARCHAR(16) NOT NULL DEFAULT 'queued',
    `delivered_at` INT DEFAULT NULL,
    `read_at` INT DEFAULT NULL,
    `created_at` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_esro_notifications_identifier` (`identifier`),
    KEY `idx_esro_notifications_state` (`state`),
    UNIQUE KEY `uniq_esro_notifications_dedupe` (`identifier`, `dedupe_key`, `state`)
);

CREATE TABLE IF NOT EXISTS `esro_zones` (
    `zone_id` VARCHAR(32) NOT NULL,
    `controller_faction_id` VARCHAR(32) NOT NULL,
    `pressure_json` LONGTEXT NOT NULL,
    `bonuses_json` LONGTEXT NOT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`zone_id`)
);