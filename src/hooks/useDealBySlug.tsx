import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const useDealBySlug = (slug: string | undefined) => {
  // First, resolve the slug to a deal_id
  const { data: systemInfo, isLoading: isLoadingSlug } = useQuery({
    queryKey: ["deal-slug-lookup", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");

      // Check if slug is already a UUID (legacy format)
      if (isValidUUID(slug)) {
        return { deal_id: slug };
      }

      // Otherwise, look it up in deal_system_info
      const { data, error } = await supabase
        .from("deal_system_info")
        .select("deal_id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Deal not found");
      
      return data;
    },
    enabled: !!slug,
  });

  // Once we have the deal_id, fetch the full deal data
  const { data: deal, isLoading: isLoadingDeal, error } = useQuery({
    queryKey: ["deal", systemInfo?.deal_id],
    queryFn: async () => {
      if (!systemInfo?.deal_id) throw new Error("Deal ID not resolved");

      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          pods(id, name),
          clients(*)
        `)
        .eq("id", systemInfo.deal_id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Deal not found");
      
      return data;
    },
    enabled: !!systemInfo?.deal_id,
  });

  return {
    deal,
    isLoading: isLoadingSlug || isLoadingDeal,
    error,
    dealId: systemInfo?.deal_id,
  };
};

