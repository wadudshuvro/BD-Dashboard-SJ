import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSendPMEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      recipientEmail,
      recipientName,
      subject,
      message,
      dealTitle,
      dealUrl,
    }: {
      dealId: string;
      recipientEmail: string;
      recipientName: string;
      subject: string;
      message: string;
      dealTitle?: string;
      dealUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-pm-email', {
        body: {
          dealId,
          recipientEmail,
          recipientName,
          subject,
          message,
          dealTitle,
          dealUrl,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-comments', variables.dealId] });
      toast.success('Email sent successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });
}
