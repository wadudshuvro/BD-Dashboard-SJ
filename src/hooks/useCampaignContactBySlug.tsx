import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CampaignContact {
  id: string;
  slug: string;
  campaign_id: string;
  contact_name: string;
  contact_email?: string | null;
  contact_linkedin_url?: string | null;
  contact_company?: string | null;
  contact_title?: string | null;
  contact_phone?: string | null;
  status: string;
  research_summary?: unknown;
  metadata?: unknown;
  created_at: string;
  updated_at: string;
}

export const useCampaignContactBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["campaign-contact-by-slug", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      
      const { data, error } = await supabase
        .from("campaign_contacts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Contact not found");
      return data as CampaignContact;
    },
    enabled: !!slug,
  });
};
