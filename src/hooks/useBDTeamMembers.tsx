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
      try {
        // Fetch all users with their roles (if they have any)
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            avatar_url,
            user_roles(role)
          `)
          .order('full_name');

        if (error) {
          console.error('Error fetching BD team members:', error);
          throw new Error(error.message);
        }

        if (!data) {
          console.warn('No profiles data returned');
          return [];
        }

        const members = data.map((member: any) => {
          // Get the role from user_roles if it exists
          const role = Array.isArray(member.user_roles) && member.user_roles.length > 0
            ? member.user_roles[0].role
            : 'team_member';

          return {
            id: member.id,
            full_name: member.full_name || member.email,
            email: member.email,
            avatar_url: member.avatar_url,
            role: role,
          };
        }) as BDTeamMember[];

        console.log(`Fetched ${members.length} team members for assignee dropdown`);
        return members;
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2, // Retry failed requests twice
  });
}
