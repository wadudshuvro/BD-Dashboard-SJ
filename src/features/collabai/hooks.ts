import { useQuery, useMutation } from "@tanstack/react-query";
import { getActiveIntegration, fetchAgentsByIntegration, chatWithAgent } from "./api";
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
    enabled: !!integrationId
  });
}

export function useCollabAIChat() {
  return useMutation({
    mutationFn: ({ integrationId, agentId, message }: { integrationId: string; agentId: string; message: string }) =>
      chatWithAgent(integrationId, agentId, message)
  });
}