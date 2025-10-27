import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCampaignContactResearch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase.functions.invoke("campaign-contact-research", {
        body: { contactId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, contactId) => {
      queryClient.invalidateQueries({ queryKey: ["campaign-contact-by-slug"] });
      toast({ 
        title: "Research completed", 
        description: "Contact research has been updated with new insights" 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Research failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
