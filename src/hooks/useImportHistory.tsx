import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImportJob {
  id: string;
  campaign_id: string;
  user_id: string;
  status: string;
  import_source: string;
  sheet_url?: string;
  field_mapping?: any;
  validation_results?: any;
  rollback_data?: any;
  is_rolled_back: boolean;
  rolled_back_at?: string;
  rolled_back_by?: string;
  skipped_count: number;
  failed_count: number;
  duplicate_count: number;
  tags?: string[];
  criteria: any;
  error_details?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  bd_campaigns?: {
    name: string;
    slug: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface ImportHistoryFilters {
  campaignId?: string;
  status?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useImportHistory = (filters?: ImportHistoryFilters) => {
  return useQuery({
    queryKey: ["import-history", filters],
    queryFn: async () => {
      let query = supabase
        .from("lead_import_jobs")
        .select(`
          *,
          bd_campaigns(name, slug),
          profiles(full_name)
        `)
        .order("created_at", { ascending: false });

      if (filters?.campaignId) {
        query = query.eq("campaign_id", filters.campaignId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.source) {
        query = query.eq("import_source", filters.source);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any as ImportJob[];
    },
  });
};

export const useImportById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["import-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("Import ID is required");

      const { data, error } = await supabase
        .from("lead_import_jobs")
        .select(`
          *,
          bd_campaigns(name, slug),
          profiles(full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as any as ImportJob;
    },
    enabled: !!id,
  });
};

export const useRollbackImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ importId, reason }: { importId: string; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("campaign-import-rollback", {
        body: { importId, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["import-history"] });
      queryClient.invalidateQueries({ queryKey: ["import-detail"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-contacts"] });
      toast.success(data.message || "Import rolled back successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to rollback import");
    },
  });
};

export const useImportStats = () => {
  return useQuery({
    queryKey: ["import-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_import_jobs")
        .select("*");

      if (error) throw error;

      const totalImports = data.length;
      const successfulImports = data.filter((job: any) => job.status === "completed").length;
      // Count from rollback_data or criteria as fallback
      const totalContactsAdded = data.reduce((sum: number, job: any) => {
        const imported = job.rollback_data?.contact_ids?.length || 0;
        return sum + imported;
      }, 0);
      const successRate = totalImports > 0 ? (successfulImports / totalImports) * 100 : 0;

      return {
        totalImports,
        successfulImports,
        totalContactsAdded,
        successRate: Math.round(successRate),
      };
    },
  });
};
