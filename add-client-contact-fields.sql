-- Run this SQL in your Supabase SQL Editor to add the client contact fields
-- 
-- Steps:
-- 1. Go to your Supabase Dashboard (https://app.supabase.com)
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this SQL
-- 5. Click "Run"

-- Add client_email and client_phone columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_deals_client_email ON deals(client_email);
CREATE INDEX IF NOT EXISTS idx_deals_client_phone ON deals(client_phone);

-- Add comments to describe the columns
COMMENT ON COLUMN deals.client_email IS 'Email address of the client contact for this deal';
COMMENT ON COLUMN deals.client_phone IS 'Phone number of the client contact for this deal';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' AND column_name IN ('client_email', 'client_phone')
ORDER BY column_name;

