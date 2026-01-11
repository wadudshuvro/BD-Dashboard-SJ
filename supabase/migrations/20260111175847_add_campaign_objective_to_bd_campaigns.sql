-- Add campaign_objective column to bd_campaigns table
-- This stores the campaign story/narrative with rich text content

ALTER TABLE public.bd_campaigns
ADD COLUMN campaign_objective TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.bd_campaigns.campaign_objective IS
'Campaign story/narrative describing goals, target audience, and strategy (supports rich text HTML)';
