-- Add campaign_id column to project_tasks table
-- This allows tasks to be optionally associated with campaigns

ALTER TABLE public.project_tasks
ADD COLUMN campaign_id UUID REFERENCES public.bd_campaigns(id) ON DELETE SET NULL;

-- Add index for performance when querying tasks by campaign
CREATE INDEX idx_project_tasks_campaign_id
ON public.project_tasks(campaign_id);

-- Add comment for documentation
COMMENT ON COLUMN public.project_tasks.campaign_id IS
'Optional foreign key to bd_campaigns - allows tasks to be associated with a campaign';
