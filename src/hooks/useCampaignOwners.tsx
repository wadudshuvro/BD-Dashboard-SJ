import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignOwner {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

export function useCampaignOwners() {
  return useQuery({
    queryKey: ['campaign-owners'],
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

      return (data ?? []).map((owner: any) => ({
        id: owner.id,
        full_name: owner.full_name || owner.email,
        email: owner.email,
        avatar_url: owner.avatar_url,
        role: owner.user_roles?.role || 'unknown',
      })) as CampaignOwner[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
