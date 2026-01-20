import { useQuery, useMutation, useQueryClient } from '@tantml/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export type GoalStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed';
export type GoalApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface AccountabilityTeamGoal {
  id: string;
  quarter_id: string;
  title: string;
  description: string | null;
  target_value: number;
  target_unit: string;
  current_value: number;
  status: GoalStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountabilityRepGoal {
  id: string;
  quarter_id: string;
  team_goal_id: string | null;
  rep_id: string;
  title: string;
  description: string | null;
  target_value: number;
  target_unit: string;
  current_value: number;
  status: GoalStatus;
  approval_status: GoalApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  rep?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  team_goal?: AccountabilityTeamGoal;
}

export interface CreateTeamGoalData {
  quarter_id: string;
  title: string;
  description?: string;
  target_value: number;
  target_unit: string;
}

export interface CreateRepGoalData {
  quarter_id: string;
  team_goal_id?: string;
  title: string;
  description?: string;
  target_value: number;
  target_unit: string;
  rep_id?: string; // Optional, defaults to current user
}

export interface UpdateRepGoalData {
  title?: string;
  description?: string;
  target_value?: number;
  target_unit?: string;
  status?: GoalStatus;
  current_value?: number;
}

export interface ApproveGoalData {
  approval_status: 'approved' | 'rejected';
  rejection_reason?: string;
}

// Hook to fetch team goals for a quarter
export function useTeamGoals(quarterId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-team-goals', quarterId],
    queryFn: async () => {
      if (!quarterId) return [];

      const { data, error } = await supabase
        .from('accountability_team_goals')
        .select('*')
        .eq('quarter_id', quarterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountabilityTeamGoal[];
    },
    enabled: !!quarterId,
  });
}

// Hook to fetch a single team goal
export function useTeamGoal(goalId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-team-goal', goalId],
    queryFn: async () => {
      if (!goalId) return null;

      const { data, error } = await supabase
        .from('accountability_team_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) throw error;
      return data as AccountabilityTeamGoal;
    },
    enabled: !!goalId,
  });
}

// Hook to fetch rep goals for a quarter (optionally filtered by rep)
export function useRepGoals(quarterId: string | undefined, repId?: string) {
  return useQuery({
    queryKey: ['accountability-rep-goals', quarterId, repId],
    queryFn: async () => {
      if (!quarterId) return [];

      let query = supabase
        .from('accountability_rep_goals')
        .select(`
          *,
          rep:profiles!accountability_rep_goals_rep_id_fkey(id, email, full_name),
          team_goal:accountability_team_goals(*)
        `)
        .eq('quarter_id', quarterId);

      if (repId) {
        query = query.eq('rep_id', repId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountabilityRepGoal[];
    },
    enabled: !!quarterId,
  });
}

// Hook to fetch a single rep goal
export function useRepGoal(goalId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-rep-goal', goalId],
    queryFn: async () => {
      if (!goalId) return null;

      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .select(`
          *,
          rep:profiles!accountability_rep_goals_rep_id_fkey(id, email, full_name),
          team_goal:accountability_team_goals(*)
        `)
        .eq('id', goalId)
        .single();

      if (error) throw error;
      return data as AccountabilityRepGoal;
    },
    enabled: !!goalId,
  });
}

// Hook to fetch goals pending approval
export function usePendingApprovalGoals(quarterId: string | undefined) {
  return useQuery({
    queryKey: ['accountability-pending-goals', quarterId],
    queryFn: async () => {
      if (!quarterId) return [];

      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .select(`
          *,
          rep:profiles!accountability_rep_goals_rep_id_fkey(id, email, full_name),
          team_goal:accountability_team_goals(*)
        `)
        .eq('quarter_id', quarterId)
        .eq('approval_status', 'pending_approval')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AccountabilityRepGoal[];
    },
    enabled: !!quarterId,
  });
}

// Hook to create a team goal
export function useCreateTeamGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: CreateTeamGoalData) => {
      const { data, error } = await supabase
        .from('accountability_team_goals')
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityTeamGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-team-goals', data.quarter_id] });
      toast.success('Team goal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create team goal: ${error.message}`);
    },
  });
}

// Hook to create a rep goal
export function useCreateRepGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: CreateRepGoalData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData = {
        ...goalData,
        rep_id: goalData.rep_id || user?.id,
      };

      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityRepGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goals', data.quarter_id] });
      toast.success('Goal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create goal: ${error.message}`);
    },
  });
}

// Hook to update a rep goal
export function useUpdateRepGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRepGoalData }) => {
      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityRepGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goals', data.quarter_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goal', data.id] });
      toast.success('Goal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update goal: ${error.message}`);
    },
  });
}

// Hook to update a team goal
export function useUpdateTeamGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateTeamGoalData> }) => {
      const { data, error } = await supabase
        .from('accountability_team_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityTeamGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-team-goals', data.quarter_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-team-goal', data.id] });
      toast.success('Team goal updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update team goal: ${error.message}`);
    },
  });
}

// Hook to submit a goal for approval
export function useSubmitGoalForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .update({ approval_status: 'pending_approval' })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityRepGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goals', data.quarter_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-pending-goals', data.quarter_id] });
      toast.success('Goal submitted for approval');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit goal: ${error.message}`);
    },
  });
}

// Hook to approve or reject a goal
export function useApproveGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, approvalData }: { goalId: string; approvalData: ApproveGoalData }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const updates: any = {
        approval_status: approvalData.approval_status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      };

      if (approvalData.approval_status === 'rejected' && approvalData.rejection_reason) {
        updates.rejection_reason = approvalData.rejection_reason;
      }

      const { data, error } = await supabase
        .from('accountability_rep_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      return data as AccountabilityRepGoal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goals', data.quarter_id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goal', data.id] });
      queryClient.invalidateQueries({ queryKey: ['accountability-pending-goals', data.quarter_id] });
      const message = data.approval_status === 'approved' ? 'Goal approved' : 'Goal rejected';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process approval: ${error.message}`);
    },
  });
}

// Hook to delete a rep goal
export function useDeleteRepGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('accountability_rep_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-rep-goals'] });
      toast.success('Goal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete goal: ${error.message}`);
    },
  });
}

// Hook to delete a team goal
export function useDeleteTeamGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('accountability_team_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-team-goals'] });
      toast.success('Team goal deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete team goal: ${error.message}`);
    },
  });
}

