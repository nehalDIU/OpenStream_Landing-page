-- Migration to add advanced settings support to access_codes table
-- Run this in your Supabase SQL Editor if you have an existing database

-- Add prefix column (optional 4-character prefix for codes)
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS prefix VARCHAR(4);

-- Add auto_expire_on_use column (controls whether codes expire after first use)
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS auto_expire_on_use BOOLEAN DEFAULT TRUE;

-- Update existing records to have auto_expire_on_use = TRUE (current behavior)
UPDATE access_codes 
SET auto_expire_on_use = TRUE 
WHERE auto_expire_on_use IS NULL;

-- Add index for prefix column for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_prefix ON access_codes(prefix);

-- Add index for auto_expire_on_use column
CREATE INDEX IF NOT EXISTS idx_access_codes_auto_expire ON access_codes(auto_expire_on_use);

-- Add comment to document the new columns
COMMENT ON COLUMN access_codes.prefix IS 'Optional prefix for the access code (max 4 characters)';
COMMENT ON COLUMN access_codes.auto_expire_on_use IS 'Whether the code should be automatically deactivated after first use';
