-- Schema Migration V6: Remove api_response field from skiptrace tables
-- Run this in your Supabase SQL Editor

-- Step 1: Remove api_response column from both skiptrace tables
ALTER TABLE skiptrace DROP COLUMN IF EXISTS api_response;
ALTER TABLE skiptrace_sandbox DROP COLUMN IF EXISTS api_response;

-- Step 2: Add cost tracking table for skip trace operations
CREATE TABLE IF NOT EXISTS skiptrace_costs (
    id SERIAL PRIMARY KEY,
    docket_number VARCHAR(100) NOT NULL REFERENCES cases(docket_number) ON DELETE CASCADE,
    lookup_count INTEGER NOT NULL DEFAULT 1,
    cost_per_lookup DECIMAL(10, 4) DEFAULT 0.07,
    total_cost DECIMAL(10, 4) GENERATED ALWAYS AS (lookup_count * cost_per_lookup) STORED,
    is_sandbox BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(docket_number, is_sandbox)
);

-- Step 3: Create index for cost tracking
CREATE INDEX idx_skiptrace_costs_docket ON skiptrace_costs(docket_number);

-- Step 4: Create a view to check if a case has been skip traced
CREATE OR REPLACE VIEW v_cases_skiptrace_status AS
SELECT DISTINCT
    c.docket_number,
    c.case_name,
    CASE WHEN s.docket_number IS NOT NULL THEN true ELSE false END as has_production_skiptrace,
    CASE WHEN ss.docket_number IS NOT NULL THEN true ELSE false END as has_sandbox_skiptrace
FROM cases c
LEFT JOIN skiptrace s ON c.docket_number = s.docket_number
LEFT JOIN skiptrace_sandbox ss ON c.docket_number = ss.docket_number;

-- Note: After running this migration, the skiptrace tables will have this structure:
-- skiptrace: id, docket_number, phone_number, phone_type, created_at
-- skiptrace_sandbox: id, docket_number, phone_number, phone_type, created_at
-- skiptrace_costs: id, docket_number, lookup_count, cost_per_lookup, total_cost, is_sandbox, created_at