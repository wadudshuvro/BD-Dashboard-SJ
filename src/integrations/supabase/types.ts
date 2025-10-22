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
          generated_tasks: Json | null
          id: string
          input: Json | null
          output: Json | null
          started_at: string
          status: string | null
          title: string | null
        }
        Insert: {
          agent_id?: string | null
          ai_summary?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          generated_tasks?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string
          status?: string | null
          title?: string | null
        }
        Update: {
          agent_id?: string | null
          ai_summary?: Json | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          error?: string | null
          generated_tasks?: Json | null
          id?: string
          input?: Json | null
          output?: Json | null
          started_at?: string
          status?: string | null
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
          config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
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
          name: string
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          stage: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          stage?: string
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
          email: string | null
          employee_count: number | null
          hubspot_id: string | null
          id: string
          industry: string | null
          last_contact_date: string | null
          name: string
          notes: string | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          revenue: number | null
          state: string | null
          status: string | null
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
          email?: string | null
          employee_count?: number | null
          hubspot_id?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          revenue?: number | null
          state?: string | null
          status?: string | null
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
          email?: string | null
          employee_count?: number | null
          hubspot_id?: string | null
          id?: string
          industry?: string | null
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          revenue?: number | null
          state?: string | null
          status?: string | null
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
      deal_checklist_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
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
          client_id: string | null
          close_date: string | null
          control_tower_client_id: string | null
          control_tower_id: string | null
          control_tower_metadata: Json | null
          control_tower_owner_id: string | null
          control_tower_status: string | null
          created_at: string
          dealtype: string | null
          expected_closing_date: string | null
          external_links: Json | null
          hubspot_crm_deal_url: string | null
          hubspot_deal_id: string | null
          id: string
          last_activity_by: string | null
          last_activity_date: string | null
          last_synced_at: string | null
          lead_source: string | null
          notes: string | null
          owner_id: string | null
          pm_assigned_id: string | null
          potential_amount: number | null
          priority: string | null
          probability: number | null
          stage: string | null
          synced_from_control_tower: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          close_date?: string | null
          control_tower_client_id?: string | null
          control_tower_id?: string | null
          control_tower_metadata?: Json | null
          control_tower_owner_id?: string | null
          control_tower_status?: string | null
          created_at?: string
          dealtype?: string | null
          expected_closing_date?: string | null
          external_links?: Json | null
          hubspot_crm_deal_url?: string | null
          hubspot_deal_id?: string | null
          id?: string
          last_activity_by?: string | null
          last_activity_date?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          notes?: string | null
          owner_id?: string | null
          pm_assigned_id?: string | null
          potential_amount?: number | null
          priority?: string | null
          probability?: number | null
          stage?: string | null
          synced_from_control_tower?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          close_date?: string | null
          control_tower_client_id?: string | null
          control_tower_id?: string | null
          control_tower_metadata?: Json | null
          control_tower_owner_id?: string | null
          control_tower_status?: string | null
          created_at?: string
          dealtype?: string | null
          expected_closing_date?: string | null
          external_links?: Json | null
          hubspot_crm_deal_url?: string | null
          hubspot_deal_id?: string | null
          id?: string
          last_activity_by?: string | null
          last_activity_date?: string | null
          last_synced_at?: string | null
          lead_source?: string | null
          notes?: string | null
          owner_id?: string | null
          pm_assigned_id?: string | null
          potential_amount?: number | null
          priority?: string | null
          probability?: number | null
          stage?: string | null
          synced_from_control_tower?: boolean | null
          tags?: string[] | null
          title?: string
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
      ],
    },
  },
} as const
