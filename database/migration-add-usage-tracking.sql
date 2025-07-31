-- Migration to add usage tracking functionality to access_codes table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add max_uses column (maximum number of times this code can be used)
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL;

-- Add current_uses column (current number of times this code has been used)
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS current_uses INTEGER DEFAULT 0;

-- Update existing records to have current_uses = 0
UPDATE access_codes 
SET current_uses = 0 
WHERE current_uses IS NULL;

-- Add indexes for the new usage tracking columns
CREATE INDEX IF NOT EXISTS idx_access_codes_max_uses ON access_codes(max_uses);
CREATE INDEX IF NOT EXISTS idx_access_codes_current_uses ON access_codes(current_uses);

-- Add comments to document the new columns
COMMENT ON COLUMN access_codes.max_uses IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN access_codes.current_uses IS 'Current number of times this code has been used';

-- Create a function to get usage statistics
CREATE OR REPLACE FUNCTION get_usage_statistics()
RETURNS TABLE (
    total_codes BIGINT,
    active_codes BIGINT,
    used_codes BIGINT,
    expired_codes BIGINT,
    codes_with_usage_limit BIGINT,
    average_usage_per_code NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_codes,
        COUNT(*) FILTER (WHERE is_active = true) as active_codes,
        COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_codes,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_codes,
        COUNT(*) FILTER (WHERE max_uses IS NOT NULL) as codes_with_usage_limit,
        ROUND(AVG(COALESCE(current_uses, 0)), 2) as average_usage_per_code
    FROM access_codes;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get top used codes
CREATE OR REPLACE FUNCTION get_top_used_codes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    code VARCHAR(8),
    current_uses INTEGER,
    max_uses INTEGER,
    usage_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.code,
        ac.current_uses,
        ac.max_uses,
        CASE 
            WHEN ac.max_uses IS NOT NULL AND ac.max_uses > 0 
            THEN ROUND((ac.current_uses::NUMERIC / ac.max_uses::NUMERIC) * 100, 2)
            ELSE NULL
        END as usage_percentage
    FROM access_codes ac
    WHERE ac.current_uses > 0
    ORDER BY ac.current_uses DESC, usage_percentage DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a code has reached its usage limit
CREATE OR REPLACE FUNCTION is_usage_limit_reached(code_to_check VARCHAR(8))
RETURNS BOOLEAN AS $$
DECLARE
    code_record RECORD;
BEGIN
    SELECT max_uses, current_uses INTO code_record
    FROM access_codes 
    WHERE code = UPPER(code_to_check) AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN true; -- Code doesn't exist or is inactive
    END IF;
    
    IF code_record.max_uses IS NULL THEN
        RETURN false; -- No usage limit
    END IF;
    
    RETURN code_record.current_uses >= code_record.max_uses;
END;
$$ LANGUAGE plpgsql;

-- Example usage queries:
/*
-- Get usage statistics
SELECT * FROM get_usage_statistics();

-- Get top 5 most used codes
SELECT * FROM get_top_used_codes(5);

-- Check if a specific code has reached its limit
SELECT is_usage_limit_reached('DEMO1234');

-- Find codes that are close to their usage limit (80% or more used)
SELECT code, current_uses, max_uses,
       ROUND((current_uses::NUMERIC / max_uses::NUMERIC) * 100, 2) as usage_percentage
FROM access_codes 
WHERE max_uses IS NOT NULL 
  AND current_uses >= (max_uses * 0.8)
  AND is_active = true
ORDER BY usage_percentage DESC;

-- Find codes with unlimited usage that have been used multiple times
SELECT code, current_uses, created_at, used_at
FROM access_codes 
WHERE max_uses IS NULL 
  AND current_uses > 1
  AND is_active = true
ORDER BY current_uses DESC;
*/
