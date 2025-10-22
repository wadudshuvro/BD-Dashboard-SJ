import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDashboardData() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-data", user?.id],
    queryFn: async () => {
      // Brands table removed - no brand data to fetch

      // Fetch team members from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) throw profilesError;

      // Brand data removed - return empty array
      const brandPerformance: any[] = [];

      // Transform team member data
      const teamMembers = (profilesData || []).map((profile) => ({
        id: profile.id,
        name: profile.full_name || profile.email || "Unknown",
        email: profile.email,
        role: "Team Member",
        performance: 85,
        tasksCompleted: 0,
        availability: "available" as const,
      }));

      return {
        brandPerformance,
        teamMembers,
      };
    },
    enabled: !!user,
  });

  return {
    brandPerformance: data?.brandPerformance || [],
    teamMembers: data?.teamMembers || [],
    loading: isLoading,
    error: error?.message,
    refreshData: refetch,
  };
}
