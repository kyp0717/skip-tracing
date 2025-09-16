-- Schema Migration: Use docket_number as foreign key instead of case_id
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS defendants CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- Step 2: Create new schema with docket_number as foreign key

-- Create cases table (docket_number is unique)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_name VARCHAR(255) NOT NULL,
    docket_number VARCHAR(100) UNIQUE NOT NULL,  -- This is now the reference key
    docket_url TEXT,
    town VARCHAR(100),
    search_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create defendants table (references cases by docket_number)
CREATE TABLE defendants (
    id SERIAL PRIMARY KEY,
    docket_number VARCHAR(100) NOT NULL REFERENCES cases(docket_number) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(docket_number, name)  -- Prevent duplicate defendants for same case
);

-- Create phone_numbers table
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    defendant_id INTEGER REFERENCES defendants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    phone_type VARCHAR(50),
    source VARCHAR(20) CHECK (source IN ('sandbox', 'production')),
    api_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cases_docket ON cases(docket_number);
CREATE INDEX idx_cases_town ON cases(town);
CREATE INDEX idx_defendants_docket ON defendants(docket_number);
CREATE INDEX idx_defendants_name ON defendants(name);
CREATE INDEX idx_phone_defendant ON phone_numbers(defendant_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: If you want to preserve existing data, run these BEFORE dropping tables:
-- 1. Export data: SELECT * FROM cases, defendants, phone_numbers
-- 2. After creating new schema, re-import with docket_number references