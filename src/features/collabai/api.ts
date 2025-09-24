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
  const integ = await getIntegration(integrationId);
  const res = await fetch(
    `${integ.base_url.replace(/\/+$/, "")}/api/assistants/n8n/assistant-list?page=1&pageSize=50`,
    { headers: { Authorization: `Bearer ${integ.api_key_encrypted}` } }
  );
  if (!res.ok) throw new Error(`Agents load failed: ${res.status}`);
  const json = await res.json();
  return (json.assistants ?? []).map((a: any) => ({
    id: a.assistant_id,
    name: a.name,
    type: a.assistantTypes || a.category || "General",
    active: !!a.is_active,
    description: a.description || "",
  }));
}

export async function chatWithAgent(integrationId: string, agentId: string, message: string) {
  const integ = await getIntegration(integrationId);
  const res = await fetch(
    `${integ.base_url.replace(/\/+$/, "")}/api/assistants/n8n/${agentId}/chats`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integ.api_key_encrypted}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  const data = await res.json();

  // Optional, non-blocking transcript
  try {
    await supabase.from("collabai_chats").insert({
      integration_id: integrationId,
      agent_id: agentId,
      user_prompt: message,
      ai_response: data?.reply ?? null,
    });
  } catch {}

  return data;
}