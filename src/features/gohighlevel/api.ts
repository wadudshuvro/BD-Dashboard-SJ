import { supabase } from "@/integrations/supabase/client";

type Integration = { id: string; api_key_encrypted: string; location_id?: string };

export async function getActiveIntegration(userId: string): Promise<Integration | null> {
  const { data, error } = await supabase
    .from("gohighlevel_integrations")
    .select("id, api_key_encrypted, location_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

type IntegrationRow = { api_key_encrypted: string; location_id?: string };

async function getIntegration(integrationId: string): Promise<IntegrationRow> {
  const { data, error } = await supabase
    .from("gohighlevel_integrations")
    .select("api_key_encrypted, location_id")
    .eq("id", integrationId)
    .single();
  if (error) throw error;
  if (!data?.api_key_encrypted) {
    throw new Error("Missing GoHighLevel credentials for this integration");
  }
  return data as IntegrationRow;
}

export async function fetchContacts(integrationId: string) {
  const { data, error } = await supabase
    .from("gohighlevel_contacts")
    .select("*")
    .eq("integration_id", integrationId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function syncContacts(integrationId: string) {
  const { data, error } = await supabase.functions.invoke('gohighlevel-manage', {
    body: { action: 'sync-contacts', integrationId }
  });
  
  if (error) throw error;
  return data;
}

export async function createContact(integrationId: string, contactData: {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  const integ = await getIntegration(integrationId);
  
  const payload: any = {
    firstName: contactData.firstName,
    lastName: contactData.lastName || '',
    email: contactData.email || '',
    phone: contactData.phone || '',
  };

  if (integ.location_id) {
    payload.locationId = integ.location_id;
  }

  const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integ.api_key_encrypted}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Contact creation failed: ${res.status}`);
  const data = await res.json();

  // Store in local database
  try {
    await supabase.from("gohighlevel_contacts").insert({
      integration_id: integrationId,
      contact_id: data.contact.id,
      name: `${contactData.firstName} ${contactData.lastName || ''}`.trim(),
      email: contactData.email || null,
      phone: contactData.phone || null,
      status: null
    });
  } catch {}

  return data;
}