import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemoryResult {
  id: string;
  content: string;
  memory_category: string;
  memory_type: string;
  importance_score: number;
  similarity?: number;
  created_at?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agent_id, user_id, query, max_results = 5 } = await req.json();
    if (!agent_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing agent_id or user_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const allMemories: MemoryResult[] = [];

    // Strategy 1: Semantic search if query is provided
    if (query) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const embResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ text: query }),
        });

        if (embResponse.ok) {
          const embData = await embResponse.json();
          const embedding = embData.embeddings?.[0];

          if (embedding) {
            const { data: semanticResults } = await supabase.rpc("get_relevant_memories", {
              p_agent_id: agent_id,
              p_user_id: user_id,
              p_embedding: JSON.stringify(embedding),
              p_match_count: max_results,
              p_match_threshold: 0.3,
            });

            if (semanticResults) {
              for (const r of semanticResults) {
                allMemories.push({
                  id: r.id,
                  content: r.content,
                  memory_category: r.memory_category,
                  memory_type: r.memory_type,
                  importance_score: r.importance_score,
                  similarity: r.similarity,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Semantic search failed, falling back to recent:", e);
      }
    }

    // Strategy 2: Recent memories (fallback/supplement)
    const { data: recentMemories } = await supabase
      .from("agent_memories")
      .select("id, content, memory_category, memory_type, importance_score, created_at")
      .eq("agent_id", agent_id)
      .eq("user_id", user_id)
      .eq("is_active", true)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("importance_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(max_results);

    if (recentMemories) {
      for (const r of recentMemories) {
        if (!allMemories.find((m) => m.id === r.id)) {
          allMemories.push({
            id: r.id,
            content: r.content,
            memory_category: r.memory_category,
            memory_type: r.memory_type,
            importance_score: r.importance_score,
            created_at: r.created_at,
          });
        }
      }
    }

    // Sort: semantic matches first, then by importance, then by recency
    allMemories.sort((a, b) => {
      if (a.similarity && !b.similarity) return -1;
      if (!a.similarity && b.similarity) return 1;
      if (a.similarity && b.similarity) return b.similarity - a.similarity;
      return b.importance_score - a.importance_score;
    });

    const topMemories = allMemories.slice(0, max_results);

    // Update access stats
    if (topMemories.length > 0) {
      const memoryIds = topMemories.map((m) => m.id);
      await supabase.rpc("increment_memory_access", { p_memory_ids: memoryIds });
    }

    // Format for system prompt injection
    let memoryContext = "";
    if (topMemories.length > 0) {
      memoryContext = "RELEVANT CONTEXT FROM PREVIOUS CONVERSATIONS:\n" +
        topMemories
          .map((m) => {
            const sim = m.similarity ? ` (relevance: ${Math.round(m.similarity * 100)}%)` : "";
            return `[${m.memory_category}] ${m.content}${sim}`;
          })
          .join("\n");
    }

    return new Response(JSON.stringify({ memories: topMemories, memoryContext }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("retrieve-agent-memories error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
