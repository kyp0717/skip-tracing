-- Schema Migration V6 (Simplified): Remove api_response field from skiptrace tables
-- Run this in your Supabase SQL Editor

-- Step 1: Remove api_response column from both skiptrace tables
ALTER TABLE skiptrace DROP COLUMN IF EXISTS api_response;
ALTER TABLE skiptrace_sandbox DROP COLUMN IF EXISTS api_response;

-- Step 2: Create a view to check if a case has been skip traced
CREATE OR REPLACE VIEW v_cases_skiptrace_status AS
SELECT DISTINCT
    c.docket_number,
    c.case_name,
    c.town,
    CASE WHEN s.docket_number IS NOT NULL THEN true ELSE false END as has_production_skiptrace,
    CASE WHEN ss.docket_number IS NOT NULL THEN true ELSE false END as has_sandbox_skiptrace,
    COUNT(DISTINCT s.phone_number) as production_phone_count,
    COUNT(DISTINCT ss.phone_number) as sandbox_phone_count
FROM cases c
LEFT JOIN skiptrace s ON c.docket_number = s.docket_number
LEFT JOIN skiptrace_sandbox ss ON c.docket_number = ss.docket_number
GROUP BY c.docket_number, c.case_name, c.town, s.docket_number, ss.docket_number;

-- Final structure after migration:
-- skiptrace: id, docket_number, phone_number, phone_type, created_at
-- skiptrace_sandbox: id, docket_number, phone_number, phone_type, created_at