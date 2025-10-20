import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useControlTowerConfig } from './useControlTowerConfig';
import { createControlTowerClient } from '@/integrations/controlTower/client';
import { toast } from 'sonner';

export interface SyncResult {
  synced: number;
  updated: number;
  failed: number;
  errors: string[];
}

export const useSyncControlTowerDeals = () => {
  const queryClient = useQueryClient();
  const { data: config } = useControlTowerConfig();

  const syncDeals = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      if (!config?.url || !config?.anon_key) {
        throw new Error('Control Tower not configured');
      }

      const ctClient = createControlTowerClient(config.url, config.anon_key);
      
      // Fetch active deals from Control Tower
      const { data: ctDeals, error: fetchError } = await ctClient
        .from('deals')
        .select('*')
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      if (!ctDeals || ctDeals.length === 0) {
        return { synced: 0, updated: 0, failed: 0, errors: [] };
      }

      const result: SyncResult = {
        synced: 0,
        updated: 0,
        failed: 0,
        errors: []
      };

      // Sync each deal
      for (const ctDeal of ctDeals) {
        try {
          const dealData = {
            control_tower_id: ctDeal.id,
            title: ctDeal.deal_name || ctDeal.title,
            amount: ctDeal.value || ctDeal.amount,
            stage: ctDeal.stage,
            close_date: ctDeal.close_date,
            control_tower_client_id: ctDeal.client_id,
            control_tower_owner_id: ctDeal.owner_id,
            control_tower_status: ctDeal.status,
            synced_from_control_tower: true,
            last_synced_at: new Date().toISOString()
          };

          // Upsert deal (insert or update based on control_tower_id)
          const { error: upsertError } = await supabase
            .from('deals')
            .upsert(dealData, {
              onConflict: 'control_tower_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            result.failed++;
            result.errors.push(`Deal ${ctDeal.deal_name}: ${upsertError.message}`);
          } else {
            // Check if it was an update or insert
            const { data: existing } = await supabase
              .from('deals')
              .select('id')
              .eq('control_tower_id', ctDeal.id)
              .single();
            
            if (existing) {
              result.updated++;
            } else {
              result.synced++;
            }
          }
        } catch (err) {
          result.failed++;
          result.errors.push(`Deal ${ctDeal.deal_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      if (result.failed > 0) {
        toast.warning(`Sync completed with issues`, {
          description: `Synced: ${result.synced}, Updated: ${result.updated}, Failed: ${result.failed}`
        });
      } else {
        toast.success('Deals synced successfully', {
          description: `Synced: ${result.synced} new deals, Updated: ${result.updated} existing deals`
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Sync failed', {
        description: error.message
      });
    }
  });

  return {
    syncDeals: syncDeals.mutateAsync,
    isSyncing: syncDeals.isPending
  };
};
