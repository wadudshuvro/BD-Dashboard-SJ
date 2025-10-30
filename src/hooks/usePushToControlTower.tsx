import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PushResult {
  success: boolean;
  deal_fields: {
    synced: number;
    failed: number;
  };
  errors?: string[];
}

export const usePushToControlTower = (dealId?: string) => {
  const pushDeal = useMutation({
    mutationFn: async (): Promise<PushResult> => {
      const { data, error } = await supabase.functions.invoke('push-to-control-tower', {
        body: { 
          entity_type: 'deal_fields',
          deal_id: dealId 
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to push deal to Control Tower');
      }

      return data as PushResult;
    },
    onSuccess: (result) => {
      if (result.deal_fields.synced > 0) {
        toast.success('Deal pushed successfully', {
          description: `✅ ${result.deal_fields.synced} deal field(s) synced to Control Tower`
        });
      } else if (result.deal_fields.failed > 0) {
        toast.error('Push failed', {
          description: result.errors?.join(', ') || 'Failed to push deal fields'
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Push failed', {
        description: error.message
      });
    }
  });

  return {
    pushDeal: pushDeal.mutateAsync,
    isPushing: pushDeal.isPending
  };
};
