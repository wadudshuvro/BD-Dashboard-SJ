import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemStats {
  totalBrands: number;
  totalUsers: number;
  totalIntegrations: number;
  totalRevenue: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  brand?: string;
  user?: string;
  time: string;
  type: 'brand' | 'system';
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const stats: SystemStats = {
        totalBrands: 0,
        totalUsers: 0,
        totalIntegrations: 0,
        totalRevenue: 0
      };
      
      const recentActivity: RecentActivity[] = [];

      try {
        // Brands table removed
        stats.totalBrands = 0;

        // Fetch collabai integrations
        const { data: collabIntegrations } = await supabase
          .from('collabai_integrations')
          .select('id')
          .eq('is_active', true);
        
        stats.totalIntegrations = collabIntegrations?.length || 0;

        // Brands removed - no recent activity to fetch

        if (stats.totalIntegrations > 0) {
          recentActivity.push({
            id: `integration-${Date.now()}`,
            action: 'Active integrations monitored',
            time: new Date().toLocaleString(),
            type: 'system'
          });
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }

      // Sort by time
      recentActivity.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      return { stats, recentActivity };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
