import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch total emails sent count across all active campaigns
 */
export const useTotalEmailsSent = () => {
  return useQuery({
    queryKey: ['campaign-emails-total-sent'],
    queryFn: async () => {
      // Count all emails that have been sent (sent_at is not null)
      // for campaigns that are active
      const { count, error } = await supabase
        .from('campaign_emails')
        .select('id, bd_campaigns!inner(status)', { count: 'exact', head: true })
        .not('sent_at', 'is', null)
        .eq('bd_campaigns.status', 'active');

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook to fetch emails sent count for a specific campaign
 */
export const useCampaignEmailsSent = (campaignId?: string) => {
  return useQuery({
    queryKey: ['campaign-emails-sent', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      if (!campaignId) return 0;

      // Count all emails that have been sent for this campaign
      const { count, error } = await supabase
        .from('campaign_emails')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
