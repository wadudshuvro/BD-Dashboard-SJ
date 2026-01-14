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
        // Fetch all users from profiles table (without user_roles to avoid relationship errors)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .order('full_name');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw new Error(profilesError.message);
        }

        if (!profilesData || profilesData.length === 0) {
          console.warn('No profiles data returned');
          return [];
        }

        // Try to fetch roles separately if the table exists
        let rolesMap: Record<string, string> = {};
        try {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

          if (!rolesError && rolesData) {
            rolesMap = rolesData.reduce((acc, r: any) => {
              acc[r.user_id] = r.role;
              return acc;
            }, {} as Record<string, string>);
          }
        } catch (roleError) {
          console.warn('user_roles table not available, assigning default role');
        }

        const members = profilesData.map((member: any) => ({
          id: member.id,
          full_name: member.full_name || member.email || 'Unknown User',
          email: member.email,
          avatar_url: member.avatar_url,
          role: rolesMap[member.id] || 'team_member',
        })) as BDTeamMember[];

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
