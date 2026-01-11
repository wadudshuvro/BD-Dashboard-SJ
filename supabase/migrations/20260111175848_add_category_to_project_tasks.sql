-- Add category column to project_tasks table
-- Categories: Ideas, Discussion, Work, Other

ALTER TABLE public.project_tasks
ADD COLUMN category TEXT CHECK (category IN ('ideas', 'discussion', 'work', 'other')) DEFAULT 'work';

-- Add index for performance when filtering by category
CREATE INDEX idx_project_tasks_category
ON public.project_tasks(category);

-- Add comment for documentation
COMMENT ON COLUMN public.project_tasks.category IS
'Task category: ideas (brainstorming), discussion (team alignment), work (execution), other (miscellaneous)';
