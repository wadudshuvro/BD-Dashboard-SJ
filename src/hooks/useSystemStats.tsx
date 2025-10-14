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
  kpi?: string;
  time: string;
  type: 'brand' | 'user' | 'kpi';
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
        // Fetch brands
        const { data: brands } = await supabase
          .from('brands')
          .select('id')
          .eq('is_active', true);
        
        stats.totalBrands = brands?.length || 0;

        // Fetch collabai integrations
        const { data: collabIntegrations } = await supabase
          .from('collabai_integrations')
          .select('id')
          .eq('is_active', true);
        
        stats.totalIntegrations = collabIntegrations?.length || 0;

        // Fetch recent brands (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: recentBrands } = await supabase
          .from('brands')
          .select('id, name, created_at')
          .gte('created_at', oneDayAgo)
          .order('created_at', { ascending: false })
          .limit(5);

        recentBrands?.forEach((brand) => {
          recentActivity.push({
            id: `brand-${brand.id}`,
            action: 'New brand created',
            brand: brand.name,
            time: new Date(brand.created_at).toLocaleString(),
            type: 'brand'
          });
        });

        // Fetch recent KPI updates
        const { data: recentKPIs } = await supabase
          .from('brand_kpis')
          .select('id, name, updated_at')
          .gte('updated_at', oneDayAgo)
          .order('updated_at', { ascending: false })
          .limit(5);

        recentKPIs?.forEach((kpi) => {
          recentActivity.push({
            id: `kpi-${kpi.id}`,
            action: 'Brand KPI updated',
            kpi: kpi.name,
            time: new Date(kpi.updated_at).toLocaleString(),
            type: 'kpi'
          });
        });
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
