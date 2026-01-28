import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch total emails sent count across all active campaigns
 * Aggregates from:
 * 1. campaign.ghl_stats.emails_sent (GoHighLevel email sends)
 * 2. campaign_emails table (direct email sends)
 * 3. contact_sequence_enrollments table (sequence-based emails via total_sent)
 */
export const useTotalEmailsSent = () => {
  return useQuery({
    queryKey: ['campaign-emails-total-sent'],
    queryFn: async () => {
      // 1. Get ghl_stats.emails_sent from active campaigns
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('bd_campaigns')
        .select('id, ghl_stats')
        .eq('status', 'active');

      if (campaignsError) {
        console.error('Error fetching active campaigns:', campaignsError);
        return 0;
      }

      // Sum emails_sent from ghl_stats for all active campaigns
      const ghlEmailsCount = activeCampaigns?.reduce((sum, campaign) => {
        const ghlStats = campaign.ghl_stats as Record<string, number> | null;
        return sum + (ghlStats?.emails_sent ?? 0);
      }, 0) ?? 0;

      const activeCampaignIds = activeCampaigns?.map(c => c.id) ?? [];

      if (activeCampaignIds.length === 0) {
        return ghlEmailsCount;
      }

      // 2. Count direct emails from campaign_emails for active campaigns
      const { count: directEmailsCount, error: directError } = await supabase
        .from('campaign_emails')
        .select('id', { count: 'exact', head: true })
        .in('campaign_id', activeCampaignIds)
        .not('sent_at', 'is', null);

      if (directError) {
        console.error('Error fetching direct emails count:', directError);
      }

      // 3. Get contact IDs for active campaigns
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .in('campaign_id', activeCampaignIds);

      if (contactsError) {
        console.error('Error fetching campaign contacts:', contactsError);
        return ghlEmailsCount + (directEmailsCount ?? 0);
      }

      const contactIds = contacts?.map(c => c.id) ?? [];

      if (contactIds.length === 0) {
        return ghlEmailsCount + (directEmailsCount ?? 0);
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

      return ghlEmailsCount + (directEmailsCount ?? 0) + sequenceEmailsCount;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Hook to fetch emails sent count for a specific campaign
 * Aggregates from:
 * 1. campaign.ghl_stats.emails_sent (GoHighLevel email sends)
 * 2. campaign_emails table (direct email sends)
 * 3. contact_sequence_enrollments table (sequence-based emails via total_sent)
 */
export const useCampaignEmailsSent = (campaignId?: string) => {
  return useQuery({
    queryKey: ['campaign-emails-sent', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      if (!campaignId) return 0;

      // 1. Get ghl_stats.emails_sent from the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('bd_campaigns')
        .select('ghl_stats')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
      }

      const ghlStats = campaign?.ghl_stats as Record<string, number> | null;
      const ghlEmailsCount = ghlStats?.emails_sent ?? 0;

      // 2. Count direct emails from campaign_emails for this campaign
      const { count: directEmailsCount, error: directError } = await supabase
        .from('campaign_emails')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null);

      if (directError) {
        console.error('Error fetching direct emails count:', directError);
      }

      // 3. Get contact IDs for this campaign
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .eq('campaign_id', campaignId);

      if (contactsError) {
        console.error('Error fetching campaign contacts:', contactsError);
        return ghlEmailsCount + (directEmailsCount ?? 0);
      }

      const contactIds = contacts?.map(c => c.id) ?? [];

      if (contactIds.length === 0) {
        return ghlEmailsCount + (directEmailsCount ?? 0);
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

      return ghlEmailsCount + (directEmailsCount ?? 0) + sequenceEmailsCount;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
