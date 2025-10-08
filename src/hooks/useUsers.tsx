import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'super_admin' | 'manager' | 'pm' | 'user';
  status: 'active' | 'inactive' | 'pending';
}

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, status')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return data as User[];
    },
  });
};
