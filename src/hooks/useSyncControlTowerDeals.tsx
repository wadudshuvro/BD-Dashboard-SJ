import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncResult {
  deals: {
    new: number;
    updated: number;
    failed: number;
  };
  clients: {
    new: number;
    updated: number;
  };
  checklists: {
    synced: number;
    failed: number;
  };
  errors: string[];
  duration: number;
}

export const useSyncControlTowerDeals = () => {
  const queryClient = useQueryClient();

  const syncDeals = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-deals');

      if (error) {
        throw new Error(error.message || 'Failed to sync deals');
      }

      return data as SyncResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      const summary = [
        `✅ Deals: ${result.deals.new} new, ${result.deals.updated} updated`,
        `👥 Clients: ${result.clients.new} new, ${result.clients.updated} updated`,
        `📋 Checklists: ${result.checklists.synced} items synced`,
        `⏱️ Completed in ${(result.duration / 1000).toFixed(1)}s`
      ];
      
      const totalFailed = result.deals.failed + result.checklists.failed;
      
      if (totalFailed > 0) {
        summary.push(`⚠️ Failed: ${totalFailed} items`);
        toast.warning('Sync completed with issues', {
          description: summary.join('\n')
        });
      } else {
        toast.success('Pull sync completed successfully', {
          description: summary.join('\n')
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
