import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useDashboardData() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-data", user?.id],
    queryFn: async () => {
      // Fetch active brands
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .eq("is_active", true);

      if (brandsError) throw brandsError;

      // Fetch team members from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) throw profilesError;

      // Transform brand data
      const brandPerformance = (brandsData || []).map((brand) => ({
        id: brand.id,
        name: brand.name || "Unnamed Brand",
        description: brand.description || "",
        type: brand.industry || "internal",
        status: brand.is_active ? "growing" : "inactive",
        owner_id: brand.owner_id,
        owner_name: "Owner",
        is_active: brand.is_active,
        revenue: 0,
        growth: 0,
        monthly_budget: 0,
        activeTasks: 0,
        active_integrations: brand.active_integrations || [],
      }));

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
