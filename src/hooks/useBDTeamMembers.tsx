import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BDTeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

export function useBDTeamMembers() {
  return useQuery({
    queryKey: ['bd-team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          user_roles!inner(role)
        `)
        .in('user_roles.role', ['super_admin', 'admin', 'manager'])
        .order('full_name');

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []).map((member: any) => ({
        id: member.id,
        full_name: member.full_name || member.email,
        email: member.email,
        avatar_url: member.avatar_url,
        role: member.user_roles?.role || 'unknown',
      })) as BDTeamMember[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
