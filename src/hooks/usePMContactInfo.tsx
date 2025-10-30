import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PMContactInfo {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  source: 'local' | 'control_tower';
}

export function usePMContactInfo(pmId?: string | null, pmControlTowerId?: string | null) {
  return useQuery({
    queryKey: ['pm-contact-info', pmId, pmControlTowerId],
    queryFn: async (): Promise<PMContactInfo | null> => {
      // First try to get from local profiles
      if (pmId) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', pmId)
          .single();

        if (!error && profile) {
          return {
            id: profile.id,
            full_name: profile.full_name || profile.email || 'Unknown',
            email: profile.email,
            phone: undefined,
            source: 'local',
          };
        }
      }

      // Then try from Control Tower employees
      if (pmControlTowerId) {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('id, full_name, email, phone, control_tower_id')
          .eq('control_tower_id', pmControlTowerId)
          .single();

        if (!error && employee) {
          return {
            id: employee.id,
            full_name: employee.full_name,
            email: employee.email || undefined,
            phone: employee.phone || undefined,
            source: 'control_tower',
          };
        }
      }

      return null;
    },
    enabled: !!(pmId || pmControlTowerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
