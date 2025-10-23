import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const headers = { ...corsHeaders, "Content-Type": "application/json" } as const;

const RequestSchema = z.object({
  campaignId: z.string().uuid(),
  keywords: z.array(z.string()).min(1),
  maxResults: z.number().int().positive().max(100).default(25),
  filters: z.object({
    industries: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
    companySize: z.string().optional(),
  }).optional(),
});

type JsonRecord = Record<string, unknown>;

const EXA_API_BASE_URL = "https://api.exa.ai";
const WEBSETS_ENDPOINT = "/websets/v0/websets";
const MAX_POLL_DURATION_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 750;
const EXA_COST_PER_LEAD = 0.10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const exaApiKey = Deno.env.get("EXA_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase environment variables are not configured" }, 500);
  }

  if (!exaApiKey) {
    return jsonResponse({ error: "EXA_API_KEY is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  let payload: z.infer<typeof RequestSchema>;
  try {
    payload = RequestSchema.parse(body);
  } catch (error) {
    return jsonResponse({ error: "Invalid request payload", details: formatZodError(error) }, 400);
  }

  // Verify campaign access
  const { data: campaign, error: campaignError } = await supabase
    .from("bd_campaigns")
    .select("id, created_by, owned_by")
    .eq("id", payload.campaignId)
    .single();

  if (campaignError || !campaign) {
    return jsonResponse({ error: "Campaign not found" }, 404);
  }

  if (campaign.created_by !== user.id && campaign.owned_by !== user.id) {
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some(r => r.role === "admin" || r.role === "super_admin");
    if (!isAdmin) {
      return jsonResponse({ error: "Access denied" }, 403);
    }
  }

  try {
    // Create job record immediately
    const { data: job, error: jobError } = await supabase
      .from("lead_import_jobs")
      .insert({
        user_id: user.id,
        campaign_id: payload.campaignId,
        job_type: "campaign",
        status: "queued",
        notify_email: user.email,
        criteria: {
          keywords: payload.keywords,
          max_results: payload.maxResults,
          filters: payload.filters,
        },
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("[campaign-lead-import] Failed to create job:", jobError);
      return jsonResponse({ error: "Failed to create import job" }, 500);
    }

    // Process in background (non-blocking) - fire and forget
    processLeadImportJob(job.id, exaApiKey, supabase, payload, user.id)
      .catch((err) => {
        console.error(`[campaign-lead-import] Background job ${job.id} failed:`, err);
        supabase
          .from("lead_import_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_details: err instanceof Error ? err.message : "Unknown error",
          })
          .eq("id", job.id)
          .then(() => console.log(`[campaign-lead-import] Job ${job.id} marked as failed`));
      });

    // Return immediately with job_id
    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        status: "queued",
        message: "Lead import started. You will be notified via email when complete.",
        estimated_time: "2-5 minutes",
      }),
      { status: 202, headers }
    );
  } catch (error) {
    console.error("[campaign-lead-import]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function formatZodError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.flatten();
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

async function fetchExaWebset(
  apiKey: string,
  query: string,
  maxResults: number,
  filters?: { industries?: string[]; locations?: string[]; companySize?: string },
  externalId?: string
): Promise<{ websetId: string | null; status: string | null; items: unknown[] }> {
  const url = `${EXA_API_BASE_URL}${WEBSETS_ENDPOINT}`;
  const reqHeaders: HeadersInit = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };

  // Build enhanced query string with filters
  let enhancedQuery = query;
  const queryParts: string[] = [];
  
  if (filters?.industries && filters.industries.length > 0) {
    queryParts.push(filters.industries.join(" OR "));
  }
  if (filters?.locations && filters.locations.length > 0) {
    queryParts.push(filters.locations.join(" OR "));
  }
  if (filters?.companySize) {
    queryParts.push(`company size ${filters.companySize}`);
  }
  
  if (queryParts.length > 0) {
    enhancedQuery = `${query} ${queryParts.join(" ")}`;
  }

  // Construct proper Exa Websets API payload
  const payload: JsonRecord = {
    search: {
      query: enhancedQuery,
      count: maxResults,
    },
    entity: {
      type: "people",
    },
  };

  // Add enrichments to get LinkedIn URLs and other data
  payload.enrichments = [
    {
      description: "LinkedIn profile URL",
      format: "text",
    },
    {
      description: "Email address",
      format: "text",
    },
    {
      description: "Job title and company name",
      format: "text",
    },
  ];

  // Add external ID for tracking
  if (externalId) {
    payload.externalId = externalId;
  }

  console.log("[fetchExaWebset] Sending Websets API request:", JSON.stringify(payload, null, 2));

  const createResponse = await fetchWithRetry(() =>
    fetch(url, { method: "POST", headers: reqHeaders, body: JSON.stringify(payload) })
  );

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Exa webset request failed (${createResponse.status}): ${text}`);
  }

  const initialJson = (await safeJson(createResponse)) as JsonRecord;
  let normalized = normalizeWebset(initialJson);

  if (normalized.items.length > 0 && isCompletedStatus(normalized.status)) {
    return normalized;
  }

  if (!normalized.websetId) {
    throw new Error("Exa response did not include a webset identifier");
  }

  const deadline = Date.now() + MAX_POLL_DURATION_MS;
  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);
    const pollResponse = await fetchWithRetry(() =>
      fetch(`${url}/${normalized.websetId}`, { method: "GET", headers: reqHeaders })
    );

    if (!pollResponse.ok) {
      const text = await pollResponse.text();
      throw new Error(`Exa webset polling failed (${pollResponse.status}): ${text}`);
    }

    const pollJson = (await safeJson(pollResponse)) as JsonRecord;
    normalized = normalizeWebset(pollJson);

    if (isCompletedStatus(normalized.status) && normalized.items.length >= 0) {
      return normalized;
    }

    if (isFailedStatus(normalized.status)) {
      throw new Error(`Exa webset returned failure status: ${normalized.status ?? "unknown"}`);
    }
  }

  throw new Error("Timed out while waiting for Exa webset results");
}

async function fetchWithRetry(fetcher: () => Promise<Response>, attempt = 0): Promise<Response> {
  try {
    const response = await fetcher();
    if (shouldRetryResponse(response) && attempt < RETRY_ATTEMPTS) {
      await delay(backoffDelay(attempt));
      return fetchWithRetry(fetcher, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt >= RETRY_ATTEMPTS) throw error;
    await delay(backoffDelay(attempt));
    return fetchWithRetry(fetcher, attempt + 1);
  }
}

function shouldRetryResponse(response: Response): boolean {
  return response.status === 429 || response.status >= 500;
}

function backoffDelay(attempt: number): number {
  return RETRY_BACKOFF_MS * Math.max(1, attempt + 1);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function normalizeWebset(data: JsonRecord): {
  websetId: string | null;
  status: string | null;
  items: unknown[];
} {
  const websetId = extractStringFromPaths(data, ["id", "webset_id", "websetId", "webset.id", "data.id"]);
  const status = extractStringFromPaths(data, ["status", "state", "webset.status", "data.status"]);
  const items = extractArrayFromPaths(data, ["items", "results", "webset.items", "webset.results", "data.items", "data.results"]);

  return { websetId, status, items };
}

function isCompletedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const value = status.toLowerCase();
  return ["ready", "completed", "complete", "done", "finished", "success"].includes(value);
}

function isFailedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const value = status.toLowerCase();
  return ["failed", "error", "cancelled", "canceled"].includes(value);
}

interface NormalizedLead {
  exaItemId: string | null;
  contactName: string | null;
  companyName: string | null;
  email: string | null;
  linkedinUrl: string | null;
  title: string | null;
  score: number | null;
  metadata: JsonRecord;
}

function normalizeLeads(items: unknown[]): NormalizedLead[] {
  const results: NormalizedLead[] = [];
  for (const item of items) {
    const normalized = normalizeLeadItem(item);
    if (!normalized) continue;
    if (!normalized.exaItemId && !normalized.email && !normalized.linkedinUrl) continue;
    results.push(normalized);
  }
  return results;
}

function normalizeLeadItem(raw: unknown): NormalizedLead | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as JsonRecord;
  const merged: JsonRecord = { ...flattenNested(record), ...record };

  const exaItemId = extractStringFromPaths(merged, ["item_id", "id", "result_id", "document_id", "item.id", "document.id"]);
  const contactName = extractStringFromPaths(merged, ["contact_name", "name", "person_name", "person.name", "profile.name"]);
  const companyName = extractStringFromPaths(merged, ["company", "company_name", "organization", "employer", "profile.company"]);
  const email = extractStringFromPaths(merged, ["email", "emails", "contact.email", "profile.email", "person.email"]);
  const linkedinUrl = extractStringFromPaths(merged, ["linkedin_url", "linkedin", "profile_url", "profile.linkedin", "person.linkedin_url"]);
  const title = extractStringFromPaths(merged, ["title", "job_title", "position", "role", "profile.title", "person.title"]);
  const score = extractNumberFromPaths(merged, ["score", "relevance", "ranking", "metadata.score"]);

  return {
    exaItemId,
    contactName,
    companyName,
    email: email ? email.toLowerCase() : null,
    linkedinUrl,
    title,
    score,
    metadata: toJsonRecord(raw),
  };
}

function dedupeLeads(leads: NormalizedLead[]): NormalizedLead[] {
  const seen = new Set<string>();
  const results: NormalizedLead[] = [];

  for (const lead of leads) {
    const key = lead.exaItemId ?? lead.email ?? lead.linkedinUrl;
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    results.push(lead);
  }

  return results;
}

function extractStringFromPaths(obj: JsonRecord, paths: string[]): string | null {
  for (const path of paths) {
    const val = getNestedValue(obj, path);
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
}

function extractNumberFromPaths(obj: JsonRecord, paths: string[]): number | null {
  for (const path of paths) {
    const val = getNestedValue(obj, path);
    if (typeof val === "number") return val;
  }
  return null;
}

function extractArrayFromPaths(obj: JsonRecord, paths: string[]): unknown[] {
  for (const path of paths) {
    const val = getNestedValue(obj, path);
    if (Array.isArray(val)) return val;
  }
  return [];
}

function getNestedValue(obj: JsonRecord, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as JsonRecord)) {
      current = (current as JsonRecord)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function flattenNested(obj: JsonRecord): JsonRecord {
  const result: JsonRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = flattenNested(value as JsonRecord);
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        result[`${key}.${nestedKey}`] = nestedValue;
      }
    }
  }
  return result;
}

function toJsonRecord(val: unknown): JsonRecord {
  if (val && typeof val === "object" && !Array.isArray(val)) {
    return val as JsonRecord;
  }
  return {};
}

async function processLeadImportJob(
  jobId: string,
  exaApiKey: string,
  supabase: any,
  payload: {
    campaignId: string;
    keywords: string[];
    maxResults: number;
    filters?: { industries?: string[]; locations?: string[]; companySize?: string };
  },
  userId: string
) {
  try {
    // Update status to processing
    await supabase
      .from("lead_import_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId);

    console.log(`[processLeadImportJob] Starting job ${jobId} for campaign ${payload.campaignId}`);

    // Call Exa.ai Websets API with proper format
    const query = payload.keywords.join(" OR ");
    const externalId = `campaign-${payload.campaignId}-import-${Date.now()}`;
    const webset = await fetchExaWebset(exaApiKey, query, payload.maxResults, payload.filters, externalId);

    console.log(`[processLeadImportJob] Received ${webset.items.length} items from Exa`);

    // Store webset_id for tracking
    await supabase
      .from("lead_import_jobs")
      .update({
        criteria: {
          ...payload,
          webset_id: webset.websetId,
          webset_status: webset.status,
        },
      })
      .eq("id", jobId);

    const normalizedLeads = dedupeLeads(normalizeLeads(webset.items));

    if (normalizedLeads.length === 0) {
      await supabase
        .from("lead_import_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          imported_count: 0,
        })
        .eq("id", jobId);
      return;
    }

    // Get current campaign
    const { data: currentCampaign, error: fetchError } = await supabase
      .from("bd_campaigns")
      .select("contacts_summary")
      .eq("id", payload.campaignId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch campaign: ${fetchError.message}`);
    }

    // Build contacts array
    const existingContacts = Array.isArray(currentCampaign.contacts_summary)
      ? (currentCampaign.contacts_summary as Array<Record<string, unknown>>)
      : [];

    const newContacts = normalizedLeads.map((lead) => ({
      id: crypto.randomUUID(),
      contact_name: lead.contactName || "Unknown",
      contact_email: lead.email || null,
      contact_linkedin_url: lead.linkedinUrl || null,
      contact_company: lead.companyName || null,
      contact_title: lead.title || null,
      status: "identified",
      metadata: {
        exa_enrichment: lead.metadata,
        exa_item_id: lead.exaItemId,
        exa_score: lead.score,
        imported_at: new Date().toISOString(),
        import_job_id: jobId,
      },
      last_enriched_at: new Date().toISOString(),
      exa_item_id: lead.exaItemId,
      created_at: new Date().toISOString(),
    }));

    // Deduplicate: update existing or add new
    let imported = 0;
    let updated = 0;

    for (const newContact of newContacts) {
      const existingIndex = existingContacts.findIndex(
        (c) =>
          (c.exa_item_id && newContact.exa_item_id && c.exa_item_id === newContact.exa_item_id) ||
          (c.contact_email && newContact.contact_email && c.contact_email === newContact.contact_email) ||
          (c.contact_linkedin_url &&
            newContact.contact_linkedin_url &&
            c.contact_linkedin_url === newContact.contact_linkedin_url)
      );

      if (existingIndex >= 0) {
        // Update existing contact (merge data)
        existingContacts[existingIndex] = {
          ...existingContacts[existingIndex],
          ...newContact,
          id: existingContacts[existingIndex].id, // Keep original ID
          created_at: existingContacts[existingIndex].created_at, // Keep original created_at
          status: existingContacts[existingIndex].status, // Keep existing status
          updated_at: new Date().toISOString(),
        };
        updated++;
      } else {
        // Add new contact
        existingContacts.push(newContact);
        imported++;
      }
    }

    // Update campaign with new contacts
    const { error: updateError } = await supabase
      .from("bd_campaigns")
      .update({
        contacts_summary: existingContacts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.campaignId);

    if (updateError) {
      throw new Error(`Failed to update campaign contacts: ${updateError.message}`);
    }

    // Update job as completed
    await supabase
      .from("lead_import_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        imported_count: imported,
      })
      .eq("id", jobId);

    console.log(`[processLeadImportJob] Job ${jobId} completed: ${imported} new, ${updated} updated`);

    // Send email notification
    try {
      await supabase.functions.invoke("send-lead-import-notification", {
        body: {
          jobId,
          campaignId: payload.campaignId,
          results: { imported, updated, total: normalizedLeads.length },
        },
      });
    } catch (emailError) {
      console.error("[processLeadImportJob] Email notification failed:", emailError);
      // Don't fail the whole job if email fails
    }
  } catch (error) {
    console.error(`[processLeadImportJob] Job ${jobId} failed:`, error);
    throw error;
  }
}
