-- Schema Migration V4: Updated skiptrace table structure
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables (WARNING: This will delete all data!)
DROP TABLE IF EXISTS skiptrace CASCADE;
DROP TABLE IF EXISTS defendants CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- Step 2: Create new schema with updated structure

-- Create cases table (unchanged)
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_name VARCHAR(255) NOT NULL,
    docket_number VARCHAR(100) UNIQUE NOT NULL,  -- This is the reference key
    docket_url TEXT,
    town VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create defendants table (unchanged)
CREATE TABLE defendants (
    id SERIAL PRIMARY KEY,
    docket_number VARCHAR(100) NOT NULL REFERENCES cases(docket_number) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    town VARCHAR(100),  -- Town name from web scraping
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(docket_number, name)  -- Prevent duplicate defendants for same case
);

-- Create skiptrace table (updated structure)
CREATE TABLE skiptrace (
    id SERIAL PRIMARY KEY,
    docket_number VARCHAR(100) NOT NULL REFERENCES cases(docket_number) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    phone_type VARCHAR(50),
    api_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cases_docket ON cases(docket_number);
CREATE INDEX idx_cases_town ON cases(town);
CREATE INDEX idx_defendants_docket ON defendants(docket_number);
CREATE INDEX idx_defendants_name ON defendants(name);
CREATE INDEX idx_defendants_town ON defendants(town);
CREATE INDEX idx_skiptrace_docket ON skiptrace(docket_number);
CREATE INDEX idx_skiptrace_phone ON skiptrace(phone_number);