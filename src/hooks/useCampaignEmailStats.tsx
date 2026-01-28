import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch total emails sent count across all active campaigns
 * Aggregates from:
 * 1. campaign_emails table (direct email sends)
 * 2. contact_sequence_enrollments table (sequence-based emails via total_sent)
 */
export const useTotalEmailsSent = () => {
  return useQuery({
    queryKey: ['campaign-emails-total-sent'],
    queryFn: async () => {
      // 1. Count direct emails from campaign_emails for active campaigns
      const { count: directEmailsCount, error: directError } = await supabase
        .from('campaign_emails')
        .select('id, bd_campaigns!inner(status)', { count: 'exact', head: true })
        .not('sent_at', 'is', null)
        .eq('bd_campaigns.status', 'active');

      if (directError) {
        console.error('Error fetching direct emails count:', directError);
      }

      // 2. Get active campaign IDs first
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('bd_campaigns')
        .select('id')
        .eq('status', 'active');

      if (campaignsError) {
        console.error('Error fetching active campaigns:', campaignsError);
        return directEmailsCount ?? 0;
      }

      const activeCampaignIds = activeCampaigns?.map(c => c.id) ?? [];

      if (activeCampaignIds.length === 0) {
        return directEmailsCount ?? 0;
      }

      // 3. Get contact IDs for active campaigns
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .in('campaign_id', activeCampaignIds);

      if (contactsError) {
        console.error('Error fetching campaign contacts:', contactsError);
        return directEmailsCount ?? 0;
      }

      const contactIds = contacts?.map(c => c.id) ?? [];

      if (contactIds.length === 0) {
        return directEmailsCount ?? 0;
      }

      // 4. Sum total_sent from enrollments for these contacts
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('contact_sequence_enrollments')
        .select('total_sent')
        .in('contact_id', contactIds);

      if (enrollmentsError) {
        console.error('Error fetching sequence enrollments:', enrollmentsError);
      }

      const sequenceEmailsCount = enrollments?.reduce((sum, enrollment) => {
        return sum + (enrollment.total_sent ?? 0);
      }, 0) ?? 0;

      return (directEmailsCount ?? 0) + sequenceEmailsCount;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook to fetch emails sent count for a specific campaign
 * Aggregates from:
 * 1. campaign_emails table (direct email sends)
 * 2. contact_sequence_enrollments table (sequence-based emails via total_sent)
 */
export const useCampaignEmailsSent = (campaignId?: string) => {
  return useQuery({
    queryKey: ['campaign-emails-sent', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      if (!campaignId) return 0;

      // 1. Count direct emails from campaign_emails for this campaign
      const { count: directEmailsCount, error: directError } = await supabase
        .from('campaign_emails')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null);

      if (directError) {
        console.error('Error fetching direct emails count:', directError);
      }

      // 2. Get contact IDs for this campaign
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .eq('campaign_id', campaignId);

      if (contactsError) {
        console.error('Error fetching campaign contacts:', contactsError);
        return directEmailsCount ?? 0;
      }

      const contactIds = contacts?.map(c => c.id) ?? [];

      if (contactIds.length === 0) {
        return directEmailsCount ?? 0;
      }

      // 3. Sum total_sent from enrollments for these contacts
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('contact_sequence_enrollments')
        .select('total_sent')
        .in('contact_id', contactIds);

      if (enrollmentsError) {
        console.error('Error fetching sequence enrollments:', enrollmentsError);
      }

      const sequenceEmailsCount = enrollments?.reduce((sum, enrollment) => {
        return sum + (enrollment.total_sent ?? 0);
      }, 0) ?? 0;

      return (directEmailsCount ?? 0) + sequenceEmailsCount;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
