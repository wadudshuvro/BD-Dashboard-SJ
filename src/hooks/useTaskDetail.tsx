import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectTask } from './useProjectTasks';

export const useTaskDetail = (taskId?: string) => {
  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          labels:project_task_labels(
            label_id,
            task_labels(
              id,
              name,
              color
            )
          ),
          attachments:task_attachments(
            id,
            task_id,
            file_name,
            file_path,
            file_size,
            file_type,
            uploaded_by,
            created_at
          ),
          campaign:bd_campaigns(
            id,
            name
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;

      // Transform labels data
      const transformedTask = {
        ...data,
        labels: (data.labels || [])
          .map((l: any) => l.task_labels)
          .filter(Boolean),
      };

      return transformedTask as ProjectTask;
    },
    enabled: !!taskId,
    staleTime: 30000, // 30 seconds
  });

  return {
    task,
    isLoading,
    error,
    refetch,
  };
};

