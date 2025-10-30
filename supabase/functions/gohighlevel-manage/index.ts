import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { encryptSecret, decryptSecret } from "../_shared/crypto.ts";

type GHLIntegrationRow = {
  id: string;
  user_id: string;
  api_key_encrypted: string;
  location_id: string | null;
  location_name: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

type TriggerSource = "manual" | "webhook";

const GHL_API_BASE = "https://services.leadconnectorhq.com";

async function createSupabaseClient(req?: Request, forWebhook = false) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: !forWebhook && req
      ? { headers: { Authorization: req.headers.get("Authorization") ?? "" } }
      : undefined,
  });
}

async function requireAuth(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
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

async function resolvePrimaryBrand(client: SupabaseClient, userId: string | null): Promise<string | null> {
  if (userId) {
    const { data } = await client
      .from("user_brands")
      .select("brand_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);
    if (data?.[0]?.brand_id) {
      return data[0].brand_id as string;
    }
  }

  const { data: brands } = await client
    .from("brands")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  return brands?.[0]?.id ?? null;
}

async function fetchGHL(endpoint: string, apiKey: string, method: string = "GET", body?: any) {
  const url = `${GHL_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GoHighLevel API error (${response.status}): ${text}`);
  }

  return response.json();
}

async function syncGoHighLevel({
  client,
  integration,
  apiKey,
  triggeredBy,
}: {
  client: SupabaseClient;
  integration: GHLIntegrationRow;
  apiKey: string;
  triggeredBy: TriggerSource;
}) {
  if (!integration.location_id) {
    throw new Error("Location ID is required for syncing GoHighLevel data");
  }

  const contactsPayload = await fetchGHL(`/contacts/search`, apiKey, "POST", { locationId: integration.location_id });
  const contacts = Array.isArray(contactsPayload?.contacts) ? contactsPayload.contacts : (Array.isArray(contactsPayload) ? contactsPayload : []);

  const contactsToInsert = contacts.map((contact: any) => {
    const fullName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    const status = contact.status || (Array.isArray(contact.tags) ? contact.tags.join(",") : null);
    return {
      integration_id: integration.id,
      contact_id: contact.id,
      name: fullName || contact.companyName || "Unknown Contact",
      email: contact.email || null,
      phone: contact.phone || null,
      status,
    };
  });

  await client
    .from("gohighlevel_contacts")
    .delete()
    .eq("integration_id", integration.id);

  if (contactsToInsert.length > 0) {
    await client.from("gohighlevel_contacts").insert(contactsToInsert);
  }

  const emailMap = new Map<string, string>();
  const contactClientMap = new Map<string, string>();

  const emails = contacts
    .map((contact: any) => (contact.email ? String(contact.email).toLowerCase() : null))
    .filter((email: string | null): email is string => Boolean(email));

  if (emails.length > 0) {
    const { data: existingClients } = await client
      .from("clients")
      .select("id, email")
      .in("email", emails);

    existingClients?.forEach((row: any) => {
      if (row.email) {
        emailMap.set(String(row.email).toLowerCase(), row.id);
      }
    });
  }

  for (const contact of contacts) {
    const email = contact.email ? String(contact.email).toLowerCase() : null;
    const fullName = contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    const payload = {
      name: fullName || contact.companyName || "GHL Contact",
      company: contact.companyName || null,
      email: contact.email || null,
      phone: contact.phone || null,
      status: "active",
      source: "gohighlevel",
    } as Record<string, unknown>;

    let clientId = email ? emailMap.get(email) ?? null : null;

    if (clientId) {
      await client
        .from("clients")
        .update(payload)
        .eq("id", clientId);
    } else {
      const { data: inserted } = await client
        .from("clients")
        .insert(payload)
        .select("id, email")
        .single();

      clientId = inserted?.id ?? null;
      if (clientId && inserted?.email) {
        emailMap.set(String(inserted.email).toLowerCase(), clientId);
      }
    }

    if (clientId) {
      contactClientMap.set(contact.id, clientId);
    }
  }

  const opportunitiesPayload = await fetchGHL(`/opportunities/search?location_id=${integration.location_id}`, apiKey);
  const opportunities = Array.isArray(opportunitiesPayload?.opportunities)
    ? opportunitiesPayload.opportunities
    : (Array.isArray(opportunitiesPayload) ? opportunitiesPayload : []);

  const dealRows = opportunities.map((opportunity: any) => {
    const contactId = opportunity.contactId || opportunity.contact?.id || opportunity.contact?.contactId;
    const clientId = contactId ? contactClientMap.get(contactId) ?? null : null;
    if (!clientId) {
      return null;
    }

    const amount = parseNumber(opportunity.monetaryValue ?? opportunity.amount ?? opportunity.value ?? null);
    const probabilityRaw = parseNumber(opportunity.probability ?? null);
    const probability = probabilityRaw && probabilityRaw <= 1 ? probabilityRaw * 100 : probabilityRaw;

    const stage = opportunity.stageName
      || opportunity.status
      || opportunity.pipelineStage
      || opportunity.pipelineStageName
      || null;

    const pipeline = opportunity.pipelineName || opportunity.pipelineId || null;

    return {
      hubspot_id: `ghl:${opportunity.id}`,
      client_id: clientId,
      name: opportunity.name || opportunity.title || `Opportunity ${opportunity.id}`,
      amount,
      stage,
      pipeline,
      probability,
      close_date: parseDate(opportunity.closeDate || opportunity.expectedCloseDate || null),
      deal_type: "gohighlevel",
    } as Record<string, unknown>;
  }).filter((deal: any): deal is Record<string, unknown> => Boolean(deal));

  if (dealRows.length > 0) {
    await client.from("deals").upsert(dealRows, { onConflict: "hubspot_id" });
  }

  const pipelineValue = dealRows.reduce((sum: number, deal: any) => {
    const amount = typeof deal.amount === "number" ? deal.amount : Number(deal.amount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const now = new Date().toISOString();
  await client
    .from("gohighlevel_integrations")
    .update({ updated_at: now })
    .eq("id", integration.id);

  await client
    .from("analytics_data")
    .insert([
      {
        source: "gohighlevel",
        metric_name: "integration_sync",
        metric_value: contactsToInsert.length,
        dimensions: {
          contacts: contactsToInsert.length,
          deals: dealRows.length,
          pipelineValue,
          triggeredBy,
        },
        recorded_at: now,
      },
    ]);

  return {
    contactsSynced: contactsToInsert.length,
    dealsSynced: dealRows.length,
    pipelineValue,
  };
}

async function handleGetIntegration(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const client = await createSupabaseClient(req);
    const userId = await requireAuth(client);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }

    const { data } = await client
      .from("gohighlevel_integrations")
      .select("id, location_id, location_name, is_active, updated_at")
      .eq("user_id", userId)
      .eq("is_active", true);

    return new Response(JSON.stringify({
      ok: true,
      integrations: data ?? [],
    }), { headers });
  } catch (error) {
    console.error("[GHL] GET integration", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 500 });
  }
}

async function handleCreateIntegration(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const body = await req.json();
  const apiKey = body?.apiKey;
  const locationId = body?.locationId ?? null;
  const locationName = body?.locationName ?? null;

  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "API key required" }), { headers, status: 400 });
  }

  if (!locationId) {
    return new Response(JSON.stringify({ ok: false, error: "Location ID required" }), { headers, status: 400 });
  }

  try {
    const client = await createSupabaseClient(req);
    const userId = await requireAuth(client);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }

    const encryptedKey = await encryptSecret(apiKey);

    const { data, error } = await client
      .from("gohighlevel_integrations")
      .insert({
        user_id: userId,
        api_key_encrypted: encryptedKey,
        location_id: locationId,
        location_name: locationName,
        is_active: true,
      })
      .select("id, location_id, location_name, is_active, updated_at")
      .single();

    if (error) throw error;

    const now = new Date().toISOString();
    await client
      .from("analytics_data")
      .insert({
        source: "gohighlevel",
        metric_name: "integration_sync",
        metric_value: 0,
        dimensions: {
          event: "integration_connected",
          triggeredBy: "manual",
        },
        recorded_at: now,
      });

    return new Response(JSON.stringify({ ok: true, integration: data }), { headers, status: 201 });
  } catch (error) {
    console.error("[GHL] create integration", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 500 });
  }
}

async function handleDeleteIntegration(req: Request, integrationId: string): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const client = await createSupabaseClient(req);
    const userId = await requireAuth(client);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }

    const { data: integration } = await client
      .from("gohighlevel_integrations")
      .select("id")
      .eq("id", integrationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!integration) {
      return new Response(JSON.stringify({ ok: false, error: "Integration not found" }), { headers, status: 404 });
    }

    await client
      .from("gohighlevel_integrations")
      .update({ is_active: false })
      .eq("id", integrationId);

    await client
      .from("gohighlevel_contacts")
      .delete()
      .eq("integration_id", integrationId);

    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (error) {
    console.error("[GHL] delete integration", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 500 });
  }
}

async function handlePushClient(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const client = await createSupabaseClient(req);
    const userId = await requireAuth(client);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }

    const { clientId } = await req.json();
    if (!clientId) {
      return new Response(JSON.stringify({ ok: false, error: "Client ID is required" }), { headers, status: 400 });
    }

    const { data: integration, error: integrationError } = await client
      .from("gohighlevel_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ ok: false, error: "No active GoHighLevel integration found" }), { headers, status: 404 });
    }

    const decryptedKey = await decryptSecret(integration.api_key_encrypted);
    if (!decryptedKey) {
      return new Response(JSON.stringify({ ok: false, error: "Failed to decrypt API key" }), { headers, status: 500 });
    }

    const { data: clientData, error: clientError } = await client
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !clientData) {
      return new Response(JSON.stringify({ ok: false, error: "Client not found" }), { headers, status: 404 });
    }

    if (!clientData.email && !clientData.phone) {
      return new Response(JSON.stringify({ ok: false, error: "Client must have either email or phone" }), { headers, status: 400 });
    }

    let ghlContactId = clientData.gohighlevel_contact_id;
    let action = "created";

    const contactData = {
      locationId: integration.location_id,
      email: clientData.email || undefined,
      phone: clientData.phone || undefined,
      name: clientData.name || clientData.contact_person || undefined,
      companyName: clientData.company || undefined,
      website: clientData.website || undefined,
      address1: clientData.address || undefined,
      city: clientData.city || undefined,
      state: clientData.state || undefined,
      country: clientData.country || undefined,
      postalCode: clientData.postal_code || undefined,
      source: "LeadsLift CRM",
      customFields: [
        { key: "crm_id", value: clientData.id },
        { key: "industry", value: clientData.industry || "" },
      ],
    };

    if (ghlContactId) {
      await fetchGHL(`/contacts/${ghlContactId}`, decryptedKey, "PUT", contactData);
      action = "updated";
    } else {
      if (clientData.email) {
        const searchResult = await fetchGHL(`/contacts/search`, decryptedKey, "POST", {
          locationId: integration.location_id,
          email: clientData.email,
        });

        if (searchResult?.contacts?.length > 0) {
          ghlContactId = searchResult.contacts[0].id;
          await fetchGHL(`/contacts/${ghlContactId}`, decryptedKey, "PUT", contactData);
          action = "linked";
        }
      }

      if (!ghlContactId) {
        const createResult = await fetchGHL(`/contacts/`, decryptedKey, "POST", contactData);
        ghlContactId = createResult?.contact?.id || createResult?.id;
        action = "created";
      }
    }

    const { error: updateError } = await client
      .from("clients")
      .update({
        gohighlevel_contact_id: ghlContactId,
        gohighlevel_last_synced_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("[GHL] Failed to update client sync status:", updateError);
    }

    await client.from("control_tower_sync_log").insert({
      sync_type: "push",
      entity_type: "client",
      entity_id: clientId,
      control_tower_id: ghlContactId,
      status: "success",
      synced_by: userId,
      payload: { action, ghl_contact_id: ghlContactId },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        action,
        ghlContactId,
        message: `Client ${action} in GoHighLevel CRM`,
      }),
      { headers }
    );
  } catch (error) {
    console.error("[GHL] Push client error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to push client to GoHighLevel",
      }),
      { headers, status: 500 }
    );
  }
}

async function handleSyncContacts(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  try {
    const client = await createSupabaseClient(req);
    const userId = await requireAuth(client);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const integrationId = body?.integration_id;

    let query = client
      .from("gohighlevel_integrations")
      .select("id, user_id, api_key_encrypted, location_id, location_name, is_active, created_at, updated_at")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (integrationId) {
      query = query.eq("id", integrationId);
    }

    const { data: integration, error } = await query.maybeSingle();

    if (error) throw error;
    if (!integration) {
      return new Response(JSON.stringify({ ok: false, error: "Integration not found" }), { headers, status: 404 });
    }

    const apiKey = await decryptSecret(integration.api_key_encrypted);
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "Integration credentials missing" }), { headers, status: 400 });
    }

    const result = await syncGoHighLevel({
      client,
      integration,
      apiKey,
      triggeredBy: "manual",
    });

    return new Response(JSON.stringify({ ok: true, ...result }), { headers });
  } catch (error) {
    console.error("[GHL] sync", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 500 });
  }
}

async function handleWebhook(req: Request): Promise<Response> {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const secret = Deno.env.get("GHL_WEBHOOK_SECRET");
  if (secret) {
    const provided = req.headers.get("x-webhook-secret") || req.headers.get("x-ghl-secret");
    if (provided !== secret) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { headers, status: 401 });
    }
  }

  try {
    const payload = await req.json();
    const locationId = payload?.locationId || payload?.data?.locationId || payload?.location_id || null;
    if (!locationId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing location" }), { headers, status: 400 });
    }

    const client = await createSupabaseClient(undefined, true);
    const { data: integration } = await client
      .from("gohighlevel_integrations")
      .select("id, user_id, api_key_encrypted, location_id, location_name, is_active, created_at, updated_at")
      .eq("location_id", locationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!integration) {
      return new Response(JSON.stringify({ ok: false, error: "Integration not found" }), { headers, status: 404 });
    }

    const apiKey = await decryptSecret(integration.api_key_encrypted);
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: "Integration credentials missing" }), { headers, status: 400 });
    }

    const result = await syncGoHighLevel({
      client,
      integration,
      apiKey,
      triggeredBy: "webhook",
    });

    return new Response(JSON.stringify({ ok: true, ...result }), { headers });
  } catch (error) {
    console.error("[GHL] webhook", error);
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { headers, status: 500 });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/gohighlevel-manage/, "") || "/";

  if (req.method === "GET" && pathname === "/integration") {
    return handleGetIntegration(req);
  }

  if (req.method === "POST" && pathname === "/integration") {
    return handleCreateIntegration(req);
  }

  if (req.method === "DELETE" && pathname === "/integration") {
    const body = await req.json();
    const integrationId = body?.integration_id;
    if (!integrationId) {
      return new Response(JSON.stringify({ ok: false, error: "integration_id required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    return handleDeleteIntegration(req, integrationId);
  }

  if (req.method === "POST" && pathname === "/sync-contacts") {
    return handleSyncContacts(req);
  }

  if (req.method === "POST" && pathname === "/push-client") {
    return handlePushClient(req);
  }

  if (req.method === "POST" && pathname === "/webhook") {
    return handleWebhook(req);
  }

  return new Response(JSON.stringify({ error: "Not Found" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 404,
  });
});
