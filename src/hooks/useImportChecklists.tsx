import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChecklistImportResult {
  synced: number;
  skipped: number;
  failed: number;
  duration: number;
  errors: string[];
}

export const useImportChecklists = () => {
  const queryClient = useQueryClient();

  const importChecklists = useMutation({
    mutationFn: async (dealId?: string): Promise<ChecklistImportResult> => {
      const { data, error } = await supabase.functions.invoke('import-checklist-only', {
        body: dealId ? { dealId } : {},
      });

      if (error) {
        throw new Error(error.message || 'Failed to import checklists');
      }

      return data as ChecklistImportResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['deal-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      
      const summary = [
        `📋 ${result.synced} items imported`,
        `⏭️ ${result.skipped} skipped`,
        `⏱️ ${(result.duration / 1000).toFixed(1)}s`
      ];
      
      if (result.failed > 0) {
        summary.push(`⚠️ ${result.failed} failed`);
        toast.warning('Checklist import completed with issues', {
          description: summary.join('\n')
        });
      } else {
        toast.success('Checklists imported successfully', {
          description: summary.join('\n')
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Import failed', {
        description: error.message
      });
    }
  });

  return {
    importChecklists: importChecklists.mutateAsync,
    isImporting: importChecklists.isPending
  };
};
