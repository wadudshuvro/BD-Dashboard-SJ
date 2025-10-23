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
import { getCampaignDetail } from '@/Api/adminCampaigns';
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
  const queryClient = useQueryClient();

  const campaignQuery = useQuery({
    queryKey: ['admin-campaign-detail', campaignId],
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
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const response = await getCampaignDetail(campaignId);
      return response;
    },
  });

  const contacts = useMemo(
    () => (campaignQuery.data?.contacts as CampaignContact[] | undefined) ?? [],
    [campaignQuery.data?.contacts],
  );
  const activities = useMemo(
    () => (campaignQuery.data?.activities as CampaignActivity[] | undefined) ?? [],
    [campaignQuery.data?.activities],
  );
  const tasks = useMemo(() => {
    const projectTasks = campaignQuery.data?.tasks as Array<Record<string, unknown>> | undefined;
    return mapProjectTasksToAITasks(projectTasks ?? [], campaignId);
  }, [campaignQuery.data?.tasks, campaignId]);

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

    contacts.forEach((contact) => {
      counts[contact.status].push(contact);
    });

    return counts;
  }, [contacts]);

  return {
    campaign: campaignQuery.data?.campaign as BDCampaign | undefined,
    contacts,
    activities,
    tasks,
    contactByStatus,
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
function mapProjectTasksToAITasks(
  projectTasks: Array<Record<string, unknown>>,
  campaignId?: string,
): CampaignAITask[] {
  if (!projectTasks || projectTasks.length === 0) {
    return [];
  }

  return projectTasks.map((task) => {
    const status = normalizeTaskStatus(task.status);
    const createdAt = typeof task.created_at === 'string' ? task.created_at : new Date().toISOString();
    const updatedAt = typeof task.updated_at === 'string' ? task.updated_at : createdAt;

    return {
      id: String(task.id ?? `task-${Math.random().toString(36).slice(2)}`),
      campaign_id: campaignId ?? String(task.project_id ?? ''),
      contact_id: null,
      task_type: 'personalization',
      agent_id: null,
      input_data: {
        title: task.title,
        description: task.description,
        priority: task.priority,
      },
      output_data: null,
      status,
      created_at: createdAt,
      updated_at: updatedAt,
      completed_at: typeof task.completed_at === 'string' ? task.completed_at : null,
    };
  });
}

function normalizeTaskStatus(status: unknown): CampaignAITask['status'] {
  if (typeof status !== 'string') {
    return 'pending';
  }

  const lower = status.toLowerCase();
  if (lower.includes('progress') || lower === 'in_progress') {
    return 'running';
  }
  if (lower === 'done' || lower === 'completed' || lower === 'complete') {
    return 'completed';
  }
  if (lower === 'failed') {
    return 'failed';
  }
  return 'pending';
}
