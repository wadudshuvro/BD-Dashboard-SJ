import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";
import { decryptSecret, encryptSecret } from "../_shared/crypto.ts";

type HubSpotIntegration = {
  id: string;
  is_active: boolean;
  last_sync: string | null;
  config: Record<string, any> | null;
};

type HubSpotObject = {
  id: string;
  properties?: Record<string, any>;
  associations?: Record<string, { results?: Array<{ id: string }> }>;
};

type SyncResult = {
  companies: number;
  contacts: number;
  deals: number;
  pipelineValue: number;
  lastSync: string;
};

type TriggerSource = "manual" | "webhook";

const HUBSPOT_COMPANY_PROPERTIES = [
  "name",
  "domain",
  "website",
  "phone",
  "city",
  "state",
  "country",
  "industry",
  "address",
  "zip",
  "annualrevenue",
  "numberofemployees",
  "description",
  "type",
];

const HUBSPOT_CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "jobtitle",
  "lifecyclestage",
  "hs_lead_status",
];

const HUBSPOT_DEAL_PROPERTIES = [
  "dealname",
  "amount",
  "dealstage",
  "closedate",
  "hs_pipeline_stage_probability",
  "dealtype",
  "hs_lastmodifieddate",
  "createdate",
  "pipeline",
];

async function createSupabaseClient(req?: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: req
      ? { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
      : undefined,
  });
}

async function getHubSpotIntegration(client: SupabaseClient): Promise<{ integration: HubSpotIntegration; token: string }>
{
  const { data, error } = await client
    .from("integrations")
    .select("id, is_active, last_sync, config")
    .eq("type", "hubspot")
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Active HubSpot integration not found");
  }

  const config = data.config ?? {};
  const encryptedToken = config.api_key_encrypted || config.access_token || config.api_key;
  const token = await decryptSecret(encryptedToken);

  if (!token) {
    throw new Error("HubSpot API credentials are not configured");
  }

  return { integration: data, token };
}

async function fetchPagedObjects(token: string, resource: string, properties: string[], associations: string[] = []): Promise<HubSpotObject[]> {
  const results: HubSpotObject[] = [];
  let after: string | undefined;

  do {
    const url = new URL(`https://api.hubapi.com/crm/v3/objects/${resource}`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("properties", properties.join(","));
    if (associations.length > 0) {
      url.searchParams.set("associations", associations.join(","));
    }
    if (after) {
      url.searchParams.set("after", after);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot ${resource} fetch failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.results)) {
      results.push(...payload.results);
    }
    after = payload.paging?.next?.after;
  } while (after);

  return results;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return numeric;
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return null;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const date = new Date(numeric);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return null;
}

function parseTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
    return null;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      const date = new Date(numeric);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}

async function performHubSpotSync(options: {
  supabase?: SupabaseClient;
  integration?: HubSpotIntegration;
  token?: string;
  triggeredBy?: TriggerSource;
} = {}): Promise<SyncResult> {
  const supabase = options.supabase ?? await createSupabaseClient();
  let integration = options.integration;
  let token = options.token;

  if (!integration || !token) {
    const resolved = await getHubSpotIntegration(supabase);
    integration = resolved.integration;
    token = resolved.token;
  }

  const now = new Date().toISOString();

  const [companies, contacts, deals] = await Promise.all([
    fetchPagedObjects(token, "companies", HUBSPOT_COMPANY_PROPERTIES),
    fetchPagedObjects(token, "contacts", HUBSPOT_CONTACT_PROPERTIES, ["companies"]),
    fetchPagedObjects(token, "deals", HUBSPOT_DEAL_PROPERTIES, ["companies"]),
  ]);

  const clientMap = new Map<string, string>();

  const { data: existingClients } = await supabase
    .from("clients")
    .select("id, hubspot_id")
    .not("hubspot_id", "is", null);

  existingClients?.forEach((row: any) => {
    if (row.hubspot_id) {
      clientMap.set(row.hubspot_id, row.id);
    }
  });

  if (companies.length > 0) {
    const clientRows = companies.map((company) => {
      const props = company.properties ?? {};
      return {
        hubspot_id: company.id,
        name: props.name || "Unknown Company",
        company: props.name || null,
        website: props.website || props.domain || null,
        phone: props.phone || null,
        email: props.email || null,
        address: props.address || null,
        city: props.city || null,
        state: props.state || null,
        country: props.country || null,
        postal_code: props.zip || null,
        industry: props.industry || null,
        company_revenue: parseNumber(props.annualrevenue),
        team_size: parseNumber(props.numberofemployees),
        notes: props.description || null,
        status: "active",
        source: "hubspot",
        hubspot_sync_status: "synced",
        hubspot_last_sync: now,
        hubspot_sync_metadata: { type: props.type || null },
      } as Record<string, unknown>;
    });

    const { data: upsertedClients, error: clientError } = await supabase
      .from("clients")
      .upsert(clientRows, { onConflict: "hubspot_id" })
      .select("id, hubspot_id");

    if (clientError) {
      throw clientError;
    }

    upsertedClients?.forEach((row: any) => {
      if (row.hubspot_id) {
        clientMap.set(row.hubspot_id, row.id);
      }
    });
  }

  const contactRows = contacts.map((contact) => {
    const props = contact.properties ?? {};
    const associatedCompany = contact.associations?.companies?.results?.[0]?.id;
    return {
      hubspot_id: contact.id,
      client_id: associatedCompany ? clientMap.get(associatedCompany) ?? null : null,
      first_name: props.firstname || null,
      last_name: props.lastname || null,
      email: props.email || null,
      phone: props.phone || null,
      job_title: props.jobtitle || null,
      lifecycle_stage: props.lifecyclestage || null,
      lead_status: props.hs_lead_status || null,
      hubspot_sync_status: "synced",
      hubspot_last_sync: now,
    } as Record<string, unknown>;
  });

  if (contactRows.length > 0) {
    const { error: contactsError } = await supabase
      .from("contacts")
      .upsert(contactRows, { onConflict: "hubspot_id" });

    if (contactsError) {
      throw contactsError;
    }
  }

  const dealRows = deals.map((deal) => {
    const props = deal.properties ?? {};
    const associatedCompany = deal.associations?.companies?.results?.[0]?.id;
    const amount = parseNumber(props.amount);
    const probabilityRaw = parseNumber(props.hs_pipeline_stage_probability);
    const probability = probabilityRaw && probabilityRaw <= 1 ? probabilityRaw * 100 : probabilityRaw;
    const clientId = associatedCompany ? clientMap.get(associatedCompany) ?? null : null;

    if (!clientId) {
      return null;
    }

    return {
      hubspot_id: deal.id,
      client_id: clientId,
      name: props.dealname || `Deal ${deal.id}`,
      amount,
      stage: props.dealstage || null,
      probability,
      close_date: parseDate(props.closedate),
      pipeline: props.pipeline || null,
      deal_type: props.dealtype || null,
      hubspot_updated_at: parseTimestamp(props.hs_lastmodifieddate),
      hubspot_created_at: parseTimestamp(props.createdate),
    } as Record<string, unknown>;
  }).filter((deal): deal is Record<string, unknown> => Boolean(deal));

  if (dealRows.length > 0) {
    const { error: dealsError } = await supabase
      .from("deals")
      .upsert(dealRows, { onConflict: "hubspot_id" });

    if (dealsError) {
      throw dealsError;
    }
  }

  const pipelineValue = dealRows.reduce((sum, deal) => {
    const amount = typeof deal.amount === "number" ? deal.amount : Number(deal.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  await supabase
    .from("integrations")
    .update({ last_sync: now })
    .eq("id", integration!.id);

  await supabase
    .from("analytics_data")
    .insert([
      {
        source: "hubspot",
        metric_name: "integration_sync",
        metric_value: companies.length + contactRows.length + dealRows.length,
        dimensions: {
          companies: companies.length,
          contacts: contactRows.length,
          deals: dealRows.length,
          triggeredBy: options.triggeredBy ?? "manual",
        },
        recorded_at: now,
      },
      {
        source: "hubspot",
        metric_name: "pipeline_value",
        metric_value: pipelineValue,
        dimensions: {
          triggeredBy: options.triggeredBy ?? "manual",
        },
        recorded_at: now,
      },
    ]);

  return {
    companies: companies.length,
    contacts: contactRows.length,
    deals: dealRows.length,
    pipelineValue,
    lastSync: now,
  };
}

async function handleStatus(): Promise<Response> {
  try {
    const supabase = await createSupabaseClient();
    const { integration } = await getHubSpotIntegration(supabase);
    return new Response(JSON.stringify({
      ok: true,
      isActive: integration.is_active,
      lastSync: integration.last_sync,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      ok: false,
      isActive: false,
      lastSync: null,
      error: message,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  }
}

async function handleSync(): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const result = await performHubSpotSync({ triggeredBy: "manual" });
    return new Response(JSON.stringify({ ok: true, ...result }), { headers });
  } catch (error) {
    console.error("[HubSpot Sync]", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      headers,
      status: 500,
    });
  }
}

async function handleWebhook(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const secret = Deno.env.get("HUBSPOT_WEBHOOK_SECRET");
  if (secret) {
    const provided = req.headers.get("x-webhook-secret") || req.headers.get("x-hubspot-secret");
    if (provided !== secret) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }
  }

  try {
    const supabase = await createSupabaseClient();
    const { integration, token } = await getHubSpotIntegration(supabase);
    const result = await performHubSpotSync({
      supabase,
      integration,
      token,
      triggeredBy: "webhook",
    });

    return new Response(JSON.stringify({ ok: true, ...result }), { headers });
  } catch (error) {
    console.error("[HubSpot Webhook]", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      headers,
      status: 500,
    });
  }
}

async function handleConfigure(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  
  try {
    const body = await req.json();
    const apiKey = body?.apiKey;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return new Response(JSON.stringify({ ok: false, error: "API key is required" }), {
        headers,
        status: 400,
      });
    }

    // Validate API key format (HubSpot private app tokens start with "pat-")
    if (!apiKey.startsWith("pat-")) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Invalid API key format. HubSpot Private App Access Tokens should start with 'pat-'" 
      }), {
        headers,
        status: 400,
      });
    }

    // Test the API key by making a simple API call
    const testResponse = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Invalid API key: ${testResponse.status} - ${errorText}` 
      }), {
        headers,
        status: 400,
      });
    }

    // Encrypt the API key
    const encryptedKey = await encryptSecret(apiKey);

    // Save to database
    const supabase = await createSupabaseClient();
    const { data: existingIntegration } = await supabase
      .from("integrations")
      .select("id")
      .eq("type", "hubspot")
      .maybeSingle();

    if (existingIntegration) {
      // Update existing
      const { error: updateError } = await supabase
        .from("integrations")
        .update({
          config: { api_key_encrypted: encryptedKey },
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);

      if (updateError) throw updateError;
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from("integrations")
        .insert({
          name: "HubSpot",
          type: "hubspot",
          config: { api_key_encrypted: encryptedKey },
          is_active: true,
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ ok: true, message: "HubSpot API key configured successfully" }), {
      headers,
    });
  } catch (error) {
    console.error("[HubSpot Configure]", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Configuration failed" 
    }), {
      headers,
      status: 500,
    });
  }
}

async function handleLegacyAction(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const body = await req.json();
  const action = body?.action;

  if (!action) {
    return new Response(JSON.stringify({ error: "Invalid action" }), { headers, status: 400 });
  }

  try {
    const supabase = await createSupabaseClient();
    const { token } = await getHubSpotIntegration(supabase);

    if (action === "search_companies") {
      const response = await fetch("https://api.hubapi.com/crm/v3/objects/companies/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{
              propertyName: "name",
              operator: "CONTAINS_TOKEN",
              value: body.searchTerm,
            }],
          }],
          properties: HUBSPOT_COMPANY_PROPERTIES,
          limit: 20,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data.results || []), { headers });
    }

    if (action === "fetch_company_by_id") {
      let actualCompanyId = body.companyId;

      try {
        const contactResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${body.companyId}?properties=associatedcompanyid`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          if (contactData.properties?.associatedcompanyid) {
            actualCompanyId = contactData.properties.associatedcompanyid;
          }
        }
      } catch (_err) {
        // ignore and treat as company id
      }

      const companyResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${actualCompanyId}?properties=${HUBSPOT_COMPANY_PROPERTIES.join(",")}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!companyResponse.ok) {
        throw new Error(`Company not found: ${companyResponse.statusText}`);
      }

      const companyData = await companyResponse.json();

      const contactsResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${actualCompanyId}/associations/contacts`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      let contacts: any[] = [];
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        const contactIds = contactsData.results?.map((r: any) => r.id) || [];

        if (contactIds.length > 0) {
          const contactDetailsResponse = await fetch(
            "https://api.hubapi.com/crm/v3/objects/contacts/batch/read",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: HUBSPOT_CONTACT_PROPERTIES,
                inputs: contactIds.map((id: string) => ({ id })),
              }),
            },
          );

          if (contactDetailsResponse.ok) {
            const contactDetailsData = await contactDetailsResponse.json();
            contacts = contactDetailsData.results || [];
          }
        }
      }

      return new Response(JSON.stringify({ company: companyData, contacts }), { headers });
    }

    if (action === "import_company") {
      const { company, contacts } = body;
      const props = company.properties ?? {};
      const now = new Date().toISOString();

      const clientData = {
        name: props.name || "Unknown Company",
        company: props.name || "Unknown Company",
        email: props.email || null,
        phone: props.phone || null,
        website: props.website || props.domain || null,
        address: props.address || null,
        city: props.city || null,
        state: props.state || null,
        country: props.country || null,
        industry: props.industry || null,
        revenue: parseNumber(props.annualrevenue),
        employee_count: parseNumber(props.numberofemployees),
        notes: props.description || null,
        status: "active",
        source: "hubspot",
        hubspot_id: company.id,
        hubspot_sync_status: "synced",
        hubspot_last_sync: now,
        hubspot_sync_metadata: { type: props.type || null },
      } as Record<string, unknown>;

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .upsert(clientData, { onConflict: "hubspot_id" })
        .select()
        .single();

      if (clientError) throw clientError;

      if (Array.isArray(contacts) && contacts.length > 0) {
        const contactsData = contacts.map((contact: any) => ({
          client_id: client.id,
          hubspot_id: contact.id,
          first_name: contact.properties?.firstname || null,
          last_name: contact.properties?.lastname || null,
          email: contact.properties?.email || null,
          phone: contact.properties?.phone || null,
          job_title: contact.properties?.jobtitle || null,
          lifecycle_stage: contact.properties?.lifecyclestage || null,
          lead_status: contact.properties?.hs_lead_status || null,
          hubspot_sync_status: "synced",
          hubspot_last_sync: now,
        }));

        const { error: contactsError } = await supabase
          .from("contacts")
          .upsert(contactsData, { onConflict: "hubspot_id" });

        if (contactsError) throw contactsError;
      }

      return new Response(JSON.stringify({ success: true, client }), { headers });
    }

    if (action === "sync_client") {
      const { data: clientRecord, error: clientFetchError } = await supabase
        .from("clients")
        .select("hubspot_id")
        .eq("id", body.clientId)
        .single();

      if (clientFetchError) throw clientFetchError;
      if (!clientRecord?.hubspot_id) {
        throw new Error("Client not linked to HubSpot");
      }

      const companyResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${clientRecord.hubspot_id}?properties=${HUBSPOT_COMPANY_PROPERTIES.join(",")}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!companyResponse.ok) {
        throw new Error("Failed to sync from HubSpot");
      }

      const companyData = await companyResponse.json();
      const props = companyData.properties ?? {};
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: props.name || "Unknown",
          company: props.name || "Unknown",
          phone: props.phone || null,
          website: props.website || props.domain || null,
          address: props.address || null,
          city: props.city || null,
          state: props.state || null,
          country: props.country || null,
          industry: props.industry || null,
          revenue: parseNumber(props.annualrevenue),
          employee_count: parseNumber(props.numberofemployees),
          notes: props.description || null,
          hubspot_sync_status: "synced",
          hubspot_last_sync: now,
        })
        .eq("id", body.clientId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    if (action === "link_client") {
      const now = new Date().toISOString();
      const { error: linkError } = await supabase
        .from("clients")
        .update({
          hubspot_id: body.hubspotId,
          hubspot_sync_status: "synced",
          hubspot_last_sync: now,
          source: "manual",
        })
        .eq("id", body.clientId);

      if (linkError) throw linkError;

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { headers, status: 400 });
  } catch (error) {
    console.error("[HubSpot Legacy]", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 400 });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/hubspot-sync/, "") || "/";

  if (req.method === "GET" && pathname === "/status") {
    return handleStatus();
  }

  if (req.method === "POST" && pathname === "/sync") {
    return handleSync();
  }

  if (req.method === "POST" && pathname === "/webhook") {
    return handleWebhook(req);
  }

  if (req.method === "POST" && pathname === "/configure") {
    return handleConfigure(req);
  }

  if (req.method === "POST") {
    return handleLegacyAction(req);
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
