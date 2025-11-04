-- Fix NULL auth columns that cause "Database error querying schema" login error
-- This updates Paresh's account and any other users with similar issues

UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE 
  email_change IS NULL 
  OR email_change_token_new IS NULL 
  OR phone_change IS NULL 
  OR email_change_confirm_status IS NULL 
  OR phone_change_token IS NULL;