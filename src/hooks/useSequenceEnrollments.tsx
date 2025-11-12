import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnrollmentFilters {
  sequenceId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useSequenceEnrollments(filters?: EnrollmentFilters) {
  return useQuery({
    queryKey: ['sequence-enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('contact_sequence_enrollments')
        .select(`
          *,
          contact:campaign_contacts(
            id,
            contact_name,
            contact_email,
            contact_company,
            status
          ),
          sequence:campaign_sequences(
            id,
            name,
            status
          ),
          current_step:sequence_steps(
            id,
            step_order,
            channel,
            content_template
          )
        `)
        .order('enrolled_at', { ascending: false });

      if (filters?.sequenceId) {
        query = query.eq('sequence_id', filters.sequenceId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('enrolled_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('enrolled_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}

export function useSequenceMetrics(sequenceId?: string) {
  return useQuery({
    queryKey: ['sequence-metrics', sequenceId],
    queryFn: async () => {
      let query = supabase
        .from('contact_sequence_enrollments')
        .select('*');

      if (sequenceId) {
        query = query.eq('sequence_id', sequenceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data?.length || 0;
      const active = data?.filter(e => e.status === 'active').length || 0;
      const completed = data?.filter(e => e.status === 'completed').length || 0;
      const failed = data?.filter(e => e.status === 'failed').length || 0;
      const paused = data?.filter(e => e.status === 'paused').length || 0;

      const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

      return {
        total,
        active,
        completed,
        failed,
        paused,
        successRate,
      };
    },
  });
}
