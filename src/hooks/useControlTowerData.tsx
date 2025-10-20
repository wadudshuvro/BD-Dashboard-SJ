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
        .from('leads')
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
        .from('hubspot_leads')
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
        .from('deals')
        .select(`
          *,
          client:clients(name),
          project:projects(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!config?.url && !!config?.anon_key && config?.is_active,
  });
};

// Hook for fetching clients
export const useControlTowerClients = () => {
  const { data: config } = useControlTowerConfig();
  
  return useQuery({
    queryKey: ['control-tower-clients'],
    queryFn: async (): Promise<ControlTowerClient[]> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }
      
      const client = createControlTowerClient(config.url, config.anon_key);
      const { data, error } = await client
        .from('clients')
        .select(`
          *,
          projects:projects(count)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
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
        client.from('leads').select('id', { count: 'exact', head: true }),
        client.from('hubspot_leads').select('id', { count: 'exact', head: true }),
        client.from('deals').select('id, value').eq('status', 'active'),
        client.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      const dealsValue = dealsResult.data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

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
