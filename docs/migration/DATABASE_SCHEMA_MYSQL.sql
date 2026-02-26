-- ============================================================
-- Artistiya E-Commerce: Complete MySQL 8.0+ Database Schema
-- Full parity with Supabase (PostgreSQL) — ALL tables, functions,
-- triggers, views, enums, and storage equivalents
-- Generated: 2026-02-26 | Updated for complete parity
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION_CONNECTION = 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SECTION A: ENUM EQUIVALENTS (MySQL native ENUMs)
-- Supabase custom_order_status, order_status, payment_method
-- ============================================================
-- Note: MySQL ENUMs are defined inline in column definitions.
-- If you need to add values later:
--   ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed',...,'new_value');

-- ============================================================
-- SECTION B: CORE TABLES (55 tables total)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. USERS & AUTHENTICATION
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `remember_token` VARCHAR(100) NULL,
  `raw_user_meta_data` JSON NULL COMMENT 'Mirrors auth.users.raw_user_meta_data',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `avatar_url` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_profiles_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 2. CATEGORIES & PRODUCTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_bn` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image_url` TEXT NULL,
  `mobile_image_url` TEXT NULL,
  `icon_name` VARCHAR(100) NULL,
  `icon_emoji` VARCHAR(10) NULL,
  `parent_id` CHAR(36) NULL,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  INDEX `idx_categories_parent` (`parent_id`),
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(500) NOT NULL,
  `name_bn` VARCHAR(500) NULL,
  `slug` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `compare_at_price` DECIMAL(12,2) NULL,
  `stock_quantity` INT DEFAULT 0,
  `category_id` CHAR(36) NULL,
  `images` JSON NULL COMMENT 'text[] → JSON array of URLs',
  `features` JSON NULL COMMENT 'text[] → JSON array of strings',
  `is_active` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_new_arrival` TINYINT(1) DEFAULT 0,
  `is_preorderable` TINYINT(1) DEFAULT 0,
  `is_showcase` TINYINT(1) DEFAULT 0,
  `allow_customization` TINYINT(1) DEFAULT 0,
  `customization_only` TINYINT(1) DEFAULT 0,
  `customization_instructions` TEXT NULL,
  `advance_payment_percent` INT NULL,
  `featured_section` VARCHAR(100) NULL,
  `materials` TEXT NULL,
  `materials_bn` TEXT NULL,
  `dimensions` VARCHAR(255) NULL,
  `care_instructions` TEXT NULL,
  `care_instructions_bn` TEXT NULL,
  `story` TEXT NULL,
  `story_bn` TEXT NULL,
  `showcase_description` TEXT NULL,
  `showcase_description_bn` TEXT NULL,
  `production_time` VARCHAR(100) NULL,
  `video_url` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`(191)),
  INDEX `idx_products_category` (`category_id`),
  INDEX `idx_products_active` (`is_active`),
  INDEX `idx_products_featured` (`is_featured`),
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `product_id` CHAR(36) NOT NULL,
  `sku` VARCHAR(100) NULL,
  `color` VARCHAR(100) NULL,
  `color_code` VARCHAR(20) NULL,
  `size` VARCHAR(50) NULL,
  `price_adjustment` DECIMAL(12,2) DEFAULT 0,
  `stock_quantity` INT DEFAULT 0,
  `images` JSON NULL COMMENT 'text[] → JSON array',
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_variants_product` (`product_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_colors` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL,
  `name_bn` VARCHAR(100) NULL,
  `color_code` VARCHAR(20) NOT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_sizes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(50) NOT NULL,
  `name_bn` VARCHAR(50) NULL,
  `category` VARCHAR(100) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `collections` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_bn` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `description_bn` TEXT NULL,
  `image_url` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_featured` TINYINT(1) DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_collections_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `collection_products` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `collection_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_collection_product` (`collection_id`, `product_id`),
  FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3. ADDRESSES & ORDERS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `division` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `thana` VARCHAR(100) NOT NULL,
  `address_line` TEXT NOT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_addresses_user` (`user_id`),
  INDEX `idx_addresses_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_partners` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `contact_phone` VARCHAR(20) NULL,
  `contact_email` VARCHAR(255) NULL,
  `api_type` VARCHAR(50) NULL,
  `api_key` TEXT NULL,
  `notes` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `order_number` VARCHAR(50) NOT NULL,
  `user_id` CHAR(36) NULL,
  `address_id` CHAR(36) NULL,
  `status` ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `payment_method` ENUM('cod','bkash','nagad','bank_transfer') NOT NULL,
  `payment_transaction_id` VARCHAR(255) NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `shipping_cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `total` DECIMAL(12,2) NOT NULL,
  `discount_amount` DECIMAL(12,2) DEFAULT 0,
  `promo_code_id` CHAR(36) NULL,
  `is_preorder` TINYINT(1) DEFAULT 0,
  `is_flagged` TINYINT(1) DEFAULT 0,
  `fraud_score` INT NULL,
  `ip_address` VARCHAR(45) NULL,
  `device_fingerprint` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `tracking_number` VARCHAR(255) NULL,
  `delivery_partner_id` CHAR(36) NULL,
  `partner_payment_status` VARCHAR(50) NULL,
  `partner_payment_amount` DECIMAL(12,2) NULL,
  `partner_payment_date` TIMESTAMP NULL,
  `shipped_at` TIMESTAMP NULL,
  `delivered_at` TIMESTAMP NULL,
  `return_requested_at` TIMESTAMP NULL,
  `return_reason` TEXT NULL,
  `qr_code_id` CHAR(36) NULL,
  `qr_discount_claimed` TINYINT(1) DEFAULT 0,
  `qr_discount_claimed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`order_number`),
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_created` (`created_at`),
  FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `order_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `product_name` VARCHAR(500) NOT NULL,
  `product_price` DECIMAL(12,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `is_preorder` TINYINT(1) DEFAULT 0,
  `customization_details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_items_order` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `customization_details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 4. PAYMENT
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `payment_providers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `provider_type` VARCHAR(50) NOT NULL,
  `payment_mode` VARCHAR(20) DEFAULT 'manual',
  `is_active` TINYINT(1) DEFAULT 0,
  `is_sandbox` TINYINT(1) DEFAULT 1,
  `store_id` TEXT NULL,
  `store_password` TEXT NULL,
  `account_number` VARCHAR(50) NULL,
  `account_type` VARCHAR(50) NULL,
  `qr_code_image` TEXT NULL,
  `instructions` TEXT NULL,
  `instructions_bn` TEXT NULL,
  `config` JSON DEFAULT (JSON_OBJECT()),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `order_id` CHAR(36) NULL,
  `gateway_code` VARCHAR(50) NOT NULL,
  `transaction_id` VARCHAR(255) NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'BDT',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `gateway_response` JSON DEFAULT (JSON_OBJECT()),
  `error_message` TEXT NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_payment_tx_order` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 5. PROMO CODES & DISCOUNTS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `discount_type` VARCHAR(20) NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `min_order_amount` DECIMAL(12,2) NULL,
  `max_discount_amount` DECIMAL(12,2) NULL,
  `usage_limit` INT NULL,
  `used_count` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `applicable_categories` JSON NULL COMMENT 'text[] → JSON array',
  `applicable_products` JSON NULL COMMENT 'text[] → JSON array',
  `starts_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `created_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_promo_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promo_code_usage` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `promo_code_id` CHAR(36) NULL,
  `order_id` CHAR(36) NULL,
  `user_id` CHAR(36) NULL,
  `discount_applied` DECIMAL(12,2) NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_discount_credits` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `discount_value` DECIMAL(12,2) NOT NULL,
  `discount_type` VARCHAR(20) DEFAULT 'percentage',
  `source` VARCHAR(50) DEFAULT 'qr_scan',
  `is_used` TINYINT(1) DEFAULT 0,
  `used_at` TIMESTAMP NULL,
  `order_id` CHAR(36) NULL,
  `used_on_order_id` CHAR(36) NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_credits_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qr_discount_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `discount_type` VARCHAR(20) DEFAULT 'percentage',
  `discount_value` DECIMAL(12,2) NULL,
  `discount_percent` DECIMAL(5,2) NULL,
  `min_order_value` DECIMAL(12,2) NULL,
  `expires_after_days` INT NULL,
  `usage_limit_per_customer` INT NULL,
  `message` TEXT NULL,
  `message_bn` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 6. DELIVERY & SHIPPING
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `delivery_zones` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `division` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NOT NULL,
  `thana` VARCHAR(100) NULL,
  `shipping_cost` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `estimated_days` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_zones_district` (`district`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_providers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `provider_type` VARCHAR(50) NOT NULL,
  `api_key` TEXT NULL,
  `api_secret` TEXT NULL,
  `config` JSON DEFAULT (JSON_OBJECT()),
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 7. CHECKOUT & FRAUD
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `checkout_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `default_shipping_cost` DECIMAL(12,2) DEFAULT 120,
  `free_shipping_threshold` DECIMAL(12,2) NULL,
  `cod_enabled` TINYINT(1) DEFAULT 1,
  `cod_extra_charge` DECIMAL(12,2) DEFAULT 0,
  `min_order_amount` DECIMAL(12,2) NULL,
  `require_phone` TINYINT(1) DEFAULT 1,
  `require_address` TINYINT(1) DEFAULT 1,
  `show_promo_code` TINYINT(1) DEFAULT 1,
  `show_order_notes` TINYINT(1) DEFAULT 1,
  `show_gift_message` TINYINT(1) DEFAULT 0,
  `show_shipping_calculator` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `checkout_fraud_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `max_orders_per_phone_24h` INT DEFAULT 5,
  `order_rate_limit_seconds` INT DEFAULT 30,
  `max_cod_amount_new_customer` DECIMAL(12,2) NULL,
  `block_suspicious_orders` TINYINT(1) DEFAULT 0,
  `guest_checkout_enabled` TINYINT(1) DEFAULT 1,
  `require_captcha_for_guest` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blocked_customers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `block_reason` TEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `blocked_by` CHAR(36) NULL,
  `blocked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unblocked_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_blocked_phone` (`phone`),
  INDEX `idx_blocked_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_fraud_flags` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `order_id` CHAR(36) NULL,
  `flag_type` VARCHAR(100) NOT NULL,
  `flag_reason` TEXT NOT NULL,
  `severity` VARCHAR(20) DEFAULT 'medium',
  `is_resolved` TINYINT(1) DEFAULT 0,
  `resolved_by` CHAR(36) NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_fraud_order` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `abandoned_carts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `full_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `cart_data` JSON DEFAULT (JSON_ARRAY()),
  `cart_total` DECIMAL(12,2) DEFAULT 0,
  `last_activity_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `is_recovered` TINYINT(1) DEFAULT 0,
  `recovered_order_id` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_abandoned_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 8. REVIEWS & TESTIMONIALS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `is_approved` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reviews_product` (`product_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `order_id` CHAR(36) NULL,
  `order_number` VARCHAR(50) NOT NULL,
  `reviewer_name` VARCHAR(255) NULL,
  `rating` INT NOT NULL,
  `review_text` TEXT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `admin_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_reviews_product` (`product_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) NULL,
  `text` TEXT NOT NULL,
  `rating` INT DEFAULT 5,
  `image_url` TEXT NULL,
  `customer_photo_url` TEXT NULL,
  `source` VARCHAR(50) DEFAULT 'manual',
  `platform` VARCHAR(50) DEFAULT 'manual',
  `google_review_id` VARCHAR(255) NULL,
  `google_place_id` VARCHAR(255) NULL,
  `product_id` CHAR(36) NULL,
  `order_id` CHAR(36) NULL,
  `review_date` TIMESTAMP NULL,
  `verified_purchase` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 9. CMS & HOMEPAGE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` TEXT NULL,
  `title_highlight` TEXT NULL,
  `title_end` TEXT NULL,
  `badge_text` TEXT NULL,
  `description` TEXT NULL,
  `button_text` VARCHAR(255) DEFAULT 'Shop Now',
  `button_link` VARCHAR(500) DEFAULT '/shop',
  `secondary_button_text` VARCHAR(255) NULL,
  `secondary_button_link` VARCHAR(500) NULL,
  `image_url` TEXT NULL,
  `image_link_url` TEXT NULL,
  `image_fit` VARCHAR(20) DEFAULT 'cover',
  `text_alignment` VARCHAR(20) DEFAULT 'left',
  `animation_type` VARCHAR(20) DEFAULT 'fade',
  `overlay_enabled` TINYINT(1) DEFAULT 1,
  `overlay_opacity` INT DEFAULT 40,
  `overlay_position` VARCHAR(20) DEFAULT 'left',
  `show_title` TINYINT(1) DEFAULT 1,
  `show_description` TINYINT(1) DEFAULT 1,
  `show_badge` TINYINT(1) DEFAULT 1,
  `show_primary_button` TINYINT(1) DEFAULT 1,
  `show_secondary_button` TINYINT(1) DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `featured_sections` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `section_key` VARCHAR(100) NOT NULL DEFAULT '',
  `title_line1` TEXT NULL,
  `title_highlight` TEXT NULL,
  `badge_text` TEXT NULL,
  `description` TEXT NULL,
  `button_text` VARCHAR(255) NULL,
  `button_link` VARCHAR(500) NULL,
  `image_url` TEXT NULL,
  `price_text` VARCHAR(100) NULL,
  `features` JSON NULL COMMENT 'text[] → JSON array',
  `layout` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `making_section` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title_line1` TEXT NULL,
  `title_highlight` TEXT NULL,
  `badge_text` TEXT NULL,
  `description` TEXT NULL,
  `button_text` VARCHAR(255) NULL,
  `button_link` VARCHAR(500) NULL,
  `background_image_url` TEXT NULL,
  `overlay_opacity` INT NULL,
  `stat1_number` VARCHAR(50) NULL,
  `stat1_label` VARCHAR(100) NULL,
  `stat2_number` VARCHAR(50) NULL,
  `stat2_label` VARCHAR(100) NULL,
  `stat3_number` VARCHAR(50) NULL,
  `stat3_label` VARCHAR(100) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `homepage_content` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `section_key` VARCHAR(100) NOT NULL,
  `content` JSON NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT NULL,
  `instagram_access_token` TEXT NULL,
  `instagram_user_id` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `homepage_sections` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `section_type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `subtitle` TEXT NULL,
  `config` JSON NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_pages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `page_key` VARCHAR(100) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `title_bn` VARCHAR(500) NULL,
  `content` LONGTEXT NOT NULL,
  `content_bn` LONGTEXT NULL,
  `meta_title` VARCHAR(255) NULL,
  `meta_description` TEXT NULL,
  `lang1_label` VARCHAR(50) NULL,
  `lang2_label` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_content_pages_key` (`page_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faq_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `question` TEXT NOT NULL,
  `question_bn` TEXT NULL,
  `answer` TEXT NOT NULL,
  `answer_bn` TEXT NULL,
  `category` VARCHAR(255) NOT NULL,
  `category_bn` VARCHAR(255) NULL,
  `page_type` VARCHAR(50) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 10. BLOG
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `blog_categories` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_bn` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `parent_id` CHAR(36) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_blog_cat_slug` (`slug`),
  FOREIGN KEY (`parent_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(500) NOT NULL,
  `title_bn` VARCHAR(500) NULL,
  `slug` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `content_bn` LONGTEXT NULL,
  `excerpt` TEXT NULL,
  `excerpt_bn` TEXT NULL,
  `featured_image` TEXT NULL,
  `category_id` CHAR(36) NULL,
  `author_id` CHAR(36) NULL,
  `is_published` TINYINT(1) DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `published_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_blog_slug` (`slug`(191)),
  FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `blog_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `is_blog_active` TINYINT(1) DEFAULT 1,
  `posts_per_page` INT DEFAULT 10,
  `show_banner` TINYINT(1) DEFAULT 0,
  `banner_title` VARCHAR(500) NULL,
  `banner_title_bn` VARCHAR(500) NULL,
  `banner_image_url` TEXT NULL,
  `banner_link` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 11. GALLERY & MEDIA
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `gallery_albums` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `title_bn` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `description_bn` TEXT NULL,
  `cover_image_url` TEXT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `published_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gallery_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `album_id` CHAR(36) NULL,
  `title` VARCHAR(255) NULL,
  `title_bn` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `description_bn` TEXT NULL,
  `media_url` TEXT NOT NULL,
  `media_type` VARCHAR(20) DEFAULT 'image',
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`album_id`) REFERENCES `gallery_albums`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `instagram_posts` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `image_url` TEXT NOT NULL,
  `caption` TEXT NULL,
  `link_url` TEXT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `youtube_videos` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(500) NOT NULL,
  `title_bn` VARCHAR(500) NULL,
  `video_id` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `description_bn` TEXT NULL,
  `thumbnail_url` TEXT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `certifications` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `title_bn` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `description_bn` TEXT NULL,
  `file_url` TEXT NOT NULL,
  `file_type` VARCHAR(20) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 12. NAVIGATION & MENUS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `href` VARCHAR(500) NOT NULL,
  `menu_type` VARCHAR(20) DEFAULT 'header',
  `parent_id` CHAR(36) NULL,
  `is_mega_menu` TINYINT(1) DEFAULT 0,
  `banner_title` VARCHAR(255) NULL,
  `banner_subtitle` TEXT NULL,
  `banner_link` VARCHAR(500) NULL,
  `banner_image_url` TEXT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_id`) REFERENCES `menu_items`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `menu_sub_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `menu_item_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `href` VARCHAR(500) NOT NULL,
  `image_url` TEXT NULL,
  `items` JSON NULL COMMENT 'text[] → JSON array of sub-sub items',
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `footer_link_groups` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `footer_links` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `group_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `href` VARCHAR(500) NOT NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`group_id`) REFERENCES `footer_link_groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 13. SETTINGS & BRANDING
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `site_branding` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `logo_url` TEXT NULL,
  `logo_text` VARCHAR(100) DEFAULT 'artistiya',
  `logo_text_secondary` VARCHAR(100) DEFAULT '.store',
  `favicon_url` TEXT NULL,
  `show_logo_text` TINYINT(1) DEFAULT 1,
  `header_logo_size` VARCHAR(20) DEFAULT 'medium',
  `header_announcement_active` TINYINT(1) DEFAULT 1,
  `header_announcement_text` TEXT NULL,
  `footer_description` TEXT NULL,
  `footer_copyright` TEXT NULL,
  `footer_logo_size` VARCHAR(20) DEFAULT 'medium',
  `footer_banner_url` TEXT NULL,
  `footer_banner_link` TEXT NULL,
  `footer_banner_height` INT DEFAULT 80,
  `footer_left_logo_url` TEXT NULL,
  `footer_right_logo_url` TEXT NULL,
  `footer_left_logo_link` TEXT NULL,
  `footer_right_logo_link` TEXT NULL,
  `social_instagram` TEXT NULL,
  `social_facebook` TEXT NULL,
  `social_email` VARCHAR(255) NULL,
  `social_whatsapp` VARCHAR(20) NULL,
  `contact_phone` VARCHAR(20) NULL,
  `contact_address` TEXT NULL,
  `contact_address_bn` TEXT NULL,
  `business_hours` TEXT NULL,
  `business_hours_bn` TEXT NULL,
  `google_maps_embed_url` TEXT NULL,
  `contact_page_title` VARCHAR(255) DEFAULT 'Contact Us',
  `contact_page_title_bn` VARCHAR(255) NULL,
  `contact_page_subtitle` TEXT NULL,
  `contact_page_subtitle_bn` TEXT NULL,
  `google_place_id` VARCHAR(255) NULL,
  `google_api_key` TEXT NULL,
  `payment_methods` JSON NULL,
  `signup_discount_percent` DECIMAL(5,2) DEFAULT 5,
  `signup_discount_enabled` TINYINT(1) DEFAULT 1,
  `auto_sync_google_reviews` TINYINT(1) DEFAULT 0,
  `hide_manual_reviews_when_api_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `key` VARCHAR(255) NOT NULL,
  `value` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_integrations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `integration_key` VARCHAR(100) NOT NULL,
  `settings` JSON NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_integration_key` (`integration_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `theme_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_theme_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `category_display_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `section_title` VARCHAR(255) DEFAULT 'Shop by Category',
  `section_subtitle` VARCHAR(255) DEFAULT 'Explore Our World',
  `card_shape` VARCHAR(20) DEFAULT 'square',
  `items_to_show` INT DEFAULT 4,
  `columns_desktop` INT DEFAULT 4,
  `columns_tablet` INT DEFAULT 2,
  `columns_mobile` INT DEFAULT 1,
  `enable_slider` TINYINT(1) DEFAULT 0,
  `auto_slide` TINYINT(1) DEFAULT 0,
  `slide_interval` INT DEFAULT 5000,
  `show_description` TINYINT(1) DEFAULT 1,
  `show_subtitle` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shop_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `default_sort` VARCHAR(50) DEFAULT 'newest',
  `filter_position` VARCHAR(20) DEFAULT 'left',
  `min_price` DECIMAL(12,2) DEFAULT 0,
  `max_price` DECIMAL(12,2) DEFAULT 50000,
  `price_step` DECIMAL(12,2) DEFAULT 100,
  `products_per_page` INT DEFAULT 12,
  `show_out_of_stock` TINYINT(1) DEFAULT 1,
  `show_showcase_products` TINYINT(1) DEFAULT 1,
  `show_sales_banner` TINYINT(1) DEFAULT 1,
  `show_promo_banner` TINYINT(1) DEFAULT 0,
  `sales_banner_position` VARCHAR(20) DEFAULT 'top',
  `sales_banner_text` TEXT NULL,
  `sales_banner_text_bn` TEXT NULL,
  `sales_banner_link` VARCHAR(500) NULL,
  `sales_banner_bg_color` VARCHAR(20) DEFAULT '#C9A961',
  `sales_banner_text_color` VARCHAR(20) DEFAULT '#000000',
  `promo_banner_position` VARCHAR(20) DEFAULT 'right',
  `promo_banner_image` TEXT NULL,
  `promo_banner_link` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `shop_page_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `hero_title` VARCHAR(500) NULL,
  `hero_title_bn` VARCHAR(500) NULL,
  `hero_subtitle` TEXT NULL,
  `hero_subtitle_bn` TEXT NULL,
  `hero_background_image` TEXT NULL,
  `hero_overlay_opacity` INT NULL,
  `sales_banner_enabled` TINYINT(1) DEFAULT 0,
  `sales_banner_title` VARCHAR(500) NULL,
  `sales_banner_title_bn` VARCHAR(500) NULL,
  `sales_banner_image` TEXT NULL,
  `sales_banner_link` VARCHAR(500) NULL,
  `sales_banner_start_date` TIMESTAMP NULL,
  `sales_banner_end_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `filter_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `filter_key` VARCHAR(100) NOT NULL,
  `filter_name` VARCHAR(255) NOT NULL,
  `filter_type` VARCHAR(50) DEFAULT 'checkbox',
  `options` JSON DEFAULT (JSON_ARRAY()),
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 14. EMAIL & NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `email_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `provider` VARCHAR(50) NULL,
  `is_enabled` TINYINT(1) DEFAULT 0,
  `from_name` VARCHAR(255) NULL,
  `from_email` VARCHAR(255) NULL,
  `reply_to_email` VARCHAR(255) NULL,
  `smtp_host` VARCHAR(255) NULL,
  `smtp_port` INT NULL,
  `smtp_user` VARCHAR(255) NULL,
  `smtp_password` TEXT NULL,
  `resend_api_key` TEXT NULL,
  `send_order_confirmation` TINYINT(1) DEFAULT 1,
  `send_shipping_update` TINYINT(1) DEFAULT 0,
  `send_delivery_notification` TINYINT(1) DEFAULT 0,
  `order_confirmation_template_id` CHAR(36) NULL,
  `shipping_template_id` CHAR(36) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `template_key` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `html_content` LONGTEXT NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `title` VARCHAR(500) NOT NULL,
  `title_bn` VARCHAR(500) NULL,
  `message` TEXT NOT NULL,
  `message_bn` TEXT NULL,
  `type` VARCHAR(50) NULL,
  `image_url` TEXT NULL,
  `link_url` TEXT NULL,
  `is_global` TINYINT(1) DEFAULT 0,
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `announcement_bar` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `message` TEXT NOT NULL,
  `message_bn` TEXT NULL,
  `background_color` VARCHAR(20) NULL,
  `text_color` VARCHAR(20) NULL,
  `link_text` VARCHAR(255) NULL,
  `link_url` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `show_on_desktop` TINYINT(1) DEFAULT 1,
  `show_on_mobile` TINYINT(1) DEFAULT 1,
  `start_date` TIMESTAMP NULL,
  `end_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 15. NEWSLETTER & LEADS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `newsletter_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(500) DEFAULT 'Join Our Artistic Journey',
  `title_bn` VARCHAR(500) NULL,
  `subtitle` TEXT NULL,
  `subtitle_bn` TEXT NULL,
  `button_text` VARCHAR(100) DEFAULT 'Subscribe',
  `button_text_bn` VARCHAR(100) NULL,
  `placeholder_text` VARCHAR(255) DEFAULT 'Enter your email',
  `success_message` VARCHAR(500) DEFAULT 'Thank you for subscribing!',
  `is_enabled` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `source` VARCHAR(50) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `subscribed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subscribers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `source` VARCHAR(50) DEFAULT 'website',
  `message` TEXT NULL,
  `notes` TEXT NULL,
  `is_contacted` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 16. CUSTOMERS & CRM
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `customers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `discount_percentage` DECIMAL(5,2) NULL,
  `is_premium_member` TINYINT(1) DEFAULT 0,
  `premium_expires_at` TIMESTAMP NULL,
  `total_orders` INT DEFAULT 0,
  `total_spent` DECIMAL(12,2) DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customers_user` (`user_id`),
  INDEX `idx_customers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `crm_reports` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `report_type` VARCHAR(100) NOT NULL,
  `date_from` DATE NOT NULL,
  `date_to` DATE NOT NULL,
  `data` JSON NULL,
  `generated_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 17. CUSTOM ORDERS & WISHLIST
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `custom_order_requests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NULL,
  `description` TEXT NOT NULL,
  `reference_image_url` TEXT NOT NULL,
  `budget_min` DECIMAL(12,2) NULL,
  `budget_max` DECIMAL(12,2) NULL,
  `status` ENUM('pending','approved','rejected','in_production','completed') DEFAULT 'pending',
  `estimated_price` DECIMAL(12,2) NULL,
  `estimated_time` VARCHAR(100) NULL,
  `advance_amount` DECIMAL(12,2) DEFAULT 0,
  `advance_paid` TINYINT(1) DEFAULT 0,
  `admin_notes` TEXT NULL,
  `full_name` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `division` VARCHAR(100) NULL,
  `district` VARCHAR(100) NULL,
  `thana` VARCHAR(100) NULL,
  `address_line` TEXT NULL,
  `delivery_notes` TEXT NULL,
  `payment_method` VARCHAR(50) NULL,
  `payment_transaction_id` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customization_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `custom_order_enabled` TINYINT(1) DEFAULT 1,
  `require_image` TINYINT(1) DEFAULT 1,
  `show_budget_fields` TINYINT(1) DEFAULT 1,
  `default_advance_percent` INT DEFAULT 30,
  `min_advance_percent` INT DEFAULT 10,
  `max_advance_percent` INT DEFAULT 80,
  `header_button_enabled` TINYINT(1) DEFAULT 1,
  `header_button_text` VARCHAR(255) NULL,
  `header_button_text_bn` VARCHAR(255) NULL,
  `header_button_icon` VARCHAR(50) NULL,
  `header_button_link` VARCHAR(500) NULL,
  `form_title` VARCHAR(500) NULL,
  `form_title_bn` VARCHAR(500) NULL,
  `form_subtitle` TEXT NULL,
  `form_subtitle_bn` TEXT NULL,
  `form_description_label` VARCHAR(255) NULL,
  `form_description_placeholder` TEXT NULL,
  `success_message` TEXT NULL,
  `success_message_bn` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wishlist_user_product` (`user_id`, `product_id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 18. BUNDLES & UPSELLS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `product_bundles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `discount_percent` INT DEFAULT 10,
  `trigger_category_id` CHAR(36) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`trigger_category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bundle_products` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `bundle_id` CHAR(36) NULL,
  `product_id` CHAR(36) NULL,
  `category_id` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`bundle_id`) REFERENCES `product_bundles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `upsell_offers` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `trigger_type` VARCHAR(50) NULL,
  `trigger_value` VARCHAR(255) NULL,
  `trigger_categories` JSON NULL COMMENT 'text[] → JSON array',
  `product_id` CHAR(36) NULL,
  `discount_percent` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 19. TEAM & SOCIAL
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `team_members` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_bn` VARCHAR(255) NULL,
  `role` VARCHAR(255) NULL,
  `role_bn` VARCHAR(255) NULL,
  `bio` TEXT NULL,
  `bio_bn` TEXT NULL,
  `image_url` TEXT NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `social_facebook` TEXT NULL,
  `social_instagram` TEXT NULL,
  `social_linkedin` TEXT NULL,
  `slug` VARCHAR(255) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_links` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `platform` VARCHAR(100) NOT NULL,
  `url` TEXT NOT NULL,
  `icon_name` VARCHAR(100) NULL,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `currency_rates` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `currency_code` VARCHAR(10) NOT NULL,
  `currency_name` VARCHAR(100) NOT NULL,
  `symbol` VARCHAR(10) NOT NULL,
  `rate_to_bdt` DECIMAL(12,6) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `logo_url` TEXT NULL,
  `company_name` VARCHAR(255) DEFAULT 'artistiya.store',
  `company_address` TEXT NULL,
  `company_phone` VARCHAR(20) NULL,
  `company_email` VARCHAR(255) NULL,
  `terms_and_conditions` TEXT NULL,
  `footer_note` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 20. PHP-SPECIFIC TABLES (Sessions, CSRF, Rate Limiting)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` CHAR(36) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `payload` TEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `csrf_tokens` (
  `id` BIGINT AUTO_INCREMENT,
  `token` VARCHAR(255) NOT NULL,
  `session_id` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_csrf_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id` BIGINT AUTO_INCREMENT,
  `identifier` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `attempts` INT DEFAULT 1,
  `last_attempt_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `blocked_until` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rate_limit` (`identifier`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 21. FILE STORAGE (Supabase Storage → Local/S3)
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `storage_objects` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `bucket` VARCHAR(100) NOT NULL COMMENT 'custom-designs, product-images, media, testimonials',
  `name` VARCHAR(500) NOT NULL COMMENT 'File path within bucket',
  `size` BIGINT NULL,
  `mime_type` VARCHAR(100) NULL,
  `url` TEXT NOT NULL COMMENT 'Public URL of the file',
  `uploaded_by` CHAR(36) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_storage_bucket` (`bucket`),
  UNIQUE KEY `uk_storage_bucket_name` (`bucket`, `name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SECTION C: VIEWS (Supabase Views → MySQL Views)
-- ============================================================

-- public_site_branding: Excludes sensitive fields (google_api_key, google_place_id, header_logo_size)
CREATE OR REPLACE VIEW `public_site_branding` AS
SELECT
  id, logo_url, logo_text, logo_text_secondary, favicon_url,
  show_logo_text, header_announcement_active, header_announcement_text,
  footer_description, footer_copyright, footer_logo_size,
  footer_banner_url, footer_banner_link, footer_banner_height,
  footer_left_logo_url, footer_right_logo_url,
  footer_left_logo_link, footer_right_logo_link,
  social_instagram, social_facebook, social_email, social_whatsapp,
  contact_phone, contact_address, contact_address_bn,
  business_hours, business_hours_bn, google_maps_embed_url,
  contact_page_title, contact_page_title_bn,
  contact_page_subtitle, contact_page_subtitle_bn,
  payment_methods, signup_discount_percent, signup_discount_enabled,
  auto_sync_google_reviews, hide_manual_reviews_when_api_active,
  created_at, updated_at
FROM site_branding;

-- ============================================================
-- SECTION D: STORED FUNCTIONS (Supabase Functions → MySQL Functions)
-- ============================================================

DELIMITER //

-- is_admin(): Check if user has admin role
CREATE FUNCTION IF NOT EXISTS `is_admin`(check_user_id CHAR(36))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TINYINT(1) DEFAULT 0;
  SELECT 1 INTO result FROM user_roles WHERE user_id = check_user_id AND role = 'admin' LIMIT 1;
  RETURN COALESCE(result, 0);
END//

-- can_submit_lead(): Rate limit lead submissions (max 3 per 5 minutes)
CREATE FUNCTION IF NOT EXISTS `can_submit_lead`(p_email VARCHAR(255), p_phone VARCHAR(20))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE recent_count INT DEFAULT 0;
  SELECT COUNT(*) INTO recent_count FROM leads
  WHERE (email = p_email OR phone = p_phone)
  AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE);
  RETURN IF(recent_count < 3, 1, 0);
END//

-- can_subscribe_newsletter(): Prevent duplicate subscriptions
CREATE FUNCTION IF NOT EXISTS `can_subscribe_newsletter`(p_email VARCHAR(255))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE existing_count INT DEFAULT 0;
  SELECT COUNT(*) INTO existing_count FROM newsletter_subscribers WHERE email = p_email;
  RETURN IF(existing_count = 0, 1, 0);
END//

-- generate_order_number(): Create order number like ART-20260226-1234
CREATE FUNCTION IF NOT EXISTS `generate_order_number`()
RETURNS VARCHAR(50)
NOT DETERMINISTIC
BEGIN
  RETURN CONCAT('ART-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
END//

DELIMITER ;

-- ============================================================
-- SECTION E: TRIGGERS (Supabase Triggers → MySQL Triggers)
-- ============================================================

DELIMITER //

-- Auto-generate order_number before insert
CREATE TRIGGER IF NOT EXISTS `trg_before_insert_orders`
BEFORE INSERT ON `orders`
FOR EACH ROW
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SET NEW.order_number = generate_order_number();
  END IF;
END//

-- Auto-update updated_at on orders
CREATE TRIGGER IF NOT EXISTS `trg_before_update_orders`
BEFORE UPDATE ON `orders`
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END//

-- Fraud detection on new orders (mirrors check_order_fraud)
CREATE TRIGGER IF NOT EXISTS `trg_after_insert_orders_fraud`
AFTER INSERT ON `orders`
FOR EACH ROW
BEGIN
  DECLARE address_phone VARCHAR(20);
  DECLARE phone_count INT DEFAULT 0;
  DECLARE completed_count INT DEFAULT 0;
  DECLARE calc_fraud_score INT DEFAULT 0;

  -- Get phone from address
  SELECT phone INTO address_phone FROM addresses WHERE id = NEW.address_id LIMIT 1;

  IF address_phone IS NOT NULL THEN
    -- Check: Multiple orders from same phone in 24 hours
    SELECT COUNT(*) INTO phone_count
    FROM orders o
    JOIN addresses a ON o.address_id = a.id
    WHERE a.phone = address_phone
    AND o.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND o.id != NEW.id;

    IF phone_count >= 3 THEN
      SET calc_fraud_score = calc_fraud_score + 50;
      INSERT INTO order_fraud_flags (order_id, flag_type, flag_reason, severity)
      VALUES (NEW.id, 'rate_limit', CONCAT('Same phone placed ', phone_count + 1, ' orders in 24h'), 'high');
    ELSEIF phone_count >= 1 THEN
      SET calc_fraud_score = calc_fraud_score + 20;
      INSERT INTO order_fraud_flags (order_id, flag_type, flag_reason, severity)
      VALUES (NEW.id, 'duplicate_phone', 'Multiple orders from same phone in 24h', 'medium');
    END IF;

    -- Check: High value COD from new customer
    IF NEW.payment_method = 'cod' AND NEW.total > 10000 THEN
      SELECT COUNT(*) INTO completed_count
      FROM orders o JOIN addresses a ON o.address_id = a.id
      WHERE a.phone = address_phone AND o.status = 'delivered';

      IF completed_count = 0 THEN
        SET calc_fraud_score = calc_fraud_score + 25;
        INSERT INTO order_fraud_flags (order_id, flag_type, flag_reason, severity)
        VALUES (NEW.id, 'suspicious_pattern', 'High value COD from new customer', 'medium');
      END IF;
    END IF;
  END IF;

  -- High value order flag
  IF NEW.total > 50000 THEN
    SET calc_fraud_score = calc_fraud_score + 30;
    INSERT INTO order_fraud_flags (order_id, flag_type, flag_reason, severity)
    VALUES (NEW.id, 'high_risk', CONCAT('High value order: ৳', NEW.total), 'medium');
  END IF;

  -- Update fraud score on order
  UPDATE orders SET fraud_score = calc_fraud_score, is_flagged = IF(calc_fraud_score >= 50, 1, 0) WHERE id = NEW.id;
END//

-- Sync customer from order (mirrors sync_customer_from_order)
CREATE TRIGGER IF NOT EXISTS `trg_after_insert_orders_customer`
AFTER INSERT ON `orders`
FOR EACH ROW
BEGIN
  DECLARE addr_name VARCHAR(255);
  DECLARE addr_phone VARCHAR(20);
  DECLARE user_email VARCHAR(255);

  IF NEW.user_id IS NOT NULL THEN
    SELECT full_name, phone INTO addr_name, addr_phone FROM addresses WHERE id = NEW.address_id LIMIT 1;
    SELECT email INTO user_email FROM users WHERE id = NEW.user_id LIMIT 1;

    INSERT INTO customers (user_id, email, full_name, phone, total_orders, total_spent)
    VALUES (
      NEW.user_id,
      COALESCE(user_email, 'unknown@email.com'),
      COALESCE(addr_name, ''),
      COALESCE(addr_phone, ''),
      1,
      COALESCE(NEW.total, 0)
    )
    ON DUPLICATE KEY UPDATE
      total_orders = total_orders + 1,
      total_spent = total_spent + COALESCE(NEW.total, 0),
      updated_at = NOW();
  END IF;
END//

-- Auto-create profile on user registration (mirrors handle_new_user)
CREATE TRIGGER IF NOT EXISTS `trg_after_insert_users`
AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    JSON_UNQUOTE(JSON_EXTRACT(COALESCE(NEW.raw_user_meta_data, '{}'), '$.full_name'))
  );
END//

-- Auto-update customization_settings updated_at
CREATE TRIGGER IF NOT EXISTS `trg_before_update_customization`
BEFORE UPDATE ON `customization_settings`
FOR EACH ROW
BEGIN
  SET NEW.updated_at = NOW();
END//

DELIMITER ;

-- ============================================================
-- SECTION F: STORED PROCEDURES (Credential Encryption)
-- ============================================================

DELIMITER //

-- encrypt_credential_value: Encrypt using AES-256
-- Note: MySQL AES_ENCRYPT uses AES-128 by default. Set block_encryption_mode for AES-256.
CREATE PROCEDURE IF NOT EXISTS `encrypt_credential_value`(
  IN plaintext TEXT,
  IN encryption_key VARCHAR(64),
  OUT encrypted_result TEXT
)
BEGIN
  SET @@SESSION.block_encryption_mode = 'aes-256-cbc';
  IF plaintext IS NULL OR plaintext = '' THEN
    SET encrypted_result = plaintext;
  ELSE
    SET encrypted_result = CONCAT('enc:', TO_BASE64(AES_ENCRYPT(plaintext, UNHEX(encryption_key))));
  END IF;
END//

-- decrypt_credential: Decrypt AES-256 encrypted value
CREATE PROCEDURE IF NOT EXISTS `decrypt_credential`(
  IN encrypted_text TEXT,
  IN encryption_key VARCHAR(64),
  OUT decrypted_result TEXT
)
BEGIN
  SET @@SESSION.block_encryption_mode = 'aes-256-cbc';
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    SET decrypted_result = encrypted_text;
  ELSEIF LEFT(encrypted_text, 4) != 'enc:' THEN
    SET decrypted_result = encrypted_text;
  ELSE
    SET decrypted_result = AES_DECRYPT(FROM_BASE64(SUBSTRING(encrypted_text, 5)), UNHEX(encryption_key));
  END IF;
END//

DELIMITER ;

-- ============================================================
-- SECTION G: INITIAL DATA (Supabase Storage Buckets → storage_objects metadata)
-- ============================================================

-- Storage bucket registry
INSERT INTO site_settings (`key`, `value`) VALUES
  ('storage_buckets', '["custom-designs", "product-images", "media", "testimonials"]')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ============================================================
-- END OF COMPLETE SCHEMA
-- Total: 55 tables + 1 view + 4 functions + 6 triggers + 2 procedures
-- ============================================================
