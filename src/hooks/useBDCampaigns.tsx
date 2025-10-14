import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BDCampaign {
  id: string;
  name: string;
  niche_id: string;
  brand_id?: string;
  campaign_type: 'email_outbound' | 'linkedin_outbound' | 'cold_calling' | 'abm' | 'other';
  status: 'planning' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  target_contacts?: string[];
  target_regions?: string[];
  target_contacts_count?: number;
  actual_contacts_reached: number;
  responses_received: number;
  meetings_booked: number;
  deals_generated: number;
  owned_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useBDCampaigns = (nicheId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['bd_campaigns', nicheId],
    queryFn: async () => {
      let query = supabase
        .from('bd_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (nicheId) {
        query = query.eq('niche_id', nicheId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BDCampaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<BDCampaign>) => {
      const { data, error } = await supabase
        .from('bd_campaigns')
        .insert([campaign])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BDCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('bd_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bd_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bd_campaigns'] });
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    campaigns: campaigns || [],
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
};
