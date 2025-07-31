-- ============================================================================
-- OpenStream Landing Page Database Schema (Complete Version)
-- ============================================================================
--
-- VERSION: 2.0 (with Advanced Settings & Usage Tracking)
-- LAST UPDATED: 2025-01-31
--
-- FEATURES INCLUDED:
-- ✅ Basic access code generation and validation
-- ✅ Advanced Settings:
--    - Custom prefixes (up to 4 characters)
--    - Auto-expire on use control
--    - Usage limits (1-1000 uses)
--    - Usage tracking and analytics
-- ✅ Usage logs and activity tracking
-- ✅ Utility functions for statistics
-- ✅ Comprehensive indexes for performance
-- ✅ Sample data and usage examples
--
-- USAGE:
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. Database will be fully configured with all features
--
-- MIGRATION:
-- If you have an existing database, use: database/migration-add-usage-tracking.sql
--
-- Compatible with all Supabase plans (Free, Pro, Team, Enterprise)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by VARCHAR(255),
    duration_minutes INTEGER NOT NULL DEFAULT 10,
    created_by VARCHAR(255) DEFAULT 'admin',
    prefix VARCHAR(4),
    auto_expire_on_use BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(8) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('generated', 'used', 'expired', 'revoked')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_access_codes_expires_at ON access_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_codes_created_at ON access_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_access_codes_prefix ON access_codes(prefix);
CREATE INDEX IF NOT EXISTS idx_access_codes_auto_expire ON access_codes(auto_expire_on_use);
CREATE INDEX IF NOT EXISTS idx_access_codes_max_uses ON access_codes(max_uses);
CREATE INDEX IF NOT EXISTS idx_access_codes_current_uses ON access_codes(current_uses);

CREATE INDEX IF NOT EXISTS idx_usage_logs_code ON usage_logs(code);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action ON usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);

-- Add comments to document the columns
COMMENT ON COLUMN access_codes.prefix IS 'Optional prefix for the access code (max 4 characters)';
COMMENT ON COLUMN access_codes.auto_expire_on_use IS 'Whether the code should be automatically deactivated after first use';
COMMENT ON COLUMN access_codes.max_uses IS 'Maximum number of times this code can be used (NULL = unlimited)';
COMMENT ON COLUMN access_codes.current_uses IS 'Current number of times this code has been used';

-- Create utility functions for usage tracking
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

-- Create function to get top used codes
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

-- Create function to check if a code has reached its usage limit
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

-- Create Row Level Security (RLS) policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy for access_codes: Allow all operations (you can restrict this based on your needs)
CREATE POLICY "Allow all operations on access_codes" ON access_codes
    FOR ALL USING (true);

-- Policy for usage_logs: Allow all operations
CREATE POLICY "Allow all operations on usage_logs" ON usage_logs
    FOR ALL USING (true);

-- Create a function to automatically cleanup expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_codes()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Count expired codes that are still active
    SELECT COUNT(*) INTO expired_count
    FROM access_codes
    WHERE is_active = TRUE AND expires_at < NOW();
    
    -- Deactivate expired codes
    UPDATE access_codes
    SET is_active = FALSE
    WHERE is_active = TRUE AND expires_at < NOW();
    
    -- Log the cleanup action for each expired code
    INSERT INTO usage_logs (code, action, details)
    SELECT code, 'expired', 'Automatically expired by cleanup function'
    FROM access_codes
    WHERE is_active = FALSE AND expires_at < NOW()
    AND NOT EXISTS (
        SELECT 1 FROM usage_logs ul 
        WHERE ul.code = access_codes.code 
        AND ul.action = 'expired' 
        AND ul.timestamp > NOW() - INTERVAL '1 minute'
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_codes', (
            SELECT COUNT(*) FROM access_codes 
            WHERE is_active = TRUE AND expires_at > NOW()
        ),
        'total_codes', (
            SELECT COUNT(*) FROM access_codes
        ),
        'used_codes', (
            SELECT COUNT(*) FROM access_codes 
            WHERE used_at IS NOT NULL
        ),
        'expired_codes', (
            SELECT COUNT(*) FROM access_codes 
            WHERE expires_at < NOW()
        ),
        'codes_generated_today', (
            SELECT COUNT(*) FROM access_codes 
            WHERE created_at >= CURRENT_DATE
        ),
        'codes_used_today', (
            SELECT COUNT(*) FROM access_codes 
            WHERE used_at >= CURRENT_DATE
        ),
        'expiring_soon', (
            SELECT COUNT(*) FROM access_codes 
            WHERE is_active = TRUE 
            AND expires_at > NOW() 
            AND expires_at < NOW() + INTERVAL '5 minutes'
        ),
        'recent_activity_count', (
            SELECT COUNT(*) FROM usage_logs 
            WHERE timestamp >= NOW() - INTERVAL '24 hours'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active codes with time remaining
CREATE OR REPLACE VIEW active_codes_with_time_remaining AS
SELECT 
    *,
    CASE 
        WHEN expires_at > NOW() THEN 
            EXTRACT(EPOCH FROM (expires_at - NOW()))::INTEGER
        ELSE 0 
    END as seconds_remaining,
    CASE 
        WHEN expires_at > NOW() THEN 
            EXTRACT(EPOCH FROM (expires_at - NOW()))/60::INTEGER
        ELSE 0 
    END as minutes_remaining
FROM access_codes 
WHERE is_active = TRUE
ORDER BY created_at DESC;

-- Create a view for recent activity
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    ul.*,
    ac.expires_at,
    ac.duration_minutes,
    ac.used_at as code_used_at
FROM usage_logs ul
LEFT JOIN access_codes ac ON ul.code = ac.code
ORDER BY ul.timestamp DESC;

-- Grant necessary permissions (adjust based on your security requirements)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON access_codes TO anon, authenticated;
GRANT ALL ON usage_logs TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert some sample data for testing (optional - uncomment if needed)
/*
INSERT INTO access_codes (code, expires_at, duration_minutes) VALUES
('DEMO1234', NOW() + INTERVAL '10 minutes', 10),
('TEST5678', NOW() + INTERVAL '30 minutes', 30),
('SAMPLE99', NOW() + INTERVAL '1 hour', 60);

INSERT INTO usage_logs (code, action, details) VALUES
('DEMO1234', 'generated', 'Generated for testing'),
('TEST5678', 'generated', 'Generated for testing'),
('SAMPLE99', 'generated', 'Generated for testing');
*/

-- ============================================================================
-- BACKUP AND RESTORE INSTRUCTIONS
-- ============================================================================

/*
BACKUP YOUR DATA:

1. Export access codes:
   SELECT * FROM access_codes ORDER BY created_at;

2. Export usage logs:
   SELECT * FROM usage_logs ORDER BY timestamp;

3. Export statistics:
   SELECT * FROM get_usage_statistics();

RESTORE FROM BACKUP:

1. Run this schema file first
2. Import your data using INSERT statements
3. Verify with test queries below

MIGRATION FROM OLDER VERSIONS:

If upgrading from a version without usage tracking:
1. Run: database/migration-add-usage-tracking.sql
2. Verify all columns exist
3. Test usage limits functionality
*/

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to get comprehensive usage analytics
CREATE OR REPLACE FUNCTION get_usage_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_codes_generated', (
            SELECT COUNT(*) FROM access_codes
            WHERE created_at BETWEEN start_date AND end_date
        ),
        'total_codes_used', (
            SELECT COUNT(*) FROM access_codes
            WHERE used_at BETWEEN start_date AND end_date
        ),
        'success_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE used_at IS NOT NULL)::DECIMAL /
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM access_codes
            WHERE created_at BETWEEN start_date AND end_date
        ),
        'average_usage_time', (
            SELECT ROUND(
                AVG(EXTRACT(EPOCH FROM (used_at - created_at)) / 60), 2
            )
            FROM access_codes
            WHERE used_at BETWEEN start_date AND end_date
        ),
        'codes_by_prefix', (
            SELECT json_object_agg(
                COALESCE(prefix, 'no_prefix'),
                count
            )
            FROM (
                SELECT
                    prefix,
                    COUNT(*) as count
                FROM access_codes
                WHERE created_at BETWEEN start_date AND end_date
                GROUP BY prefix
            ) prefix_stats
        ),
        'daily_usage', (
            SELECT json_agg(
                json_build_object(
                    'date', date_trunc('day', created_at)::date,
                    'generated', generated_count,
                    'used', used_count
                )
                ORDER BY date_trunc('day', created_at)
            )
            FROM (
                SELECT
                    created_at,
                    COUNT(*) as generated_count,
                    COUNT(*) FILTER (WHERE used_at IS NOT NULL) as used_count
                FROM access_codes
                WHERE created_at BETWEEN start_date AND end_date
                GROUP BY date_trunc('day', created_at)
            ) daily_stats
        ),
        'hourly_distribution', (
            SELECT json_object_agg(
                hour_of_day::text,
                usage_count
            )
            FROM (
                SELECT
                    EXTRACT(HOUR FROM created_at) as hour_of_day,
                    COUNT(*) as usage_count
                FROM access_codes
                WHERE created_at BETWEEN start_date AND end_date
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour_of_day
            ) hourly_stats
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA VERSION INFO
-- ============================================================================

-- Schema version: 2.0
-- Features: Basic codes, Advanced settings, Usage tracking, Analytics
-- Last updated: 2025-01-31
-- Compatible with: All Supabase plans
-- Migration path: database/migration-add-usage-tracking.sql (for existing DBs)

-- ============================================================================
-- ADVANCED SETTINGS DOCUMENTATION
-- ============================================================================

/*
ADVANCED SETTINGS COLUMNS:

1. prefix (VARCHAR(4))
   - Optional 4-character prefix for access codes
   - Examples: 'VIP', 'TEMP', 'TEST', 'DEMO'
   - When set, generated codes will start with this prefix
   - Total code length remains 8 characters (prefix + random chars)

2. auto_expire_on_use (BOOLEAN, DEFAULT TRUE)
   - Controls whether codes expire after first use
   - TRUE (default): One-time use codes (expire after validation)
   - FALSE: Reusable codes (can be validated multiple times)
   - Provides flexibility for different use cases

3. max_uses (INTEGER, DEFAULT NULL)
   - Maximum number of times this code can be used
   - NULL (default): Unlimited uses (controlled by auto_expire_on_use)
   - 1: One-time use (same as auto_expire_on_use = TRUE)
   - 2+: Limited multi-use codes (e.g., 5 uses, 10 uses)
   - Overrides auto_expire_on_use when set

4. current_uses (INTEGER, DEFAULT 0)
   - Current number of times this code has been used
   - Automatically incremented on each validation
   - Used to enforce max_uses limit
   - Provides usage analytics

USAGE EXAMPLES:

-- ============================================================================
-- BASIC CODE GENERATION
-- ============================================================================

-- Generate a basic code (10 minutes, one-time use)
INSERT INTO access_codes (code, expires_at, duration_minutes)
VALUES ('BASIC123', NOW() + INTERVAL '10 minutes', 10);

-- Generate a VIP code that expires after first use
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, auto_expire_on_use)
VALUES ('VIP12345', NOW() + INTERVAL '1 hour', 60, 'VIP', TRUE);

-- Generate a reusable test code (unlimited uses)
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, auto_expire_on_use)
VALUES ('TEST6789', NOW() + INTERVAL '24 hours', 1440, 'TEST', FALSE);

-- ============================================================================
-- USAGE LIMIT EXAMPLES
-- ============================================================================

-- Generate a code that can be used exactly 5 times
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, max_uses, current_uses)
VALUES ('DEMO5USE', NOW() + INTERVAL '12 hours', 720, 'DEMO', 5, 0);

-- Generate a premium code with 10 uses
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, max_uses, current_uses)
VALUES ('PREM10X', NOW() + INTERVAL '7 days', 10080, 'PREM', 10, 0);

-- Generate a trial code with 3 uses
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, max_uses, current_uses)
VALUES ('TRIAL3X', NOW() + INTERVAL '2 days', 2880, 'TRIAL', 3, 0);

-- Generate a one-time code using max_uses (alternative to auto_expire_on_use)
INSERT INTO access_codes (code, expires_at, duration_minutes, prefix, max_uses, current_uses)
VALUES ('ONCE1234', NOW() + INTERVAL '1 hour', 60, 'ONCE', 1, 0);

-- ============================================================================
-- QUERY EXAMPLES
-- ============================================================================

-- Query codes with usage tracking
SELECT code, prefix, max_uses, current_uses,
       CASE
         WHEN max_uses IS NULL THEN 'Unlimited'
         ELSE CONCAT(current_uses, '/', max_uses)
       END as usage_status,
       expires_at, is_active
FROM access_codes
WHERE max_uses IS NOT NULL OR prefix IS NOT NULL
ORDER BY created_at DESC;

-- Find codes that are close to their usage limit (80% used)
SELECT code, prefix, current_uses, max_uses,
       (max_uses - current_uses) as remaining_uses,
       ROUND((current_uses::NUMERIC / max_uses::NUMERIC) * 100, 2) as usage_percentage
FROM access_codes
WHERE max_uses IS NOT NULL
  AND current_uses >= (max_uses * 0.8)
  AND is_active = TRUE
ORDER BY usage_percentage DESC;

-- Find codes that have reached their usage limit
SELECT code, prefix, current_uses, max_uses, used_at
FROM access_codes
WHERE max_uses IS NOT NULL
  AND current_uses >= max_uses
ORDER BY used_at DESC;

-- Get usage statistics using the utility function
SELECT * FROM get_usage_statistics();

-- Get top 5 most used codes
SELECT * FROM get_top_used_codes(5);

-- Check if a specific code has reached its limit
SELECT is_usage_limit_reached('DEMO5USE');

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Usage distribution by limit type
SELECT
    CASE
        WHEN max_uses IS NULL THEN 'Unlimited'
        WHEN max_uses = 1 THEN 'One-time'
        WHEN max_uses <= 5 THEN 'Low limit (2-5)'
        WHEN max_uses <= 25 THEN 'Medium limit (6-25)'
        ELSE 'High limit (26+)'
    END as limit_type,
    COUNT(*) as code_count,
    AVG(current_uses) as avg_usage
FROM access_codes
GROUP BY
    CASE
        WHEN max_uses IS NULL THEN 'Unlimited'
        WHEN max_uses = 1 THEN 'One-time'
        WHEN max_uses <= 5 THEN 'Low limit (2-5)'
        WHEN max_uses <= 25 THEN 'Medium limit (6-25)'
        ELSE 'High limit (26+)'
    END
ORDER BY code_count DESC;

-- Prefix usage statistics
SELECT
    COALESCE(prefix, 'No prefix') as prefix_type,
    COUNT(*) as code_count,
    AVG(current_uses) as avg_usage,
    SUM(current_uses) as total_usage
FROM access_codes
GROUP BY prefix
ORDER BY code_count DESC;

-- Daily code generation and usage
SELECT
    DATE(created_at) as date,
    COUNT(*) as codes_generated,
    COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as codes_used,
    SUM(current_uses) as total_usage
FROM access_codes
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
*/
-- SELECT get_dashboard_stats();
-- SELECT cleanup_expired_codes();
