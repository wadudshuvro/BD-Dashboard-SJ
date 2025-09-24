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
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          monthly_budget: number | null
          name: string
          owner_id: string | null
          slug: string
          status: string
          team_members: string[] | null
          type: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          active_integrations?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_budget?: number | null
          name: string
          owner_id?: string | null
          slug: string
          status?: string
          team_members?: string[] | null
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          active_integrations?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_budget?: number | null
          name?: string
          owner_id?: string | null
          slug?: string
          status?: string
          team_members?: string[] | null
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
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
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          phone: string | null
          satisfaction_score: number | null
          status: string
          total_revenue: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          satisfaction_score?: number | null
          status?: string
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          satisfaction_score?: number | null
          status?: string
          total_revenue?: number | null
          updated_at?: string
          website?: string | null
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
        Relationships: []
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
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          password_hash: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          password_hash: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          password_hash?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
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
