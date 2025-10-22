import { useQuery } from '@tanstack/react-query';
import { createControlTowerClient } from '@/integrations/controlTower/client';
import { useControlTowerConfig } from './useControlTowerConfig';
import type {
  ControlTowerLead,
  ControlTowerWarmLead,
  ControlTowerDeal,
  ControlTowerClient,
  ControlTowerSummary
} from '@/types/controlTower';

// Hook for fetching leads
export const useControlTowerLeads = () => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-leads'],
    queryFn: async (): Promise<ControlTowerLead[]> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const client = createControlTowerClient(config.url, config.anon_key);
      const { data, error } = await client
        .from('Lead')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching warm leads (HubSpot synced)
export const useControlTowerWarmLeads = () => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-warm-leads'],
    queryFn: async (): Promise<ControlTowerWarmLead[]> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const client = createControlTowerClient(config.url, config.anon_key);
      const { data, error } = await client
        .from('HubSpot_Leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching deals
export const useControlTowerDeals = () => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-deals'],
    queryFn: async (): Promise<ControlTowerDeal[]> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const client = createControlTowerClient(config.url, config.anon_key);
      const { data, error } = await client
        .from('Deal')
        .select(`
          *,
          client:clients!client_id(name)
        `)
        .order('createdate', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching clients
export const useControlTowerClients = (page: number = 1, limit: number = 25) => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-clients', page, limit],
    queryFn: async () => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const client = createControlTowerClient(config.url, config.anon_key);
      const { data, error, count } = await client
        .from('clients')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        data: (data || []) as ControlTowerClient[],
        total: count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching summary stats
export const useControlTowerSummary = () => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-summary'],
    queryFn: async (): Promise<ControlTowerSummary> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const client = createControlTowerClient(config.url, config.anon_key);
      
      // Fetch counts from multiple tables
      const [leadsResult, warmLeadsResult, dealsResult, clientsResult] = await Promise.all([
        client.from('Lead').select('id', { count: 'exact', head: true }),
        client.from('HubSpot_Leads').select('id', { count: 'exact', head: true }),
        client.from('Deal').select('id, amount').eq('dealstatus', 'active'),
        client.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const dealsValue = dealsResult.data?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

      return {
        new_leads_count: leadsResult.count || 0,
        warm_leads_count: warmLeadsResult.count || 0,
        active_deals_count: dealsResult.data?.length || 0,
        deals_value_total: dealsValue,
        active_clients_count: clientsResult.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching deals by stage
export const useControlTowerDealsByStage = (
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation',
  page: number = 1,
  limit: number = 25
) => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-deals-by-stage', stage, page, limit],
    queryFn: async () => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const client = createControlTowerClient(config.url, config.anon_key);
      
      const { data, error, count } = await client
        .from('Deal')
        .select(`
          *,
          client:clients!client_id (
            id,
            name,
            contact_email,
            contact_phone,
            contact_person,
            address,
            industry,
            domain
          )
        `, { count: 'exact' })
        .eq('dealstage', stage)
        .order('createdate', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      // Flatten client data into deal object
      const deals = (data || []).map((deal: any) => ({
        id: deal.id,
        deal_name: deal.dealname || '',
        client_id: deal.client_id,
        client_name: deal.client?.name || deal.clientCompanyName || '',
        stage: deal.dealstage,
        value: deal.amount || deal.potential_amount,
        owner_id: deal.actual_deal_owner_id,
        owner_name: deal.actual_deal_owner_name || `${deal.dealOwnerFirstName || ''} ${deal.dealOwnerLastName || ''}`.trim(),
        pm_assigned_id: deal.pm_assigned_id,
        pm_assigned_name: deal.pm_assigned_name,
        status: 'active',
        close_date: deal.expected_closing_date || deal.closedate,
        created_at: deal.createdate || new Date().toISOString(),
        updated_at: deal.updated_at || new Date().toISOString(),
        project_id: deal.project_id,
        
        // Client contact info
        client_email: deal.client?.contact_email || deal.clientEmail,
        client_phone: deal.client?.contact_phone || deal.clientPhone,
        client_contact_person: deal.client?.contact_person || `${deal.clientFirstName || ''} ${deal.clientLastName || ''}`.trim(),
        client_address: deal.client?.address,
        client_industry: deal.client?.industry,
        client_domain: deal.client?.domain || deal.clientWebsite,
        
        // Additional deal fields
        hubspot_deal_id: deal.hubspot_deal_id,
        hubspot_crm_deal_url: deal.hubspot_crm_deal_url,
        dealtype: deal.dealtype,
        lead_source: deal.lead_source,
        expected_closing_date: deal.expected_closing_date,
        potential_amount: deal.potential_amount,
      }));
      
      return {
        data: deals,
        total: count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};
