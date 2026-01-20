import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export type ActivityFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'one_time';
export type ActivityStatus = 'active' | 'paused' | 'completed';

export interface AccountabilityActivity {
  id: string;
  rep_goal_id: string;
  title: string;
  description: string | null;
  frequency: ActivityFrequency;
  target_count: number;
  current_count: number;
  linked_task_id: string | null;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  linked_task?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface CreateActivityData {
  rep_goal_id: string;
  title: string;
  description?: string;
  frequency: ActivityFrequency;
  target_count: number;
  linked_task_id?: string;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  frequency?: ActivityFrequency;
  target_count?: number;
  current_count?: number;
  linked_task_id?: string;
  status?: ActivityStatus;
}

// Hook to fetch activities for a rep goal
export function useActivities(repGoalId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-activities', repGoalId],
    queryFn: async () => {
      if (!repGoalId) return [];

      const { data, error } = await supabase
        .from('accountability_activities')
        .select(`
          *,
          linked_task:project_tasks(id, title, status)
        `)
        .eq('rep_goal_id', repGoalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountabilityActivity[];
    },
    enabled: !!repGoalId,
  });
}

// Hook to fetch a single activity
export function useActivity(activityId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-activity', activityId],
    queryFn: async () => {
      if (!activityId) return null;

      const { data, error } = await supabase
        .from('accountability_activities')
        .select(`
          *,
          linked_task:project_tasks(id, title, status)
        `)
        .eq('id', activityId)
        .single();

      if (error) throw error;
      return data as AccountabilityActivity;
    },
    enabled: !!activityId,
  });
}

// Hook to create an activity
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityData: CreateActivityData) => {
      const { data, error } = await supabase
        .from('accountability_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-activities', data.rep_goal_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goal', data.rep_goal_id] });
      toast.success('Activity created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create activity: ${error.message}`);
    },
  });
}

// Hook to update an activity
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateActivityData }) => {
      const { data, error } = await supabase
        .from('accountability_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-activities', data.rep_goal_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-activity', data.id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goal', data.rep_goal_id] });
      toast.success('Activity updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });
}

// Hook to link a task to an activity
export function useLinkTaskToActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, taskId }: { activityId: string; taskId: string | null }) => {
      const { data, error } = await supabase
        .from('accountability_activities')
        .update({ linked_task_id: taskId })
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-activities', data.rep_goal_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-activity', data.id] });
      const message = data.linked_task_id ? 'Task linked successfully' : 'Task unlinked successfully';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to link task: ${error.message}`);
    },
  });
}

// Hook to delete an activity
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('accountability_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-activities'] });
      toast.success('Activity deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
    },
  });
}

