import { useQuery } from '@tanstack/react-query';
import { controlTowerClient } from '@/integrations/controlTower/client';
import type {
  ControlTowerLead,
  ControlTowerWarmLead,
  ControlTowerDeal,
  ControlTowerClient,
  ControlTowerSummary
} from '@/types/controlTower';

// Hook for fetching leads
export const useControlTowerLeads = () => {
  return useQuery({
    queryKey: ['control-tower-leads'],
    queryFn: async (): Promise<ControlTowerLead[]> => {
      const { data, error } = await controlTowerClient
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching warm leads (HubSpot synced)
export const useControlTowerWarmLeads = () => {
  return useQuery({
    queryKey: ['control-tower-warm-leads'],
    queryFn: async (): Promise<ControlTowerWarmLead[]> => {
      const { data, error } = await controlTowerClient
        .from('hubspot_leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for fetching deals
export const useControlTowerDeals = () => {
  return useQuery({
    queryKey: ['control-tower-deals'],
    queryFn: async (): Promise<ControlTowerDeal[]> => {
      const { data, error } = await controlTowerClient
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
  });
};

// Hook for fetching clients
export const useControlTowerClients = () => {
  return useQuery({
    queryKey: ['control-tower-clients'],
    queryFn: async (): Promise<ControlTowerClient[]> => {
      const { data, error } = await controlTowerClient
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
  });
};

// Hook for fetching summary stats
export const useControlTowerSummary = () => {
  return useQuery({
    queryKey: ['control-tower-summary'],
    queryFn: async (): Promise<ControlTowerSummary> => {
      // Fetch counts from multiple tables
      const [leadsResult, warmLeadsResult, dealsResult, clientsResult] = await Promise.all([
        controlTowerClient.from('leads').select('id', { count: 'exact', head: true }),
        controlTowerClient.from('hubspot_leads').select('id', { count: 'exact', head: true }),
        controlTowerClient.from('deals').select('id, value').eq('status', 'active'),
        controlTowerClient.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
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
  });
};
