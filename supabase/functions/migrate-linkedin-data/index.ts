import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { parseLinkedInProfile } from "../_shared/parseLinkedInData.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting LinkedIn data migration...");

    // Fetch all contacts that have metadata but no linkedin_headline
    const { data: contacts, error: fetchError } = await supabaseClient
      .from("campaign_contacts")
      .select("id, contact_name, metadata")
      .is("linkedin_headline", null)
      .not("metadata", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch contacts: ${fetchError.message}`);
    }

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No contacts found to migrate",
          processed: 0,
          skipped: 0,
          errors: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${contacts.length} contacts to process`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    // Process each contact
    for (const contact of contacts) {
      try {
        console.log(`Processing contact: ${contact.contact_name} (${contact.id})`);
        
        // Parse the LinkedIn data
        const parsedData = parseLinkedInProfile(contact.metadata);
        
        // Skip if no meaningful data was parsed
        if (!parsedData.headline && !parsedData.current_employer) {
          console.log(`Skipping ${contact.contact_name} - no parseable LinkedIn data`);
          skipped++;
          continue;
        }

        // Update the contact with parsed data
        const { error: updateError } = await supabaseClient
          .from("campaign_contacts")
          .update({
            linkedin_headline: parsedData.headline,
            linkedin_location: parsedData.location,
            linkedin_follower_count: parsedData.follower_count,
            linkedin_connection_count: parsedData.connection_count,
            linkedin_profile_image_url: parsedData.profile_image_url,
            current_employer: parsedData.current_employer,
            current_position_title: parsedData.current_position_title,
            current_position_start_date: parsedData.current_position_start_date,
            years_in_current_role: parsedData.years_in_current_role,
            linkedin_about: parsedData.about,
            linkedin_skills: parsedData.skills,
            languages: parsedData.languages,
            total_years_experience: parsedData.total_years_experience,
            industry_focus: parsedData.industry_focus,
            previous_employers: parsedData.previous_employers,
            education_summary: parsedData.education_summary,
            highest_degree: parsedData.highest_degree,
            profile_completeness_score: parsedData.profile_completeness_score,
            last_linkedin_activity_date: parsedData.last_activity_date,
          })
          .eq("id", contact.id);

        if (updateError) {
          throw updateError;
        }

        processed++;
        console.log(`✓ Successfully processed ${contact.contact_name}`);
        
      } catch (error) {
        console.error(`Error processing contact ${contact.id}:`, error);
        errors++;
        errorDetails.push({
          contact_id: contact.id,
          contact_name: contact.contact_name,
          error: error.message,
        });
      }
    }

    const summary = {
      message: "LinkedIn data migration completed",
      total_contacts: contacts.length,
      processed,
      skipped,
      errors,
      error_details: errorDetails,
    };

    console.log("Migration summary:", summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
