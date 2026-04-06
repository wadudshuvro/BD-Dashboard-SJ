import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, user_id, conversation_id } = await req.json();
    if (!agent_id || !user_id || !conversation_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all messages in conversation
    const { data: messages, error: msgErr } = await supabase
      .from("agent_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(30);

    if (msgErr || !messages || messages.length < 2) {
      return new Response(JSON.stringify({ extracted: 0, reason: "Not enough messages" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build conversation text
    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n\n");

    // Ask AI to extract memories
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a memory extraction system. Analyze the conversation and extract important facts, preferences, decisions, and patterns about the user. Return a JSON array of memory objects. Each object must have:
- "memory_type": one of "summary", "fact", "preference", "decision", "pattern"
- "content": a 1-2 sentence description of the memory
- "relevance_score": a number between 0.5 and 1.0 indicating importance

Only extract genuinely useful memories. If nothing significant, return an empty array [].
Return ONLY the JSON array, no other text.`,
          },
          {
            role: "user",
            content: `Extract memories from this conversation:\n\n${conversationText.slice(0, 6000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!extractionResponse.ok) {
      const errText = await extractionResponse.text();
      console.error("AI extraction failed:", errText);
      return new Response(JSON.stringify({ extracted: 0, error: "AI call failed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractionData = await extractionResponse.json();
    const rawContent = extractionData.choices?.[0]?.message?.content?.trim() || "[]";

    let memories: Array<{ memory_type: string; content: string; relevance_score: number }> = [];
    try {
      // Handle potential markdown wrapping
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      memories = JSON.parse(cleaned);
      if (!Array.isArray(memories)) memories = [];
    } catch {
      console.error("Failed to parse memories:", rawContent);
      return new Response(JSON.stringify({ extracted: 0, error: "Parse failed" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store each memory with embedding
    let stored = 0;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    for (const mem of memories.slice(0, 5)) {
      try {
        // Generate embedding
        const embResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ text: mem.content }),
        });

        let embedding: number[] | null = null;
        if (embResponse.ok) {
          const embData = await embResponse.json();
          embedding = embData.embeddings?.[0] || null;
        }

        // Map memory_type from extraction to category
        const categoryMap: Record<string, string> = {
          summary: "summary",
          fact: "fact",
          preference: "preference",
          decision: "decision",
          pattern: "pattern",
        };

        const { error: insertErr } = await supabase.from("agent_memories").insert({
          agent_id,
          user_id,
          memory_type: "short_term",
          memory_category: categoryMap[mem.memory_type] || "fact",
          content: mem.content,
          summary: mem.content.slice(0, 200),
          embedding: embedding ? JSON.stringify(embedding) : null,
          source_type: "conversation",
          source_id: conversation_id,
          importance_score: Math.max(0, Math.min(1, mem.relevance_score || 0.5)),
        });

        if (!insertErr) stored++;
      } catch (e) {
        console.error("Failed to store memory:", e);
      }
    }

    return new Response(JSON.stringify({ extracted: stored }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-agent-memories error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
