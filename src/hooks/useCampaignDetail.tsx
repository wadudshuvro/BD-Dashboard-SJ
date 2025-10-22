import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BDCampaign } from './useBDCampaigns';

export type CampaignContactStatus =
  | 'identified'
  | 'researched'
  | 'contacted_linkedin'
  | 'connected'
  | 'messaged'
  | 'contacted_email'
  | 'responded'
  | 'meeting_booked';

export interface CampaignContact {
  id: string;
  campaign_id: string;
  contact_name: string;
  contact_email?: string | null;
  contact_linkedin_url?: string | null;
  contact_company?: string | null;
  status: CampaignContactStatus;
  linkedin_request_sent_at?: string | null;
  linkedin_accepted_at?: string | null;
  linkedin_message_sent_at?: string | null;
  email_sent_at?: string | null;
  last_activity_at?: string | null;
  research_summary?: Record<string, unknown> | null;
  personalization_notes?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignActivity {
  id: string;
  campaign_id: string;
  contact_id?: string | null;
  activity_type: 'linkedin_request' | 'linkedin_message' | 'email_sent' | 'response_received' | 'meeting_booked';
  activity_data?: Record<string, unknown> | null;
  performed_by?: string | null;
  performed_at: string;
  ai_generated?: boolean | null;
  created_at: string;
}

export interface CampaignAITask {
  id: string;
  campaign_id: string;
  contact_id?: string | null;
  task_type: 'research' | 'email_generation' | 'message_generation' | 'personalization';
  agent_id?: string | null;
  input_data?: Record<string, unknown> | null;
  output_data?: Record<string, unknown> | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export const useCampaignDetail = (campaignId?: string) => {
  const campaignQuery = useQuery({
    queryKey: ['campaign-detail', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bd_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data as BDCampaign;
    },
  });

  // Campaign contacts, activities, and tasks tables don't exist - returning empty data
  const contactsQuery = useQuery({
    queryKey: ['campaign-contacts', campaignId],
    enabled: false, // Table doesn't exist
    queryFn: async () => {
      return [] as CampaignContact[];
    },
  });

  const activitiesQuery = useQuery({
    queryKey: ['campaign-activities', campaignId],
    enabled: false, // Table doesn't exist
    queryFn: async () => {
      return [] as CampaignActivity[];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['campaign-ai-tasks', campaignId],
    enabled: false, // Table doesn't exist
    queryFn: async () => {
      return [] as CampaignAITask[];
    },
  });

  const contactByStatus = useMemo(() => {
    const counts: Record<CampaignContactStatus, CampaignContact[]> = {
      identified: [],
      researched: [],
      contacted_linkedin: [],
      connected: [],
      messaged: [],
      contacted_email: [],
      responded: [],
      meeting_booked: [],
    };

    (contactsQuery.data || []).forEach((contact) => {
      counts[contact.status].push(contact);
    });

    return counts;
  }, [contactsQuery.data]);

  return {
    campaign: campaignQuery.data,
    contacts: contactsQuery.data || [],
    activities: activitiesQuery.data || [],
    tasks: tasksQuery.data || [],
    contactByStatus,
    isLoading:
      campaignQuery.isLoading || contactsQuery.isLoading || activitiesQuery.isLoading || tasksQuery.isLoading,
    isError: campaignQuery.isError || contactsQuery.isError || activitiesQuery.isError || tasksQuery.isError,
    error:
      campaignQuery.error ||
      contactsQuery.error ||
      activitiesQuery.error ||
      tasksQuery.error ||
      null,
  };
};
