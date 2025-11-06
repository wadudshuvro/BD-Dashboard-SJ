import { supabase } from "@/integrations/supabase/client";

type Integration = { id: string; api_key_encrypted: string; base_url: string };

export async function getActiveIntegration(userId: string): Promise<Integration | null> {
  const { data, error } = await supabase
    .from("collabai_integrations")
    .select("id, api_key_encrypted, base_url, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as any) ?? null;
}

type IntegrationRow = { api_key_encrypted: string; base_url: string };

async function getIntegration(integrationId: string): Promise<IntegrationRow> {
  const { data, error } = await supabase
    .from("collabai_integrations")
    .select("api_key_encrypted, base_url")
    .eq("id", integrationId)
    .single();
  if (error) throw error;
  if (!data?.api_key_encrypted || !data?.base_url) {
    throw new Error("Missing CollabAI credentials for this integration");
  }
  return data as IntegrationRow;
}

export async function fetchAgentsByIntegration(integrationId: string) {
  const { data, error } = await supabase
    .from('collabai_agents')
    .select('*')
    .eq('integration_id', integrationId)
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    agent_id: a.agent_id,
    name: a.name,
    type: a.agent_type || "General",
    active: a.is_active,
    description: a.description || "",
  }));
}

export async function syncAgents(integrationId: string) {
  const { data, error } = await supabase.functions.invoke('collabai-manage', {
    body: { action: 'sync_agents', integration_id: integrationId }
  });
  if (error) throw error;
  return data;
}