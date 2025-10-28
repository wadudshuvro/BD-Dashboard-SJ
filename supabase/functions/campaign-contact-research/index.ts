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

    // Build research query with both contact and company research
    const query = `Research ${contact.contact_name}${contact.contact_company ? ` at ${contact.contact_company}` : ""}${contact.contact_title ? `, ${contact.contact_title}` : ""}. 
    
Campaign context: ${contact.bd_campaigns.name} (${contact.bd_campaigns.campaign_type})
${contact.contact_linkedin_url ? `LinkedIn: ${contact.contact_linkedin_url}` : ""}

Provide in structured sections:

CONTACT INFORMATION:
1. Professional background and expertise
2. Recent activities or achievements
3. Potential pain points or needs relevant to our campaign
4. Personalization opportunities for outreach
5. Best approach for engagement

COMPANY INFORMATION${contact.contact_company ? ` (for ${contact.contact_company})` : ''}:
1. Company website URL
2. Company LinkedIn URL
3. Industry/sector
4. Company size (employee count range)
5. Headquarters location
6. Brief company description (2-3 sentences)
7. Year founded (if available)
8. Technologies used (if known)

Format your response clearly with "CONTACT:" and "COMPANY:" section headers.`;

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
    const fullResearchResponse = aiResponse.choices?.[0]?.message?.content || "No research generated";

    // Split contact and company sections
    const contactSection = fullResearchResponse.split('COMPANY:')[0].replace('CONTACT:', '').trim();
    const companySection = fullResearchResponse.split('COMPANY:')[1]?.trim() || '';

    // Extract company data using regex patterns
    const websiteMatch = companySection.match(/website[:\s]+([^\s\n]+)/i);
    const linkedinMatch = companySection.match(/linkedin[:\s]+([^\s\n]+)/i);
    const industryMatch = companySection.match(/industry[:\s]+([^\n]+)/i);
    const sizeMatch = companySection.match(/size[:\s]+([^\n]+)/i);
    const hqMatch = companySection.match(/headquarters[:\s]+([^\n]+)/i);
    const descMatch = companySection.match(/description[:\s]+([^\n]+(?:\n[^\n]+)?)/i);

    const companyData = {
      website: websiteMatch?.[1]?.trim(),
      linkedin_url: linkedinMatch?.[1]?.trim(),
      industry: industryMatch?.[1]?.trim(),
      employee_count: sizeMatch?.[1]?.trim(),
      headquarters: hqMatch?.[1]?.trim(),
      description: descMatch?.[1]?.trim(),
    };

    // Parse LinkedIn data from metadata if available
    const { data: contactData } = await supabase
      .from("campaign_contacts")
      .select("metadata")
      .eq("id", contactId)
      .single();

    let linkedInFields = {};
    if (contactData?.metadata) {
      const text = typeof contactData.metadata === 'string' 
        ? contactData.metadata 
        : (contactData.metadata as any).text || JSON.stringify(contactData.metadata);
      
      const headlineMatch = text.match(/###\s*([^\n]+?)\s*at\s+\[/);
      const employerMatch = text.match(/at\s+\[([^\]]+)\]/);
      
      linkedInFields = {
        linkedin_headline: headlineMatch?.[1]?.trim(),
        current_employer: employerMatch?.[1]?.trim(),
        current_position_title: headlineMatch?.[1]?.trim(),
      };
    }

    // Handle company data upsert if we have company information
    let companyId = null;
    if (contact.contact_company && companyData.website) {
      // Check if company exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', contact.contact_company)
        .maybeSingle();

      if (existingCompany) {
        // Update existing company
        await supabase
          .from('companies')
          .update({
            website: companyData.website,
            linkedin_url: companyData.linkedin_url,
            industry: companyData.industry,
            employee_count: companyData.employee_count,
            headquarters: companyData.headquarters,
            description: companyData.description,
            last_researched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCompany.id);
        
        companyId = existingCompany.id;
        console.log("Updated existing company:", existingCompany.id);
      } else {
        // Create new company with slug
        const slug = contact.contact_company
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            name: contact.contact_company,
            slug: slug,
            website: companyData.website,
            linkedin_url: companyData.linkedin_url,
            industry: companyData.industry,
            employee_count: companyData.employee_count,
            headquarters: companyData.headquarters,
            description: companyData.description,
            last_researched_at: new Date().toISOString(),
            created_by: user.id,
          })
          .select('id, slug')
          .single();
        
        companyId = newCompany?.id;
        console.log("Created new company:", companyId, "with slug:", newCompany?.slug);
      }
    }

    // Update contact with research summary, company link, and parsed fields
    const { error: updateError } = await supabase
      .from("campaign_contacts")
      .update({
        research_summary: {
          summary: contactSection,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
          model: model,
          query: query,
        },
        last_enriched_at: new Date().toISOString(),
        company_id: companyId,
        company_website: companyData.website,
        company_linkedin_url: companyData.linkedin_url,
        company_industry: companyData.industry,
        company_size: companyData.employee_count,
        company_description: companyData.description,
        company_headquarters: companyData.headquarters,
        ...linkedInFields,
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
        research_summary: contactSection,
        company_data: companyData,
        company_id: companyId,
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
