-- ============================================
-- Smart Canteen System - Database Schema
-- ============================================
-- Version: 1.0
-- Date: 2025-10-22
-- Description: Complete database schema for the RFID-based cashless canteen system
-- ============================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS canteen_db;
USE canteen_db;

-- Set proper character encoding
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- TABLE: users
-- Purpose: Store all system users (students, staff, vendors, admins)
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('student','staff','vendor','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'student',
  `rfid_uid` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `is_card_locked` tinyint(1) NOT NULL DEFAULT '0',
  `card_locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `rfid_uid` (`rfid_uid`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_rfid_lock` (`rfid_uid`,`is_card_locked`),
  KEY `idx_users_rfid` (`rfid_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System users with role-based access control';

-- ============================================
-- TABLE: menu
-- Purpose: Food menu items and prices for vendors
-- ============================================
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Menu items available for purchase';

-- ============================================
-- TABLE: transactions
-- Purpose: Record all student purchases/sales
-- ============================================
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `tx_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `item_id` int DEFAULT NULL,
  `custom_item` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `device_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`tx_id`),
  KEY `user_id` (`user_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu` (`item_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Purchase history and transaction records';

-- ============================================
-- TABLE: reloads
-- Purpose: Record all balance reload transactions
-- ============================================
DROP TABLE IF EXISTS `reloads`;
CREATE TABLE `reloads` (
  `reload_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `cashier_id` int DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reload_id`),
  KEY `user_id` (`user_id`),
  KEY `cashier_id` (`cashier_id`),
  CONSTRAINT `reloads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reloads_ibfk_2` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Balance reload history by staff';

-- ============================================
-- TABLE: pending_reloads
-- Purpose: Temporary table for RFID-based reload workflow
-- ============================================
DROP TABLE IF EXISTS `pending_reloads`;
CREATE TABLE `pending_reloads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `cashier_id` int NOT NULL,
  `confirmed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `confirmed` (`confirmed`),
  KEY `created_at` (`created_at`),
  KEY `idx_pr_state_time` (`confirmed`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pending reload requests awaiting RFID card tap';

-- ============================================
-- TABLE: pending_sales
-- Purpose: Temporary table for RFID-based sale workflow
-- ============================================
DROP TABLE IF EXISTS `pending_sales`;
CREATE TABLE `pending_sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int DEFAULT NULL,
  `item_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vendor_id` int NOT NULL,
  `confirmed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0=pending,1=confirmed,2=failed',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ps_state_time` (`confirmed`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pending sale requests awaiting RFID card tap';

-- ============================================
-- TABLE: pending_rfid_links
-- Purpose: Temporary table for RFID card linking workflow
-- ============================================
DROP TABLE IF EXISTS `pending_rfid_links`;
CREATE TABLE `pending_rfid_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `uid` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `confirmed` (`confirmed`,`created_at`),
  CONSTRAINT `fk_prl_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pending RFID card linking requests';

-- ============================================
-- TABLE: card_hotlist
-- Purpose: Blocked/blacklisted RFID cards
-- ============================================
DROP TABLE IF EXISTS `card_hotlist`;
CREATE TABLE `card_hotlist` (
  `rfid_uid` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rfid_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Blocked RFID cards for security';

-- ============================================
-- TABLE: devices
-- Purpose: Registered ESP32/Arduino devices
-- ============================================
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices` (
  `device_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varbinary(32) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registered hardware devices (ESP32/Arduino)';

-- ============================================
-- END OF SCHEMA
-- ============================================

