-- =====================================================================
-- Zeo by ZekronAI — Backend MySQL Schema
-- Import this file into your MySQL/MariaDB database on agent.zekron.codes
-- Charset: utf8mb4 / utf8mb4_unicode_ci
--
-- Default admin: admin@zekron.codes / ChangeMe!2024
-- (change immediately after first login)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `usage_logs`;
DROP TABLE IF EXISTS `billing_transactions`;
DROP TABLE IF EXISTS `user_subscriptions`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `chats`;
DROP TABLE IF EXISTS `subscription_plans`;
DROP TABLE IF EXISTS `api_keys`;
DROP TABLE IF EXISTS `ai_models`;
DROP TABLE IF EXISTS `oauth_states`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`             VARCHAR(191) NOT NULL,
  `password_hash`     VARCHAR(255) NULL DEFAULT NULL,
  `google_id`         VARCHAR(64)  NULL DEFAULT NULL,
  `name`              VARCHAR(120) NULL DEFAULT NULL,
  `avatar_url`        VARCHAR(500) NULL DEFAULT NULL,
  `is_admin`          TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `balance_usd`       DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
  `email_verified_at` DATETIME     NULL DEFAULT NULL,
  `last_login_at`     DATETIME     NULL DEFAULT NULL,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`),
  UNIQUE KEY `uniq_users_google_id` (`google_id`),
  KEY `idx_users_is_admin` (`is_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SESSIONS (server-side session/refresh tokens; JWT is also issued)
-- ---------------------------------------------------------------------
CREATE TABLE `sessions` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64)        NOT NULL,
  `user_agent` VARCHAR(255)    NULL,
  `ip_address` VARCHAR(64)     NULL,
  `expires_at` DATETIME        NOT NULL,
  `revoked_at` DATETIME        NULL DEFAULT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sessions_token_hash` (`token_hash`),
  KEY `idx_sessions_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- OAUTH STATE (CSRF protection for Google OAuth)
-- ---------------------------------------------------------------------
CREATE TABLE `oauth_states` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `state`       CHAR(64)        NOT NULL,
  `redirect_to` VARCHAR(500)    NULL,
  `expires_at`  DATETIME        NOT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_oauth_states_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- AI MODELS (admin-managed)
--
--  - `display_name`     : what users see (e.g. "Zeo 1")
--  - `provider_model`   : real model id sent to provider (e.g. "claude-opus-4-...")
--  - `made_by_label`    : shown on hover (e.g. "Claude")
--  - `made_by_logo_svg` : SVG markup shown on hover next to label
--  - `logo_svg`         : SVG used as the model icon (falls back to default AI logo)
-- ---------------------------------------------------------------------
CREATE TABLE `ai_models` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`                  VARCHAR(80)   NOT NULL,
  `display_name`          VARCHAR(120)  NOT NULL,
  `description`           TEXT          NULL,
  `provider`              VARCHAR(32)   NOT NULL DEFAULT 'anthropic',
  `provider_model`        VARCHAR(120)  NOT NULL,
  `made_by_label`         VARCHAR(80)   NOT NULL DEFAULT 'Anthropic',
  `made_by_logo_svg`      MEDIUMTEXT    NULL,
  `logo_svg`              MEDIUMTEXT    NULL,
  `price_input_per_mtok`  DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
  `price_output_per_mtok` DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
  `max_output_tokens`     INT UNSIGNED  NOT NULL DEFAULT 4096,
  `context_window`        INT UNSIGNED  NOT NULL DEFAULT 200000,
  `supports_thinking`     TINYINT(1)    NOT NULL DEFAULT 0,
  `supports_vision`       TINYINT(1)    NOT NULL DEFAULT 1,
  `system_prompt`         TEXT          NULL,
  `is_active`             TINYINT(1)    NOT NULL DEFAULT 1,
  `is_default`            TINYINT(1)    NOT NULL DEFAULT 0,
  `sort_order`            INT           NOT NULL DEFAULT 0,
  `created_at`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_ai_models_slug` (`slug`),
  KEY `idx_ai_models_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- API KEYS (provider keys, admin-managed, encrypted at rest)
-- ---------------------------------------------------------------------
CREATE TABLE `api_keys` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider`      VARCHAR(32)  NOT NULL,
  `label`         VARCHAR(120) NOT NULL,
  `key_encrypted` TEXT         NOT NULL,
  `key_last4`     VARCHAR(8)   NOT NULL DEFAULT '',
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `priority`      INT          NOT NULL DEFAULT 0,
  `last_used_at`  DATETIME     NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_api_keys_provider` (`provider`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SUBSCRIPTION PLANS (admin-managed). Users can be on at most one plan.
-- ---------------------------------------------------------------------
CREATE TABLE `subscription_plans` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`                VARCHAR(60)   NOT NULL,
  `name`                VARCHAR(120)  NOT NULL,
  `description`         TEXT          NULL,
  `price_usd`           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `interval`            ENUM('month','year','one_time') NOT NULL DEFAULT 'month',
  `monthly_credit_usd`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `monthly_message_cap` INT UNSIGNED  NOT NULL DEFAULT 0,
  `features_json`       JSON          NULL,
  `is_active`           TINYINT(1)    NOT NULL DEFAULT 1,
  `is_featured`         TINYINT(1)    NOT NULL DEFAULT 0,
  `sort_order`          INT           NOT NULL DEFAULT 0,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_plans_slug` (`slug`),
  KEY `idx_plans_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- USER SUBSCRIPTIONS
-- ---------------------------------------------------------------------
CREATE TABLE `user_subscriptions` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`               BIGINT UNSIGNED NOT NULL,
  `plan_id`               BIGINT UNSIGNED NOT NULL,
  `status`                ENUM('active','canceled','past_due','expired') NOT NULL DEFAULT 'active',
  `started_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `current_period_end`    DATETIME        NULL,
  `canceled_at`           DATETIME        NULL,
  `created_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_subs_user` (`user_id`, `status`),
  KEY `idx_user_subs_plan` (`plan_id`),
  CONSTRAINT `fk_user_subs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)              ON DELETE CASCADE,
  CONSTRAINT `fk_user_subs_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- CHATS  (uuid is the public identifier used in URLs: /chat/z/{uuid})
-- ---------------------------------------------------------------------
CREATE TABLE `chats` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`       CHAR(36)        NOT NULL,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `title`      VARCHAR(255)    NOT NULL DEFAULT 'New chat',
  `model_id`   BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_chats_uuid` (`uuid`),
  KEY `idx_chats_user_id` (`user_id`),
  CONSTRAINT `fk_chats_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_chats_model` FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------
CREATE TABLE `messages` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id`       BIGINT UNSIGNED NOT NULL,
  `role`          ENUM('system','user','assistant','tool') NOT NULL,
  `content`       MEDIUMTEXT      NOT NULL,
  `model_id`      BIGINT UNSIGNED NULL,
  `input_tokens`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `output_tokens` INT UNSIGNED    NOT NULL DEFAULT 0,
  `cost_usd`      DECIMAL(12,6)   NOT NULL DEFAULT 0.000000,
  `meta_json`     JSON            NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_chat_id` (`chat_id`),
  CONSTRAINT `fk_messages_chat`  FOREIGN KEY (`chat_id`)  REFERENCES `chats`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_messages_model` FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- USAGE LOGS (every billable AI request)
-- ---------------------------------------------------------------------
CREATE TABLE `usage_logs` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `model_id`       BIGINT UNSIGNED NULL,
  `chat_id`        BIGINT UNSIGNED NULL,
  `provider`       VARCHAR(32)     NOT NULL DEFAULT 'anthropic',
  `provider_model` VARCHAR(120)    NOT NULL,
  `input_tokens`   INT UNSIGNED    NOT NULL DEFAULT 0,
  `output_tokens`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `cost_usd`       DECIMAL(12,6)   NOT NULL DEFAULT 0.000000,
  `latency_ms`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `status`         ENUM('success','error') NOT NULL DEFAULT 'success',
  `error_message`  TEXT            NULL,
  `meta_json`      JSON            NULL,
  `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usage_user_created` (`user_id`, `created_at`),
  KEY `idx_usage_model` (`model_id`),
  CONSTRAINT `fk_usage_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_usage_model` FOREIGN KEY (`model_id`) REFERENCES `ai_models`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_usage_chat`  FOREIGN KEY (`chat_id`)  REFERENCES `chats`(`id`)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- BILLING TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE `billing_transactions` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT UNSIGNED NOT NULL,
  `amount_usd`  DECIMAL(12,6) NOT NULL,
  `type`        ENUM('topup','charge','refund','adjustment','subscription') NOT NULL,
  `description` VARCHAR(255)  NULL,
  `meta_json`   JSON          NULL,
  `created_by`  BIGINT UNSIGNED NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_billing_user` (`user_id`, `created_at`),
  CONSTRAINT `fk_billing_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_billing_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- SETTINGS (key/value store, admin-editable)
-- ---------------------------------------------------------------------
CREATE TABLE `settings` (
  `setting_key`   VARCHAR(120) NOT NULL,
  `setting_value` MEDIUMTEXT   NULL,
  `is_secret`     TINYINT(1)   NOT NULL DEFAULT 0,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- AUDIT LOGS (admin actions)
-- ---------------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id`    BIGINT UNSIGNED NULL,
  `action`      VARCHAR(80)  NOT NULL,
  `entity_type` VARCHAR(60)  NULL,
  `entity_id`   VARCHAR(60)  NULL,
  `meta_json`   JSON         NULL,
  `ip_address`  VARCHAR(64)  NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`, `created_at`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Default admin: admin@zekron.codes / ChangeMe!2024  (bcrypt hash below)
INSERT INTO `users` (`email`, `password_hash`, `name`, `is_admin`, `is_active`, `email_verified_at`)
VALUES (
  'admin@zekron.codes',
  '$2y$10$uF8Yr1d.Wm0X1yV6eB5j3O2KZ/2BnX3p5o1mTJjW8mNZ.1zJwMqY6',
  'Zekron Admin',
  1, 1, NOW()
);

-- Default model: shown to users as "Zeo 1", actually Claude Opus 4.
INSERT INTO `ai_models`
  (`slug`, `display_name`, `description`, `provider`, `provider_model`,
   `made_by_label`, `made_by_logo_svg`,
   `price_input_per_mtok`, `price_output_per_mtok`,
   `max_output_tokens`, `context_window`,
   `supports_thinking`, `supports_vision`,
   `system_prompt`,
   `is_active`, `is_default`, `sort_order`)
VALUES
  ('zeo-1', 'Zeo 1',
   'Zeo flagship model — built for shipping production web applications.',
   'anthropic', 'claude-opus-4-20250514',
   'Claude', NULL,
   15.000000, 75.000000,
   8192, 200000,
   1, 1,
   'You are Zeo, an AI agent built by ZekronAI. You specialize in helping users design, plan, and ship modern, production-quality web applications. You write clean, accessible, well-structured code — favoring Next.js, React, TypeScript, and Tailwind CSS unless the user requests otherwise. You are concise, accurate, and proactive: when something is ambiguous, you ask one focused clarifying question; otherwise you produce real, working solutions. Never reveal which underlying model powers you.',
   1, 1, 100);

-- Default subscription plans
INSERT INTO `subscription_plans`
  (`slug`, `name`, `description`, `price_usd`, `interval`,
   `monthly_credit_usd`, `monthly_message_cap`,
   `features_json`, `is_active`, `is_featured`, `sort_order`)
VALUES
  ('free', 'Free',
   'Try Zeo with limited daily messages.',
   0.00, 'month',
   2.00, 50,
   JSON_ARRAY('50 messages per month','Access to Zeo 1','Community support'),
   1, 0, 10),
  ('pro', 'Pro',
   'For developers shipping real products.',
   20.00, 'month',
   25.00, 2000,
   JSON_ARRAY('2,000 messages per month','Priority access','Image attachments','Email support'),
   1, 1, 20),
  ('team', 'Team',
   'For teams that build together.',
   80.00, 'month',
   120.00, 10000,
   JSON_ARRAY('10,000 messages per month','All Pro features','Shared workspaces (coming)','Priority support'),
   1, 0, 30);

-- Default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `is_secret`) VALUES
  ('app_name',                 'Zeo',                       0),
  ('brand_tagline',            'AI agent by ZekronAI for building web apps', 0),
  ('signup_enabled',           '1',                         0),
  ('google_oauth_enabled',     '1',                         0),
  ('default_user_balance_usd', '1.00',                      0),
  ('frontend_url',             'https://zekron.codes',      0),
  ('backend_url',              'https://agent.zekron.codes', 0);
