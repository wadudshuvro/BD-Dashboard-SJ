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

export const useCompanyBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["company", "slug", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Company slug is required");
      
      // Try to fetch by slug first
      let { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      // If not found by slug, try by ID (for backward compatibility)
      if (!data && !error) {
        const result = await supabase
          .from("companies")
          .select("*")
          .eq("id", slug)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) throw new Error("Company not found");
      return data as Company;
    },
    enabled: !!slug,
  });
};
