export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accountability_chart: {
        Row: {
          created_at: string
          id: string
          position: string
          reports_to: string | null
          responsibilities: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position: string
          reports_to?: string | null
          responsibilities?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: string
          reports_to?: string | null
          responsibilities?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_agent_runs: {
        Row: {
          agent_id: string | null
          ai_summary: Json | null
          category: string | null
          completed_at: string | null
          created_at: string
          error: string | null
          error_message: string | null
          executed_by: string | null
          execution_context: Json | null
          generated_tasks: Json | null
          id: string
          input: Json | null
          output: Json | null
          provider_chain: Json | null
          selected_file_ids: string[] | null
          started_at: string
          status: string | null
          structured_output: Json | null
          title: string | null
          user_context: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_summary?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          generated_tasks?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          provider_chain?: Json | null
          selected_file_ids?: string[] | null
          started_at?: string
          status?: string | null
          structured_output?: Json | null
          title?: string | null
          user_context?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_summary?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          generated_tasks?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          provider_chain?: Json | null
          selected_file_ids?: string[] | null
          started_at?: string
          status?: string | null
          structured_output?: Json | null
          title?: string | null
          user_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          model: string | null
          name: string
          provider: string
          template_config: Json
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          model?: string | null
          name: string
          provider: string
          template_config: Json
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          model?: string | null
          name?: string
          provider?: string
          template_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          category: string | null
          config: Json | null
          created_at: string
          created_by: string | null
          data_source_config: Json | null
          description: string | null
          file_selection_config: Json | null
          id: string
          is_active: boolean | null
          is_enabled: boolean | null
          last_run_at: string | null
          name: string
          output_actions: Json | null
          prompt_template: string | null
          schedule_config: Json | null
          slug: string | null
          success_rate: number | null
          system_prompt: string | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          data_source_config?: Json | null
          description?: string | null
          file_selection_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          last_run_at?: string | null
          name: string
          output_actions?: Json | null
          prompt_template?: string | null
          schedule_config?: Json | null
          slug?: string | null
          success_rate?: number | null
          system_prompt?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          data_source_config?: Json | null
          description?: string | null
          file_selection_config?: Json | null
          id?: string
          is_active?: boolean | null
          is_enabled?: boolean | null
          last_run_at?: string | null
          name?: string
          output_actions?: Json | null
          prompt_template?: string | null
          schedule_config?: Json | null
          slug?: string | null
          success_rate?: number | null
          system_prompt?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_business_context: {
        Row: {
          context_type: string
          created_at: string | null
          created_by: string | null
          data: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          context_type: string
          created_at?: string | null
          created_by?: string | null
          data: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          context_type?: string
          created_at?: string | null
          created_by?: string | null
          data?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          configuration_data: Json
          configuration_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration_data?: Json
          configuration_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration_data?: Json
          configuration_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bd_campaigns: {
        Row: {
          actual_contacts_reached: number | null
          brand_id: string | null
          campaign_type: string
          campaign_types: string[] | null
          created_at: string
          created_by: string | null
          deals_generated: number | null
          end_date: string | null
          id: string
          meetings_booked: number | null
          name: string
          niche_id: string
          owned_by: string | null
          responses_received: number | null
          slug: string | null
          start_date: string | null
          status: string
          target_contacts: string[] | null
          target_contacts_count: number | null
          target_regions: string[] | null
          updated_at: string
        }
        Insert: {
          actual_contacts_reached?: number | null
          brand_id?: string | null
          campaign_type: string
          campaign_types?: string[] | null
          created_at?: string
          created_by?: string | null
          deals_generated?: number | null
          end_date?: string | null
          id?: string
          meetings_booked?: number | null
          name: string
          niche_id: string
          owned_by?: string | null
          responses_received?: number | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_contacts?: string[] | null
          target_contacts_count?: number | null
          target_regions?: string[] | null
          updated_at?: string
        }
        Update: {
          actual_contacts_reached?: number | null
          brand_id?: string | null
          campaign_type?: string
          campaign_types?: string[] | null
          created_at?: string
          created_by?: string | null
          deals_generated?: number | null
          end_date?: string | null
          id?: string
          meetings_booked?: number | null
          name?: string
          niche_id?: string
          owned_by?: string | null
          responses_received?: number | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_contacts?: string[] | null
          target_contacts_count?: number | null
          target_regions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bd_campaigns_niche_id_fkey"
            columns: ["niche_id"]
            isOneToOne: false
            referencedRelation: "target_niches"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_brands: {
        Row: {
          brand_id: string
          campaign_id: string
          created_at: string
          id: string
        }
        Insert: {
          brand_id: string
          campaign_id: string
          created_at?: string
          id?: string
        }
        Update: {
          brand_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_brands_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contact_comments: {
        Row: {
          comment: string
          contact_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          contact_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          contact_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contact_comments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contact_linkedin_messages: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string | null
          follow_up_strategy: string | null
          generated_by: string | null
          generation_context: Json | null
          id: string
          message_type: string
          message_variants: Json
          reasoning: string | null
          recommended_variant: string
          send_timing_suggestion: string | null
          updated_at: string | null
          user_context: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string | null
          follow_up_strategy?: string | null
          generated_by?: string | null
          generation_context?: Json | null
          id?: string
          message_type: string
          message_variants: Json
          reasoning?: string | null
          recommended_variant: string
          send_timing_suggestion?: string | null
          updated_at?: string | null
          user_context?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string | null
          follow_up_strategy?: string | null
          generated_by?: string | null
          generation_context?: Json | null
          id?: string
          message_type?: string
          message_variants?: Json
          reasoning?: string | null
          recommended_variant?: string
          send_timing_suggestion?: string | null
          updated_at?: string | null
          user_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contact_linkedin_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contact_linkedin_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contact_status_history: {
        Row: {
          change_trigger: string
          changed_at: string
          changed_by: string | null
          contact_id: string
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          change_trigger?: string
          changed_at?: string
          changed_by?: string | null
          contact_id: string
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          change_trigger?: string
          changed_at?: string
          changed_by?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contact_status_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          auto_status_enabled: boolean | null
          campaign_id: string
          company_description: string | null
          company_founded_year: number | null
          company_headquarters: string | null
          company_industry: string | null
          company_linkedin_url: string | null
          company_size: string | null
          company_website: string | null
          contact_company: string | null
          contact_email: string | null
          contact_linkedin_url: string | null
          contact_name: string
          contact_phone: string | null
          contact_title: string | null
          created_at: string
          current_employer: string | null
          current_position_start_date: string | null
          current_position_title: string | null
          education_summary: string | null
          exa_item_id: string | null
          exa_score: number | null
          highest_degree: string | null
          id: string
          industry_focus: string | null
          languages: string[] | null
          last_enriched_at: string | null
          last_linkedin_activity_date: string | null
          last_status_change_at: string | null
          linkedin_about: string | null
          linkedin_connection_count: number | null
          linkedin_follower_count: number | null
          linkedin_headline: string | null
          linkedin_location: string | null
          linkedin_profile_image_url: string | null
          linkedin_skills: string[] | null
          metadata: Json | null
          previous_employers: string[] | null
          profile_completeness_score: number | null
          research_summary: Json | null
          slug: string | null
          status: string
          total_years_experience: number | null
          updated_at: string
          years_in_current_role: number | null
        }
        Insert: {
          auto_status_enabled?: boolean | null
          campaign_id: string
          company_description?: string | null
          company_founded_year?: number | null
          company_headquarters?: string | null
          company_industry?: string | null
          company_linkedin_url?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_linkedin_url?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string
          current_employer?: string | null
          current_position_start_date?: string | null
          current_position_title?: string | null
          education_summary?: string | null
          exa_item_id?: string | null
          exa_score?: number | null
          highest_degree?: string | null
          id?: string
          industry_focus?: string | null
          languages?: string[] | null
          last_enriched_at?: string | null
          last_linkedin_activity_date?: string | null
          last_status_change_at?: string | null
          linkedin_about?: string | null
          linkedin_connection_count?: number | null
          linkedin_follower_count?: number | null
          linkedin_headline?: string | null
          linkedin_location?: string | null
          linkedin_profile_image_url?: string | null
          linkedin_skills?: string[] | null
          metadata?: Json | null
          previous_employers?: string[] | null
          profile_completeness_score?: number | null
          research_summary?: Json | null
          slug?: string | null
          status?: string
          total_years_experience?: number | null
          updated_at?: string
          years_in_current_role?: number | null
        }
        Update: {
          auto_status_enabled?: boolean | null
          campaign_id?: string
          company_description?: string | null
          company_founded_year?: number | null
          company_headquarters?: string | null
          company_industry?: string | null
          company_linkedin_url?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_company?: string | null
          contact_email?: string | null
          contact_linkedin_url?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string
          current_employer?: string | null
          current_position_start_date?: string | null
          current_position_title?: string | null
          education_summary?: string | null
          exa_item_id?: string | null
          exa_score?: number | null
          highest_degree?: string | null
          id?: string
          industry_focus?: string | null
          languages?: string[] | null
          last_enriched_at?: string | null
          last_linkedin_activity_date?: string | null
          last_status_change_at?: string | null
          linkedin_about?: string | null
          linkedin_connection_count?: number | null
          linkedin_follower_count?: number | null
          linkedin_headline?: string | null
          linkedin_location?: string | null
          linkedin_profile_image_url?: string | null
          linkedin_skills?: string[] | null
          metadata?: Json | null
          previous_employers?: string[] | null
          profile_completeness_score?: number | null
          research_summary?: Json | null
          slug?: string | null
          status?: string
          total_years_experience?: number | null
          updated_at?: string
          years_in_current_role?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_research: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          payload: Json
          provider: string | null
          query: string | null
          requested_at: string
          research_type: string
          results: Json
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          provider?: string | null
          query?: string | null
          requested_at?: string
          research_type: string
          results?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          provider?: string | null
          query?: string | null
          requested_at?: string
          research_type?: string
          results?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_research_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          created_at: string
          id: string
          order_index: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          items: Json | null
          name: string
          stage: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json | null
          name: string
          stage?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json | null
          name?: string
          stage?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          brand_id: string | null
          city: string | null
          company: string | null
          contact_person: string | null
          control_tower_id: string | null
          country: string | null
          created_at: string
          description: string | null
          email: string | null
          employee_count: number | null
          hubspot_id: string | null
          id: string
          industry: string | null
          last_contact_date: string | null
          last_researched_at: string | null
          linkedin_url: string | null
          logo_url: string | null
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          research_summary: Json | null
          revenue: number | null
          slug: string | null
          specialties: string[] | null
          state: string | null
          status: string | null
          technologies: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          control_tower_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          hubspot_id?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          last_researched_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          research_summary?: Json | null
          revenue?: number | null
          slug?: string | null
          specialties?: string[] | null
          state?: string | null
          status?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          control_tower_id?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          employee_count?: number | null
          hubspot_id?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          last_researched_at?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          research_summary?: Json | null
          revenue?: number | null
          slug?: string | null
          specialties?: string[] | null
          state?: string | null
          status?: string | null
          technologies?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      collabai_agents: {
        Row: {
          agent_id: string
          agent_type: string | null
          created_at: string
          description: string | null
          id: string
          integration_id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          sample_questions: Json | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          integration_id: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          sample_questions?: Json | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          integration_id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          sample_questions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collabai_agents_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "collabai_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      collabai_integrations: {
        Row: {
          agent_count: number | null
          api_key_encrypted: string
          base_url: string
          created_at: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_count?: number | null
          api_key_encrypted: string
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_count?: number | null
          api_key_encrypted?: string
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      control_tower_sync_log: {
        Row: {
          control_tower_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          payload: Json | null
          status: string
          sync_type: string
          synced_at: string
          synced_by: string | null
        }
        Insert: {
          control_tower_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          status: string
          sync_type: string
          synced_at?: string
          synced_by?: string | null
        }
        Update: {
          control_tower_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          status?: string
          sync_type?: string
          synced_at?: string
          synced_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sync_log_synced_by"
            columns: ["synced_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      control_tower_user_mappings: {
        Row: {
          control_tower_email: string
          control_tower_name: string | null
          control_tower_user_id: string
          created_at: string | null
          id: string
          local_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          control_tower_email: string
          control_tower_name?: string | null
          control_tower_user_id: string
          created_at?: string | null
          id?: string
          local_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          control_tower_email?: string
          control_tower_name?: string | null
          control_tower_user_id?: string
          created_at?: string | null
          id?: string
          local_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_tower_user_mappings_local_user_id_fkey"
            columns: ["local_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          control_tower_item_id: string | null
          created_at: string
          deal_id: string
          id: string
          is_completed: boolean
          order_index: number
          synced_to_control_tower: boolean
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          control_tower_item_id?: string | null
          created_at?: string
          deal_id: string
          id?: string
          is_completed?: boolean
          order_index?: number
          synced_to_control_tower?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          control_tower_item_id?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          synced_to_control_tower?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_checklist_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_comments: {
        Row: {
          comment: string
          created_at: string
          deal_id: string
          id: string
          synced_to_control_tower: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          deal_id: string
          id?: string
          synced_to_control_tower?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          deal_id?: string
          id?: string
          synced_to_control_tower?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_comments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_files: {
        Row: {
          category: string | null
          checksum: string | null
          client_id: string | null
          created_at: string
          deal_id: string | null
          drive_created_at: string | null
          drive_file_id: string | null
          drive_file_name: string | null
          drive_file_type: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          drive_last_modified_at: string | null
          file_size: number | null
          id: string
          json_snapshot_path: string | null
          metadata: Json | null
          storage_bucket_path: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          checksum?: string | null
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          drive_created_at?: string | null
          drive_file_id?: string | null
          drive_file_name?: string | null
          drive_file_type?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          drive_last_modified_at?: string | null
          file_size?: number | null
          id?: string
          json_snapshot_path?: string | null
          metadata?: Json | null
          storage_bucket_path?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          checksum?: string | null
          client_id?: string | null
          created_at?: string
          deal_id?: string | null
          drive_created_at?: string | null
          drive_file_id?: string | null
          drive_file_name?: string | null
          drive_file_type?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          drive_last_modified_at?: string | null
          file_size?: number | null
          id?: string
          json_snapshot_path?: string | null
          metadata?: Json | null
          storage_bucket_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_files_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_system_info: {
        Row: {
          created_at: string
          deal_id: string
          external_references: Json | null
          id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          external_references?: Json | null
          id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          external_references?: Json | null
          id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_system_info_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          category: string | null
          client_agent_folder: string | null
          client_agent_url: string | null
          client_estimate_doc_url: string | null
          client_id: string | null
          close_date: string | null
          collaborative_ai: string | null
          collaborative_ai_link: string | null
          control_tower_client_id: string | null
          control_tower_id: string | null
          control_tower_metadata: Json | null
          control_tower_owner_id: string | null
          control_tower_status: string | null
          created_at: string
          dealtype: string | null
          estimate_task_link: string | null
          estimate_url: string | null
          expected_closing_date: string | null
          external_links: Json | null
          google_drive_folder_id: string | null
          google_drive_folder_url: string | null
          hubspot_crm_deal_url: string | null
          hubspot_deal_id: string | null
          id: string
          internal_estimate_doc_link: string | null
          internal_estimate_doc_url: string | null
          last_activity_by: string | null
          last_activity_date: string | null
          last_synced_at: string | null
          lead_source: string | null
          leadslift_crm_deal_url: string | null
          notes: string | null
          owner_id: string | null
          pandadoc_proposal_url: string | null
          pipeline: string | null
          pm_assigned_id: string | null
          pod_id: string | null
          potential_amount: number | null
          priority: string | null
          probability: number | null
          stage: string | null
          status: string | null
          synced_from_control_tower: boolean | null
          tags: string[] | null
          title: string
          type_of_work: string | null
          updated_at: string
          workboard_ai_link: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          client_agent_folder?: string | null
          client_agent_url?: string | null
          client_estimate_doc_url?: string | null
          client_id?: string | null
          close_date?: string | null
          collaborative_ai?: string | null
          collaborative_ai_link?: string | null
          control_tower_client_id?: string | null
          control_tower_id?: string | null
          control_tower_metadata?: Json | null
          control_tower_owner_id?: string | null
          control_tower_status?: string | null
          created_at?: string
          dealtype?: string | null
          estimate_task_link?: string | null
          estimate_url?: string | null
          expected_closing_date?: string | null
          external_links?: Json | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          hubspot_crm_deal_url?: string | null
          hubspot_deal_id?: string | null
          id?: string
          internal_estimate_doc_link?: string | null
          internal_estimate_doc_url?: string | null
          last_activity_by?: string | null
          last_activity_date?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          leadslift_crm_deal_url?: string | null
          notes?: string | null
          owner_id?: string | null
          pandadoc_proposal_url?: string | null
          pipeline?: string | null
          pm_assigned_id?: string | null
          pod_id?: string | null
          potential_amount?: number | null
          priority?: string | null
          probability?: number | null
          stage?: string | null
          status?: string | null
          synced_from_control_tower?: boolean | null
          tags?: string[] | null
          title: string
          type_of_work?: string | null
          updated_at?: string
          workboard_ai_link?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          client_agent_folder?: string | null
          client_agent_url?: string | null
          client_estimate_doc_url?: string | null
          client_id?: string | null
          close_date?: string | null
          collaborative_ai?: string | null
          collaborative_ai_link?: string | null
          control_tower_client_id?: string | null
          control_tower_id?: string | null
          control_tower_metadata?: Json | null
          control_tower_owner_id?: string | null
          control_tower_status?: string | null
          created_at?: string
          dealtype?: string | null
          estimate_task_link?: string | null
          estimate_url?: string | null
          expected_closing_date?: string | null
          external_links?: Json | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          hubspot_crm_deal_url?: string | null
          hubspot_deal_id?: string | null
          id?: string
          internal_estimate_doc_link?: string | null
          internal_estimate_doc_url?: string | null
          last_activity_by?: string | null
          last_activity_date?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          leadslift_crm_deal_url?: string | null
          notes?: string | null
          owner_id?: string | null
          pandadoc_proposal_url?: string | null
          pipeline?: string | null
          pm_assigned_id?: string | null
          pod_id?: string | null
          potential_amount?: number | null
          priority?: string | null
          probability?: number | null
          stage?: string | null
          status?: string | null
          synced_from_control_tower?: boolean | null
          tags?: string[] | null
          title?: string
          type_of_work?: string | null
          updated_at?: string
          workboard_ai_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      eod_submissions: {
        Row: {
          challenges: string | null
          created_at: string
          date: string
          hours_worked: number | null
          id: string
          project_id: string | null
          tasks_completed: string | null
          tomorrow_plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenges?: string | null
          created_at?: string
          date: string
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          tasks_completed?: string | null
          tomorrow_plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenges?: string | null
          created_at?: string
          date?: string
          hours_worked?: number | null
          id?: string
          project_id?: string | null
          tasks_completed?: string | null
          tomorrow_plan?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eod_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          contact: string
          created_at: string
          date: string
          id: string
          next_step: string | null
          outcome: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact: string
          created_at?: string
          date: string
          id?: string
          next_step?: string | null
          outcome?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string
          created_at?: string
          date?: string
          id?: string
          next_step?: string | null
          outcome?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_drive_sync_log: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string | null
          errors: Json | null
          files_added: number | null
          files_scanned: number | null
          files_skipped: number | null
          files_updated: number | null
          id: string
          started_at: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          errors?: Json | null
          files_added?: number | null
          files_scanned?: number | null
          files_skipped?: number | null
          files_updated?: number | null
          id?: string
          started_at?: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          errors?: Json | null
          files_added?: number | null
          files_scanned?: number | null
          files_skipped?: number | null
          files_updated?: number | null
          id?: string
          started_at?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_drive_sync_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_drive_sync_log_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync: string | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      kpis: {
        Row: {
          brand_id: string | null
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          name: string
          period_end: string | null
          period_start: string | null
          project_id: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          name?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_jobs: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          criteria: Json
          error_details: string | null
          id: string
          imported_count: number
          initiated_by: string | null
          job_type: string | null
          notification_sent_at: string | null
          notify_email: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          error_details?: string | null
          id?: string
          imported_count?: number
          initiated_by?: string | null
          job_type?: string | null
          notification_sent_at?: string | null
          notify_email?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          error_details?: string | null
          id?: string
          imported_count?: number
          initiated_by?: string | null
          job_type?: string | null
          notification_sent_at?: string | null
          notify_email?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_id: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          enrichment_status: string | null
          exa_item_id: string | null
          id: string
          imported_via_exa: boolean | null
          industry: string | null
          last_enriched_at: string | null
          lead_score_exa: number | null
          metadata: Json | null
          phone: string | null
          slug: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          campaign_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enrichment_status?: string | null
          exa_item_id?: string | null
          id?: string
          imported_via_exa?: boolean | null
          industry?: string | null
          last_enriched_at?: string | null
          lead_score_exa?: number | null
          metadata?: Json | null
          phone?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          campaign_id?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enrichment_status?: string | null
          exa_item_id?: string | null
          id?: string
          imported_via_exa?: boolean | null
          industry?: string | null
          last_enriched_at?: string | null
          lead_score_exa?: number | null
          metadata?: Json | null
          phone?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "bd_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          lead_user_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_user_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_user_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          google_drive_link: string | null
          id: string
          is_active: boolean | null
          marketing_variant_link: string | null
          name: string
          owner_team: string | null
          pricing_model: string | null
          target_industries: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          google_drive_link?: string | null
          id?: string
          is_active?: boolean | null
          marketing_variant_link?: string | null
          name: string
          owner_team?: string | null
          pricing_model?: string | null
          target_industries?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          google_drive_link?: string | null
          id?: string
          is_active?: boolean | null
          marketing_variant_link?: string | null
          name?: string
          owner_team?: string | null
          pricing_model?: string | null
          target_industries?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_owner_team_fkey"
            columns: ["owner_team"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_id: string | null
          budget: number | null
          client_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          project_manager_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_manager_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_manager_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      target_niches: {
        Row: {
          business_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dreams: string[] | null
          employee_size_max: number | null
          employee_size_min: number | null
          id: string
          industries: string[] | null
          name: string
          pain_points: string[] | null
          pod_id: string | null
          priority: string
          revenue_max: number | null
          revenue_min: number | null
          services: string[] | null
          status: string
          target_clients: number | null
          target_contacts: string[] | null
          target_regions: string[] | null
          target_revenue: number | null
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dreams?: string[] | null
          employee_size_max?: number | null
          employee_size_min?: number | null
          id?: string
          industries?: string[] | null
          name: string
          pain_points?: string[] | null
          pod_id?: string | null
          priority?: string
          revenue_max?: number | null
          revenue_min?: number | null
          services?: string[] | null
          status?: string
          target_clients?: number | null
          target_contacts?: string[] | null
          target_regions?: string[] | null
          target_revenue?: number | null
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dreams?: string[] | null
          employee_size_max?: number | null
          employee_size_min?: number | null
          id?: string
          industries?: string[] | null
          name?: string
          pain_points?: string[] | null
          pod_id?: string | null
          priority?: string
          revenue_max?: number | null
          revenue_min?: number | null
          services?: string[] | null
          status?: string
          target_clients?: number | null
          target_contacts?: string[] | null
          target_regions?: string[] | null
          target_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_niches_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_summaries: {
        Row: {
          created_at: string
          date: string
          id: string
          summary: string | null
          team_size: number | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          summary?: string | null
          team_size?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          summary?: string | null
          team_size?: number | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_accountability_chart: {
        Row: {
          created_at: string
          id: string
          responsibilities: string | null
          serial_number: number
          type_of_work: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          responsibilities?: string | null
          serial_number?: number
          type_of_work: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          responsibilities?: string | null
          serial_number?: number
          type_of_work?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          first_name: string | null
          id: string
          is_marketing: boolean | null
          last_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          first_name?: string | null
          id: string
          is_marketing?: boolean | null
          last_name?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_marketing?: boolean | null
          last_name?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          created_by: string | null
          duration: number | null
          id: string
          prompt: string
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration?: number | null
          id?: string
          prompt: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration?: number | null
          id?: string
          prompt?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_sync_logs: { Args: never; Returns: undefined }
      clear_all_sync_logs: { Args: never; Returns: undefined }
      generate_slug_numeric: { Args: { base_text: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "project_manager"
        | "team_member"
        | "client"
        | "bd_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "project_manager",
        "team_member",
        "client",
        "bd_user",
      ],
    },
  },
} as const
