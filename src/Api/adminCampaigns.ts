import axiosPrivate from "@/lib/axiosPrivate";

export type CampaignStatus = "planning" | "active" | "paused" | "completed" | "archived";
export type CampaignType = "email_outbound" | "linkedin_outbound" | "cold_calling" | "abm" | "other";

export interface CampaignKpi {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  current_value?: number | null;
  target_value?: number | null;
  updated_at?: string;
}

export interface CampaignAnalyticsSummary {
  metric_name: string;
  total_value: number;
  last_recorded_at: string | null;
}

export interface CampaignProfile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface CampaignBrand {
  id: string;
  name?: string | null;
  slug?: string | null;
}

export interface CampaignSummary {
  id: string;
  name: string;
  niche_id: string;
  brand_id: string | null;
  campaign_type: CampaignType;
  status: CampaignStatus;
  ghl_campaign_id: string | null;
  linkedin_campaign_id: string | null;
  ai_agent_id: string | null;
  content_template: unknown;
  research_data: Record<string, unknown> | null;
  linkedin_stats: Record<string, unknown> | null;
  ghl_stats: Record<string, unknown> | null;
  contacts_summary: unknown;
  start_date: string | null;
  end_date: string | null;
  target_contacts: string[] | null;
  target_regions: string[] | null;
  target_contacts_count: number | null;
  actual_contacts_reached: number | null;
  responses_received: number | null;
  meetings_booked: number | null;
  deals_generated: number | null;
  owned_by: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  brand?: CampaignBrand | null;
  owner?: CampaignProfile | null;
  creator?: CampaignProfile | null;
  kpis?: CampaignKpi[];
  analytics_summary?: CampaignAnalyticsSummary[];
}

export interface CampaignPayload {
  name: string;
  niche_id: string;
  brand_id?: string | null;
  campaign_type: CampaignType;
  status?: CampaignStatus;
  ghl_campaign_id?: string | null;
  linkedin_campaign_id?: string | null;
  ai_agent_id?: string | null;
  content_template?: unknown;
  research_data?: Record<string, unknown> | null;
  linkedin_stats?: Record<string, unknown> | null;
  ghl_stats?: Record<string, unknown> | null;
  contacts_summary?: unknown;
  start_date?: string | null;
  end_date?: string | null;
  target_contacts?: string[] | null;
  target_regions?: string[] | null;
  target_contacts_count?: number | null;
  actual_contacts_reached?: number | null;
  responses_received?: number | null;
  meetings_booked?: number | null;
  deals_generated?: number | null;
  owned_by?: string | null;
  created_by?: string | null;
}

export interface CampaignListResponse {
  data: CampaignSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampaignTaskPayload {
  title: string;
  description?: string | null;
  status?: string;
  priority?: "low" | "medium" | "high";
  dueInDays?: number | null;
  assigned_to?: string | null;
}

export interface CampaignCreateOptions {
  seedKpis?: boolean;
  taskTemplateKey?: string;
  tasks?: CampaignTaskPayload[];
}

export interface CampaignCreateRequest {
  campaign: CampaignPayload;
  options?: CampaignCreateOptions;
}

export interface CampaignUpdateRequest {
  campaign?: Partial<CampaignPayload>;
  metrics?: Array<{
    metric_name: string;
    metric_value: number;
    source?: string;
    recorded_at?: string;
    dimensions?: Record<string, unknown>;
  }>;
  options?: CampaignCreateOptions;
}

export interface CampaignDetailResponse {
  campaign: CampaignSummary;
  tasks: Array<Record<string, unknown>>;
  contacts: unknown[];
  activities: unknown[];
}

export interface CampaignListParams {
  page?: number;
  pageSize?: number;
  status?: CampaignStatus;
  nicheId?: string;
  ownerId?: string;
  brandId?: string;
  search?: string;
  includeArchived?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export async function listCampaigns(params: CampaignListParams = {}): Promise<CampaignListResponse> {
  const response = await axiosPrivate.get<CampaignListResponse>("/admin-campaigns/list", { params });
  return response.data;
}

export async function getCampaignDetail(id: string): Promise<CampaignDetailResponse> {
  const response = await axiosPrivate.get<CampaignDetailResponse>(`/admin-campaigns/${id}`);
  return response.data;
}

export async function createCampaign(payload: CampaignCreateRequest): Promise<CampaignSummary> {
  const response = await axiosPrivate.post<{ campaign: CampaignSummary }>("/admin-campaigns", payload);
  return response.data.campaign;
}

export async function updateCampaign(id: string, payload: CampaignUpdateRequest): Promise<CampaignSummary> {
  const response = await axiosPrivate.put<{ campaign: CampaignSummary }>(`/admin-campaigns/${id}`, payload);
  return response.data.campaign;
}

export async function archiveCampaign(id: string): Promise<void> {
  await axiosPrivate.delete(`/admin-campaigns/${id}`);
}
