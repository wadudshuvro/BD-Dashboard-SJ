import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { DEAL_STAGES, DEAL_STATUSES, DealStage, DealStatus } from '@/lib/dealStages';

export interface Deal {
  id: string;
  title: string;
  amount?: number | null;
  stage?: DealStage | null;
  status?: DealStatus | null;
  probability?: number | null;
  client_id?: string | null;
  owner_id?: string | null;
  pm_assigned_id?: string | null;
  close_date?: string | null;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  synced_from_control_tower?: boolean;
  last_synced_at?: string | null;
  control_tower_id?: string | null;
  control_tower_status?: string | null;
  control_tower_client_id?: string | null;
  control_tower_owner_id?: string | null;
  client?: {
    id: string;
    name: string | null;
  } | null;
}

export interface DealStats {
  totalValue: number;
  activeValue: number;
  averageDealSize: number;
  winRate: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
}

export interface DealFilters {
  stages?: DealStage[];
  statuses?: DealStatus[];
  ownerIds?: string[];
  pmIds?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  syncedOnly?: boolean;
  search?: string;
}

export interface CreateDealData {
  title: string;
  amount?: number | null;
  stage?: DealStage | null;
  status?: DealStatus | null;
  probability?: number | null;
  client_id?: string | null;
  owner_id?: string | null;
  pm_assigned_id?: string | null;
  close_date?: string | null;
  notes?: string | null;
  synced_from_control_tower?: boolean;
  control_tower_id?: string | null;
  control_tower_status?: string | null;
  control_tower_client_id?: string | null;
  control_tower_owner_id?: string | null;
}

export interface UpdateDealData extends Partial<CreateDealData> {}

interface UseDealsOptions {
  clientId?: string;
  filters?: DealFilters;
  sortBy?: keyof Deal | 'created_at' | 'amount' | 'probability';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  enabled?: boolean;
}

interface UseDealsReturn {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  stats: DealStats;
  createDeal: (dealData: CreateDealData) => Promise<Deal>;
  updateDeal: (dealId: string, dealData: UpdateDealData) => Promise<Deal>;
  deleteDeal: (dealId: string) => Promise<void>;
  assignProjectManager: (dealId: string, pmId: string | null) => Promise<Deal>;
  updateDealStatus: (dealId: string, status: DealStatus) => Promise<Deal>;
  getDealById: (dealId: string) => Promise<Deal | null>;
  refetch: () => Promise<void>;
}

function calculateStats(records: Deal[]): DealStats {
  const totalDeals = records.length;
  const totalValue = records.reduce((sum, deal) => sum + (deal.amount ?? 0), 0);
  const activeDeals = records.filter((deal) => deal.status === DEAL_STATUSES.ACTIVE);
  const wonDeals = records.filter((deal) => deal.status === DEAL_STATUSES.WON);
  const lostDeals = records.filter((deal) => deal.status === DEAL_STATUSES.LOST);
  const dealsWithAmount = records.filter((deal) => typeof deal.amount === 'number' && !Number.isNaN(deal.amount ?? NaN));
  const averageDealSize = dealsWithAmount.length > 0 ? totalValue / dealsWithAmount.length : 0;
  const winRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const conversionRate = wonDeals.length + lostDeals.length > 0
    ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
    : 0;

  return {
    totalValue,
    activeValue: activeDeals.reduce((sum, deal) => sum + (deal.amount ?? 0), 0),
    averageDealSize,
    winRate,
    conversionRate,
    totalDeals,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
  };
}

export function useDeals(options: UseDealsOptions = {}): UseDealsReturn {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DealStats>(calculateStats([]));

  const {
    clientId,
    filters,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search,
    enabled = true,
  } = options;

  const fetchDeals = useCallback(async () => {
    if (!user?.id || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query: any = supabase
        .from('deals')
        .select(
          `
          *,
          client:clients(id, name)
        `
        )
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const parsedFilters = filters ?? {};
      const searchTerm = search ?? parsedFilters.search;

      if (parsedFilters.stages?.length) {
        query = query.in('stage', parsedFilters.stages);
      }

      if (parsedFilters.statuses?.length) {
        query = query.in('status', parsedFilters.statuses);
      }

      if (parsedFilters.ownerIds?.length) {
        query = query.in('owner_id', parsedFilters.ownerIds);
      }

      if (parsedFilters.pmIds?.length) {
        query = query.in('pm_assigned_id', parsedFilters.pmIds);
      }

      if (parsedFilters.syncedOnly) {
        query = query.eq('synced_from_control_tower', true);
      }

      if (parsedFilters.dateFrom) {
        query = query.gte('close_date', parsedFilters.dateFrom);
      }

      if (parsedFilters.dateTo) {
        query = query.lte('close_date', parsedFilters.dateTo);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const dealData = (data || []) as Deal[];
      setDeals(dealData);
      setStats(calculateStats(dealData));
    } catch (err) {
      console.error('Error fetching deals:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch deals';
      setError(message);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [user?.id, enabled, clientId, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const createDeal = useCallback(async (dealData: CreateDealData): Promise<Deal> => {
    if (!user?.id) throw new Error('User not authenticated');

    const payload: CreateDealData = {
      status: DEAL_STATUSES.ACTIVE,
      stage: DEAL_STAGES.PROSPECTING,
      ...dealData,
    };

    const { data, error } = await supabase
      .from('deals')
      .insert([payload])
      .select(
        `
        *,
        client:clients(id, name)
      `
      )
      .single();

    if (error) throw error;

    toast.success('Deal created successfully');
    await fetchDeals();
    return data as Deal;
  }, [user?.id, fetchDeals]);

  const updateDeal = useCallback(async (dealId: string, dealData: UpdateDealData): Promise<Deal> => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .update(dealData)
      .eq('id', dealId)
      .select(
        `
        *,
        client:clients(id, name)
      `
      )
      .single();

    if (error) throw error;

    toast.success('Deal updated successfully');
    await fetchDeals();
    return data as Deal;
  }, [user?.id, fetchDeals]);

  const deleteDeal = useCallback(async (dealId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) throw error;

    toast.success('Deal deleted successfully');
    await fetchDeals();
  }, [user?.id, fetchDeals]);

  const assignProjectManager = useCallback(async (dealId: string, pmId: string | null): Promise<Deal> => {
    return updateDeal(dealId, { pm_assigned_id: pmId });
  }, [updateDeal]);

  const updateDealStatus = useCallback(async (dealId: string, status: DealStatus): Promise<Deal> => {
    const updates: UpdateDealData = { status };

    if (status === DEAL_STATUSES.WON) {
      updates.stage = DEAL_STAGES.CLOSED_WON;
    }

    if (status === DEAL_STATUSES.LOST) {
      updates.stage = DEAL_STAGES.CLOSED_LOST;
    }

    return updateDeal(dealId, updates);
  }, [updateDeal]);

  const getDealById = useCallback(async (dealId: string): Promise<Deal | null> => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('deals')
      .select(
        `
        *,
        client:clients(id, name)
      `
      )
      .eq('id', dealId)
      .maybeSingle();

    if (error) throw error;
    return (data as Deal) ?? null;
  }, [user?.id]);

  return {
    deals,
    loading,
    error,
    stats,
    createDeal,
    updateDeal,
    deleteDeal,
    assignProjectManager,
    updateDealStatus,
    getDealById,
    refetch: fetchDeals,
  };
}

export type { DealStage, DealStatus };

// Hook for fetching local deals by stage (for pipeline pages)
export function useLocalDealsByStage(
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'new',
  page: number = 1,
  limit: number = 25
) {
  const { user } = useAuth();
  const [data, setData] = useState<{ data: any[]; total: number }>({ data: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        // Fetch deals without resource embedding to avoid foreign key cache issues
        const { data: dealsData, error, count } = await supabase
          .from('deals')
          .select('*', { count: 'exact' })
          .eq('stage', stage)
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        if (!dealsData || dealsData.length === 0) {
          setData({ data: [], total: count || 0 });
          setIsLoading(false);
          return;
        }

        // Fetch related data separately
        const clientIds = [...new Set(dealsData.map(d => d.client_id).filter(Boolean))];
        const ownerIds = [...new Set(dealsData.map(d => d.owner_id).filter(Boolean))];
        const pmIds = [...new Set(dealsData.map(d => d.pm_assigned_id).filter(Boolean))];

        const [clientsRes, ownersRes, pmsRes] = await Promise.all([
          clientIds.length > 0 
            ? supabase.from('clients').select('id, name, email, phone, contact_person, company').in('id', clientIds)
            : Promise.resolve({ data: [] }),
          ownerIds.length > 0
            ? supabase.from('users').select('id, first_name, last_name').in('id', ownerIds)
            : Promise.resolve({ data: [] }),
          pmIds.length > 0
            ? supabase.from('users').select('id, first_name, last_name').in('id', pmIds)
            : Promise.resolve({ data: [] })
        ]);

        // Create lookup maps
        const clientsMap = new Map<string, any>(clientsRes.data?.map(c => [c.id, c] as [string, any]) || []);
        const usersMap = new Map<string, any>([
          ...(ownersRes.data?.map(u => [u.id, u] as [string, any]) || []),
          ...(pmsRes.data?.map(u => [u.id, u] as [string, any]) || [])
        ]);
        
        // Transform to match expected format with related data
        const deals = dealsData.map((deal: any) => {
          const client = deal.client_id ? clientsMap.get(deal.client_id) : null;
          const owner = deal.owner_id ? usersMap.get(deal.owner_id) : null;
          const pm = deal.pm_assigned_id ? usersMap.get(deal.pm_assigned_id) : null;

          return {
            id: deal.id,
            deal_name: deal.title,
            client_id: deal.client_id,
            client_name: (client as any)?.name || (client as any)?.company || '-',
            client_email: (client as any)?.email || '-',
            client_phone: (client as any)?.phone || '-',
            client_contact_person: (client as any)?.contact_person || '-',
            value: deal.amount,
            owner_id: deal.owner_id,
            owner_name: owner ? `${(owner as any).first_name} ${(owner as any).last_name}` : '-',
            pm_assigned_id: deal.pm_assigned_id,
            pm_assigned_name: pm ? `${(pm as any).first_name} ${(pm as any).last_name}` : '-',
            stage: deal.stage,
            close_date: deal.close_date,
            created_at: deal.created_at,
            control_tower_id: deal.control_tower_id,
            synced_from_control_tower: deal.synced_from_control_tower,
            lead_source: deal.control_tower_status || '-',
            hubspot_crm_deal_url: deal.control_tower_id ? `https://app.hubspot.com/contacts/deal/${deal.control_tower_id}` : null,
          };
        });
        
        setData({
          data: deals,
          total: count || 0,
        });
      } catch (error) {
        console.error('Error fetching deals by stage:', error);
        toast.error('Failed to load deals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, stage, page, limit]);

  return { data, isLoading };
}
