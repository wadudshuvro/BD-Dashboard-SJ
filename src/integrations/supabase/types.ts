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
      activecollab_task_data: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          external_task_id: string
          hours_logged: number | null
          id: string
          last_comment: string | null
          last_comment_date: string | null
          project_id: string | null
          raw_data: Json | null
          status: string | null
          sync_date: string
          task_name: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          external_task_id: string
          hours_logged?: number | null
          id?: string
          last_comment?: string | null
          last_comment_date?: string | null
          project_id?: string | null
          raw_data?: Json | null
          status?: string | null
          sync_date: string
          task_name: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          external_task_id?: string
          hours_logged?: number | null
          id?: string
          last_comment?: string | null
          last_comment_date?: string | null
          project_id?: string | null
          raw_data?: Json | null
          status?: string | null
          sync_date?: string
          task_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activecollab_task_data_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activecollab_task_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          body: string | null
          client_id: string
          created_at: string
          deal_id: string | null
          duration_minutes: number | null
          hubspot_id: string | null
          id: string
          outcome: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          body?: string | null
          client_id: string
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number | null
          hubspot_id?: string | null
          id?: string
          outcome?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          body?: string | null
          client_id?: string
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number | null
          hubspot_id?: string | null
          id?: string
          outcome?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_runs: {
        Row: {
          agent_id: string
          ai_summary: Json
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          business_context: string | null
          category: string | null
          created_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_context: Json | null
          generated_tasks: Json | null
          id: string
          status: string | null
          tags: Json | null
          title: string | null
        }
        Insert: {
          agent_id: string
          ai_summary?: Json
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_context?: string | null
          category?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          generated_tasks?: Json | null
          id?: string
          status?: string | null
          tags?: Json | null
          title?: string | null
        }
        Update: {
          agent_id?: string
          ai_summary?: Json
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_context?: string | null
          category?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          generated_tasks?: Json | null
          id?: string
          status?: string | null
          tags?: Json | null
          title?: string | null
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
      ai_agents: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          data_sources: Json
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          output_actions: Json | null
          required_role: Database["public"]["Enums"]["app_role"] | null
          schedule_config: Json | null
          slug: string
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          output_actions?: Json | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          schedule_config?: Json | null
          slug: string
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          output_actions?: Json | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          schedule_config?: Json | null
          slug?: string
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_configurations: {
        Row: {
          configuration_data: Json
          configuration_type: string
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          configuration_data?: Json
          configuration_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          configuration_data?: Json
          configuration_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      brand_analytics_data: {
        Row: {
          brand_id: string
          created_at: string | null
          data_type: string
          date_range_end: string
          date_range_start: string
          dimensions: Json | null
          id: string
          integration_id: string | null
          metrics: Json
          raw_data: Json | null
          received_at: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          data_type: string
          date_range_end: string
          date_range_start: string
          dimensions?: Json | null
          id?: string
          integration_id?: string | null
          metrics: Json
          raw_data?: Json | null
          received_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          data_type?: string
          date_range_end?: string
          date_range_start?: string
          dimensions?: Json | null
          id?: string
          integration_id?: string | null
          metrics?: Json
          raw_data?: Json | null
          received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_analytics_data_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_analytics_data_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "brand_analytics_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_analytics_integrations: {
        Row: {
          brand_id: string
          created_at: string | null
          created_by: string | null
          data_sources: Json | null
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          n8n_workflow_id: string | null
          sync_frequency: string | null
          updated_at: string | null
          webhook_secret: string
          webhook_url: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          n8n_workflow_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_secret: string
          webhook_url: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          n8n_workflow_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_secret?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_analytics_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_analytics_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kpis: {
        Row: {
          brand_id: string
          created_at: string | null
          current_value: number
          description: string | null
          display_order: number | null
          id: string
          name: string
          source: string
          target_value: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          current_value?: number
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          source: string
          target_value?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          current_value?: number
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          source?: string
          target_value?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kpis_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active_integrations: string[] | null
          co_owner_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          monthly_budget: number | null
          name: string
          owner_id: string
          slug: string
          status: string
          team_members: string[] | null
          type: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          active_integrations?: string[] | null
          co_owner_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_budget?: number | null
          name: string
          owner_id: string
          slug: string
          status?: string
          team_members?: string[] | null
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          active_integrations?: string[] | null
          co_owner_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_budget?: number | null
          name?: string
          owner_id?: string
          slug?: string
          status?: string
          team_members?: string[] | null
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_co_owner_id_fkey"
            columns: ["co_owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_communications: {
        Row: {
          client_id: string
          content: string | null
          created_at: string
          created_by: string
          direction: string
          id: string
          project_id: string | null
          subject: string | null
          type: string
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string
          created_by: string
          direction?: string
          id?: string
          project_id?: string | null
          subject?: string | null
          type?: string
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          direction?: string
          id?: string
          project_id?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          assigned_manager: string | null
          city: string | null
          company: string | null
          company_revenue: number | null
          contact_person: string | null
          country: string | null
          created_at: string
          data_completeness_score: number | null
          email: string | null
          founded_year: number | null
          hubspot_id: string | null
          hubspot_last_sync: string | null
          hubspot_sync_metadata: Json | null
          hubspot_sync_status: string | null
          id: string
          industry: string | null
          monthly_billing: number | null
          name: string
          notes: string | null
          phone: string | null
          satisfaction_score: number | null
          source: string | null
          state: string | null
          status: string
          team_size: number | null
          total_revenue: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          company_revenue?: number | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          data_completeness_score?: number | null
          email?: string | null
          founded_year?: number | null
          hubspot_id?: string | null
          hubspot_last_sync?: string | null
          hubspot_sync_metadata?: Json | null
          hubspot_sync_status?: string | null
          id?: string
          industry?: string | null
          monthly_billing?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          satisfaction_score?: number | null
          source?: string | null
          state?: string | null
          status?: string
          team_size?: number | null
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          company_revenue?: number | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          data_completeness_score?: number | null
          email?: string | null
          founded_year?: number | null
          hubspot_id?: string | null
          hubspot_last_sync?: string | null
          hubspot_sync_metadata?: Json | null
          hubspot_sync_status?: string | null
          id?: string
          industry?: string | null
          monthly_billing?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          satisfaction_score?: number | null
          source?: string | null
          state?: string | null
          status?: string
          team_size?: number | null
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      code_analysis_results: {
        Row: {
          agent_run_id: string | null
          analysis_type: string
          created_at: string
          file_path: string | null
          findings: Json
          id: string
          repository_id: string
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          agent_run_id?: string | null
          analysis_type: string
          created_at?: string
          file_path?: string | null
          findings?: Json
          id?: string
          repository_id: string
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          agent_run_id?: string | null
          analysis_type?: string
          created_at?: string
          file_path?: string | null
          findings?: Json
          id?: string
          repository_id?: string
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      code_generation_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          framework: string | null
          id: string
          is_active: boolean | null
          language: string | null
          name: string
          template_content: string
          updated_at: string
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name: string
          template_content: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          name?: string
          template_content?: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      code_repositories: {
        Row: {
          analysis_status: string | null
          branch: string | null
          created_at: string
          created_by: string | null
          description: string | null
          framework: string | null
          id: string
          language: string | null
          last_analyzed_at: string | null
          metadata: Json | null
          name: string
          repository_url: string | null
          updated_at: string
        }
        Insert: {
          analysis_status?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          language?: string | null
          last_analyzed_at?: string | null
          metadata?: Json | null
          name: string
          repository_url?: string | null
          updated_at?: string
        }
        Update: {
          analysis_status?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          framework?: string | null
          id?: string
          language?: string | null
          last_analyzed_at?: string | null
          metadata?: Json | null
          name?: string
          repository_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collabai_chats: {
        Row: {
          agent_id: string
          ai_response: string | null
          created_at: string | null
          id: string
          integration_id: string
          status: string | null
          user_prompt: string
        }
        Insert: {
          agent_id: string
          ai_response?: string | null
          created_at?: string | null
          id?: string
          integration_id: string
          status?: string | null
          user_prompt: string
        }
        Update: {
          agent_id?: string
          ai_response?: string | null
          created_at?: string | null
          id?: string
          integration_id?: string
          status?: string | null
          user_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "collabai_chats_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "collabai_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      collabai_integrations: {
        Row: {
          api_key_encrypted: string
          base_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          base_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          base_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_collabai_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          first_name: string | null
          hubspot_id: string | null
          hubspot_last_sync: string | null
          hubspot_sync_status: string | null
          id: string
          is_primary: boolean | null
          job_title: string | null
          last_name: string | null
          lead_status: string | null
          lifecycle_stage: string | null
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          hubspot_id?: string | null
          hubspot_last_sync?: string | null
          hubspot_sync_status?: string | null
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_name?: string | null
          lead_status?: string | null
          lifecycle_stage?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          hubspot_id?: string | null
          hubspot_last_sync?: string | null
          hubspot_sync_status?: string | null
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          last_name?: string | null
          lead_status?: string | null
          lifecycle_stage?: string | null
          phone?: string | null
          title?: string | null
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
      deals: {
        Row: {
          amount: number | null
          client_id: string
          close_date: string | null
          created_at: string
          deal_type: string | null
          hubspot_created_at: string | null
          hubspot_id: string | null
          hubspot_updated_at: string | null
          id: string
          name: string
          pipeline: string | null
          probability: number | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          close_date?: string | null
          created_at?: string
          deal_type?: string | null
          hubspot_created_at?: string | null
          hubspot_id?: string | null
          hubspot_updated_at?: string | null
          id?: string
          name: string
          pipeline?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          close_date?: string | null
          created_at?: string
          deal_type?: string | null
          hubspot_created_at?: string | null
          hubspot_id?: string | null
          hubspot_updated_at?: string | null
          id?: string
          name?: string
          pipeline?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_videos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration: number | null
          error: Json | null
          id: string
          metadata: Json | null
          operation_name: string
          prompt: string
          status: string
          thumbnail_url: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration?: number | null
          error?: Json | null
          id: string
          metadata?: Json | null
          operation_name: string
          prompt: string
          status?: string
          thumbnail_url?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration?: number | null
          error?: Json | null
          id?: string
          metadata?: Json | null
          operation_name?: string
          prompt?: string
          status?: string
          thumbnail_url?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      gohighlevel_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          email: string | null
          id: string
          integration_id: string
          name: string | null
          phone: string | null
          status: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          integration_id: string
          name?: string | null
          phone?: string | null
          status?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          integration_id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gohighlevel_contacts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "gohighlevel_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      gohighlevel_integrations: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ghl_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          external_task_id: string | null
          id: string
          imported_hours: number | null
          last_hours_import: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          external_task_id?: string | null
          id?: string
          imported_hours?: number | null
          last_hours_import?: string | null
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          external_task_id?: string | null
          id?: string
          imported_hours?: number | null
          last_hours_import?: string | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_cost: number | null
          assigned_team: string[] | null
          budget: number | null
          client_id: string
          created_at: string
          deadline: string | null
          description: string | null
          end_date: string | null
          external_project_id: string | null
          id: string
          last_hours_import: string | null
          name: string
          priority: string
          progress: number | null
          project_manager: string | null
          start_date: string | null
          status: string
          tags: string[] | null
          total_logged_hours: number | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_team?: string[] | null
          budget?: number | null
          client_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          external_project_id?: string | null
          id?: string
          last_hours_import?: string | null
          name: string
          priority?: string
          progress?: number | null
          project_manager?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          total_logged_hours?: number | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_team?: string[] | null
          budget?: number | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          external_project_id?: string | null
          id?: string
          last_hours_import?: string | null
          name?: string
          priority?: string
          progress?: number | null
          project_manager?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          total_logged_hours?: number | null
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
      team_daily_summaries: {
        Row: {
          agent_run_id: string | null
          ai_summary: Json
          concerns: string[] | null
          created_at: string | null
          eod_submission_id: string | null
          hours_logged: number | null
          id: string
          key_accomplishments: string[] | null
          productivity_score: number | null
          summary_date: string
          tasks_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_run_id?: string | null
          ai_summary?: Json
          concerns?: string[] | null
          created_at?: string | null
          eod_submission_id?: string | null
          hours_logged?: number | null
          id?: string
          key_accomplishments?: string[] | null
          productivity_score?: number | null
          summary_date: string
          tasks_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_run_id?: string | null
          ai_summary?: Json
          concerns?: string[] | null
          created_at?: string | null
          eod_submission_id?: string | null
          hours_logged?: number | null
          id?: string
          key_accomplishments?: string[] | null
          productivity_score?: number | null
          summary_date?: string
          tasks_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_daily_summaries_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_daily_summaries_eod_submission_id_fkey"
            columns: ["eod_submission_id"]
            isOneToOne: false
            referencedRelation: "team_eod_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_daily_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_eod_submissions: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          submission_date: string
          task_links: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          submission_date: string
          task_links?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          submission_date?: string
          task_links?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_eod_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_brands: {
        Row: {
          access_level: string
          brand_id: string
          can_manage_content: boolean
          can_manage_settings: boolean
          can_manage_team: boolean
          can_view_analytics: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          brand_id: string
          can_manage_content?: boolean
          can_manage_settings?: boolean
          can_manage_team?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          brand_id?: string
          can_manage_content?: boolean
          can_manage_settings?: boolean
          can_manage_team?: boolean
          can_view_analytics?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_brands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          first_name: string | null
          id: string
          is_marketing: boolean | null
          last_name: string | null
          password_hash: string | null
          refresh_token: string | null
          refresh_token_expires_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_marketing?: boolean | null
          last_name?: string | null
          password_hash?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_marketing?: boolean | null
          last_name?: string | null
          password_hash?: string | null
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_brand_access: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_marketing_or_manager: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "manager" | "pm" | "user"
      user_role:
        | "manager"
        | "assistant_manager"
        | "project_coordinator"
        | "content_writer"
        | "seo_specialist"
        | "design_consultant"
        | "marketing_executive"
        | "brand_owner"
        | "team_member"
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
      app_role: ["super_admin", "manager", "pm", "user"],
      user_role: [
        "manager",
        "assistant_manager",
        "project_coordinator",
        "content_writer",
        "seo_specialist",
        "design_consultant",
        "marketing_executive",
        "brand_owner",
        "team_member",
      ],
    },
  },
} as const
