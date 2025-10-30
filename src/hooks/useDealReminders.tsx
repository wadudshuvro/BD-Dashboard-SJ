import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DealReminder {
  id: string;
  deal_id: string;
  recipient_id?: string;
  recipient_email: string;
  reminder_type: string;
  reminder_date: string;
  message?: string;
  sent_at?: string;
  created_by?: string;
  created_at: string;
}

export function useDealReminders(dealId: string) {
  return useQuery({
    queryKey: ['deal-reminders', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_reminders')
        .select('*')
        .eq('deal_id', dealId)
        .order('reminder_date', { ascending: false });

      if (error) throw error;
      return data as DealReminder[];
    },
    enabled: !!dealId,
  });
}

export function useScheduleReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reminder: {
      deal_id: string;
      recipient_email: string;
      recipient_id?: string;
      reminder_type: string;
      reminder_date: string;
      message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deal_reminders')
        .insert({
          ...reminder,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-reminders', variables.deal_id] });
      toast.success('Reminder scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule reminder: ${error.message}`);
    },
  });
}
