export type BrandType = 'internal' | 'client';

export type AccessLevel = 'owner' | 'manager' | 'member' | 'viewer';

export type KPIType = 'number' | 'percentage' | 'currency';

export type IntegrationType = 
  | 'hubspot' 
  | 'google_analytics' 
  | 'linkedin' 
  | 'gohighlevel' 
  | 'perplexity' 
  | 'exa' 
  | 'custom';

export type KPISource = 
  | 'manual' 
  | 'hubspot' 
  | 'google_analytics' 
  | 'linkedin' 
  | 'gohighlevel' 
  | 'custom';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  type: BrandType;
  description?: string;
  owner_id?: string;
  is_active: boolean;
  monthly_budget?: number;
  logo_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserBrand {
  id: string;
  user_id: string;
  brand_id: string;
  access_level: AccessLevel;
  can_view_kpis: boolean;
  can_edit_kpis: boolean;
  can_manage_team: boolean;
  can_edit_settings: boolean;
  created_at: string;
}

export interface BrandKPI {
  id: string;
  brand_id: string;
  name: string;
  description?: string;
  kpi_type: KPIType;
  current_value?: number;
  target_value?: number;
  source: KPISource;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BrandIntegration {
  id: string;
  brand_id: string;
  integration_type: IntegrationType;
  is_enabled: boolean;
  config?: Record<string, any>;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandWithKPIs extends Brand {
  kpis: BrandKPI[];
  access_level?: AccessLevel;
  can_view_kpis?: boolean;
  can_edit_kpis?: boolean;
  can_manage_team?: boolean;
  can_edit_settings?: boolean;
}

export interface BrandWithDetails extends BrandWithKPIs {
  team_members: Array<{
    id: string;
    access_level: AccessLevel;
    profiles: {
      id: string;
      email: string;
      full_name: string;
    };
  }>;
  integrations: BrandIntegration[];
}

export interface CreateBrandData {
  name: string;
  type: BrandType;
  description?: string;
  owner_id?: string;
  monthly_budget?: number;
  logo_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBrandData extends Partial<CreateBrandData> {
  id: string;
}

export interface CreateKPIData {
  brand_id: string;
  name: string;
  description?: string;
  kpi_type: KPIType;
  current_value?: number;
  target_value?: number;
  source?: KPISource;
  display_order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateKPIData extends Partial<CreateKPIData> {
  id: string;
}

export interface BrandFilters {
  search?: string;
  type?: BrandType;
  is_active?: boolean;
}
