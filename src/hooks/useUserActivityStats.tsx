import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivitySummary {
  activeUsers: {
    day: number;
    week: number;
    month: number;
  };
  totalEvents: number;
  totalLogins: number;
  periodStart: string;
  periodEnd: string;
}

export interface ActivityLeaderboardEntry {
  userId: string;
  userName: string;
  activityCount: number;
  loginCount: number;
  lastActivityAt: string;
}

export interface RecentActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string;
}

export interface UserActivityStatsResponse {
  summary: UserActivitySummary;
  activityBreakdown: Record<string, number>;
  leaderboard: ActivityLeaderboardEntry[];
  recentActivity: RecentActivityEntry[];
}

interface UseUserActivityStatsOptions {
  period?: '7d' | '30d' | '90d';
  recentLimit?: number;
}

export function useUserActivityStats(options: UseUserActivityStatsOptions = {}) {
  const { period = '30d', recentLimit = 20 } = options;

  return useQuery({
    queryKey: ['user-activity-stats', period, recentLimit],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        recentLimit: recentLimit.toString(),
      });

      const { data, error } = await supabase.functions.invoke(
        `user-activity-stats?${params.toString()}`,
        { method: 'GET' }
      );

      if (error) throw error;
      return data as UserActivityStatsResponse;
    },
    refetchInterval: 60000,
  });
}

export function useSendLowUsageNotifications() {
  return useMutation({
    mutationFn: async (days: number = 7) => {
      const params = new URLSearchParams({ days: days.toString() });
      const { data, error } = await supabase.functions.invoke(
        `notify-low-usage?${params.toString()}`,
        { method: 'POST' }
      );

      if (error) throw error;
      return data as {
        notifiedCount: number;
        inactiveCount: number;
        skippedCount: number;
      };
    },
  });
}
