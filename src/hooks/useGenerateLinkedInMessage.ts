import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateMessageParams {
  contactId: string;
  messageType: 'connection_request' | 'first_followup' | 'second_followup' | 'meeting_request';
  userContext?: string;
}

interface MessageVariant {
  variant_name: string;
  message: string;
  character_count: number;
  tone: string;
  key_hooks: string[];
  personalization_elements: string[];
}

interface GeneratedMessageResponse {
  message_variants: MessageVariant[];
  recommended_variant: string;
  reasoning: string;
  send_timing_suggestion: string;
  follow_up_strategy: string;
}

export function useGenerateLinkedInMessage() {
  return useMutation({
    mutationFn: async (params: GenerateMessageParams) => {
      // Fetch full contact data
      const { data: contact, error: contactError } = await supabase
        .from('campaign_contacts')
        .select('*')
        .eq('id', params.contactId)
        .single();

      if (contactError || !contact) throw new Error('Contact not found');

      // Find the LinkedIn agent
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('slug', 'linkedin-message-generator')
        .eq('is_active', true)
        .single();

      if (agentError || !agent) {
        throw new Error('LinkedIn message agent not configured');
      }

      // Prepare execution context with ALL available data
      const executionContext = {
        user_id: contact.id,
        message_type: params.messageType,
        contact_data: {
          contact_name: contact.contact_name,
          current_position_title: contact.current_position_title,
          current_employer: contact.current_employer,
          linkedin_headline: contact.linkedin_headline,
          linkedin_location: contact.linkedin_location,
          years_in_current_role: contact.years_in_current_role,
          total_years_experience: contact.total_years_experience,
          industry_focus: contact.industry_focus,
          linkedin_skills: contact.linkedin_skills,
          linkedin_about: contact.linkedin_about,
          education_summary: contact.education_summary,
          previous_employers: contact.previous_employers,
          research_summary: contact.research_summary,
          status: contact.status,
        },
        user_context: params.userContext || ''
      };

      // Call run-ai-agent edge function
      const { data, error } = await supabase.functions.invoke('run-ai-agent', {
        body: {
          agent_id: agent.id,
          execution_context: executionContext,
        },
      });

      if (error) throw error;
      return data.structured_output as GeneratedMessageResponse;
    },
    onSuccess: () => {
      toast.success("LinkedIn messages generated", {
        description: "Choose your preferred variant and copy to clipboard",
      });
    },
    onError: (error: Error) => {
      console.error('Message generation failed:', error);
      toast.error("Failed to generate messages", {
        description: error.message,
      });
    },
  });
}
