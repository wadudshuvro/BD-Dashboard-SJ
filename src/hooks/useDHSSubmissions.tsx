import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DHSSubmission, DHSSubmissionFormData, DHSTeamSummary, DHSSubmissionWithUser } from '@/types/dhs';

export function useDHSSubmissions(userId?: string, date?: Date) {
  const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['dhs-submissions', userId, dateStr],
    queryFn: async () => {
      let query = supabase
        .from('dhs_submissions')
        .select('*')
        .eq('date', dateStr);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DHSSubmission[];
    },
  });
}

export function useMyDHSHistory(userId?: string, dateRange?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: ['dhs-history', userId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('dhs_submissions')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (dateRange?.start) {
        query = query.gte('date', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('date', dateRange.end);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as DHSSubmission[];
    },
  });
}

export function useTodayDHSSubmission(userId?: string) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['dhs-today', userId, today],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('dhs_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data as DHSSubmission | null;
    },
    enabled: !!userId,
  });
}

export function useSubmitDHS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: DHSSubmissionFormData & { date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('dhs_submissions')
        .insert({
          user_id: user.id,
          date: submission.date,
          follow_ups_done: submission.follow_ups_done,
          calls_made: submission.calls_made,
          meetings_booked: submission.meetings_booked,
          pipeline_updated: submission.pipeline_updated,
          score: submission.score || null,
          status: submission.status || null,
          notes: submission.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DHSSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dhs-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-history'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-today'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-team-summary'] });
    },
  });
}

export function useUpdateDHS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<DHSSubmissionFormData>;
    }) => {
      const { data, error } = await supabase
        .from('dhs_submissions')
        .update({
          follow_ups_done: updates.follow_ups_done,
          calls_made: updates.calls_made,
          meetings_booked: updates.meetings_booked,
          pipeline_updated: updates.pipeline_updated,
          score: updates.score !== undefined ? updates.score : undefined,
          status: updates.status !== undefined ? updates.status : undefined,
          notes: updates.notes !== undefined ? updates.notes : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DHSSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dhs-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-history'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-today'] });
      queryClient.invalidateQueries({ queryKey: ['dhs-team-summary'] });
    },
  });
}

export function useAllDHSSubmissions(dateFilter?: string) {
  return useQuery({
    queryKey: ['dhs-all-submissions', dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('dhs_submissions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('date', { ascending: false });

      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('date', today);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('date', weekAgo.toISOString().split('T')[0]);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('date', monthAgo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DHSSubmissionWithUser[];
    },
  });
}

export function useDHSTeamSummary(date?: Date) {
  const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['dhs-team-summary', dateStr],
    queryFn: async () => {
      // Get all submissions for the date
      const { data: submissions, error: submissionsError } = await supabase
        .from('dhs_submissions')
        .select('*')
        .eq('date', dateStr);

      if (submissionsError) throw submissionsError;

      // Get total active users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('id', 'is', null);

      if (usersError) throw usersError;

      const submissionsData = submissions as DHSSubmission[];
      const total_submissions = submissionsData.length;
      const submission_rate = totalUsers ? (total_submissions / totalUsers) * 100 : 0;

      // Calculate aggregates
      const total_follow_ups = submissionsData.reduce((sum, s) => sum + s.follow_ups_done, 0);
      const total_calls = submissionsData.reduce((sum, s) => sum + s.calls_made, 0);
      const total_meetings = submissionsData.reduce((sum, s) => sum + s.meetings_booked, 0);

      // Calculate average score (only for submissions with scores)
      const submissionsWithScore = submissionsData.filter(s => s.score !== null && s.score !== undefined);
      const average_score = submissionsWithScore.length > 0
        ? submissionsWithScore.reduce((sum, s) => sum + (s.score || 0), 0) / submissionsWithScore.length
        : undefined;

      // Status breakdown
      const status_breakdown = {
        on_track: submissionsData.filter(s => s.status === 'on_track').length,
        at_risk: submissionsData.filter(s => s.status === 'at_risk').length,
        blocked: submissionsData.filter(s => s.status === 'blocked').length,
      };

      const summary: DHSTeamSummary = {
        date: dateStr,
        total_submissions,
        submission_rate,
        average_score,
        total_follow_ups,
        total_calls,
        total_meetings,
        status_breakdown,
      };

      return summary;
    },
  });
}

