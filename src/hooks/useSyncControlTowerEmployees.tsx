import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSyncControlTowerEmployees() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-control-tower-employees');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Employee sync complete: ${data.synced} new, ${data.updated} updated`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync employees: ${error.message}`);
    },
  });
}
