import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveIntegration, fetchAgentsByIntegration, syncAgents } from "./api";
import { useAuth } from "@/hooks/useAuth";

export function useCollabAIIntegration() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collab:integration", user?.id],
    queryFn: async () => (user ? getActiveIntegration(user.id) : null),
    enabled: !!user
  });
}

export function useCollabAIAgents(integrationId?: string) {
  return useQuery({
    queryKey: ["collab:agents", integrationId],
    queryFn: async () => (integrationId ? fetchAgentsByIntegration(integrationId) : []),
    enabled: !!integrationId,
    staleTime: 5 * 60 * 1000 // 5 minutes - data is now local
  });
}

export function useSyncCollabAIAgents() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ integrationId }: { integrationId: string }) =>
      syncAgents(integrationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['collab:agents', variables.integrationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['collab:integration'] 
      });
    }
  });
}