import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import axiosPrivate from '@/lib/axiosPrivate';
import type {
  CampaignAITask,
  CampaignActivity,
  CampaignAnalyticsPoint,
  CampaignAIAgentRun,
  CampaignContact,
  CampaignContactStatus,
  CampaignDetailIntegrations,
  CampaignDetailResponse,
  CampaignKpi,
  CampaignProjectTask,
  UpdateCampaignPayload,
} from '@/features/campaign-detail/types';

const defaultContactByStatus = (): Record<CampaignContactStatus, CampaignContact[]> => ({
  identified: [],
  researched: [],
  contacted_linkedin: [],
  connected: [],
  messaged: [],
  contacted_email: [],
  responded: [],
  meeting_booked: [],
});

const buildIntegrationFallback = (
  integrations?: CampaignDetailIntegrations,
): CampaignDetailIntegrations => ({
  n8n: integrations?.n8n ?? { status: 'pending', message: 'Waiting for first sync run.' },
  hubspot: integrations?.hubspot ?? { status: 'not_configured', message: 'HubSpot sync not configured yet.' },
  ghl: integrations?.ghl ?? { status: 'pending', message: 'Waiting for GoHighLevel sync.' },
});

export const useCampaignDetail = (campaignId?: string) => {
  const queryClient = useQueryClient();

  const campaignQuery = useQuery({
    queryKey: ['campaign-detail', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const { data } = await axiosPrivate.get<CampaignDetailResponse>(`/admin-campaigns/${campaignId}`);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateCampaignPayload) => {
      if (!campaignId) {
        throw new Error('Campaign ID is required to update campaign');
      }

      const { data } = await axiosPrivate.put<CampaignDetailResponse>(`/admin-campaigns/${campaignId}`, payload);
      return data;
    },
    onSuccess: () => {
      if (!campaignId) return;
      queryClient.invalidateQueries({ queryKey: ['campaign-detail', campaignId] });
    },
  });

  const detail = campaignQuery.data;

  const contacts = detail?.contacts ?? [];
  const contactByStatus = useMemo(() => {
    const buckets = defaultContactByStatus();

    contacts.forEach((contact) => {
      if (buckets[contact.status]) {
        buckets[contact.status].push(contact);
      }
    });

    return buckets;
  }, [contacts]);

  const integrations: CampaignDetailIntegrations = buildIntegrationFallback(detail?.integrations);

  const analytics: CampaignAnalyticsPoint[] = detail?.analytics_data ?? [];
  const kpis: CampaignKpi[] = detail?.linked_kpis ?? [];
  const projectTasks: CampaignProjectTask[] = detail?.project_tasks ?? [];
  const aiAgentRuns: CampaignAIAgentRun[] = detail?.ai_agent_runs ?? [];
  const aiTasks: CampaignAITask[] = detail?.ai_tasks ?? [];

  const markCompleted = async () =>
    updateMutation.mutateAsync({ status: 'completed', trigger_ai_summary: true });

  const softArchive = async () => updateMutation.mutateAsync({ status: 'archived', archived: true });

  return {
    campaign: detail?.campaign,
    contacts,
    activities: detail?.activities ?? [],
    tasks: aiTasks,
    analytics,
    kpis,
    projectTasks,
    aiAgentRuns,
    integrations,
    aiSummary: detail?.campaign?.ai_summary ?? detail?.campaign?.insights_summary ?? null,
    aiPostMortem: detail?.campaign?.ai_post_mortem ?? null,
    contactByStatus,
    refetch: campaignQuery.refetch,
    updateCampaign: updateMutation.mutateAsync,
    markCompleted,
    softArchive,
    isUpdating: updateMutation.isPending,
    isLoading: campaignQuery.isLoading,
    isError: campaignQuery.isError,
    error: campaignQuery.error ?? null,
  };
};

export type {
  CampaignAITask,
  CampaignActivity,
  CampaignAnalyticsPoint,
  CampaignAIAgentRun,
  CampaignContact,
  CampaignContactStatus,
  CampaignDetailIntegrations,
  CampaignKpi,
  CampaignProjectTask,
  UpdateCampaignPayload,
} from '@/features/campaign-detail/types';
