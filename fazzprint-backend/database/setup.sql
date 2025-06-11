-- FazzPrint ERP Database Setup Script
-- This script creates the database and sets up initial configuration

-- Create the database
CREATE DATABASE IF NOT EXISTS fazzprint_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE fazzprint_erp;

-- Grant privileges (if using specific user)
-- GRANT ALL PRIVILEGES ON fazzprint_erp.* TO 'fazzprint_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;

-- The tables will be created by Laravel migrations
-- This script just ensures the database exists 