-- Create Connecticut Towns table in Supabase
-- This table stores all Connecticut towns and their associated counties

-- Drop table if exists (use with caution in production)
-- DROP TABLE IF EXISTS ct_towns;

-- Create the ct_towns table
CREATE TABLE IF NOT EXISTS ct_towns (
    id SERIAL PRIMARY KEY,
    town VARCHAR(100) UNIQUE NOT NULL,
    county VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ct_towns_county ON ct_towns(county);
CREATE INDEX IF NOT EXISTS idx_ct_towns_town_lower ON ct_towns(LOWER(town));

-- Add comment to table
COMMENT ON TABLE ct_towns IS 'Connecticut towns and their associated counties for validation and reference';
COMMENT ON COLUMN ct_towns.town IS 'Official town name in Connecticut';
COMMENT ON COLUMN ct_towns.county IS 'County that the town belongs to';

-- Sample query to verify table creation
-- SELECT * FROM ct_towns LIMIT 5;