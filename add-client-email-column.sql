-- Run this SQL in your Supabase SQL Editor to add the client_email column
-- 
-- Steps:
-- 1. Go to your Supabase Dashboard (https://app.supabase.com)
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this SQL
-- 5. Click "Run"

-- Add client_email column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_deals_client_email ON deals(client_email);

-- Add comment to describe the column
COMMENT ON COLUMN deals.client_email IS 'Email address of the client contact for this deal';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deals' AND column_name = 'client_email';

