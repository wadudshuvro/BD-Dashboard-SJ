import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CampaignContact } from "./useCampaignContactBySlug";

export const useCampaignContactUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      contactId, 
      updates 
    }: { 
      contactId: string; 
      updates: { status?: string; [key: string]: any }; 
    }) => {
      const { data, error } = await supabase
        .from("campaign_contacts")
        .update(updates)
        .eq("id", contactId)
        .select()
        .single();

      if (error) throw error;
      return data as CampaignContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-contact-by-slug", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["campaign-by-slug"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-contacts"] });
      
      toast({
        title: "Contact updated",
        description: "Changes saved successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
