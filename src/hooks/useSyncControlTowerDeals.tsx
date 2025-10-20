import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SyncResult {
  synced: number;
  updated: number;
  failed: number;
  errors: string[];
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
