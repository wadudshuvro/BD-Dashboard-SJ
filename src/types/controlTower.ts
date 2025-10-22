export interface ControlTowerLead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  source: 'linkedin' | 'referral' | 'bidding' | 'website' | 'other';
  status: 'cold' | 'warm' | 'hot';
  owner_id?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface ControlTowerWarmLead {
  id: string;
  contact_name: string;
  company: string;
  email: string;
  hubspot_id?: string;
  hubspot_url?: string;
  source: string;
  last_touch?: string;
  next_step?: string;
  owner_id?: string;
  owner_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlTowerDeal {
  id: string;
  deal_name: string;
  client_id?: string;
  client_name?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value?: number;
  owner_id?: string;
  owner_name?: string;
  pm_assigned_id?: string;
  pm_assigned_name?: string;
  status: 'active' | 'won' | 'lost' | 'on_hold';
  close_date?: string;
  created_at: string;
  updated_at: string;
  project_id?: string;
}

export interface ControlTowerClient {
  id: string;
  name: string;
  company: string;
  industry?: string;
  owner_id?: string;
  owner_name?: string;
  active_projects_count: number;
  total_revenue?: number;
  status: 'active' | 'inactive' | 'churned';
  created_at: string;
  updated_at: string;
}

export interface ControlTowerSummary {
  new_leads_count: number;
  warm_leads_count: number;
  active_deals_count: number;
  deals_value_total: number;
  active_clients_count: number;
}

export interface ControlTowerDealEnhanced extends ControlTowerDeal {
  // Client contact info from clients table
  client_email?: string;
  client_phone?: string;
  client_contact_person?: string;
  client_address?: any; // JSONB
  client_industry?: string;
  client_domain?: string;
  
  // Additional deal fields from Control Tower
  hubspot_deal_id?: string;
  hubspot_crm_deal_url?: string;
  dealtype?: string;
  lead_source?: string;
  expected_closing_date?: string;
  potential_amount?: number;
}
