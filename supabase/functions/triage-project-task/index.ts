import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You are an autonomous client task triage agent for a digital agency.
Analyze the task and client context. Recommend priority, owner (pick from the team list by email),
category, and next action. Draft a client-safe status update (professional, concise, no internal blame).
Propose 2–3 internal follow-up subtasks. Be conservative on urgency — only mark urgent when deadline,
outage, or revenue risk is explicit.`;

interface TriageToolResult {
  suggested_priority: "low" | "medium" | "high" | "urgent";
  suggested_assignee_email: string;
  suggested_category: "ideas" | "discussion" | "work" | "other";
  suggested_next_action: string;
  reasoning: string;
  client_status_update: string;
  follow_up_subtasks: Array<{
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    due_in_days: number;
  }>;
}

function buildDemoTriage(
  task: { title?: string; description?: string },
  profiles: Array<{ email?: string | null }> | null,
): TriageToolResult {
  const title = (task.title ?? "").toLowerCase();
  const description = (task.description ?? "").toLowerCase();
  const text = `${title} ${description}`;

  let suggested_priority: TriageToolResult["suggested_priority"] = "medium";
  let suggested_category: TriageToolResult["suggested_category"] = "work";
  let suggested_next_action = "Review the client request and assign an owner.";
  let reasoning = "Demo triage mode (set LOVABLE_API_KEY for live AI).";
  let client_status_update =
    "Thank you for reaching out. We have received your request and are reviewing it. We will follow up shortly with an update.";
  let follow_up_subtasks: TriageToolResult["follow_up_subtasks"] = [
    { title: "Clarify requirements with client", priority: "medium", due_in_days: 1 },
    { title: "Assign owner and post internal update", priority: "medium", due_in_days: 1 },
  ];

  if (text.includes("site down") || text.includes("not loading") || text.includes("asap")) {
    suggested_priority = "urgent";
    suggested_next_action = "Investigate production outage and confirm impact scope.";
    reasoning = "Outage / downtime language detected — escalated to urgent for hackathon demo.";
    client_status_update =
      "Thank you for flagging this. We are investigating the site availability issue now and will share an ETA as soon as we have one.";
    follow_up_subtasks = [
      { title: "Check server logs and uptime monitors", priority: "urgent", due_in_days: 0 },
      { title: "Confirm fix and notify client with ETA", priority: "urgent", due_in_days: 0 },
      { title: "Document root cause for post-incident review", priority: "high", due_in_days: 2 },
    ];
  } else if (text.includes("invoice") || text.includes("wrong amount")) {
    suggested_priority = "high";
    suggested_next_action = "Reconcile invoice against PO and respond to finance contact.";
    reasoning = "Billing discrepancy — high priority for client trust.";
    client_status_update =
      "We are reviewing the invoice details you mentioned and will confirm the correct amount shortly.";
    follow_up_subtasks = [
      { title: "Pull invoice line items from billing", priority: "high", due_in_days: 1 },
      { title: "Send corrected summary to client finance contact", priority: "high", due_in_days: 2 },
    ];
  } else if (text.includes("weekly sync") || text.includes("fyi")) {
    suggested_priority = "low";
    suggested_category = "discussion";
    suggested_next_action = "Skim notes and reply with any concerns.";
    reasoning = "Informational client notes — low urgency.";
    client_status_update =
      "Thanks for sharing these notes. We have reviewed them and will follow up if anything needs attention.";
    follow_up_subtasks = [
      { title: "Reply with brief acknowledgment", priority: "low", due_in_days: 3 },
    ];
  }

  return {
    suggested_priority,
    suggested_assignee_email: profiles?.[0]?.email ?? "test@example.com",
    suggested_category,
    suggested_next_action,
    reasoning,
    client_status_update,
    follow_up_subtasks,
  };
}

async function callLovableTriage(
  lovableApiKey: string,
  userPrompt: string,
): Promise<{ triageData: TriageToolResult; rawAiResponse: unknown }> {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "triage_client_task",
          description: "Return structured task triage recommendations",
          parameters: {
            type: "object",
            properties: {
              suggested_priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
              },
              suggested_assignee_email: { type: "string" },
              suggested_category: {
                type: "string",
                enum: ["ideas", "discussion", "work", "other"],
              },
              suggested_next_action: { type: "string" },
              reasoning: { type: "string" },
              client_status_update: { type: "string" },
              follow_up_subtasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "urgent"],
                    },
                    due_in_days: { type: "number" },
                  },
                  required: ["title", "priority", "due_in_days"],
                },
              },
            },
            required: [
              "suggested_priority",
              "suggested_assignee_email",
              "suggested_category",
              "suggested_next_action",
              "reasoning",
              "client_status_update",
              "follow_up_subtasks",
            ],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "triage_client_task" } },
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("[triage-project-task] AI API error:", errorText);
    throw new Error(`AI API error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call in AI response");
  }

  return {
    triageData: JSON.parse(toolCall.function.arguments) as TriageToolResult,
    rawAiResponse: aiData,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { task_id: taskId } = await req.json();
    if (!taskId) {
      throw new Error("task_id is required");
    }

    const { data: task, error: taskError } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError) throw taskError;

    let projectName = "Unknown project";
    let clientName = "Unknown client";
    let clientIndustry = "unknown";
    let projectDeadline: string | null = null;

    if (task.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id, name, deadline, client_id")
        .eq("id", task.project_id)
        .maybeSingle();

      if (project) {
        projectName = project.name ?? projectName;
        projectDeadline = project.deadline ?? null;

        if (project.client_id) {
          const { data: client } = await supabase
            .from("clients")
            .select("id, name, industry")
            .eq("id", project.client_id)
            .maybeSingle();

          if (client) {
            clientName = client.name ?? clientName;
            clientIndustry = client.industry ?? clientIndustry;
          }
        }
      }
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    if (profilesError) throw profilesError;

    const teamList = (profiles ?? [])
      .map((p) => `- ${p.full_name ?? "Unknown"} <${p.email}>`)
      .join("\n");

    const userPrompt = `Task to triage:
- Title: ${task.title}
- Description: ${task.description ?? "No description"}
- Current priority: ${task.priority}
- Current status: ${task.status}
- Current category: ${task.category ?? "unset"}
- Due date: ${task.due_date ?? "none"}

Project context:
- Project: ${projectName}
- Client: ${clientName}
- Client industry: ${clientIndustry}
- Project deadline: ${projectDeadline ?? "none"}

Team members (pick owner by email):
${teamList || "No team members found — use test@example.com"}

Analyze this client task and return structured triage recommendations.`;

    let triageData: TriageToolResult;
    let rawAiResponse: unknown = { mode: "demo" };

    if (lovableApiKey) {
      const aiResult = await callLovableTriage(lovableApiKey, userPrompt);
      triageData = aiResult.triageData;
      rawAiResponse = aiResult.rawAiResponse;
    } else {
      console.warn("[triage-project-task] LOVABLE_API_KEY not set — using demo triage");
      triageData = buildDemoTriage(task, profiles);
    }

    const matchedProfile = (profiles ?? []).find(
      (p) => p.email?.toLowerCase() === triageData.suggested_assignee_email?.toLowerCase(),
    );

    const { data: triageResult, error: insertError } = await supabase
      .from("task_triage_results")
      .insert({
        task_id: taskId,
        suggested_priority: triageData.suggested_priority,
        suggested_assignee_id: matchedProfile?.id ?? user.id,
        suggested_category: triageData.suggested_category,
        suggested_next_action: triageData.suggested_next_action,
        reasoning: triageData.reasoning,
        client_status_update: triageData.client_status_update,
        follow_up_subtasks: triageData.follow_up_subtasks ?? [],
        status: "pending",
        created_by: user.id,
        raw_ai_response: rawAiResponse,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, result: triageResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[triage-project-task] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
