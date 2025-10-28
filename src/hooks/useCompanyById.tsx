import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  slug: string;
  name: string;
  website?: string | null;
  linkedin_url?: string | null;
  description?: string | null;
  industry?: string | null;
  employee_count?: string | null;
  headquarters?: string | null;
  founded_year?: number | null;
  logo_url?: string | null;
  revenue_range?: string | null;
  technologies?: string[] | null;
  specialties?: string[] | null;
  research_summary?: Record<string, unknown> | null;
  last_researched_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export const useCompanyById = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("Company ID is required");
      
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Company not found");
      return data as Company;
    },
    enabled: !!companyId,
  });
};
