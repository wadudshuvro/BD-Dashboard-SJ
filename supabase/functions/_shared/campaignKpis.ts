import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export interface CampaignKpiTemplate {
  name: string;
  description: string;
  unit?: string | null;
  targetValue?: number | null;
  initialValue?: number | null;
}

export const DEFAULT_CAMPAIGN_KPI_TEMPLATES: CampaignKpiTemplate[] = [
  {
    name: "Actual Contacts Reached",
    description: "Number of prospects that received at least one outbound touchpoint.",
    unit: "contacts",
    targetValue: null,
    initialValue: 0,
  },
  {
    name: "Responses Received",
    description: "Responses or replies captured across outbound channels.",
    unit: "responses",
    targetValue: null,
    initialValue: 0,
  },
  {
    name: "Meetings Booked",
    description: "Qualified meetings scheduled as a result of the campaign.",
    unit: "meetings",
    targetValue: null,
    initialValue: 0,
  },
  {
    name: "Deals Generated",
    description: "Opportunities created from this campaign.",
    unit: "deals",
    targetValue: null,
    initialValue: 0,
  },
];

interface EnsureOptions {
  templates?: CampaignKpiTemplate[];
  seedIfMissing?: boolean;
}

export async function ensureCampaignKpis(
  client: SupabaseClient,
  campaignId: string,
  options: EnsureOptions = {},
): Promise<void> {
  const { templates = DEFAULT_CAMPAIGN_KPI_TEMPLATES, seedIfMissing = true } = options;

  try {
    const { data, error } = await client
      .from("kpis")
      .select("id, name")
      .eq("project_id", campaignId);

    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        console.warn("[admin-campaigns] KPIs table is not available");
        return;
      }
      throw error;
    }

    if (!seedIfMissing || (data?.length ?? 0) > 0) {
      return;
    }

    const rows = templates.map((template) => ({
      project_id: campaignId,
      name: template.name,
      description: template.description,
      unit: template.unit ?? null,
      target_value: template.targetValue ?? null,
      current_value: template.initialValue ?? 0,
    }));

    const { error: insertError } = await client.from("kpis").insert(rows);
    if (insertError) {
      if ((insertError as { code?: string }).code === "42P01") {
        console.warn("[admin-campaigns] Unable to seed KPIs because table is missing");
        return;
      }
      throw insertError;
    }
  } catch (error) {
    console.error("[admin-campaigns] Failed to ensure campaign KPIs", error);
    throw error;
  }
}
