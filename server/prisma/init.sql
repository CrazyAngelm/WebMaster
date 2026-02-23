-- 📁 server/prisma/init.sql - PostgreSQL initialization script
-- 🎯 Core function: Initialize PostgreSQL database with extensions
-- 🔗 Key dependencies: PostgreSQL
-- 💡 Usage: Runs automatically when PostgreSQL container starts

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just examples, actual indexes will be created by Prisma

-- Set timezone to UTC
SET timezone = 'UTC';

-- Create custom functions if needed
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
