import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectTask } from './useProjectTasks';

export const useTaskDetail = (taskId?: string) => {
  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      // Fetch task — avoid bd_campaigns join (table may not exist on hackathon/minimal DB)
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      // Optional campaign name when full schema is available
      let campaign: { id: string; name: string } | null = null;
      if (data.campaign_id) {
        try {
          const { data: campaignData } = await supabase
            .from('bd_campaigns')
            .select('id, name')
            .eq('id', data.campaign_id)
            .maybeSingle();
          campaign = campaignData ?? null;
        } catch {
          // bd_campaigns not present on minimal/hackathon database
        }
      }

      // Fetch labels separately using type assertion
      let labels: any[] = [];
      try {
        const { data: labelData } = await (supabase as any)
          .from('project_task_labels')
          .select(`
            label_id,
            task_labels(id, name, color)
          `)
          .eq('task_id', taskId);
        
        labels = (labelData || []).map((l: any) => l.task_labels).filter(Boolean);
      } catch (e) {
        console.log('Labels table may not exist:', e);
      }

      // Fetch attachments separately using type assertion
      let attachments: any[] = [];
      try {
        const { data: attachData } = await (supabase as any)
          .from('task_attachments')
          .select('*')
          .eq('task_id', taskId);
        
        attachments = attachData || [];
      } catch (e) {
        console.log('Attachments table may not exist:', e);
      }

      // Transform and return
      const transformedTask = {
        ...data,
        campaign,
        labels,
        attachments,
      };

      return transformedTask as unknown as ProjectTask;
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
