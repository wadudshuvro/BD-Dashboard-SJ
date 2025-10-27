import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }

    if (!perplexityApiKey) {
      throw new Error("PERPLEXITY_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contactId } = await req.json();
    if (!contactId) {
      return new Response(JSON.stringify({ error: "contactId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from("campaign_contacts")
      .select("*, bd_campaigns!inner(name, campaign_type, target_regions)")
      .eq("id", contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Perplexity's current default model
    const model = "sonar";

    // Build research query
    const query = `Research ${contact.contact_name}${contact.contact_company ? ` at ${contact.contact_company}` : ""}${contact.contact_title ? `, ${contact.contact_title}` : ""}. 
    
Campaign context: ${contact.bd_campaigns.name} (${contact.bd_campaigns.campaign_type})
${contact.contact_linkedin_url ? `LinkedIn: ${contact.contact_linkedin_url}` : ""}

Provide:
1. Professional background and expertise
2. Recent activities or achievements
3. Potential pain points or needs relevant to our campaign
4. Personalization opportunities for outreach
5. Best approach for engagement`;

    console.log("Calling Perplexity API with model:", model);

    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a business development research assistant. Provide concise, actionable insights for B2B outreach.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const researchSummary = aiResponse.choices?.[0]?.message?.content || "No research generated";

    // Update contact with research summary
    const { error: updateError } = await supabase
      .from("campaign_contacts")
      .update({
        research_summary: {
          summary: researchSummary,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
          model: model,
          query: query,
        },
        last_enriched_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      console.error("Failed to update contact:", updateError);
      throw updateError;
    }

    console.log("Research completed successfully for contact:", contactId);

    return new Response(
      JSON.stringify({
        success: true,
        research_summary: researchSummary,
        contact_id: contactId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in campaign-contact-research:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
